import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  glass?: boolean;
  hover?: boolean;
}

export default function Card({ children, className = "", glass = false, hover = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl p-6 transition-all duration-200 ${
        glass
          ? "bg-white/10 backdrop-blur-xl border border-white/20"
          : "bg-white shadow-card border border-slate-100"
      } ${hover ? "hover:shadow-card-hover hover:border-slate-200" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
