"use client";

import Link from "next/link";
import { Calendar, Search, Car } from "lucide-react";
import Card from "@/components/ui/Card";

const ACTIONS = [
  {
    href: "/my-car",
    icon: Car,
    title: "차량 등록 및 조회",
    description: "차량 등록 후 만료일·예약 관리",
  },
  {
    href: "/reserve",
    icon: Calendar,
    title: "검사 예약",
    description: "날짜와 시간을 선택해 예약하세요",
  },
  {
    href: "/lookup",
    icon: Search,
    title: "예약 조회",
    description: "비밀번호로 예약 현황 확인 (대기중·확정·취소)",
  },
] as const;

export default function MainActionCards() {
  return (
    <section className="px-4 -mt-4 relative z-10">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {ACTIONS.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="block h-full min-w-0">
            <Card hover className="h-full group">
              <div className="flex flex-col items-center text-center gap-3 p-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0 w-full">
                  <h3 className="font-semibold text-primary leading-snug [word-break:keep-all]">
                    {title}
                  </h3>
                  <p className="text-caption text-secondary mt-0.5 leading-snug [word-break:keep-all]">
                    {description}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
