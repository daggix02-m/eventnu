import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Container({ children, className, id }: ContainerProps) {
  return (
    <div id={id} className={cn("w-full px-gutter max-w-container-max mx-auto", className)}>
      {children}
    </div>
  );
}
