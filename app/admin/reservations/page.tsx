"use client";

import { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui/Table";

interface ReservationDoc {
  id: string;
  vehicleId?: string;
  customerId?: string;
  name?: string;
  phone?: string;
  carNumber?: string;
  date: string;
  timeSlot: string;
  type?: string;
  note?: string;
  status: string;
  createdAt?: { seconds: number };
}

const STATUS_LABEL: Record<string, string> = {
  requested: "접수",
  confirmed: "확정",
  completed: "완료",
  noshow: "노쇼",
  cancelled: "취소",
};

const STATUS_OPTIONS = [
  { value: "requested", label: "접수" },
  { value: "confirmed", label: "확정" },
  { value: "completed", label: "완료" },
  { value: "noshow", label: "노쇼" },
  { value: "cancelled", label: "취소" },
];

function getBadgeVariant(status: string): "default" | "warning" | "danger" | "success" {
  switch (status) {
    case "completed":
      return "success";
    case "cancelled":
    case "noshow":
      return "danger";
    case "confirmed":
      return "success";
    default:
      return "default";
  }
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getTodayKey(): string {
  return toDateKey(new Date());
}

function getTomorrowKey(): string {
  const t = new Date();
  t.setDate(t.getDate() + 1);
  return toDateKey(t);
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<ReservationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "today" | "tomorrow">("all");
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/reservations", { credentials: "include" });
        if (!res.ok) throw new Error("예약 목록을 불러오는데 실패했습니다.");
        const list = (await res.json()) as ReservationDoc[];
        setReservations(list);
      } catch (e) {
        console.error(e);
        alert("예약 목록을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = reservations;
    const todayKey = getTodayKey();
    const tomorrowKey = getTomorrowKey();
    if (tab === "today") {
      list = list.filter((r) => r.date === todayKey);
    } else if (tab === "tomorrow") {
      list = list.filter((r) => r.date === tomorrowKey);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          (r.carNumber || "").toLowerCase().includes(q) ||
          (r.phone || "").replace(/-/g, "").includes(q.replace(/-/g, "")) ||
          (r.name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [reservations, tab, search]);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("상태 변경에 실패했습니다.");
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      if (detailId === id) setDetailId(null);
    } catch (e) {
      console.error(e);
      alert("상태 변경에 실패했습니다.");
    } finally {
      setUpdatingId(null);
    }
  };

  const downloadExcel = () => {
    const headers = ["날짜", "시간", "이름", "전화", "차량", "검사종류", "상태", "메모"];
    const rows = filtered.map((r) => [
      r.date,
      r.timeSlot,
      r.name || "",
      r.phone || "",
      r.carNumber || "",
      r.type === "comprehensive" ? "종합검사" : r.type === "unknown" ? "모름" : "정기검사",
      STATUS_LABEL[r.status] || r.status,
      r.note || "",
    ]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [
      { wch: 12 },
      { wch: 6 },
      { wch: 10 },
      { wch: 14 },
      { wch: 12 },
      { wch: 8 },
      { wch: 6 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "예약목록");
    XLSX.writeFile(wb, `예약목록_${toDateKey(new Date())}.xlsx`);
  };

  const detail = detailId ? filtered.find((r) => r.id === detailId) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">예약 관리</h1>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          {(["all", "today", "tomorrow"] as const).map((t) => (
            <Button
              key={t}
              variant={tab === t ? "primary" : "ghost"}
              onClick={() => setTab(t)}
              className={tab !== t ? "bg-slate-200 hover:bg-slate-300" : ""}
            >
              {t === "all" ? "전체" : t === "today" ? "오늘" : "내일"}
            </Button>
          ))}
        </div>
        <Input
          type="search"
          placeholder="차량번호/고객명/연락처 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" onClick={downloadExcel} disabled={filtered.length === 0}>
          Excel로 내보내기
        </Button>
      </div>

      {loading ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <LoadingSpinner className="w-8 h-8" />
            <p className="text-secondary text-sm">로딩 중...</p>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="text-primary font-medium mb-2">예약이 없습니다.</p>
            <p className="text-caption text-secondary">날짜 또는 검색 조건을 변경해 보세요.</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Desktop: Table */}
          <Card className="hidden md:block overflow-x-auto">
            <Table>
              <TableHead>
                <TableHeader>날짜</TableHeader>
                <TableHeader>시간</TableHeader>
                <TableHeader>이름</TableHeader>
                <TableHeader>연락처</TableHeader>
                <TableHeader>차량</TableHeader>
                <TableHeader>상태</TableHeader>
                <TableHeader>액션</TableHeader>
              </TableHead>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.timeSlot}</TableCell>
                    <TableCell>{r.name || "-"}</TableCell>
                    <TableCell>{r.phone || "-"}</TableCell>
                    <TableCell>{r.carNumber || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(r.status)}>
                        {STATUS_LABEL[r.status] || r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {r.status !== "confirmed" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusChange(r.id, "confirmed")}
                            disabled={updatingId === r.id}
                          >
                            확정
                          </Button>
                        )}
                        {r.status !== "completed" && r.status !== "cancelled" && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleStatusChange(r.id, "completed")}
                            disabled={updatingId === r.id}
                          >
                            완료
                          </Button>
                        )}
                        {r.status !== "cancelled" && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleStatusChange(r.id, "cancelled")}
                            disabled={updatingId === r.id}
                          >
                            취소
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailId(r.id)}
                        >
                          상세
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-primary">{r.carNumber || "-"}</p>
                    <p className="text-caption text-secondary">{r.name || "-"} · {r.phone || "-"}</p>
                  </div>
                  <Badge variant={getBadgeVariant(r.status)}>
                    {STATUS_LABEL[r.status] || r.status}
                  </Badge>
                </div>
                <p className="text-sm text-secondary mb-3">
                  {r.date} {r.timeSlot} · {r.type === "comprehensive" ? "종합검사" : r.type === "unknown" ? "모름" : "정기검사"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {r.status !== "confirmed" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStatusChange(r.id, "confirmed")}
                      disabled={updatingId === r.id}
                    >
                      확정
                    </Button>
                  )}
                  {r.status !== "completed" && r.status !== "cancelled" && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleStatusChange(r.id, "completed")}
                      disabled={updatingId === r.id}
                    >
                      완료
                    </Button>
                  )}
                  {r.status !== "cancelled" && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleStatusChange(r.id, "cancelled")}
                      disabled={updatingId === r.id}
                    >
                      취소
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetailId(r.id)}
                  >
                    상세
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal
        isOpen={!!detail}
        onClose={() => setDetailId(null)}
        title="예약 상세"
      >
        {detail && (
          <div className="space-y-3 text-sm">
            <p><span className="font-medium">날짜/시간:</span> {detail.date} {detail.timeSlot}</p>
            <p><span className="font-medium">이름:</span> {detail.name || "-"}</p>
            <p><span className="font-medium">연락처:</span> {detail.phone || "-"}</p>
            <p><span className="font-medium">차량:</span> {detail.carNumber || "-"}</p>
            <p><span className="font-medium">검사:</span> {detail.type === "comprehensive" ? "종합검사" : detail.type === "unknown" ? "모름" : "정기검사"}</p>
            <p><span className="font-medium">상태:</span> {STATUS_LABEL[detail.status] || detail.status}</p>
            <p><span className="font-medium">메모:</span> {detail.note || "-"}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
