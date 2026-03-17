"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useVehicleByToken } from "@/lib/hooks/useVehicleByToken";
import VehicleInfo from "@/components/VehicleInfo";
import CustomerHeader from "@/components/CustomerHeader";
import Card from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui";

export default function VehiclePage() {
  const params = useParams();
  const token = (params?.token as string) || null;
  const { data, loading, error } = useVehicleByToken(token);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <CustomerHeader title="차량 정보" />
        <main className="pt-16 pb-8 px-4 flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner className="w-8 h-8" />
            <p className="text-secondary text-sm">차량 정보를 불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !data || !token) {
    return (
      <div className="min-h-screen bg-slate-50">
        <CustomerHeader title="차량 정보" />
        <main className="pt-16 pb-8 px-4">
          <div className="max-w-lg mx-auto">
            <Card>
              <div className="text-center py-8">
                <p className="text-error mb-4">{error || "차량 정보를 찾을 수 없습니다."}</p>
                <Link href="/" className="text-accent hover:underline font-medium">
                  홈으로
                </Link>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerHeader title="차량 정보" />
      <main className="pt-16 pb-8 px-4">
        <div className="max-w-lg mx-auto px-4">
          <VehicleInfo data={data} token={token} />
          <p className="text-center text-sm mt-6">
            <Link href="/" className="text-caption text-secondary hover:text-primary transition">
              홈으로 돌아가기
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
