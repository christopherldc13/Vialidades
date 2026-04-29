const express = require('express');
const router = express.Router();
const Suggestion = require('../models/Suggestion');
const auth = require('../middleware/auth');

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

// @route   GET api/suggestions
// @desc    Get all suggestions (moderator/admin only)
// @access  Private
router.get('/', auth, async (req, res) => {
    if (!['moderator', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ msg: 'Acceso denegado.' });
    }
    try {
        const suggestions = await Suggestion.find().sort({ createdAt: -1 });
        res.json(suggestions);
    } catch (err) {
        console.error('Error fetching suggestions:', err.message);
        res.status(500).send('Error interno del servidor');
    }
});

module.exports = router;
