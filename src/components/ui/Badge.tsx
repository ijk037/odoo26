import React from "react";
import { cn, getRoleBadgeClass, getStatusBadgeClass } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "role" | "status" | "outline";
  value?: string;
}

export function Badge({
  className,
  variant = "default",
  value,
  children,
  ...props
}: BadgeProps) {
  let badgeStyle = "bg-slate-800 text-slate-300 border-slate-700";

  if (variant === "role" && value) {
    badgeStyle = getRoleBadgeClass(value);
  } else if (variant === "status" && value) {
    badgeStyle = getStatusBadgeClass(value);
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        badgeStyle,
        className
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {children || value}
    </span>
  );
}
