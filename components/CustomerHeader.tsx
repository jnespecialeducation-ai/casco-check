"use client";

import Link from "next/link";
import { ChevronLeft, Car } from "lucide-react";

interface CustomerHeaderProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
  showLogo?: boolean;
}

export default function CustomerHeader({
  title,
  showBack = true,
  backHref = "/",
  showLogo = false,
}: CustomerHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-primary border-b border-primary-light shadow-card flex items-center px-4">
      <div className="max-w-lg mx-auto w-full flex items-center gap-3">
        {showBack && (
          <Link
            href={backHref}
            className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition text-white"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
        )}
        {showLogo && (
          <Link href="/" className="flex items-center gap-2 text-white font-bold">
            <Car className="w-5 h-5" />
            <span className="hidden sm:inline">카스코</span>
          </Link>
        )}
        <h1 className="flex-1 text-lg font-semibold text-white truncate">
          {title}
        </h1>
      </div>
    </header>
  );
}
