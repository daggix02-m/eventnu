import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "active:scale-95 disabled:pointer-events-none disabled:opacity-50",
          variant === "primary" && "primary-gradient text-white shadow-lg shadow-primary/25 hover:shadow-primary/35",
          variant === "secondary" && "bg-secondary text-on-secondary",
          variant === "outline" && "border border-outline-variant text-on-surface hover:bg-surface-container-high",
          variant === "ghost" && "text-on-surface-variant hover:text-primary hover:bg-surface-container-high",
          size === "sm" && "px-sm py-2 text-sm",
          size === "md" && "px-md py-3 text-body-md",
          size === "lg" && "px-lg py-md text-body-lg",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
