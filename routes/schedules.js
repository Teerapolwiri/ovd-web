// ===== Schedule Routes (Staff) =====
const router = require('express').Router();
const db     = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// ─────────────────────────────────────────────
// GET /api/schedules/mine — ดึงกะงานของตัวเอง
// ─────────────────────────────────────────────
router.get('/mine', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                id,
                staff_id AS staffId,
                staff_name AS staffName,
                DATE_FORMAT(date, '%Y-%m-%d') AS date,
                start_time AS startTime,
                end_time AS endTime,
                detail,
                created_at AS createdAt
            FROM schedules
            WHERE staff_id = ?
            ORDER BY date ASC, start_time ASC
        `, [req.user.id]);
        res.json({ schedules: rows });
    } catch (err) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;
