// ===== Overdoze Craft Coffee — Express Server =====
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ── CORS ──────────────────────────────────────────
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Body Parser ───────────────────────────────────
app.use(express.json());

// ── Routes ────────────────────────────────────────
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/shifts', require('./routes/shifts'));
app.use('/api/admin',  require('./routes/admin'));

// ── Health Check ──────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── 404 Handler ───────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Overdoze API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
});
