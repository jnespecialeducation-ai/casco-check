"use client";

import { Zap, Clock, MessageCircle, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  zap: Zap,
  clock: Clock,
  messageCircle: MessageCircle,
  settings: Settings,
};

interface FeatureCardProps {
  iconKey: keyof typeof ICON_MAP;
  label: string;
  href?: string;
}

export default function FeatureCard({ iconKey, label, href }: FeatureCardProps) {
  const Icon = ICON_MAP[iconKey] ?? Zap;
  const content = (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <span className="text-sm font-medium text-slate-700 text-center">{label}</span>
    </div>
  );

  const className =
    "bg-white rounded-2xl shadow-card border border-slate-100 p-6 transition hover:shadow-card-hover hover:border-slate-200 block";

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}
