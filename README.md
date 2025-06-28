# CHEMO_FINAL

ระบบจัดการผู้ป่วยและนัดหมายสำหรับเคมีบำบัด (Chemotherapy Ward Management System)

## คุณสมบัติหลัก
- จัดการข้อมูลผู้ป่วย (เพิ่ม/แก้ไข/ลบ/soft delete)
- จัดการนัดหมาย Admit/Discharge/Cancel (soft delete)
- Dashboard, สถิติ, รายงาน, Export PDF/Excel
- ระบบสิทธิ์ผู้ใช้ (Admin, Doctor, Nurse)

## โครงสร้างโปรเจกต์ (Project Structure)

```
CHEMO_FINAL/
  backend/    # Node.js + Express + Prisma (API, DB)
  frontend/   # React + Vite (Web UI)
```

## วิธีเริ่มต้นใช้งาน (Getting Started)

### Backend
1. ติดตั้ง dependencies:
   ```
   cd backend
   npm install
   ```
2. ตั้งค่าไฟล์ `.env` (ดูตัวอย่างใน `env.example`)
3. รัน migration และ start server:
   ```
   npx prisma migrate dev
   npm start
   ```

### Frontend
1. ติดตั้ง dependencies:
   ```
   cd frontend
   npm install
   ```
2. ตั้งค่าไฟล์ `.env` (ดูตัวอย่างใน `env.example`)
3. รัน dev server:
   ```
   npm run dev
   ```

## การใช้งาน
- เปิดใช้งาน backend ที่ port 5000
- เปิดใช้งาน frontend ที่ port 5173
- เข้าสู่ระบบด้วยบัญชีที่กำหนดไว้ในฐานข้อมูล

## หมายเหตุ
- ข้อมูลที่ลบในระบบจะเป็น soft delete (ข้อมูลยังคงอยู่ในฐานข้อมูล)
- สามารถปรับแต่ง .env และ config อื่น ๆ ได้ตามต้องการ

---

# CHEMO_FINAL

A Chemotherapy Ward Management System (Patient & Appointment Management)

## Project Structure

- `backend/` : Node.js + Express + Prisma (API, DB)
- `frontend/` : React + Vite (Web UI)

## Getting Started

### Backend
1. Install dependencies:
   ```
   cd backend
   npm install
   ```
2. Setup `.env` (see `env.example`)
3. Run migration and start server:
   ```
   npx prisma migrate dev
   npm start
   ```

### Frontend
1. Install dependencies:
   ```
   cd frontend
   npm install
   ```
2. Setup `.env` (see `env.example`)
3. Run dev server:
   ```
   npm run dev
   ```

---

> Created and maintained by URAREE, M.D. Aspiring programmer in the AI era  
copyright © 2025
