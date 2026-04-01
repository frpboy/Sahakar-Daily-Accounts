import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-none px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest transition-colors border",
        {
          "bg-black text-white border-black hover:bg-gray-900":
            variant === "default",
          "bg-gray-100 text-gray-900 border-gray-100 hover:bg-gray-200":
            variant === "secondary",
          "bg-red-500 text-white border-red-500 hover:bg-red-600":
            variant === "destructive",
          "bg-white text-gray-500 border-gray-200 hover:bg-gray-50":
            variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
