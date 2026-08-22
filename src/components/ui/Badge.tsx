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
  let badgeStyle = "bg-[#FAF7F2] text-[#151D22] border-2 border-[#151D22] shadow-[1px_1px_0px_0px_rgba(21,29,34,1)]";

  if (variant === "role" && value) {
    badgeStyle = getRoleBadgeClass(value);
  } else if (variant === "status" && value) {
    badgeStyle = getStatusBadgeClass(value);
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-all",
        badgeStyle,
        className
      )}
      {...props}
    >
      {children || value}
    </span>
  );
}
