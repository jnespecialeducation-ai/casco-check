"use client";

import Link from "next/link";

export default function StickyCTA() {
  return (
    <div className="sticky bottom-0 z-40 p-4 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden">
      <Link
        href="/reserve"
        className="block w-full py-4 rounded-xl bg-accent text-white font-semibold text-center shadow-card-hover hover:bg-accent-dark hover:scale-[1.02] active:scale-95 transition"
      >
        예약하기
      </Link>
    </div>
  );
}
