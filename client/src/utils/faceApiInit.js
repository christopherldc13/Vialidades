import * as faceapi from '@vladmandic/face-api';

let initPromise = null;
export let modelsLoaded = false;

export const initFaceApi = () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
        await faceapi.tf.ready();
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        modelsLoaded = true;
    })().catch((err) => {
        console.error('[FaceBlur] Init failed:', err);
        initPromise = null;
    });
    return initPromise;
};

export { faceapi };
