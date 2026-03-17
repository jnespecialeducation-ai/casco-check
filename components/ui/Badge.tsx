import { type ReactNode } from "react";

const variants = {
  default: "bg-slate-100 text-slate-700",
  warning: "bg-warning/10 text-warning",
  danger: "bg-error/10 text-error",
  success: "bg-success/10 text-success",
};

interface BadgeProps {
  variant?: keyof typeof variants;
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
}

export default function Badge({
  variant = "default",
  size = "md",
  children,
  className = "",
}: BadgeProps) {
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs rounded-md" : "px-2.5 py-0.5 text-sm rounded-lg";
  return (
    <span
      className={`inline-flex items-center font-medium ${sizeClass} ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
