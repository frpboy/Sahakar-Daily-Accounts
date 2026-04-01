"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div
          className={cn(
            "peer inline-flex h-5 w-10 shrink-0 items-center rounded-none border border-gray-200 bg-gray-100 transition-colors focus-visible:outline-none focus-visible:border-black disabled:cursor-not-allowed disabled:opacity-50",
            "peer-checked:bg-emerald-500 peer-checked:border-emerald-600",
            className
          )}
        >
          <div
            className={cn(
              "h-3.5 w-3.5 bg-white shadow-sm transition-transform rounded-none translate-x-0.5",
              "peer-checked:translate-x-5.5"
            )}
          />
        </div>
      </label>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
