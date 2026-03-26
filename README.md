# Overdoze Craft Coffee — Backend API

## โครงสร้างไฟล์
```
overdoze-backend/
├── server.js              # Entry point
├── db.js                  # MySQL connection pool
├── schema.sql             # สร้าง Database
├── api.js                 # ← copy ไปวางใน frontend folder
├── .env.example           # ตัวอย่าง config
├── middleware/
│   └── auth.js            # JWT middleware
├── routes/
│   ├── auth.js            # Register / Login
│   ├── shifts.js          # Clock in/out/break
│   └── admin.js           # Admin dashboard
└── package.json
```

---

## 1. ติดตั้งและตั้งค่า

```bash
# Clone หรือ copy โฟลเดอร์นี้ แล้วรัน
npm install

# Copy .env.example เป็น .env แล้วแก้ค่า
cp .env.example .env
```

แก้ไข `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASS=รหัสผ่าน MySQL ของคุณ
DB_NAME=overdoze_db
JWT_SECRET=เปลี่ยนเป็นค่าสุ่มยาวๆ
FRONTEND_URL=http://localhost:5500
```

---

## 2. สร้าง Database

```bash
mysql -u root -p < schema.sql
```

หรือ copy ไปรันใน MySQL Workbench / phpMyAdmin ก็ได้

**Default Admin Account:**
- Email: `admin@overdoze.coffee`
- Password: `admin123`

---

## 3. รัน Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server จะรันที่ `http://localhost:3000`

---

## 4. เชื่อม Frontend

1. copy `api.js` ไปวางในโฟลเดอร์เดียวกับ `index.html`
2. เพิ่ม script tag ใน `index.html` **ก่อน** `app.js`:

```html
<script src="api.js"></script>
<script src="app.js"></script>
```

3. แก้ฟังก์ชันใน `app.js` ให้เรียก API แทน localStorage:

```javascript
// เดิม (localStorage)
function login(email, password) {
    const users = DB.get('users');
    const user = users.find(u => u.email === email && u.password === password);
    ...
}

// ใหม่ (API)
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const pw    = document.getElementById('loginPassword').value;
    const res   = await AuthAPI.login(email, pw);
    if (!res.ok) { toast(res.error, 'error'); return; }
    toast('เข้าสู่ระบบสำเร็จ!', 'success');
    setTimeout(() => navigate(res.data.user.role === 'admin' ? 'admin' : 'staff'), 400);
}
```

---

## 5. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | ลงทะเบียน |
| POST | /api/auth/login | เข้าสู่ระบบ |
| GET | /api/shifts/active | เช็ค session ปัจจุบัน |
| POST | /api/shifts/clockin | ลงเวลาเข้า |
| POST | /api/shifts/break | พัก/กลับจากพัก |
| POST | /api/shifts/clockout | ลงเวลาออก |
| GET | /api/shifts/history | ประวัติของตัวเอง |
| GET | /api/admin/staff | รายชื่อพนักงาน (Admin) |
| PATCH | /api/admin/staff/:id/approve | อนุมัติ (Admin) |
| PATCH | /api/admin/staff/:id/reject | ปฏิเสธ (Admin) |
| GET | /api/admin/sessions | ประวัติทั้งหมด (Admin) |
| GET | /api/admin/stats | สถิติ Dashboard (Admin) |

---

## 6. Deploy บน Server จริง (VPS)

```bash
# ติดตั้ง Node.js และ MySQL บน Ubuntu
sudo apt update
sudo apt install nodejs npm mysql-server -y

# upload โปรเจคขึ้น server (ด้วย scp หรือ git)
git clone https://github.com/yourrepo/overdoze-backend
cd overdoze-backend
npm install --production

# สร้าง database
mysql -u root -p < schema.sql

# แก้ .env ให้ตรงกับ server
nano .env

# รันด้วย PM2 (ให้รันตลอด ไม่ดับเมื่อปิด terminal)
npm install -g pm2
pm2 start server.js --name overdoze-api
pm2 save
pm2 startup
```

**Frontend** อัพโหลดไฟล์ HTML/CSS/JS ขึ้น Netlify หรือ Vercel
แล้วแก้ `API_URL` ใน `api.js` ให้ชี้ไป domain ของ server:
```javascript
const API_URL = 'https://api.yourdomain.com/api';
```

---

## 7. Deploy ฟรีด้วย Railway (แนะนำ)

1. สมัคร [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. เพิ่ม MySQL plugin
4. ตั้งค่า Environment Variables จาก `.env`
5. Railway จะ deploy อัตโนมัติ
