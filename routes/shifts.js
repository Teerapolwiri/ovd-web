// ===== Shifts Routes (Clock In / Out / Break) =====
const router = require('express').Router();
const db     = require('../db');
const { authMiddleware } = require('../middleware/auth');

function genId() { return Math.random().toString(36).slice(2, 10); }

// ─────────────────────────────────────────────
// GET /api/shifts/active — เช็ค active session
// ─────────────────────────────────────────────
router.get('/active', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM sessions WHERE staff_id = ? AND clock_out IS NULL LIMIT 1',
            [req.user.id]
        );
        res.json({ session: rows[0] || null });
    } catch (err) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// ─────────────────────────────────────────────
// POST /api/shifts/clockin
// ─────────────────────────────────────────────
router.post('/clockin', authMiddleware, async (req, res) => {
    try {
        // เช็คว่ายังมี active session อยู่ไหม
        const [existing] = await db.query(
            'SELECT id FROM sessions WHERE staff_id = ? AND clock_out IS NULL',
            [req.user.id]
        );
        if (existing.length)
            return res.status(409).json({ error: 'คุณมีเซสชันที่ยังไม่ได้ลงเวลาออกอยู่' });

        const id = genId();
        const clockIn = new Date();

        await db.query(
            'INSERT INTO sessions (id, staff_id, clock_in, total_break, on_break) VALUES (?, ?, ?, 0, 0)',
            [id, req.user.id, clockIn]
        );

        res.json({ ok: true, session: { id, staffId: req.user.id, clockIn, onBreak: false, totalBreak: 0 } });
    } catch (err) {
        console.error('Clock in error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// ─────────────────────────────────────────────
// POST /api/shifts/break — toggle break
// ─────────────────────────────────────────────
router.post('/break', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM sessions WHERE staff_id = ? AND clock_out IS NULL LIMIT 1',
            [req.user.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'ไม่พบเซสชันที่ใช้งานอยู่' });

        const session = rows[0];
        const now = new Date();

        if (session.on_break) {
            // กลับจากพัก
            const breakMs = now - new Date(session.break_start);
            await db.query(
                'UPDATE sessions SET on_break = 0, break_start = NULL, total_break = total_break + ? WHERE id = ?',
                [breakMs, session.id]
            );
            res.json({ ok: true, onBreak: false, message: 'กลับเข้างานแล้ว' });
        } else {
            // เริ่มพัก
            await db.query(
                'UPDATE sessions SET on_break = 1, break_start = ? WHERE id = ?',
                [now, session.id]
            );
            res.json({ ok: true, onBreak: true, message: 'เริ่มพักเบรก' });
        }
    } catch (err) {
        console.error('Break error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// ─────────────────────────────────────────────
// POST /api/shifts/clockout
// ─────────────────────────────────────────────
router.post('/clockout', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM sessions WHERE staff_id = ? AND clock_out IS NULL LIMIT 1',
            [req.user.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'ไม่พบเซสชันที่ใช้งานอยู่' });

        const session = rows[0];
        const now = new Date();
        let totalBreak = Number(session.total_break) || 0;

        // คิดเบรกสุดท้ายถ้ายังพักอยู่
        if (session.on_break && session.break_start) {
            totalBreak += now - new Date(session.break_start);
        }

        const duration = now - new Date(session.clock_in) - totalBreak;

        await db.query(
            'UPDATE sessions SET clock_out = ?, total_break = ?, on_break = 0, break_start = NULL, duration = ? WHERE id = ?',
            [now, totalBreak, duration, session.id]
        );

        res.json({ ok: true, duration, message: 'ลงเวลาออกเรียบร้อย' });
    } catch (err) {
        console.error('Clock out error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// ─────────────────────────────────────────────
// GET /api/shifts/history — ประวัติของตัวเอง
// ─────────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM sessions WHERE staff_id = ? AND clock_out IS NOT NULL ORDER BY clock_in DESC LIMIT 50',
            [req.user.id]
        );
        res.json({ sessions: rows });
    } catch (err) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
