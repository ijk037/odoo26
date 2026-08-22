export interface LeaveCategoryQuota {
  leaveType: string;
  name: string;
  totalQuota: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
  percentageUsed: number;
  colorClass: string;
  badgeClass: string;
  description: string;
  isUnlimited?: boolean;
}

export const ANNUAL_LEAVE_POLICIES: Record<string, { name: string; quota: number; color: string; badge: string; desc: string; unlimited?: boolean }> = {
  PAID: {
    name: "Paid Annual Vacation",
    quota: 18.0,
    color: "bg-indigo-500",
    badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    desc: "Standard paid vacation allowance with full salary compensation.",
  },
  SICK: {
    name: "Sick & Medical Leave",
    quota: 12.0,
    color: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    desc: "Medical recovery days and doctor-certified illness absences.",
  },
  CASUAL: {
    name: "Casual / Personal Time",
    quota: 7.0,
    color: "bg-purple-500",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    desc: "Short personal errands, emergency family matters, and personal days.",
  },
  MATERNITY: {
    name: "Maternity Leave",
    quota: 90.0,
    color: "bg-pink-500",
    badge: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    desc: "Statutory paid parental leave for new mothers.",
  },
  PATERNITY: {
    name: "Paternity Leave",
    quota: 15.0,
    color: "bg-cyan-500",
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    desc: "Paid parental leave for secondary caregivers.",
  },
  UNPAID: {
    name: "Unpaid Leave of Absence",
    quota: 0,
    color: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    desc: "Extended time off incurring proportional Loss of Pay (LOP) deductions in payroll.",
    unlimited: true,
  },
};

export interface LeaveRecordSummary {
  id: string;
  leaveType: string;
  startDate: string | Date;
  endDate: string | Date;
  daysCount: number;
  status: string; // "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
}

export function computeLeaveBalances(
  leaveRequests: LeaveRecordSummary[],
  year = new Date().getFullYear()
): Record<string, LeaveCategoryQuota> {
  // Filter for leaves active within the current year
  const activeYearLeaves = leaveRequests.filter((l) => {
    const lYear = new Date(l.startDate).getFullYear();
    return lYear === year && (l.status === "APPROVED" || l.status === "PENDING");
  });

  const result: Record<string, LeaveCategoryQuota> = {};

  Object.entries(ANNUAL_LEAVE_POLICIES).forEach(([type, policy]) => {
    const matchingLeaves = activeYearLeaves.filter((l) => l.leaveType === type);

    const usedDays = matchingLeaves
      .filter((l) => l.status === "APPROVED")
      .reduce((sum, l) => sum + (l.daysCount || 0), 0);

    const pendingDays = matchingLeaves
      .filter((l) => l.status === "PENDING")
      .reduce((sum, l) => sum + (l.daysCount || 0), 0);

    const totalQuota = policy.quota;
    const availableDays = policy.unlimited
      ? 999
      : Math.max(0, Math.round((totalQuota - usedDays - pendingDays) * 10) / 10);

    const percentageUsed = policy.unlimited
      ? 0
      : Math.min(100, Math.round(((usedDays + pendingDays) / (totalQuota || 1)) * 100));

    result[type] = {
      leaveType: type,
      name: policy.name,
      totalQuota,
      usedDays: Math.round(usedDays * 10) / 10,
      pendingDays: Math.round(pendingDays * 10) / 10,
      availableDays,
      percentageUsed,
      colorClass: policy.color,
      badgeClass: policy.badge,
      description: policy.desc,
      isUnlimited: policy.unlimited,
    };
  });

  return result;
}

export interface LeaveValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  daysCount: number;
}

export function validateLeavePolicy({
  leaveType,
  startDate,
  endDate,
  existingLeaves = [],
  allowPastDates = false,
}: {
  leaveType: string;
  startDate: string | Date;
  endDate: string | Date;
  existingLeaves?: LeaveRecordSummary[];
  allowPastDates?: boolean;
}): LeaveValidationResult {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: "Invalid date format specified", daysCount: 0 };
  }

  // 1. Boundary: End date before start date
  if (end < start) {
    return {
      isValid: false,
      error: "End date cannot be earlier than start date.",
      daysCount: 0,
    };
  }

  // 2. Boundary: Past dates check (unless Admin override flag is enabled)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);

  if (!allowPastDates && startDay < today) {
    return {
      isValid: false,
      error: "Leave applications cannot be backdated. Contact HR or Admin for retroactive leave requests.",
      daysCount: 0,
    };
  }

  // 3. Compute business working days (excluding weekends)
  let workingDays = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  if (workingDays === 0) {
    return {
      isValid: false,
      error: "Selected date range only contains weekend days. No working days requested.",
      daysCount: 0,
    };
  }

  // 4. Boundary: Overlapping leave requests check
  const hasOverlap = existingLeaves.some((l) => {
    if (l.status === "REJECTED" || l.status === "CANCELLED") return false;
    const lStart = new Date(l.startDate);
    const lEnd = new Date(l.endDate);
    return start <= lEnd && end >= lStart;
  });

  if (hasOverlap) {
    return {
      isValid: false,
      error: "Conflict Detected: You already have an existing pending or approved leave request during these dates.",
      daysCount: workingDays,
    };
  }

  // 5. Boundary: Quota Exceeded check
  const balances = computeLeaveBalances(existingLeaves, start.getFullYear());
  const categoryBalance = balances[leaveType];

  if (categoryBalance && !categoryBalance.isUnlimited) {
    if (workingDays > categoryBalance.availableDays) {
      return {
        isValid: false,
        error: `Insufficient Quota: Requested ${workingDays} day(s), but you only have ${categoryBalance.availableDays} day(s) available in your ${categoryBalance.name} balance. (Used: ${categoryBalance.usedDays}d, Pending: ${categoryBalance.pendingDays}d).`,
        daysCount: workingDays,
      };
    }
  }

  let warning: string | undefined = undefined;
  if (leaveType === "UNPAID") {
    warning = "Notice: Unpaid Leave of Absence will calculate proportional Loss of Pay (LOP) deductions in this month's payroll.";
  } else if (categoryBalance && categoryBalance.availableDays - workingDays <= 2) {
    warning = `Notice: Approving this leave will leave you with a low balance of ${(categoryBalance.availableDays - workingDays).toFixed(1)} day(s).`;
  }

  return {
    isValid: true,
    warning,
    daysCount: workingDays,
  };
}
