import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Rubric vermilion — marks the published/publishable action state
        default:
          "border-primary/30 bg-primary/10 text-primary",
        secondary:
          "border-secondary/40 bg-secondary/15 text-secondary-foreground",
        destructive:
          "border-destructive/30 bg-destructive/10 text-destructive",
        outline: "border-outline-variant bg-card text-foreground",
        success:
          "border-success/30 bg-success/10 text-success",
        warning:
          "border-warning/40 bg-warning/15 text-warning-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
