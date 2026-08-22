# Dayflow HRMS - 3-Minute High-Impact Demo Walkthrough Script

**Platform Overview**: Dayflow HRMS is a production-grade enterprise Human Resource Management System built with Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Prisma ORM, and JWT authentication with strict server-side Role-Based Access Control (RBAC).

---

## ⏱️ Minute-by-Minute Live Evaluation Script

### **[00:00 - 00:45] Phase 1 & RBAC Security Demonstration**
1. **Landing & Instant Login**:
   - Open `/login`.
   - Highlight the **One-Click Demo Account Picker** featuring 3 distinct personas:
     - **Super Admin**: `admin@dayflow.com` (Password: `Admin@123`)
     - **HR Manager**: `hr@dayflow.com` (Password: `Hr@123`)
     - **Staff Engineer**: `alex.chen@dayflow.com` (Password: `Alex@123`)
   - Click **"Super Admin"** $\rightarrow$ Observe instant JWT authentication, role badge assignment, and loading into the responsive dark-themed dashboard shell.
2. **Strict Route Isolation**:
   - As Super Admin, navigate to `/audit-logs` $\rightarrow$ View the live, immutable security log stream with JSON inspector.
   - Use the **Demo Switcher in the top header** to switch directly to **Alex Chen (Employee)**.
   - Try navigating to `/audit-logs` or `/employees` $\rightarrow$ Notice strict redirect/403 barrier safeguarding administrative areas.

---

### **[00:45 - 01:45] Phase 2: Employee Self-Service, Time Clock & Leaves**
1. **Live Duration Clock & Punch**:
   - In the header or on `/attendance`, observe the live running clock.
   - Click **"Clock In Now"** $\rightarrow$ Toast alert confirms check-in at current timestamp with automatic status calculation (`PRESENT` or `LATE`).
   - The active shift banner immediately activates a live elapsed duration timer (`00:00:05...`).
2. **Restricted Profile Editing**:
   - Navigate to `/profile`.
   - Show how **Job Title, Department, Employee ID, Joining Date, and Basic Pay** are permanently locked with **"🔒 Locked by HR/Admin"** badges.
   - Edit the **Phone Number**, pick a new **Avatar Preset**, and save $\rightarrow$ Verified via toast alert and database update.
3. **Leave Request Submission**:
   - Navigate to `/leaves` $\rightarrow$ View dynamic quota meters (Paid: 12/15, Sick: 8/10, Casual: 5/7).
   - Click **"Apply for Time Off"** $\rightarrow$ Select `PAID` leave for 3 days with reason: *"Annual family vacation."*
   - Submit $\rightarrow$ Real-time record appears as `PENDING` with full cancellation capability.

---

### **[01:45 - 02:30] Phase 3: Admin Workforce CRUD, Approvals & Payroll**
1. **Instant Role Switch to HR Manager**:
   - Using the header **Demo Switcher**, switch to `hr@dayflow.com`.
2. **Leave Approval & Attendance Auto-Sync**:
   - Navigate to `/leaves` $\rightarrow$ View the **Pending Approval Queue**.
   - Click **"Review & Approve"** on Alex Chen's leave $\rightarrow$ Confirmation dialog notes that calendar dates will automatically sync to the attendance ledger.
   - Confirm $\rightarrow$ Navigate to `/attendance` $\rightarrow$ Verify that the calendar days are automatically marked `ON_LEAVE`!
3. **Workforce CRUD & Manual Ledger Adjustment**:
   - Navigate to `/employees` $\rightarrow$ Filter by department, open an employee dossier, and adjust salary parameters.
   - On `/attendance`, click **"Manual Log Adjustment"** $\rightarrow$ Override any employee punch with mandatory audit remarks.

---

### **[02:30 - 03:00] Dynamic Itemized Payroll & Paystub Dossier**
1. **Dynamic Payroll Computation**:
   - Navigate to `/payroll`.
   - Explain the dynamic calculation engine linking attendance, approved paid leaves, and loss of pay (LOP) deductions.
   - Click **"Paystub"** for Alex Chen $\rightarrow$ Modal renders official corporate **DAYFLOW HRMS** Paystub dossier with:
     - Basic Pay (50%), HRA (30%), Transport & Special Allowances
     - Provident Fund (12%), Tax withholding, Unpaid Leave LOP
     - Payable Days vs LOP Days
     - Net Disbursed amount in numbers and words (*"Nine Thousand Four Hundred Fifty Dollars Only"*)
     - 1-Click Print & Export.
2. **Wrap-up**: Zero runtime errors, production-ready build, full test coverage across all 25 App Router routes.
