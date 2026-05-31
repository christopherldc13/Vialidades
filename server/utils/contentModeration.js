const axios = require('axios');

const MODELS = 'nudity-2.0,violence,offensive,gore';

const checkImageContent = async (imageUrl) => {
    const apiUser   = (process.env.SIGHTENGINE_API_USER   || '').replace(/[\r\n\t\0 ]+/g, '');
    const apiSecret = (process.env.SIGHTENGINE_API_SECRET || '').replace(/[\r\n\t\0 ]+/g, '');

    const params = new URLSearchParams({
        url: imageUrl,
        models: MODELS,
        api_user: apiUser,
        api_secret: apiSecret
    });

    const { data } = await axios.get(
        `https://api.sightengine.com/1.0/check.json?${params.toString()}`
    );

    console.log('[ContentModeration] scores:', JSON.stringify({
        nudity: data.nudity,
        violence: data.violence,
        gore: data.gore,
        offensive: data.offensive
    }));

    const reasons = [];

    if (data.nudity) {
        if ((data.nudity.sexual_activity ?? 0) > 0.3) reasons.push('contenido sexual explícito');
        if ((data.nudity.sexual_display  ?? 0) > 0.3) reasons.push('exhibición sexual');
        if ((data.nudity.erotica         ?? 0) > 0.3) reasons.push('contenido erótico');
        if ((data.nudity.raw             ?? 0) > 0.3) reasons.push('desnudez explícita');
        if ((data.nudity.sextoy          ?? 0) > 0.3) reasons.push('contenido sexual');
        if ((data.nudity.suggestive      ?? 0) > 0.7) reasons.push('contenido sugestivo');
        if ((data.nudity.none            ?? 1) < 0.5) reasons.push('contenido inapropiado');
    }

    if ((data.violence?.prob ?? 0) > 0.5) reasons.push('contenido violento');
    if ((data.gore?.prob     ?? 0) > 0.5) reasons.push('imágenes gore');
    if ((data.offensive?.prob ?? 0) > 0.5) reasons.push('contenido ofensivo');

    return { isFlagged: reasons.length > 0, reasons };
};

module.exports = { checkImageContent };
