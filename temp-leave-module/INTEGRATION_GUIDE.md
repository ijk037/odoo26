# 🚀 Multi-Tier Leave Approval Module (Hackathon Ready)

This folder (`/temp-leave-module`) contains exactly what you need to integrate the "Multi-Tier Leave Approval Engine, Policy Constraints, and Audit Trails" feature into your Next.js project.

**None of your existing codebase files were touched.** 

## 📁 What's inside this folder?

1. **`schema-additions.prisma`**
   - The exact data models you need (`LeaveBalance`, `LeaveRequest`, `AuditLog`, and Enums).
   - **How to use:** Open this file, copy its contents, and paste it at the bottom of your main `prisma/schema.prisma` file. Run `npx prisma db push` afterward.

2. **`api-logic.ts`**
   - The heavily commented Next.js App Router API handlers.
   - Includes strict multi-tier RBAC logic (Manager must approve before HR) and automated Audit Logging wrapping the transactions.
   - **How to use:** Copy the functions into your respective route handlers (e.g., `src/app/api/leaves/route.ts` and `src/app/api/leaves/[id]/route.ts`).

3. **`ui-components.tsx`**
   - The React components for the HR/Manager Approval Queue and the Audit Log table.
   - Includes the logic to lock the HR approval buttons if the Manager hasn't approved it yet.
   - **How to use:** Copy and paste these components directly into your frontend pages (e.g., `src/app/hr/leaves/page.tsx`).

4. **`lib-helpers.ts`**
   - Business logic functions for calculating working days (excluding weekends) and detecting overlapping leave conflicts in the same department.
   - **How to use:** Paste into your `src/lib/utils.ts` or keep it as a standalone file.

## 🔑 Key Features
* **Multi-Tier:** Manager -> HR -> Complete.
* **Atomic Balances:** Leave balances are only decremented at the exact moment the HR tier signs off.
* **Immutable Audit Ledger:** Every status change is written to `AuditLog` in a Prisma `$transaction`, ensuring you never have ghost approvals.
* **Conflict Warning:** Automatically queries overlapping dates for the same department.

Good luck with your hackathon! 🏆
