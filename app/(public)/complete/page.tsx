"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Phone } from "lucide-react";
import { SITE } from "@/lib/constants";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import CustomerHeader from "@/components/CustomerHeader";

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return dateStr;
  const [y, m, d] = dateStr.split("-");
  if (y && m && d) {
    return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일`;
  }
  return dateStr;
}

function CompleteContent() {
  const searchParams = useSearchParams();
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerHeader title="예약 완료" />
      <main className="pt-16 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="mb-6 text-center animate-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-xl font-bold text-primary mb-2">
              예약이 완료되었습니다
            </h1>
            <p className="text-caption text-secondary mb-6">
              문의사항이 있으시면 전화로 연락해 주세요.
            </p>
            <div className="bg-slate-50 rounded-xl p-5 text-left border border-slate-100">
              <div className="space-y-3">
                <div>
                  <p className="text-caption text-secondary mb-0.5">예약 날짜</p>
                  <p className="font-semibold text-primary">{formatDateDisplay(date)}</p>
                </div>
                <div>
                  <p className="text-caption text-secondary mb-0.5">예약 시간</p>
                  <p className="font-semibold text-primary">{time}</p>
                </div>
              </div>
            </div>
          </Card>
          <a
            href={`tel:${SITE.phone.replace(/-/g, "")}`}
            className="block mb-4"
          >
            <Button variant="accent" className="w-full gap-2">
              <Phone className="w-5 h-5" />
              {SITE.phone} 전화하기
            </Button>
          </a>
          <Link
            href="/"
            className="block text-center text-caption text-secondary hover:text-primary transition"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-secondary">로딩 중...</p>
        </div>
      }
    >
      <CompleteContent />
    </Suspense>
  );
}
