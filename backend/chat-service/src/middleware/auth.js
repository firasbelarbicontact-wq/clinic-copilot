const jwt = require('jsonwebtoken');

function getSecret() {
    const secret = process.env.JWT_SECRET;
    // Spring décode souvent le secret en Base64 : mets JWT_SECRET_BASE64=true dans .env si c'est le cas
    return process.env.JWT_SECRET_BASE64 === 'true' ? Buffer.from(secret, 'base64') : secret;
}

function verifyToken(token) {
    const payload = jwt.verify(token, getSecret());
    const role = payload.role || (Array.isArray(payload.roles) ? payload.roles[0] : '') || '';
    return {
        id: String(payload.userId || payload.id || payload.sub),
        role: String(role).replace('ROLE_', ''),
    };
}

function auth(req, res, next) {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token manquant' });
    }
    try {
        req.user = verifyToken(header.slice(7));
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token invalide' });
    }



    const payload = jwt.verify(token, secret, { algorithms: ['HS256', 'HS384', 'HS512'] });
    return {
        id: String(payload.userId ?? payload.id ?? payload.sub),
        role: payload.role ?? null,
    };
}

module.exports = { auth, verifyToken };