import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ROLE_BADGES: Record<string, string> = {
  ADMIN: "bg-[#994621] text-white border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]",
  HR: "bg-[#7b5500] text-white border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]",
};

export const getRoleBadgeClass = (role: string): string =>
  ROLE_BADGES[role] || "bg-[#346645] text-white border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]";

const STATUS_BADGES: Record<string, string> = {
  ACTIVE: "bg-[#4d7f5c] text-white border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]",
  APPROVED: "bg-[#4d7f5c] text-white border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]",
  PRESENT: "bg-[#4d7f5c] text-white border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]",
  PENDING: "bg-[#E6A938] text-[#151D22] border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)] font-bold",
  HALF_DAY: "bg-[#E6A938] text-[#151D22] border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)] font-bold",
  LATE: "bg-[#E6A938] text-[#151D22] border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)] font-bold",
  REJECTED: "bg-[#ba1a1a] text-white border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]",
  ABSENT: "bg-[#ba1a1a] text-white border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]",
  SUSPENDED: "bg-[#ba1a1a] text-white border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]",
  INACTIVE: "bg-[#ba1a1a] text-white border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]",
};

export const getStatusBadgeClass = (status: string): string =>
  STATUS_BADGES[status] || "bg-[#dce3eb] text-[#151D22] border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]";

