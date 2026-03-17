"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import CustomerForm from "@/components/admin/CustomerForm";
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

interface CustomerDoc {
  id: string;
  name?: string;
  phone: string;
  carNumber?: string;
  gender?: string;
  createdAt?: { seconds: number };
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCarNumber, setEditCarNumber] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/customers", { credentials: "include" });
      if (!res.ok) throw new Error("고객 목록을 불러오는데 실패했습니다.");
      const list = (await res.json()) as CustomerDoc[];
      setCustomers(list);
    } catch (e) {
      console.error(e);
      alert("고객 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const downloadExcel = () => {
    const headers = ["이름", "휴대폰", "차량번호", "성별"];
    const rows = customers.map((c) => [
      c.name || "",
      c.phone,
      c.carNumber || "",
      c.gender === "male" ? "남" : c.gender === "female" ? "여" : c.gender || "",
    ]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 6 }];
    XLSX.utils.book_append_sheet(wb, ws, "고객목록");
    XLSX.writeFile(wb, `고객목록_${toDateKey(new Date())}.xlsx`);
  };

  const openEdit = (c: CustomerDoc) => {
    setEditId(c.id);
    setEditName(c.name || "");
    setEditPhone(c.phone);
    setEditCarNumber(c.carNumber || "");
    setEditGender(c.gender || "");
    setEditError(null);
  };

  const handleEditPhoneChange = (
    e: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>
  ) => {
    const raw = (e.target as HTMLInputElement).value;
    if (raw.length === 3 && editPhone === `${raw}-`) {
      setEditPhone(raw.slice(0, 2));
      return;
    }
    setEditPhone(formatPhone(raw));
  };

  const handleEditPhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setEditPhone(formatPhone(e.clipboardData.getData("text")));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editPhone.trim()) {
      setEditError("휴대폰 번호를 입력해 주세요.");
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          name: editName.trim() || null,
          phone: editPhone.trim(),
          carNumber: editCarNumber.trim() || null,
          gender: editGender || null,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "고객 수정에 실패했습니다.");
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
      const res = await fetch(`/api/admin/customers?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "고객 삭제에 실패했습니다.");
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
        <h1 className="text-2xl font-bold text-secondary">고객 관리</h1>
        <Button
          variant="outline"
          onClick={downloadExcel}
          disabled={loading || customers.length === 0}
        >
          Excel로 내보내기
        </Button>
      </div>
      <Card>
        <CustomerForm onSuccess={load} />
      </Card>
      {loading ? (
        <p className="text-slate-600">로딩 중...</p>
      ) : (
        <Card>
            <Table>
              <TableHead>
                <TableHeader>이름</TableHeader>
                <TableHeader>휴대폰</TableHeader>
                <TableHeader>차량번호</TableHeader>
                <TableHeader>성별</TableHeader>
                <TableHeader>액션</TableHeader>
              </TableHead>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name || "-"}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>{c.carNumber || "-"}</TableCell>
                    <TableCell>{c.gender === "male" ? "남" : c.gender === "female" ? "여" : "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(c)}
                        >
                          수정
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                        >
                          {deletingId === c.id ? "삭제 중..." : "삭제"}
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
        title="고객 수정"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              이름 (선택)
            </label>
            <Input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              휴대폰
            </label>
            <Input
              type="tel"
              value={editPhone}
              onChange={handleEditPhoneChange}
              onInput={handleEditPhoneChange}
              onPaste={handleEditPhonePaste}
              maxLength={13}
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              차량번호 (선택)
            </label>
            <Input
              type="text"
              value={editCarNumber}
              onChange={(e) => setEditCarNumber(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              성별 (선택)
            </label>
            <select
              value={editGender}
              onChange={(e) => setEditGender(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="">선택</option>
              <option value="male">남</option>
              <option value="female">여</option>
            </select>
          </div>
          {editError && (
            <p className="text-red-600 text-sm">{editError}</p>
          )}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditId(null)}
            >
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
