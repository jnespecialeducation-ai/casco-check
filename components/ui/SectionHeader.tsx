import { type ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  description,
  action,
  className = "",
}: SectionHeaderProps) {
  const desc = description ?? subtitle;
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${className}`}>
      <div>
        <h2 className="text-title text-primary">{title}</h2>
        {desc && <p className="text-caption text-secondary mt-0.5">{desc}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
