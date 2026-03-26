// ===== Admin Routes =====
const router = require('express').Router();
const db     = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// ใช้ middleware ทั้ง 2 ตัวสำหรับทุก route ในไฟล์นี้
router.use(authMiddleware, adminOnly);

// ─────────────────────────────────────────────
// GET /api/admin/staff — รายชื่อพนักงานทั้งหมด
// ─────────────────────────────────────────────
router.get('/staff', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, name, email, phone, role, status, registered_at FROM staff WHERE role != "admin" ORDER BY registered_at DESC'
        );
        res.json({ staff: rows });
    } catch (err) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// ─────────────────────────────────────────────
// PATCH /api/admin/staff/:id/approve
// ─────────────────────────────────────────────
router.patch('/staff/:id/approve', async (req, res) => {
    try {
        const [result] = await db.query(
            'UPDATE staff SET status = "approved" WHERE id = ? AND role != "admin"',
            [req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ error: 'ไม่พบพนักงาน' });
        res.json({ ok: true, message: 'อนุมัติแล้ว' });
    } catch (err) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// ─────────────────────────────────────────────
// PATCH /api/admin/staff/:id/reject
// ─────────────────────────────────────────────
router.patch('/staff/:id/reject', async (req, res) => {
    try {
        const [result] = await db.query(
            'UPDATE staff SET status = "rejected" WHERE id = ? AND role != "admin"',
            [req.params.id]
        );
        if (!result.affectedRows) return res.status(404).json({ error: 'ไม่พบพนักงาน' });
        res.json({ ok: true, message: 'ปฏิเสธแล้ว' });
    } catch (err) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// ─────────────────────────────────────────────
// GET /api/admin/sessions — ประวัติทั้งหมด
// ─────────────────────────────────────────────
router.get('/sessions', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT s.*, st.name AS staff_name, st.role AS staff_role
            FROM sessions s
            JOIN staff st ON s.staff_id = st.id
            ORDER BY s.clock_in DESC
            LIMIT 200
        `);
        res.json({ sessions: rows });
    } catch (err) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// ─────────────────────────────────────────────
// GET /api/admin/stats — สถิติ Dashboard
// ─────────────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const [[{ totalStaff }]]   = await db.query('SELECT COUNT(*) AS totalStaff FROM staff WHERE status = "approved" AND role != "admin"');
        const [[{ pendingCount }]] = await db.query('SELECT COUNT(*) AS pendingCount FROM staff WHERE status = "pending"');
        const [[{ totalHours }]]   = await db.query('SELECT COALESCE(SUM(duration),0) AS totalHours FROM sessions WHERE clock_out IS NOT NULL');
        const [[{ todayCount }]]   = await db.query('SELECT COUNT(*) AS todayCount FROM sessions WHERE DATE(clock_in) = CURDATE()');
        const [[{ todayHours }]]   = await db.query('SELECT COALESCE(SUM(duration),0) AS todayHours FROM sessions WHERE DATE(clock_in) = CURDATE() AND clock_out IS NOT NULL');

        res.json({ totalStaff, pendingCount, totalHours, todayCount, todayHours });
    } catch (err) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
