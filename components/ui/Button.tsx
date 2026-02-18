"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-500 border border-primary-500/70",
  secondary:
    "bg-gray-900 text-gray-100 border border-gray-700 hover:border-gray-600 hover:bg-gray-800",
  ghost: "bg-transparent text-gray-300 hover:text-white hover:bg-gray-900/60",
  destructive:
    "bg-red-950/40 text-red-300 border border-red-800/60 hover:bg-red-900/50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-[44px] px-3 py-2 text-sm",
  md: "min-h-[44px] px-4 py-2.5 text-sm",
  lg: "min-h-[48px] px-5 py-3 text-sm",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

