const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const multer = require('multer');
const { Jimp, JimpMime } = require('jimp');
const auth = require('../middleware/auth');

const GROQ_SUPPORTED  = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const JIMP_CONVERTIBLE = ['image/bmp', 'image/tiff'];

async function toGroqCompatibleBase64(buffer, mimetype) {
    if (GROQ_SUPPORTED.includes(mimetype)) {
        return { base64: buffer.toString('base64'), mime: mimetype };
    }
    if (JIMP_CONVERTIBLE.includes(mimetype)) {
        const image = await Jimp.fromBuffer(buffer);
        const jpegBuffer = await image.getBuffer(JimpMime.jpeg);
        return { base64: jpegBuffer.toString('base64'), mime: 'image/jpeg' };
    }
    throw new Error(`Formato no compatible con IA: ${mimetype}. Usa JPG, PNG, WEBP, GIF, BMP o TIFF.`);
}

// Setup multer for memory storage
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route    POST /api/ai/identify-vehicle
// @desc     Identify vehicle details from an image using Groq Llama 3.2 Vision
// @access   Private
router.post('/identify-vehicle', auth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'Por favor, sube una imagen de un vehículo.' });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ msg: 'La clave de API de Groq (GROQ_API_KEY) no está configurada.' });
        }

        const groq = new Groq({ apiKey });
        
        // Convert to a Groq-compatible format (JPEG if the original isn't supported)
        const { base64: base64Image, mime } = await toGroqCompatibleBase64(req.file.buffer, req.file.mimetype);
        const dataUrl = `data:${mime};base64,${base64Image}`;

        const prompt = `Analiza esta imagen de un vehículo y extrae la siguiente información en formato JSON estricto (importante: no agregues texto adicional, ni bloques de código markdown extra, solo el JSON puro):
{
  "brand": "marca del auto o vacío si no se ve",
  "model": "modelo del auto o vacío",
  "year": "especifica el año exacto o un rango aproximado basado en la generación del vehículo (ej: 2005)",
  "color": "color del auto en español"
}`;

        const chatCompletion = await groq.chat.completions.create({
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": dataUrl
                            }
                        }
                    ]
                }
            ],
            "model": "meta-llama/llama-4-scout-17b-16e-instruct",
            "temperature": 0.1,
            "max_tokens": 512,
            "top_p": 1,
            "stream": false,
            "stop": null
        });

        const responseText = chatCompletion.choices[0].message.content;

        // Clean text if LLM adds markdown blocks
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const data = JSON.parse(cleanedText);
            res.json({
                brand: data.brand || '',
                model: data.model || '',
                year: data.year || '',
                color: data.color || ''
            });
        } catch (parseError) {
            console.error("Error parsing Groq JSON response:", parseError);
            console.error("Raw response:", responseText);
            res.status(500).json({ 
                msg: 'No se pudo identificar los detalles del vehículo.',
                debug: responseText.substring(0, 100)
            });
        }

    } catch (err) {
        console.error("Groq AI Error:", err.message);
        res.status(500).json({ 
            msg: 'Error del servicio de IA (Groq): ' + err.message
        });
    }
});

module.exports = router;
