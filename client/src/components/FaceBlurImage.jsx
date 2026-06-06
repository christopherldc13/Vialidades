import { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';

let tfReady = false;
let modelsLoaded = false;
let initPromise = null;

const initFaceApi = () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
        // Force CPU backend — avoid WebGL/WASM availability issues in dev & mobile
        await faceapi.tf.setBackend('cpu');
        await faceapi.tf.ready();
        tfReady = true;
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        modelsLoaded = true;
    })().catch((err) => {
        console.error('[FaceBlur] Init failed:', err);
        initPromise = null; // allow retry
    });
    return initPromise;
};

const fetchAsObjectUrl = async (src) => {
    const res = await fetch(src, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
};

const loadImage = (src) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });

const FaceBlurImage = ({ src, alt }) => {
    const canvasRef = useRef(null);
    const [facesHidden, setFacesHidden] = useState(false);

    useEffect(() => {
        if (!src) return;
        let cancelled = false;
        let objectUrl = null;

        const detect = async () => {
            await initFaceApi();
            if (cancelled || !modelsLoaded) return;

            try {
                objectUrl = await fetchAsObjectUrl(src);
                if (cancelled) { URL.revokeObjectURL(objectUrl); return; }

                const img = await loadImage(objectUrl);
                if (cancelled) { URL.revokeObjectURL(objectUrl); return; }

                const detections = await faceapi.detectAllFaces(
                    img,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.25 })
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

                    const block = Math.max(6, Math.round(bw / 10));
                    for (let px = bx; px < bx + bw; px += block) {
                        for (let py = by; py < by + bh; py += block) {
                            const pw = Math.min(block, bx + bw - px);
                            const ph = Math.min(block, by + bh - py);
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

        setFacesHidden(false);
        detect();

        return () => {
            cancelled = true;
            if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
        };
    }, [src]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
