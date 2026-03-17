"use client";

import { AlertCircle } from "lucide-react";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";

const NOTICES = [
  "검사 당일 자동차 등록증만 지참해 주세요.",
  "예약 시간 10분 전 도착을 권장합니다.",
  "차량 점검·수리 후 검사를 받으시면 원활합니다.",
  "예약 변경·취소는 전화(062-267-9494)로 연락해 주세요.",
];

export default function NoticeSection() {
  return (
    <section className="py-8 px-4">
      <SectionHeader
        title="검사 전 유의사항"
        description="원활한 검사를 위해 확인해 주세요"
        className="mb-4"
      />
      <Card>
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-warning" />
          </div>
          <ul className="space-y-2 text-caption text-secondary">
            {NOTICES.map((text, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-warning font-medium">•</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </section>
  );
}
