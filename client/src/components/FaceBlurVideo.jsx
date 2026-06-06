import { useEffect, useRef } from 'react';
import { initFaceApi, faceapi, modelsLoaded } from '../utils/faceApiInit';

const DETECT_INTERVAL_MS = 700;

const FaceBlurVideo = ({ src }) => {
    const videoRef    = useRef(null);
    const overlayRef  = useRef(null);
    const offscreenRef = useRef(document.createElement('canvas'));
    const regionsRef  = useRef([]);
    const animRef     = useRef(null);
    const detectRef   = useRef(null);

    useEffect(() => {
        if (!src) return;
        let cancelled = false;

        const runDetect = async () => {
            const video = videoRef.current;
            if (cancelled || !video || video.paused || video.ended || !modelsLoaded) return;
            if (!video.videoWidth) { detectRef.current = setTimeout(runDetect, DETECT_INTERVAL_MS); return; }

            try {
                const dets = await faceapi.detectAllFaces(
                    video,
                    new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.3 })
                );
                if (!cancelled) regionsRef.current = dets.map(d => d.box);
            } catch (_) {}

            if (!cancelled) detectRef.current = setTimeout(runDetect, DETECT_INTERVAL_MS);
        };

        const drawOverlay = () => {
            if (cancelled) return;
            const video   = videoRef.current;
            const overlay = overlayRef.current;

            if (!video || !overlay || !video.videoWidth) {
                animRef.current = requestAnimationFrame(drawOverlay);
                return;
            }

            if (overlay.width !== video.videoWidth) {
                overlay.width  = video.videoWidth;
                overlay.height = video.videoHeight;
            }

            const ctx = overlay.getContext('2d');
            ctx.clearRect(0, 0, overlay.width, overlay.height);

            const regions = regionsRef.current;
            if (regions.length > 0) {
                const off = offscreenRef.current;
                off.width  = video.videoWidth;
                off.height = video.videoHeight;
                const offCtx = off.getContext('2d');
                offCtx.drawImage(video, 0, 0);

                regions.forEach(({ x, y, width, height }) => {
                    const pad = Math.round(width * 0.22);
                    const bx  = Math.max(0, x - pad);
                    const by  = Math.max(0, y - pad);
                    const bw  = Math.min(overlay.width  - bx, width  + pad * 2);
                    const bh  = Math.min(overlay.height - by, height + pad * 2);
                    const blk = Math.max(10, Math.round(bw / 6));

                    try {
                        for (let px = bx; px < bx + bw; px += blk) {
                            for (let py = by; py < by + bh; py += blk) {
                                const pw  = Math.min(blk, bx + bw - px);
                                const ph  = Math.min(blk, by + bh - py);
                                const mid = offCtx.getImageData(
                                    px + Math.floor(pw / 2),
                                    py + Math.floor(ph / 2),
                                    1, 1
                                ).data;
                                ctx.fillStyle = `rgb(${mid[0]},${mid[1]},${mid[2]})`;
                                ctx.fillRect(px, py, pw, ph);
                            }
                        }
                    } catch {
                        ctx.fillStyle = 'rgba(20,20,20,0.95)';
                        ctx.fillRect(bx, by, bw, bh);
                    }
                });
            }

            animRef.current = requestAnimationFrame(drawOverlay);
        };

        const onPlay  = () => { runDetect(); };
        const onPause = () => { clearTimeout(detectRef.current); };

        const setup = async () => {
            await initFaceApi();
            if (cancelled) return;

            const video = videoRef.current;
            if (!video) return;
            video.addEventListener('play',  onPlay);
            video.addEventListener('pause', onPause);
            video.addEventListener('ended', onPause);

            drawOverlay();
        };

        setup();

        return () => {
            cancelled = true;
            clearTimeout(detectRef.current);
            cancelAnimationFrame(animRef.current);
            const video = videoRef.current;
            if (video) {
                video.removeEventListener('play',  onPlay);
                video.removeEventListener('pause', onPause);
                video.removeEventListener('ended', onPause);
            }
        };
    }, [src]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
            <video
                ref={videoRef}
                src={src}
                crossOrigin="anonymous"
                controls
                muted
                playsInline
                loop
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <canvas
                ref={overlayRef}
                style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    pointerEvents: 'none',
                    zIndex: 2,
                }}
            />
        </div>
    );
};

export default FaceBlurVideo;
