import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, label, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-white/70">{label}</label>
        )}
        <select
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-xl border bg-white/[0.06] px-4 py-3",
            "border-white/[0.12] text-white/95 text-base",
            "transition-all duration-200",
            "focus:outline-none focus:border-blue-400 focus:bg-white/10",
            "focus:shadow-[0_0_0_3px_rgba(96,165,250,0.2)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "appearance-none",
            className
          )}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
