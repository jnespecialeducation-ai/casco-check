"use client";

import { useState, useEffect } from "react";
import type { Customer } from "@/lib/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatPhone } from "@/lib/utils/format";

export default function VehicleForm({ onSuccess }: { onSuccess?: () => void }) {
  const toast = useToast();
  const [customers, setCustomers] = useState<{ id: string; data: Customer }[]>([]);
  const [mode, setMode] = useState<"select" | "input">("select");
  const [customerId, setCustomerId] = useState("");
  const [directName, setDirectName] = useState("");
  const [directPhone, setDirectPhone] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [inspectionType, setInspectionType] = useState<"periodic" | "comprehensive">("periodic");
  const [nextDueDate, setNextDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/customers", { credentials: "include" });
        if (!res.ok) return;
        const list = (await res.json()) as { id: string; name?: string; phone: string; createdAt?: unknown }[];
        const withData = list.map((c) => ({
          id: c.id,
          data: { name: c.name, phone: c.phone, createdAt: c.createdAt } as Customer,
        }));
        setCustomers(withData);
        if (withData.length && mode === "select" && !customerId) setCustomerId(withData[0].id);
      } catch {
        // ignore
      }
    };
    load();
  }, [mode, customerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {
      carNumber: carNumber.trim(),
      inspectionType,
      nextDueDate,
    };
    if (mode === "select") {
      if (!customerId) {
        setError("고객을 선택해 주세요.");
        return;
      }
      body.customerId = customerId;
    } else {
      if (!directPhone.trim()) {
        setError("연락처를 입력해 주세요.");
        return;
      }
      body.name = directName.trim();
      body.phone = directPhone.trim();
    }
    if (!carNumber.trim() || !nextDueDate) {
      setError("차량번호, 만료일을 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "차량 등록에 실패했습니다.");
      }
      toast?.show("차량이 등록되었습니다.");
      setCarNumber("");
      setNextDueDate("");
      if (mode === "input") {
        setDirectName("");
        setDirectPhone("");
      }
      onSuccess?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">고객</label>
        <div className="flex gap-3 mb-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="customerMode"
              checked={mode === "select"}
              onChange={() => setMode("select")}
              className="rounded"
            />
            <span>기존 고객 선택</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="customerMode"
              checked={mode === "input"}
              onChange={() => setMode("input")}
              className="rounded"
            />
            <span>이름 직접 입력</span>
          </label>
        </div>
        {mode === "select" ? (
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          >
            <option value="">선택</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.data.name || c.data.phone}
              </option>
            ))}
          </select>
        ) : (
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="이름"
              value={directName}
              onChange={(e) => setDirectName(e.target.value)}
            />
            <Input
              type="tel"
              placeholder="연락처"
              value={directPhone}
              onChange={(e) => setDirectPhone(formatPhone(e.target.value))}
              maxLength={14}
            />
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">차량번호</label>
        <Input
          type="text"
          value={carNumber}
          onChange={(e) => setCarNumber(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">검사유형</label>
        <select
          value={inspectionType}
          onChange={(e) => setInspectionType(e.target.value as "periodic" | "comprehensive")}
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
          value={nextDueDate}
          onChange={(e) => setNextDueDate(e.target.value)}
          required
        />
      </div>
      <Button type="submit" variant="accent" disabled={loading}>
        {loading ? "저장 중..." : "차량 추가"}
      </Button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </form>
  );
}
