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

export function getRoleBadgeClass(role: string): string {
  switch (role) {
    case "ADMIN":
      return "bg-[#994621] text-white border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]";
    case "HR":
      return "bg-[#7b5500] text-white border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]";
    case "EMPLOYEE":
    default:
      return "bg-[#346645] text-white border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]";
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "ACTIVE":
    case "APPROVED":
    case "PRESENT":
      return "bg-[#4d7f5c] text-white border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]";
    case "PENDING":
    case "HALF_DAY":
    case "LATE":
      return "bg-[#E6A938] text-[#151D22] border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)] font-bold";
    case "REJECTED":
    case "ABSENT":
    case "SUSPENDED":
    case "INACTIVE":
      return "bg-[#ba1a1a] text-white border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]";
    case "ON_LEAVE":
    case "CANCELLED":
      return "bg-[#dce3eb] text-[#151D22] border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]";
    default:
      return "bg-[#dce3eb] text-[#151D22] border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]";
  }
}
