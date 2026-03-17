"use client";

import Link from "next/link";
import { Car } from "lucide-react";

export default function VehicleLookupCard() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 transition hover:shadow-xl">
      <h3 className="text-lg font-bold text-secondary mb-2 flex items-center gap-2">
        <Car className="w-5 h-5 text-primary" />
        내 차량 정보
      </h3>
      <p className="text-slate-600 text-sm mb-4">
        차량 등록하고 만료일 확인하기
      </p>
      <Link
        href="/lookup"
        className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-accent text-white font-semibold shadow-card hover:bg-accent-dark hover:shadow-card-hover active:scale-[0.98] transition"
      >
        차량 등록
      </Link>
    </div>
  );
}
