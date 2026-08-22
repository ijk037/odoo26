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
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "HR":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "EMPLOYEE":
    default:
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "ACTIVE":
    case "APPROVED":
    case "PRESENT":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "PENDING":
    case "HALF_DAY":
    case "LATE":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "REJECTED":
    case "ABSENT":
    case "SUSPENDED":
    case "INACTIVE":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "ON_LEAVE":
    case "CANCELLED":
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    default:
      return "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }
}
