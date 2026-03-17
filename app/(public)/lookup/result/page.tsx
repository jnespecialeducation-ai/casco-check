"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Calendar } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import CustomerHeader from "@/components/CustomerHeader";
import { useToast } from "@/components/ui/Toast";
import { LoadingSpinner } from "@/components/ui";

interface ReservationItem {
  id: string;
  date: string;
  timeSlot: string;
  carNumber: string;
  status?: string;
}

const STATUS_LABEL: Record<string, string> = {
  requested: "대기중",
  confirmed: "확정",
  cancelled: "취소",
  completed: "완료",
  noshow: "노쇼",
};

function getStatusBadgeVariant(status: string): "default" | "warning" | "danger" | "success" {
  switch (status) {
    case "confirmed":
    case "completed":
      return "success";
    case "cancelled":
    case "noshow":
      return "danger";
    case "requested":
    default:
      return "warning";
  }
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return dateStr;
  const [y, m, d] = dateStr.split("-");
  if (y && m && d) {
    return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일`;
  }
  return dateStr;
}

function LookupResultContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const token = searchParams.get("token") || "";

  const [reservations, setReservations] = useState<ReservationItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("조회 결과를 찾을 수 없습니다. 예약 조회부터 진행해 주세요.");
      setLoading(false);
      return;
    }

    try {
      const key = `lookup_${token}`;
      const raw = sessionStorage.getItem(key);
      if (!raw) {
        setError("조회 결과가 만료되었거나 올바르지 않습니다. 다시 조회해 주세요.");
        setLoading(false);
        return;
      }
      const data = JSON.parse(raw) as { reservations: ReservationItem[]; phone?: string; carNumber?: string };
      setReservations(data.reservations || []);
      toast?.show("조회가 완료되었습니다.");
    } catch {
      setError("조회 결과를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <CustomerHeader title="예약 조회 결과" />
        <main className="pt-16 pb-8 px-4 flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner className="w-8 h-8" />
            <p className="text-secondary text-sm">조회 중...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerHeader title="예약 조회 결과" />
      <main className="pt-16 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">예약 조회 결과</h1>
              <p className="text-caption text-secondary">
                조회가 완료되었습니다
              </p>
            </div>
          </div>

          {error ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-error font-medium mb-4">{error}</p>
                <Link href="/lookup">
                  <Button variant="outline">다시 조회하기</Button>
                </Link>
              </div>
            </Card>
          ) : reservations !== null && reservations.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-secondary font-medium">예약이 없습니다</p>
                <p className="text-caption text-secondary mt-1">
                  차량을 등록하시면 예약하기와 만료일 확인이 가능합니다
                </p>
                <Link href="/register" className="inline-block mt-4">
                  <Button variant="outline" size="sm">
                    차량 등록하기
                  </Button>
                </Link>
              </div>
            </Card>
          ) : reservations !== null ? (
            <div className="space-y-3">
              <h2 className="font-semibold text-primary">
                예약 목록 ({reservations.length}건)
              </h2>
              {reservations.map((r) => (
                <Card key={r.id} className="border-l-4 border-l-primary">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-primary">
                          {formatDateDisplay(r.date)} {r.timeSlot}
                        </p>
                        <Badge variant={getStatusBadgeVariant(r.status || "requested")}>
                          {STATUS_LABEL[r.status || "requested"] || r.status || "대기중"}
                        </Badge>
                      </div>
                      <p className="text-caption text-secondary mt-1">{r.carNumber}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : null}

          <p className="mt-6 text-center">
            <Link
              href="/lookup"
              className="text-caption text-secondary hover:text-primary transition"
            >
              다시 조회하기
            </Link>
          </p>
          <p className="mt-2 text-center">
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

export default function LookupResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex justify-center items-center">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      }
    >
      <LookupResultContent />
    </Suspense>
  );
}
