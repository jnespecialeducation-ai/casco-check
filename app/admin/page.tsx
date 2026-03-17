"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";

type ChartPeriod = "day" | "week" | "month" | "year";

interface ChartDataPoint {
  label: string;
  key: string;
  count: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    todayCount: 0,
    requested: 0,
    confirmed: 0,
    cancelled: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("day");
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/stats", { credentials: "include" });
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "데이터 로드 실패");
        }
        setStats({
          todayCount: data.todayCount ?? 0,
          requested: data.requested ?? 0,
          confirmed: data.confirmed ?? 0,
          cancelled: data.cancelled ?? 0,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(`데이터 로드 실패: ${msg}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  useEffect(() => {
    const loadChart = async () => {
      setChartLoading(true);
      try {
        const res = await fetch(
          `/api/admin/stats/chart?period=${chartPeriod}`,
          { credentials: "include" }
        );
        if (res.status === 401) return;
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "차트 로드 실패");
        setChartData(json.data ?? []);
      } catch {
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };
    loadChart();
  }, [chartPeriod]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <LoadingSpinner className="w-10 h-10" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-primary mb-6">대시보드</h1>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-6">대시보드</h1>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-caption text-secondary">오늘 예약</p>
              <p className="text-2xl font-bold text-primary">{stats.todayCount}건</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-caption text-secondary">대기중</p>
              <p className="text-2xl font-bold text-primary">{stats.requested}건</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-caption text-secondary">확정</p>
              <p className="text-2xl font-bold text-primary">{stats.confirmed}건</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-caption text-secondary">취소</p>
              <p className="text-2xl font-bold text-primary">{stats.cancelled}건</p>
            </div>
          </div>
        </Card>
      </div>
      <Link href="/admin/reservations">
        <Card hover className="inline-block">
          <span className="font-medium text-primary">예약 관리로 이동 →</span>
        </Card>
      </Link>

      <div className="mt-10">
        <h2 className="text-lg font-bold text-primary mb-4">예약 현황 시각화</h2>
        <Card>
          <div className="flex flex-wrap gap-2 mb-4">
            {(["day", "week", "month", "year"] as const).map((p) => (
              <Button
                key={p}
                variant={chartPeriod === p ? "primary" : "ghost"}
                size="sm"
                onClick={() => setChartPeriod(p)}
                className={chartPeriod !== p ? "bg-slate-200 hover:bg-slate-300" : ""}
              >
                {p === "day" ? "일" : p === "week" ? "주" : p === "month" ? "월" : "연"}
              </Button>
            ))}
          </div>
          {chartLoading ? (
            <div className="h-64 flex items-center justify-center">
              <LoadingSpinner className="w-8 h-8" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              표시할 데이터가 없습니다.
            </div>
          ) : (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5e1" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5e1" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                    formatter={(value) => [`${value ?? 0}건`, "예약"]}
                    labelFormatter={(label) => `기간: ${label}`}
                  />
                  <Bar dataKey="count" name="예약" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
