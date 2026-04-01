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
            "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "peer-checked:bg-emerald-500 peer-checked:after:translate-x-5",
            "peer-not-checked:bg-input peer-not-checked:after:translate-x-0",
            "after:content-[''] after:absolute after:top-[2px] after:left-[2px]",
            "after:h-5 after:w-5 after:rounded-full after:bg-background after:shadow after:transition-transform",
            className
          )}
        />
      </label>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };
