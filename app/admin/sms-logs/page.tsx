"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui/Table";

interface SmsLogDoc {
  id: string;
  phone: string;
  templateKey: string;
  body: string;
  vehicleId?: string;
  result: string;
  createdAt?: { seconds: number };
}

function formatDate(ts?: { seconds: number }) {
  if (!ts) return "-";
  return new Date(ts.seconds * 1000).toLocaleString("ko-KR");
}

export default function AdminSmsLogsPage() {
  const toast = useToast();
  const [logs, setLogs] = useState<SmsLogDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/sms-logs", { credentials: "include" });
      if (!res.ok) throw new Error("발송 로그를 불러오는데 실패했습니다.");
      const list = (await res.json()) as SmsLogDoc[];
      setLogs(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === logs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(logs.map((l) => l.id)));
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`선택한 ${selectedIds.size}건을 삭제하시겠습니까?`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/sms-logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "삭제에 실패했습니다.");
      toast?.show(`${selectedIds.size}건이 삭제되었습니다.`);
      setSelectedIds(new Set());
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary">문자 발송 로그</h1>
        {selectedIds.size > 0 && (
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "삭제 중..." : `선택 삭제 (${selectedIds.size}건)`}
          </Button>
        )}
      </div>
      {loading ? (
        <p className="text-slate-600">로딩 중...</p>
      ) : (
        <Card>
          <Table>
            <TableHead>
              <TableHeader className="w-12">
                <input
                  type="checkbox"
                  checked={logs.length > 0 && selectedIds.size === logs.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300"
                />
              </TableHeader>
              <TableHeader>발송시각</TableHeader>
              <TableHeader>수신번호</TableHeader>
              <TableHeader>템플릿</TableHeader>
              <TableHeader>결과</TableHeader>
              <TableHeader>내용</TableHeader>
            </TableHead>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(l.id)}
                      onChange={() => toggleSelect(l.id)}
                      className="rounded border-slate-300"
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(l.createdAt)}
                  </TableCell>
                  <TableCell>{l.phone}</TableCell>
                  <TableCell>{l.templateKey}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        l.result.startsWith("SENT") ||
                        l.result === "DEV_LOGGED"
                          ? "success"
                          : "danger"
                      }
                    >
                      {l.result}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {l.body}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {logs.length === 0 && (
            <p className="py-4 text-slate-600">발송 로그가 없습니다.</p>
          )}
        </Card>
      )}
    </div>
  );
}
