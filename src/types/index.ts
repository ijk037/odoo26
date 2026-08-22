export type Role = "ADMIN" | "HR" | "EMPLOYEE";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "LATE" | "ON_LEAVE";
export type LeaveType = "PAID" | "SICK" | "UNPAID" | "CASUAL" | "MATERNITY" | "PATERNITY";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type PaymentCycle = "MONTHLY" | "BI_WEEKLY" | "WEEKLY";

export interface UserSession {
  id: string;
  email: string;
  role: Role;
  status: string;
  createdAt?: string | Date;
  profile?: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    department: string;
    designation: string;
    phone?: string | null;
    avatarUrl?: string | null;
    address?: string | null;
    emergencyContact?: string | null;
    joiningDate?: string | Date | null;
    gender?: string | null;
  } | null;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: Role;
  name: string;
  employeeId?: string;
  iat?: number;
  exp?: number;
}

export interface UserWithProfile {
  id: string;
  email: string;
  role: Role;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  profile: {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    department: string;
    designation: string;
    joiningDate: string | Date;
    avatarUrl?: string | null;
    address?: string | null;
    emergencyContact?: string | null;
    gender?: string | null;
  } | null;
  salaryStructure?: {
    id: string;
    baseSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
    currency: string;
    paymentCycle: string;
    paymentMethod: string;
    bankName?: string | null;
    accountNumber?: string | null;
  } | null;
}

export interface AttendanceRecordData {
  id: string;
  userId: string;
  date: string | Date;
  checkIn?: string | Date | null;
  checkOut?: string | Date | null;
  status: AttendanceStatus;
  workingHours: number;
  notes?: string | null;
  user?: {
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
      employeeId: string;
      department: string;
    } | null;
  };
}

export interface LeaveRequestData {
  id: string;
  userId: string;
  leaveType: LeaveType;
  startDate: string | Date;
  endDate: string | Date;
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  approverId?: string | null;
  rejectionReason?: string | null;
  approvedAt?: string | Date | null;
  createdAt: string | Date;
  user?: {
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
      employeeId: string;
      department: string;
    } | null;
  };
  approver?: {
    profile?: {
      firstName: string;
      lastName: string;
    } | null;
  } | null;
}

export interface SalaryStructureData {
  id: string;
  userId: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  currency: string;
  paymentCycle: PaymentCycle;
  effectiveFrom: string | Date;
  paymentMethod: string;
  bankName?: string | null;
  accountNumber?: string | null;
  user?: {
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
      employeeId: string;
      department: string;
      designation: string;
    } | null;
  };
}

export interface AuditLogData {
  id: string;
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string | Date;
  actor?: {
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
      role?: string;
    } | null;
  } | null;
}

export type PayrollRecordStatus = "Draft" | "Approved" | "Paid";

export interface SalaryBreakdownData {
  grossSalary: number;
  lopDays: number;
  basic: number;
  hra: number;
  specialAllowance: number;
  totalEarnings: number;
  pf: number;
  esi: number;
  pt: number;
  lopDeduction: number;
  totalDeductions: number;
  netPay: number;
}

export interface PayrollLedgerRecord {
  id: string;
  userId: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  avatarUrl?: string | null;
  grossSalary: number;
  lopDays: number;
  payableDays?: number;
  totalDays?: number;
  currency: string;
  breakdown: SalaryBreakdownData;
  status: PayrollRecordStatus;
  paymentMethod?: string;
  bankName?: string | null;
  accountNumber?: string | null;
  month?: number;
  year?: number;
  updatedAt?: string | Date;
}

