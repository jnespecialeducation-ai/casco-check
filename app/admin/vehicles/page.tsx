"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import VehicleForm from "@/components/admin/VehicleForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { formatPhone } from "@/lib/utils/format";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui/Table";

interface VehicleDoc {
  id: string;
  customerId: string;
  carNumber: string;
  inspectionType: string;
  nextDueDate: { seconds: number };
  linkToken: string;
  customerName?: string;
}

interface CustomerOption {
  id: string;
  name?: string;
  phone: string;
}

function formatDate(ts: { seconds: number }) {
  return new Date(ts.seconds * 1000).toLocaleDateString("ko-KR");
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleDoc[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"select" | "input">("select");
  const [editCustomerId, setEditCustomerId] = useState("");
  const [editDirectName, setEditDirectName] = useState("");
  const [editDirectPhone, setEditDirectPhone] = useState("");
  const [editCarNumber, setEditCarNumber] = useState("");
  const [editInspectionType, setEditInspectionType] = useState<"periodic" | "comprehensive">("periodic");
  const [editNextDueDate, setEditNextDueDate] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [vRes, cRes] = await Promise.all([
        fetch("/api/admin/vehicles", { credentials: "include" }),
        fetch("/api/admin/customers", { credentials: "include" }),
      ]);
      if (!vRes.ok) throw new Error("차량 목록을 불러오는데 실패했습니다.");
      const list = (await vRes.json()) as VehicleDoc[];
      setVehicles(list);
      if (cRes.ok) {
        const cList = (await cRes.json()) as CustomerOption[];
        setCustomers(cList);
      }
    } catch (e) {
      console.error(e);
      alert("차량 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const downloadExcel = () => {
    const headers = ["차량번호", "검사유형", "만료일", "고객"];
    const rows = vehicles.map((v) => [
      v.carNumber,
      v.inspectionType === "periodic" ? "정기" : v.inspectionType === "comprehensive" ? "종합" : "모름",
      formatDate(v.nextDueDate),
      v.customerName || "",
    ]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [{ wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, "차량목록");
    XLSX.writeFile(wb, `차량목록_${toDateKey(new Date())}.xlsx`);
  };

  const openEdit = (v: VehicleDoc) => {
    setEditId(v.id);
    setEditMode("select");
    setEditCustomerId(v.customerId || "");
    setEditDirectName("");
    setEditDirectPhone("");
    setEditCarNumber(v.carNumber);
    setEditInspectionType((v.inspectionType as "periodic" | "comprehensive") || "periodic");
    setEditNextDueDate(
      v.nextDueDate?.seconds
        ? toDateKey(new Date(v.nextDueDate.seconds * 1000))
        : ""
    );
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const body: Record<string, unknown> = {
      id: editId,
      carNumber: editCarNumber.trim(),
      inspectionType: editInspectionType,
      nextDueDate: editNextDueDate,
    };
    if (editMode === "select") {
      if (!editCustomerId) {
        setEditError("고객을 선택해 주세요.");
        return;
      }
      body.customerId = editCustomerId;
    } else {
      if (!editDirectPhone.trim()) {
        setEditError("연락처를 입력해 주세요.");
        return;
      }
      body.name = editDirectName.trim();
      body.phone = editDirectPhone.trim();
    }
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "차량 수정에 실패했습니다.");
      }
      setEditId(null);
      load();
    } catch (e) {
      setEditError((e as Error).message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "차량 삭제에 실패했습니다.");
      }
      load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary">차량 관리</h1>
        <Button
          variant="outline"
          onClick={downloadExcel}
          disabled={loading || vehicles.length === 0}
        >
          Excel로 내보내기
        </Button>
      </div>
      <Card>
        <VehicleForm onSuccess={load} />
      </Card>
      {loading ? (
        <p className="text-slate-600">로딩 중...</p>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableHeader>차량번호</TableHeader>
              <TableHeader>검사유형</TableHeader>
              <TableHeader>만료일</TableHeader>
              <TableHeader>고객</TableHeader>
              <TableHeader>링크</TableHeader>
              <TableHeader>액션</TableHeader>
            </TableHead>
            <TableBody>
              {vehicles.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>{v.carNumber}</TableCell>
                  <TableCell>
                    {v.inspectionType === "periodic" ? "정기" : v.inspectionType === "comprehensive" ? "종합" : "모름"}
                  </TableCell>
                  <TableCell>{formatDate(v.nextDueDate)}</TableCell>
                  <TableCell>{v.customerName || "-"}</TableCell>
                  <TableCell>
                    {v.linkToken ? (
                      <a
                        href={`/v/${v.linkToken}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:no-underline"
                      >
                        열기
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(v)}
                      >
                        수정
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(v.id)}
                        disabled={deletingId === v.id}
                      >
                        {deletingId === v.id ? "삭제 중..." : "삭제"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Modal
        isOpen={!!editId}
        onClose={() => setEditId(null)}
        title="차량 수정"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">고객</label>
            <div className="flex gap-3 mb-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="editCustomerMode"
                  checked={editMode === "select"}
                  onChange={() => setEditMode("select")}
                  className="rounded"
                />
                <span>기존 고객 선택</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="editCustomerMode"
                  checked={editMode === "input"}
                  onChange={() => setEditMode("input")}
                  className="rounded"
                />
                <span>이름 직접 입력</span>
              </label>
            </div>
            {editMode === "select" ? (
              <select
                value={editCustomerId}
                onChange={(e) => setEditCustomerId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">선택</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.phone}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="이름"
                  value={editDirectName}
                  onChange={(e) => setEditDirectName(e.target.value)}
                  className="w-full"
                />
                <Input
                  type="tel"
                  placeholder="연락처"
                  value={editDirectPhone}
                  onChange={(e) => setEditDirectPhone(formatPhone(e.target.value))}
                  maxLength={14}
                  className="w-full"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">차량번호</label>
            <Input
              type="text"
              value={editCarNumber}
              onChange={(e) => setEditCarNumber(e.target.value)}
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">검사유형</label>
            <select
              value={editInspectionType}
              onChange={(e) => setEditInspectionType(e.target.value as "periodic" | "comprehensive")}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="periodic">정기검사</option>
              <option value="comprehensive">종합검사</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">다음 만료일</label>
            <Input
              type="date"
              value={editNextDueDate}
              onChange={(e) => setEditNextDueDate(e.target.value)}
              className="w-full"
              required
            />
          </div>
          {editError && <p className="text-red-600 text-sm">{editError}</p>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => setEditId(null)}>
              취소
            </Button>
            <Button type="submit" variant="accent" disabled={editLoading}>
              {editLoading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
