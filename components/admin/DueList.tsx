"use client";

import { useState, useEffect } from "react";
import { DUE_FILTER_DAYS } from "@/lib/constants";
import SendSmsButton from "./SendSmsButton";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const BULK_TEMPLATE_OPTIONS = [
  { value: "due7", label: "7일 이내 (due7)" },
  { value: "due14", label: "14일 이내 (due14)" },
  { value: "due30", label: "30일 이내 (due30)" },
] as const;

interface VehicleWithCustomer {
  id: string;
  carNumber: string;
  nextDueDate: Date;
  linkToken: string;
  customerName?: string;
  customerPhone?: string;
}

export default function DueList() {
  const toast = useToast();
  const [filterDays, setFilterDays] = useState(30);
  const [vehicles, setVehicles] = useState<VehicleWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTemplateKey, setBulkTemplateKey] = useState<string>("due30");
  const [bulkSending, setBulkSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/due?days=${filterDays}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("만료 예정 목록을 불러오는데 실패했습니다.");
        const list = (await res.json()) as {
          id: string;
          carNumber: string;
          nextDueDate: string;
          linkToken: string;
          customerName?: string;
          customerPhone?: string;
        }[];
        setVehicles(
          list.map((v) => ({
            id: v.id,
            carNumber: v.carNumber,
            nextDueDate: new Date(v.nextDueDate),
            linkToken: v.linkToken,
            customerName: v.customerName,
            customerPhone: v.customerPhone,
          }))
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filterDays]);

  const getDDay = (d: Date) => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const d2 = new Date(d);
    d2.setHours(0, 0, 0, 0);
    return Math.ceil((d2.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === vehicles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(vehicles.map((v) => v.id)));
    }
  };

  const handleBulkSend = async () => {
    if (selectedIds.size === 0) return;
    setBulkSending(true);
    try {
      const res = await fetch("/api/admin/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleIds: Array.from(selectedIds),
          templateKey: bulkTemplateKey,
        }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "문자 발송에 실패했습니다.");
      const successCount = data.successCount ?? selectedIds.size;
      toast?.show(`${successCount}명에게 문자가 발송되었습니다.`);
      setSelectedIds(new Set());
      await reloadList();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBulkSending(false);
    }
  };

  const reloadList = async () => {
    try {
      const res = await fetch(`/api/admin/due?days=${filterDays}`, { credentials: "include" });
      if (res.ok) {
        const list = (await res.json()) as { id: string; carNumber: string; nextDueDate: string; linkToken: string; customerName?: string; customerPhone?: string }[];
        setVehicles(
          list.map((v) => ({
            id: v.id,
            carNumber: v.carNumber,
            nextDueDate: new Date(v.nextDueDate),
            linkToken: v.linkToken,
            customerName: v.customerName,
            customerPhone: v.customerPhone,
          }))
        );
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {DUE_FILTER_DAYS.map((d) => (
          <Button
            key={d}
            variant={filterDays === d ? "primary" : "ghost"}
            onClick={() => setFilterDays(d)}
            className={filterDays !== d ? "bg-slate-200 hover:bg-slate-300" : ""}
          >
            {d}일 이내
          </Button>
        ))}
        {!loading && vehicles.length > 0 && (
          <>
            <span className="text-slate-600 text-sm ml-2">|</span>
            <select
              value={bulkTemplateKey}
              onChange={(e) => setBulkTemplateKey(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            >
              {BULK_TEMPLATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <Button
              variant="accent"
              onClick={handleBulkSend}
              disabled={selectedIds.size === 0 || bulkSending}
              className="ml-2"
            >
              {bulkSending ? "발송 중..." : `선택한 ${selectedIds.size}명에게 문자 보내기`}
            </Button>
          </>
        )}
      </div>
      {loading ? (
        <p className="text-slate-600">로딩 중...</p>
      ) : (
        <Table>
          <TableHead>
            <TableHeader>
              <input
                type="checkbox"
                checked={vehicles.length > 0 && selectedIds.size === vehicles.length}
                onChange={toggleSelectAll}
                className="rounded"
              />
            </TableHeader>
            <TableHeader>차량번호</TableHeader>
            <TableHeader>만료일</TableHeader>
            <TableHeader>D-day</TableHeader>
            <TableHeader>고객</TableHeader>
            <TableHeader>링크</TableHeader>
            <TableHeader>문자</TableHeader>
          </TableHead>
          <TableBody>
            {vehicles.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(v.id)}
                    onChange={() => toggleSelect(v.id)}
                    className="rounded"
                  />
                </TableCell>
                <TableCell>{v.carNumber}</TableCell>
                <TableCell>{v.nextDueDate.toLocaleDateString("ko-KR")}</TableCell>
                <TableCell>{getDDay(v.nextDueDate)}일</TableCell>
                <TableCell>{v.customerName || v.customerPhone}</TableCell>
                <TableCell>
                  <a
                    href={`/v/${v.linkToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline"
                  >
                    링크
                  </a>
                </TableCell>
                <TableCell>
                  <SendSmsButton
                    vehicleId={v.id}
                    templateKey={getDDay(v.nextDueDate) <= 7 ? "due7" : "due30"}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {!loading && vehicles.length === 0 && (
        <p className="py-4 text-slate-600">해당 기간 내 만료 예정 차량이 없습니다.</p>
      )}
    </div>
  );
}
