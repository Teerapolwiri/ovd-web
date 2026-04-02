// ===== Auth Routes =====
const router  = require('express').Router();
const db      = require('../db');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');

// ── Helper: generate short ID ──
function genId() { return Math.random().toString(36).slice(2, 10); }

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
    const { name, nickname, email, phone, bankAccount, bankName, role, password } = req.body;

    if (!name || !email || !role || !password)
        return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });

    const allowedRoles = ['barista', 'roaster', 'inventory_lead'];
    if (!allowedRoles.includes(role))
        return res.status(400).json({ error: 'ตำแหน่งไม่ถูกต้อง' });

    try {
        // เช็คซ้ำ
        const [existing] = await db.query('SELECT id FROM staff WHERE email = ?', [email]);
        if (existing.length) return res.status(409).json({ error: 'อีเมลนี้มีผู้ใช้งานแล้ว' });

        const hash = await bcrypt.hash(password, 10);
        const id   = genId();

        await db.query(
            'INSERT INTO staff (id, name, nickname, email, phone, bank_account, bank_name, role, password, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, name, nickname || null, email, phone || null, bankAccount || null, bankName || null, role, hash, 'pending']
        );

        res.status(201).json({ ok: true, message: 'ลงทะเบียนสำเร็จ รอการอนุมัติจาก Admin' });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'กรุณากรอก Email และ Password' });

    try {
        const [rows] = await db.query('SELECT * FROM staff WHERE email = ?', [email]);
        if (!rows.length) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

        const user = rows[0];

        if (user.status === 'pending')
            return res.status(403).json({ error: 'บัญชียังรอการอนุมัติจาก Admin' });
        if (user.status === 'rejected')
            return res.status(403).json({ error: 'บัญชีถูกปฏิเสธ กรุณาติดต่อผู้ดูแล' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            ok: true,
            token,
            user: {
                id:          user.id,
                name:        user.name,
                nickname:    user.nickname,
                email:       user.email,
                phone:       user.phone,
                bankAccount: user.bank_account,
                bankName:    user.bank_name,
                role:        user.role,
                status:      user.status
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
    }
});

module.exports = router;
