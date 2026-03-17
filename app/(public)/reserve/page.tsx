"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { useVehicleByToken } from "@/lib/hooks/useVehicleByToken";
import ReserveSlotPicker from "@/components/ReserveSlotPicker";
import ReserveFullForm from "@/components/ReserveFullForm";
import Card from "@/components/ui/Card";
import CustomerHeader from "@/components/CustomerHeader";
import { LoadingSpinner } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";

function ReserveContent() {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { data, loading, error } = useVehicleByToken(token);

  const handleSuccess = (date: string, timeSlot: string) => {
    toast?.show("예약이 완료되었습니다.");
    router.push(
      `/complete?date=${encodeURIComponent(date)}&time=${encodeURIComponent(timeSlot)}`
    );
  };

  if (!token) {
    return (
      <Card>
        <ReserveFullForm />
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <LoadingSpinner />
          <p className="text-secondary text-sm">차량 정보를 불러오는 중...</p>
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-error mb-4">{error || "차량 정보를 찾을 수 없습니다."}</p>
          <Link href="/" className="text-accent hover:underline font-medium">
            홈으로
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <p className="mb-4 font-medium text-primary">{data.carNumber}</p>
      <ReserveSlotPicker token={token} onSuccess={handleSuccess} />
    </Card>
  );
}

export default function ReservePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerHeader title="검사 예약" />
      <main className="pt-16 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">예약하기</h1>
              <p className="text-caption text-secondary">날짜와 시간을 선택해 주세요</p>
            </div>
          </div>
          <Suspense
            fallback={
              <Card>
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <LoadingSpinner />
                  <p className="text-secondary text-sm">로딩 중...</p>
                </div>
              </Card>
            }
          >
            <ReserveContent />
          </Suspense>
          <p className="mt-6 text-center">
            <Link
              href="/"
              className="text-caption text-secondary hover:text-primary transition"
            >
              홈으로 돌아가기
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
