import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "success" | "warning" | "error" | "locked";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "border border-slate-400 bg-slate-100 text-slate-700",
  success: "border border-emerald-300 bg-emerald-100 text-emerald-800",
  warning: "border border-amber-300 bg-amber-100 text-amber-800",
  error: "border border-red-300 bg-red-100 text-red-800",
  locked: "border border-primary-300 bg-primary-100 text-primary-800",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

