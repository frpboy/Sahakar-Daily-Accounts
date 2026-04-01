import * as React from "react"
import { cn } from "@/lib/utils"

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("container mx-auto px-4 max-w-7xl", className)}
      {...props}
    />
  )
)
Container.displayName = "Container"

export { Container }
