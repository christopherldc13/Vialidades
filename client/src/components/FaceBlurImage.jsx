import { useEffect, useRef, useState } from 'react';
import { initFaceApi, faceapi, modelsLoaded } from '../utils/faceApiInit';

const fetchBlob = async (src) => {
    const res = await fetch(src, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    return URL.createObjectURL(await res.blob());
};

const loadImage = (src) =>
    new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
    });

const FaceBlurImage = ({ src, alt }) => {
    const wrapperRef = useRef(null);
    const canvasRef  = useRef(null);
    const [facesHidden, setFacesHidden] = useState(false);

    useEffect(() => {
        if (!src) return;
        let cancelled = false;
        let objectUrl = null;

        const detect = async () => {
            await initFaceApi();
            if (cancelled || !modelsLoaded) return;

            try {
                objectUrl = await fetchBlob(src);
                if (cancelled) { URL.revokeObjectURL(objectUrl); return; }

                const img = await loadImage(objectUrl);
                if (cancelled) { URL.revokeObjectURL(objectUrl); return; }

                const detections = await faceapi.detectAllFaces(
                    img,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 })
                );

                if (cancelled || detections.length === 0) {
                    URL.revokeObjectURL(objectUrl);
                    return;
                }

                const canvas = canvasRef.current;
                if (!canvas) { URL.revokeObjectURL(objectUrl); return; }

                canvas.width  = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(objectUrl);
                objectUrl = null;

                detections.forEach(d => {
                    const { x, y, width, height } = d.box;
                    const pad = Math.round(width * 0.2);
                    const bx = Math.max(0, x - pad);
                    const by = Math.max(0, y - pad);
                    const bw = Math.min(canvas.width  - bx, width  + pad * 2);
                    const bh = Math.min(canvas.height - by, height + pad * 2);

                    const block = Math.max(8, Math.round(bw / 8));
                    for (let px = bx; px < bx + bw; px += block) {
                        for (let py = by; py < by + bh; py += block) {
                            const pw  = Math.min(block, bx + bw - px);
                            const ph  = Math.min(block, by + bh - py);
                            const mid = ctx.getImageData(
                                px + Math.floor(pw / 2),
                                py + Math.floor(ph / 2),
                                1, 1
                            ).data;
                            ctx.fillStyle = `rgb(${mid[0]},${mid[1]},${mid[2]})`;
                            ctx.fillRect(px, py, pw, ph);
                        }
                    }
                });

                if (!cancelled) setFacesHidden(true);
            } catch (e) {
                console.error('[FaceBlur] Detection failed:', e);
                if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
            }
        };

        // Only detect when the card enters the viewport
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { observer.disconnect(); detect(); } },
            { threshold: 0.1 }
        );
        if (wrapperRef.current) observer.observe(wrapperRef.current);

        return () => {
            cancelled = true;
            observer.disconnect();
            if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
        };
    }, [src]);

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img
                src={src}
                alt={alt}
                style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    display: facesHidden ? 'none' : 'block',
                }}
            />
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    display: facesHidden ? 'block' : 'none',
                }}
            />
            {facesHidden && (
                <div style={{
                    position: 'absolute', bottom: 6, right: 6,
                    background: 'rgba(0,0,0,0.6)', color: '#fff',
                    fontSize: '0.62rem', fontWeight: '700',
                    padding: '2px 8px', borderRadius: '999px',
                    backdropFilter: 'blur(4px)', letterSpacing: '0.03em',
                }}>
                    Rostro protegido
                </div>
            )}
        </div>
    );
};

export default FaceBlurImage;
