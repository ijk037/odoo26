# Dayflow HRMS — Enterprise Human Resource Management System

A production-grade Human Resource Management System (HRMS) built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Prisma ORM**, **Tailwind CSS**, and strict server-side **Role-Based Access Control (RBAC)**.

---

## 🏛️ Phase 1 Architecture Overview

```
dayflow-hrms/
├── prisma/
│   ├── schema.prisma          # Relational data schema (Users, Profiles, Attendance, Leaves, Salary, Audit)
│   ├── dev.db                 # SQLite local relational database
│   └── seed.ts                # Realistic seed script (Admin, HR, Employees, 30-day logs)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/         # Sign-in page with 1-click Demo Account Picker
│   │   │   └── register/      # New employee registration & profile creation
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/     # Role-aware Executive / Employee dashboard overview
│   │   │   ├── employees/     # Employee directory & onboarding (Admin & HR)
│   │   │   ├── attendance/    # Attendance logging, hours calculation & team logs
│   │   │   ├── leaves/        # Leave application & HR multi-tier approval queue
│   │   │   ├── payroll/       # Salary breakdown & compensation structure manager
│   │   │   ├── profile/       # Employee personal profile & details
│   │   │   ├── audit-logs/    # Immutable security & audit trail (Admin strictly only)
│   │   │   └── unauthorized/  # 403 Forbidden page for restricted role attempts
│   │   ├── api/
│   │   │   ├── auth/          # Login, Register, Logout, Session verification
│   │   │   ├── users/         # Role-filtered user management
│   │   │   ├── attendance/    # Live check-in/out and records
│   │   │   ├── leaves/        # Leave applications & approval/rejection patch
│   │   │   ├── salary/        # Salary structures & compensation update
│   │   │   └── audit-logs/    # Audit logs stream (ADMIN only)
│   │   ├── globals.css        # Professional dark-theme design tokens & scrollbars
│   │   ├── layout.tsx         # Global Root Layout with AuthProvider
│   │   └── page.tsx           # Landing page with auth state redirect
│   ├── components/
│   │   ├── attendance/        # QuickAttendanceWidget (real-time clock & check-in)
│   │   ├── auth/              # DemoAccountPicker
│   │   ├── layout/            # Collapsible Sidebar, Header with profile dropdown, DashboardLayout
│   │   └── ui/                # Badge, LoadingSkeleton, Card
│   ├── context/
│   │   └── AuthContext.tsx    # Client auth context & state provider
│   ├── lib/
│   │   ├── auth/              # JWT (jose), password (bcryptjs), rbac, session
│   │   ├── audit.ts           # System audit logging helper
│   │   ├── prisma.ts          # Prisma singleton client
│   │   └── utils.ts           # Formatting (currency, date, badges)
│   ├── middleware.ts          # Edge route guard & strict RBAC verification
│   └── types/                 # TypeScript interfaces and permission types
```

---

## 🗄️ Relational Database Schema

| Model | Purpose | Relations & Constraints |
| :--- | :--- | :--- |
| **`User`** | Core credentials, authentication, role (`ADMIN`, `HR`, `EMPLOYEE`), status | 1:1 `Profile`, 1:N `AttendanceRecord`, 1:N `LeaveRequest`, 1:1 `SalaryStructure`, 1:N `AuditLog` |
| **`Profile`** | Employment details, department, designation, employeeId (`ADM-001`, `EMP-001`), contact info | Unique `userId`, Unique `employeeId`, Cascade delete on User removal |
| **`AttendanceRecord`** | Daily check-in/out, hours logged, status (`PRESENT`, `LATE`, `HALF_DAY`, `ABSENT`), notes, IP | Unique composite `[userId, date]`, Indexed on `date` and `status` |
| **`LeaveRequest`** | Time-off applications (`PAID`, `SICK`, `CASUAL`, `UNPAID`), status (`PENDING`, `APPROVED`, `REJECTED`) | Relations to applicant `User` and approver `User`, audit timestamps |
| **`SalaryStructure`** | Monthly base salary, allowances, deductions, computed net pay, payment cycle, bank info | Unique `userId`, Foreign key with cascade delete |
| **`AuditLog`** | Security audit trail (logins, user creation, leave decisions, salary adjustments) | `actorId`, `action`, `entity`, `entityId`, `details` (JSON), `ipAddress` |

---

## 🛡️ Role-Based Access Control (RBAC) Matrix

| Feature / Resource | Super Admin (`ADMIN`) | HR Manager (`HR`) | Staff Employee (`EMPLOYEE`) |
| :--- | :---: | :---: | :---: |
| **Personal Dashboard & Profile** | ✅ View & Edit | ✅ View & Edit | ✅ View & Edit |
| **Personal Attendance & Check-In/Out** | ✅ Check-In / Out | ✅ Check-In / Out | ✅ Check-In / Out |
| **Team Attendance Audit** | ✅ Full Org View | ✅ Full Org View | ❌ Locked to Self |
| **Leave Applications** | ✅ Apply | ✅ Apply | ✅ Apply |
| **Leave Approval Queue** | ✅ Approve / Reject | ✅ Approve / Reject | ❌ No Access |
| **Employee Directory** | ✅ View & Onboard | ✅ View & Onboard | ❌ Restricted |
| **Salary / Payroll Management** | ✅ View & Modify All | ✅ View & Modify All | 🔒 Self Payslip Only |
| **System Security & Audit Logs** | 🛡️ Full Access | ❌ Restricted | ❌ Restricted |

---

## 🔑 Pre-Seeded Demo Accounts (Instant Sign-In)

Use the one-click demo presets on the login screen or manually enter credentials:

| Role | Name | Email | Password | Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Eleanor Vance | `admin@dayflow.com` | `Admin@123` | Global System Master |
| **HR Manager** | Sophia Martinez | `hr@dayflow.com` | `Hr@123` | People Ops & Leaves Approver |
| **Staff Engineer** | Alex Chen | `alex.chen@dayflow.com` | `Alex@123` | Engineering Self-Service |
| **Product Designer** | Sarah Jenkins | `sarah.jenkins@dayflow.com` | `Sarah@123` | Design Self-Service |
| **Marketing Lead** | Marcus Vance | `marcus.vance@dayflow.com` | `Marcus@123` | Marketing Self-Service |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database & Push Schema
```bash
npm run db:push
```

### 3. Seed Realistic Database Records
```bash
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000).

---

## 📦 Production Build
```bash
npm run build
npm start
```
