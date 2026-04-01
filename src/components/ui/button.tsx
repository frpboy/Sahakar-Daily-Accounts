import * as React from "react"

import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      default: "bg-black text-white hover:bg-gray-900 border-none",
      destructive: "bg-red-500 text-white hover:bg-red-600 border-none",
      outline: "border border-gray-200 bg-white hover:bg-gray-50 text-gray-900",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 border-none",
      ghost: "hover:bg-gray-50 text-gray-900",
      link: "text-gray-900 underline-offset-4 hover:underline",
    }

    const sizes = {
      default: "h-10 px-6 py-2",
      sm: "h-9 px-4",
      lg: "h-11 px-10",
      icon: "h-10 w-10",
    }

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
