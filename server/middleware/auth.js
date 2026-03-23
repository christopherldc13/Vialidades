const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Single Device Session Check
        const user = await User.findById(decoded.user.id);
        if (!user) {
            return res.status(401).json({ msg: 'User no longer exists' });
        }

        // Si el usuario tiene un token de sesión y el JWT recibido tiene un token de sesión
        // y NO coinciden, significa que se inició sesión en otro lugar.
        if (user.sessionToken && decoded.user.sessionToken && user.sessionToken !== decoded.user.sessionToken) {
            return res.status(401).json({ 
                msg: 'Iniciaste sesión en otro dispositivo', 
                sessionOverwritten: true 
            });
        }

        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
