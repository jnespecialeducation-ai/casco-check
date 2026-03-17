"use client";

import Link from "next/link";
import { Car } from "lucide-react";
import { SITE } from "@/lib/constants";
import type { VehicleData } from "@/lib/hooks/useVehicleByToken";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

function formatDueDate(val: VehicleData["nextDueDate"]): string {
  if (!val) return "-";
  let d: Date;
  if (typeof (val as { seconds?: number }).seconds === "number") {
    const t = val as { seconds: number; nanoseconds: number };
    d = new Date(t.seconds * 1000);
  } else {
    d = val as Date;
  }
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function getDDay(val: VehicleData["nextDueDate"]): number | null {
  if (!val) return null;
  let d: Date;
  if (typeof (val as { seconds?: number }).seconds === "number") {
    const t = val as { seconds: number };
    d = new Date(t.seconds * 1000);
  } else {
    d = val as Date;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getBadgeVariant(dDay: number): "default" | "warning" | "danger" | "success" {
  if (dDay < 0) return "danger";
  if (dDay <= 7) return "danger";
  if (dDay <= 14) return "warning";
  return "success";
}

interface VehicleInfoProps {
  data: VehicleData;
  token: string;
}

export default function VehicleInfo({ data, token }: VehicleInfoProps) {
  const dueStr = formatDueDate(data.nextDueDate);
  const dDay = getDDay(data.nextDueDate);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Car className="w-12 h-12 mx-auto mb-2 text-primary" strokeWidth={2} />
        <h2 className="text-lg font-medium text-slate-600">카스코자동차검사소</h2>
      </div>

      <Card className="rounded-2xl shadow-lg">
        <h3 className="text-xl font-bold text-primary mb-4">{data.carNumber}</h3>
        <div className="space-y-2 text-secondary">
          <p>
            <span className="font-medium">다음 검사일</span> {dueStr}
          </p>
          {dDay !== null && (
            <p className="flex items-center gap-2">
              <span className="font-medium">D-day</span>
              <Badge variant={getBadgeVariant(dDay)}>
                {dDay > 0 ? dDay + "일" : dDay === 0 ? "오늘" : "만료"}
              </Badge>
            </p>
          )}
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <Link href={`/reserve?token=${token}`} className="w-full">
            <Button variant="accent" className="w-full shadow-lg hover:scale-105 active:scale-95 transition-transform">
              예약하기
            </Button>
          </Link>
          <a href={`tel:${SITE.phone.replace(/-/g, "")}`} className="w-full">
            <Button variant="outline" className="w-full">
              전화하기
            </Button>
          </a>
          <a
            href={SITE.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button variant="outline" className="w-full">
              길찾기
            </Button>
          </a>
        </div>
      </Card>
    </div>
  );
}
