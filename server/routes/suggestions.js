const express = require('express');
const router = express.Router();
const Suggestion = require('../models/Suggestion');

// @route   POST api/suggestions
// @desc    Submit a user suggestion
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({ msg: 'Por favor, rellene todos los campos requeridos.' });
        }

        const newSuggestion = new Suggestion({
            name,
            email,
            message
        });

        const suggestion = await newSuggestion.save();
        
        console.log(`[SUGGESTION] New suggestion received from ${email}`);
        res.status(201).json(suggestion);

    } catch (err) {
        console.error('Error in suggestion submission:', err.message);
        res.status(500).send('Error interno del servidor');
    }
});

module.exports = router;
