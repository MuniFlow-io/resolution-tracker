import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-800 bg-gray-900/80 p-4 sm:p-6",
        className,
      )}
      {...props}
    />
  );
}

