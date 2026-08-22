# Dayflow HRMS - Production Deployment Guide

## 🚀 Recommended Hosting Options

Dayflow HRMS can be deployed to **Vercel**, **Railway**, **Render**, or **Docker/VPS** with zero code changes.

---

### **Option 1: Deploy to Vercel (Recommended for Next.js App Router)**

1. **Push Repository**: Push the repository to GitHub.
2. **Import Project**: Import the repository in [Vercel Dashboard](https://vercel.com/new).
3. **Environment Variables**:
   ```env
   DATABASE_URL="file:./prisma/dev.db" # Or Postgres URL (e.g. Neon, Supabase, Vercel Postgres)
   JWT_SECRET="production-super-secret-key-change-in-prod-min-32-chars"
   NODE_ENV="production"
   NEXT_PUBLIC_APP_URL="https://your-dayflow-hrms.vercel.app"
   ```
4. **Build Command**:
   ```bash
   prisma generate && next build
   ```
5. **Deploy**: Click Deploy.

---

### **Option 2: Deploy to Railway / Render (Full-Stack Containerized)**

1. **Create New Web Service** on Railway or Render connected to the repository.
2. **Build & Start Commands**:
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm run start`
3. **Persistent Volume** (if using SQLite):
   - Mount `/app/prisma` to a persistent disk so `dev.db` persists across restarts.
   - Or configure `DATABASE_URL` with a hosted PostgreSQL instance (e.g., Supabase / Neon / Railway Postgres) and run `npx prisma db push`.

---

### **Option 3: Run Locally in Production Mode**

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client & Push Schema
npx prisma generate
npx prisma db push

# 3. Seed demo accounts & sample data
npm run db:seed

# 4. Build optimized Next.js bundle
npm run build

# 5. Launch production server
npm run start
```

Visit: `http://localhost:3000`

---

## 🔑 Pre-Seeded Evaluation Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@dayflow.com` | `Admin@123` | Global Administration, All CRUD, Payroll, Audit Logs |
| **HR Manager** | `hr@dayflow.com` | `Hr@123` | Workforce CRUD, Attendance Overrides, Leave Approvals |
| **Staff Engineer** | `alex.chen@dayflow.com` | `Alex@123` | Self-Service Check-in, Leave Application, Personal Paystub |
| **UX Lead** | `sarah.jenkins@dayflow.com` | `Sarah@123` | Self-Service Check-in, Leave Application, Personal Paystub |
| **Marketing** | `marcus.vance@dayflow.com` | `Marcus@123` | Self-Service Check-in, Leave Application, Personal Paystub |
