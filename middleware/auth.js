// ===== JWT Auth Middleware =====
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    const header = req.headers['authorization'];
    if (!header) return res.status(401).json({ error: 'ไม่พบ Token' });

    const token = header.startsWith('Bearer ') ? header.slice(7) : header;
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
}

function adminOnly(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'สิทธิ์ไม่เพียงพอ' });
    }
    next();
}

module.exports = { authMiddleware, adminOnly };
