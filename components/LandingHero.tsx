"use client";

import Link from "next/link";
import { Car } from "lucide-react";
import { SITE } from "@/lib/constants";

const btnBase =
  "inline-flex items-center justify-center px-4 py-3.5 sm:px-5 font-semibold rounded-xl transition-all duration-150 w-full min-w-0 shrink-0 text-sm sm:text-base border-2";
const btnReserve =
  "bg-accent text-white border-accent shadow-[0_4px_0_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_0_0_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_2px_0_0_rgba(0,0,0,0.2)]";
const btnOutline =
  "bg-white/15 backdrop-blur-sm border-white/70 text-white hover:bg-white/25 hover:border-white";

export default function LandingHero() {
  return (
    <section className="relative min-h-[80dvh] flex flex-col justify-center items-center px-4 sm:px-8 gradient-bg text-white overflow-hidden">
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-64 h-64 rounded-full bg-blue-400/20 blur-3xl -top-20 -left-20 animate-[float-shape_8s_ease-in-out_infinite]"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="absolute w-48 h-48 rounded-full bg-cyan-400/15 blur-2xl top-1/2 -right-16 animate-[float-shape_10s_ease-in-out_infinite]"
          style={{ animationDelay: "-2s" }}
        />
        <div
          className="absolute w-40 h-40 rounded-full bg-indigo-400/15 blur-2xl -bottom-10 left-1/3 animate-[float-shape_12s_ease-in-out_infinite]"
          style={{ animationDelay: "-4s" }}
        />
      </div>

      {/* Glassmorphism content panel */}
      <div className="relative z-10 glass-panel rounded-2xl p-8 sm:p-12 max-w-lg w-full mx-auto shadow-xl">
        <div className="text-center mb-8">
          <Car className="w-14 h-14 mx-auto mb-4 text-white drop-shadow-lg" strokeWidth={1.5} />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-md">
            카스코자동차검사소
          </h1>
          <p className="text-base sm:text-lg text-white/90">
            안전하고 신뢰할 수 있는 자동차 검사
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <Link
            href="/reserve"
            className={`${btnBase} ${btnReserve} block`}
          >
            예약하기
          </Link>
          <a
            href={`tel:${SITE.phone.replace(/-/g, "")}`}
            className={`${btnBase} ${btnOutline} block`}
          >
            전화하기
          </a>
          <Link
            href="/#location"
            className={`${btnBase} ${btnOutline} block`}
          >
            찾아오시는 길
          </Link>
        </div>
      </div>
    </section>
  );
}
