"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui";

function ReserveCompleteRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";

  useEffect(() => {
    const q = new URLSearchParams();
    if (date) q.set("date", date);
    if (time) q.set("time", time);
    router.replace(`/complete${q.toString() ? `?${q.toString()}` : ""}`);
  }, [router, date, time]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner className="w-8 h-8" />
        <p className="text-secondary text-sm">이동 중...</p>
      </div>
    </div>
  );
}

export default function ReserveCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <p className="text-secondary">로딩 중...</p>
        </div>
      }
    >
      <ReserveCompleteRedirect />
    </Suspense>
  );
}
