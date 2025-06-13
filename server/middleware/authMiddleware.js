const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401); // No token provided
    }

    jwt.verify(token, req.app.get('jwtSecret'), (err, user) => {
        if (err) {
            return res.sendStatus(403); // Invalid token
        }
        req.user = user; // Attach user information to the request
        next();
    });
}

module.exports = {
    authenticateToken
};