// ===== Database Connection =====
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASS     || '',
    database: process.env.DB_NAME     || 'overdoze_db',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    charset:            'utf8mb4'
});

// ทดสอบการเชื่อมต่อตอนเริ่ม
pool.getConnection((err, conn) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Database connected successfully');
        conn.release();
    }
});

module.exports = pool.promise();
