import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "outline";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-sm py-1 rounded-full font-mono text-label-sm tracking-wider",
        variant === "default" && "bg-secondary-container text-on-secondary-container",
        variant === "secondary" && "bg-surface-container-high text-on-surface-variant border border-outline-variant",
        variant === "outline" && "border border-outline-variant text-on-surface-variant",
        className
      )}
    >
      {children}
    </span>
  );
}
