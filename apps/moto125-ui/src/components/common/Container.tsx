import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`container mx-auto max-w-5xl px-4 py-8 ${className}`}>
      {children}
    </div>
  );
}
