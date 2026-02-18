import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError = false, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-lg border bg-gray-950 px-3 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
          hasError
            ? "border-red-700 bg-red-950/10"
            : "border-gray-700 hover:border-gray-600",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

