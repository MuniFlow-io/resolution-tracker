import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "success" | "warning" | "error" | "locked";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-gray-800 text-gray-300 border border-gray-700",
  success: "bg-green-950/20 text-green-300 border border-green-800/60",
  warning: "bg-amber-950/20 text-amber-300 border border-amber-800/60",
  error: "bg-red-950/20 text-red-300 border border-red-800/60",
  locked: "bg-amber-950/20 text-amber-300 border border-amber-800/60",
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

