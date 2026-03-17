"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { formatAmount } from "@/lib/utils/format";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui/Table";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Plus,
  Settings,
  FileSpreadsheet,
} from "lucide-react";

type Tab = "summary" | "register" | "list" | "settings";

interface FinanceRecord {
  id: string;
  type: "income" | "expense";
  date: string;
  title: string;
  amount: number;
  category: string;
  paymentMethod: string;
  memo?: string;
}

interface FinanceSettings {
  incomeCategories: string[];
  expenseCategories: string[];
  paymentMethods: string[];
}

interface SummaryData {
  monthly: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    count: number;
  };
  monthlyChart: { label: string; income: number; expense: number }[];
  expensePie: { name: string; value: number }[];
  dailyTrend: { label: string; key: string; count: number }[];
  recent5: FinanceRecord[];
  monthKey?: string;
}

const PIE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#9333ea",
  "#0891b2",
  "#dc2626",
  "#ca8a04",
];

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function AdminFinancePage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("summary");

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const [settings, setSettings] = useState<FinanceSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [registerForm, setRegisterForm] = useState({
    type: "income" as "income" | "expense",
    date: toDateKey(new Date()),
    title: "",
    amount: 0,
    category: "",
    paymentMethod: "",
    memo: "",
  });
  const [registerLoading, setRegisterLoading] = useState(false);

  const [listFilters, setListFilters] = useState({
    start: "",
    end: "",
    type: "all" as "all" | "income" | "expense",
    category: "",
    keyword: "",
    sortBy: "date" as "date" | "amountHigh" | "amountLow",
  });

  const [summaryMonth, setSummaryMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FinanceRecord>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [settingsModal, setSettingsModal] = useState<
    | {
        type: "incomeCategory" | "expenseCategory" | "paymentMethod";
        action: "add" | "edit";
        value?: string;
        oldValue?: string;
      }
    | null
  >(null);
  const [settingsModalValue, setSettingsModalValue] = useState("");
  const [settingsModalLoading, setSettingsModalLoading] = useState(false);

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch(
        `/api/admin/finance/summary?month=${summaryMonth}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("요약 로드 실패");
      const data = (await res.json()) as SummaryData;
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadRecords = async () => {
    setRecordsLoading(true);
    try {
      const params = new URLSearchParams();
      if (listFilters.start) params.set("start", listFilters.start);
      if (listFilters.end) params.set("end", listFilters.end);
      if (listFilters.type !== "all") params.set("type", listFilters.type);
      if (listFilters.category) params.set("category", listFilters.category);
      if (listFilters.keyword) params.set("keyword", listFilters.keyword);
      const res = await fetch(
        `/api/admin/finance/records?${params.toString()}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("목록 로드 실패");
      const list = (await res.json()) as FinanceRecord[];
      setRecords(list);
    } catch {
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/finance/settings", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("설정 로드 실패");
      const data = (await res.json()) as FinanceSettings;
      setSettings(data);
    } catch {
      setSettings(null);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "summary") loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, summaryMonth]);

  useEffect(() => {
    if (tab === "list") loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab === "register" || tab === "list" || tab === "settings")
      loadSettings();
  }, [tab]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.title.trim()) {
      toast?.show("항목명을 입력해 주세요.");
      return;
    }
    if (registerForm.amount < 0) {
      toast?.show("올바른 금액을 입력해 주세요.");
      return;
    }
    setRegisterLoading(true);
    try {
      const res = await fetch("/api/admin/finance/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: registerForm.type,
          date: registerForm.date,
          title: registerForm.title.trim(),
          amount: registerForm.amount,
          category: registerForm.category.trim(),
          paymentMethod: registerForm.paymentMethod.trim(),
          memo: registerForm.memo.trim() || null,
        }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "등록 실패");
      toast?.show("등록이 완료되었습니다.");
      setRegisterForm({
        type: "income",
        date: toDateKey(new Date()),
        title: "",
        amount: 0,
        category: "",
        paymentMethod: "",
        memo: "",
      });
      loadSummary();
      loadRecords();
    } catch (e) {
      toast?.show((e as Error).message);
    } finally {
      setRegisterLoading(false);
    }
  };

  const openEdit = (r: FinanceRecord) => {
    setEditId(r.id);
    setEditForm(r);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editForm.title?.trim()) {
      toast?.show("항목명을 입력해 주세요.");
      return;
    }
    setEditLoading(true);
    try {
      const res = await fetch("/api/admin/finance/records", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          type: editForm.type,
          date: editForm.date,
          title: editForm.title.trim(),
          amount: editForm.amount,
          category: editForm.category?.trim(),
          paymentMethod: editForm.paymentMethod?.trim(),
          memo: editForm.memo?.trim() || null,
        }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "수정 실패");
      toast?.show("수정되었습니다.");
      setEditId(null);
      loadRecords();
      loadSummary();
    } catch (e) {
      toast?.show((e as Error).message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/finance/records", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "삭제 실패");
      toast?.show("삭제되었습니다.");
      loadRecords();
      loadSummary();
    } catch (e) {
      toast?.show((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const sortedRecords = [...records].sort((a, b) => {
    if (listFilters.sortBy === "amountHigh") return (b.amount || 0) - (a.amount || 0);
    if (listFilters.sortBy === "amountLow") return (a.amount || 0) - (b.amount || 0);
    return (b.date || "").localeCompare(a.date || "");
  });

  const getExcelFilename = () => {
    if (listFilters.start && listFilters.end) {
      const m = listFilters.start.slice(0, 7);
      return `검사소_수입지출_${m}.xlsx`;
    }
    const now = new Date();
    const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return `검사소_수입지출_${m}.xlsx`;
  };

  const downloadExcel = () => {
    const headers = ["날짜", "구분", "항목명", "카테고리", "금액", "결제수단", "메모"];
    const rows = sortedRecords.map((r) => [
      r.date,
      r.type === "income" ? "수입" : "지출",
      r.title,
      r.category,
      r.amount,
      r.paymentMethod,
      r.memo || "",
    ]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [
      { wch: 10 },
      { wch: 6 },
      { wch: 16 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "수입지출");
    XLSX.writeFile(wb, getExcelFilename());
  };

  const handleSettingsModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsModal || !settings) return;
    const val = settingsModalValue.trim();
    if (!val) {
      toast?.show("값을 입력해 주세요.");
      return;
    }
    setSettingsModalLoading(true);
    try {
      if (settingsModal.action === "add") {
        const res = await fetch("/api/admin/finance/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: settingsModal.type,
            value: val,
          }),
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "추가 실패");
        toast?.show("항목이 추가되었습니다.");
      } else {
        const res = await fetch("/api/admin/finance/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: settingsModal.type,
            oldValue: settingsModal.oldValue,
            newValue: val,
          }),
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "수정 실패");
        toast?.show("항목이 수정되었습니다.");
      }
      setSettingsModal(null);
      loadSettings();
    } catch (e) {
      toast?.show((e as Error).message);
    } finally {
      setSettingsModalLoading(false);
    }
  };

  const handleSettingsDelete = async (
    type: "incomeCategory" | "expenseCategory" | "paymentMethod",
    value: string
  ) => {
    if (!confirm(`'${value}' 항목을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch("/api/admin/finance/settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "삭제 실패");
      toast?.show("항목이 삭제되었습니다.");
      loadSettings();
    } catch (e) {
      toast?.show((e as Error).message);
    }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "summary", label: "요약" },
    { id: "register", label: "등록" },
    { id: "list", label: "조회" },
    { id: "settings", label: "설정" },
  ];

  const categories =
    registerForm.type === "income"
      ? settings?.incomeCategories ?? []
      : settings?.expenseCategories ?? [];

  const MONTH_OPTIONS = (() => {
    const opts: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      opts.push({ value: v, label: `${d.getFullYear()}년 ${d.getMonth() + 1}월` });
    }
    return opts;
  })();

  const TypeBadge = ({ type }: { type: string }) => (
    <Badge variant={type === "income" ? "success" : "danger"} size="sm">
      {type === "income" ? "수입" : "지출"}
    </Badge>
  );

  const CategoryBadge = ({ category }: { category: string }) =>
    category ? (
      <Badge variant="default" size="sm" className="bg-slate-200/80 text-slate-600">
        {category}
      </Badge>
    ) : (
      <span className="text-slate-400 text-sm">-</span>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary">수입·지출 관리</h1>
        <Button
          variant="accent"
          size="sm"
          onClick={() => setTab("register")}
          className="shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          내역 등록
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "primary" : "ghost"}
            size="sm"
            onClick={() => setTab(t.id)}
            className={tab !== t.id ? "bg-slate-200 hover:bg-slate-300" : ""}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "summary" && (
        <>
          {summaryLoading ? (
            <div className="min-h-[40vh] flex items-center justify-center">
              <LoadingSpinner className="w-10 h-10" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  월 선택
                  <select
                    value={summaryMonth}
                    onChange={(e) => setSummaryMonth(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
                  >
                    {MONTH_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <p className="text-sm font-medium text-slate-500 mb-1">이번 달 총 수입</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">
                    {formatAmount(summary?.monthly.totalIncome ?? 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">원</p>
                </Card>
                <Card>
                  <p className="text-sm font-medium text-slate-500 mb-1">이번 달 총 지출</p>
                  <p className="text-2xl sm:text-3xl font-bold text-red-600">
                    {formatAmount(summary?.monthly.totalExpense ?? 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">원</p>
                </Card>
                <Card>
                  <p className="text-sm font-medium text-slate-500 mb-1">잔액</p>
                  <p className="text-2xl sm:text-3xl font-bold text-primary">
                    {formatAmount(summary?.monthly.balance ?? 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">원</p>
                </Card>
                <Card>
                  <p className="text-sm font-medium text-slate-500 mb-1">등록 건수</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-700">
                    {summary?.monthly.count ?? 0}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">건</p>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <h3 className="font-semibold text-primary mb-4">월별 수입/지출 비교</h3>
                  <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={summary?.monthlyChart ?? []}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={{ stroke: "#cbd5e1" }}
                        />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={{ stroke: "#cbd5e1" }}
                          tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                          }}
                          formatter={(value) => [
                            `${formatAmount(Number(value ?? 0))}원`,
                            "",
                          ]}
                          labelFormatter={(label) => `기간: ${label}`}
                        />
                        <Bar dataKey="income" name="수입" fill="#16a34a" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" name="지출" fill="#dc2626" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card>
                  <h3 className="font-semibold text-primary mb-4">지출 카테고리 비율</h3>
                  {!summary?.expensePie?.length ? (
                    <div className="h-64 flex items-center justify-center text-slate-500">
                      이번 달 지출 데이터가 없습니다.
                    </div>
                  ) : (
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={summary.expensePie}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={(e) => `${e.name} ${formatAmount(e.value)}`}
                          >
                            {summary.expensePie.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) =>
                              `${formatAmount(Number(value ?? 0))}원`
                            }
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Card>
              </div>

              <Card>
                <h3 className="font-semibold text-primary mb-4">최근 7일 등록 추이</h3>
                <div className="w-full h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={summary?.dailyTrend ?? []}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
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
                        formatter={(value) => [`${value ?? 0}건`, "등록"]}
                        labelFormatter={(label) => `날짜: ${label}`}
                      />
                      <Bar dataKey="count" name="등록" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <h3 className="font-semibold text-primary mb-4">최근 등록 내역</h3>
                {!summary?.recent5?.length ? (
                  <div className="py-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">등록된 내역이 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {summary.recent5.map((r) => (
                      <div
                        key={r.id}
                        className="flex flex-wrap items-center gap-3 py-3 px-4 rounded-xl bg-slate-50/80 border border-slate-100"
                      >
                        <span className="text-sm font-medium text-slate-600 w-24 shrink-0">
                          {r.date}
                        </span>
                        <TypeBadge type={r.type} />
                        <span className="font-medium text-slate-800 min-w-0 flex-1 truncate">
                          {r.title}
                        </span>
                        <CategoryBadge category={r.category} />
                        <span
                          className={`font-semibold shrink-0 ${
                            r.type === "income" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatAmount(r.amount)}원
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </>
      )}

      {tab === "register" && (
        <Card>
          <form onSubmit={handleRegisterSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                구분
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    checked={registerForm.type === "income"}
                    onChange={() =>
                      setRegisterForm((p) => ({ ...p, type: "income", category: "" }))
                    }
                    className="rounded-full"
                  />
                  <span>수입</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    checked={registerForm.type === "expense"}
                    onChange={() =>
                      setRegisterForm((p) => ({ ...p, type: "expense", category: "" }))
                    }
                    className="rounded-full"
                  />
                  <span>지출</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                날짜
              </label>
              <Input
                type="date"
                value={registerForm.date}
                onChange={(e) =>
                  setRegisterForm((p) => ({ ...p, date: e.target.value }))
                }
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                항목명
              </label>
              <Input
                type="text"
                value={registerForm.title}
                onChange={(e) =>
                  setRegisterForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="예: 정기검사 수입"
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                금액
              </label>
              <Input
                type="number"
                min={0}
                value={registerForm.amount || ""}
                onChange={(e) =>
                  setRegisterForm((p) => ({
                    ...p,
                    amount: parseInt(e.target.value, 10) || 0,
                  }))
                }
                placeholder="0"
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                카테고리
              </label>
              <select
                value={registerForm.category}
                onChange={(e) =>
                  setRegisterForm((p) => ({ ...p, category: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">선택</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                결제수단
              </label>
              <select
                value={registerForm.paymentMethod}
                onChange={(e) =>
                  setRegisterForm((p) => ({ ...p, paymentMethod: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">선택</option>
                {(settings?.paymentMethods ?? []).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                메모
              </label>
              <textarea
                value={registerForm.memo}
                onChange={(e) =>
                  setRegisterForm((p) => ({ ...p, memo: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none min-h-[80px]"
                placeholder="참고 사항 (선택)"
              />
            </div>
            <Button type="submit" variant="accent" disabled={registerLoading}>
              {registerLoading ? "등록 중..." : "등록하기"}
            </Button>
          </form>
        </Card>
      )}

      {tab === "list" && (
        <>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:items-end">
            <div className="flex flex-wrap gap-2 items-center order-2 sm:order-1 flex-1">
              <Input
                type="date"
                value={listFilters.start}
                onChange={(e) =>
                  setListFilters((p) => ({ ...p, start: e.target.value }))
                }
                className="w-36"
                placeholder="시작일"
              />
              <span className="text-slate-500">~</span>
              <Input
                type="date"
                value={listFilters.end}
                onChange={(e) =>
                  setListFilters((p) => ({ ...p, end: e.target.value }))
                }
                className="w-36"
                placeholder="종료일"
              />
              <select
                value={listFilters.type}
                onChange={(e) =>
                  setListFilters((p) => ({
                    ...p,
                    type: e.target.value as "all" | "income" | "expense",
                  }))
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="all">전체</option>
                <option value="income">수입</option>
                <option value="expense">지출</option>
              </select>
              <select
                value={listFilters.category}
                onChange={(e) =>
                  setListFilters((p) => ({ ...p, category: e.target.value }))
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">카테고리 전체</option>
                {[
                  ...(settings?.incomeCategories ?? []),
                  ...(settings?.expenseCategories ?? []),
                ]
                  .filter((c, i, a) => a.indexOf(c) === i)
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
              <Input
                type="text"
                value={listFilters.keyword}
                onChange={(e) =>
                  setListFilters((p) => ({ ...p, keyword: e.target.value }))
                }
                placeholder="키워드 검색"
                className="w-40"
              />
              <select
                value={listFilters.sortBy}
                onChange={(e) =>
                  setListFilters((p) => ({
                    ...p,
                    sortBy: e.target.value as "date" | "amountHigh" | "amountLow",
                  }))
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="date">날짜순</option>
                <option value="amountHigh">금액 높은순</option>
                <option value="amountLow">금액 낮은순</option>
              </select>
              <Button
                variant="primary"
                size="sm"
                onClick={() => loadRecords()}
              >
                조회
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={downloadExcel}
              disabled={recordsLoading || records.length === 0}
              className="order-1 sm:order-2 shrink-0 bg-[#217346]/5 border-[#217346]/30 text-[#217346] hover:bg-[#217346]/10"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Excel로 내보내기
            </Button>
          </div>

          <Card>
            {recordsLoading ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner className="w-8 h-8" />
              </div>
            ) : records.length === 0 ? (
              <div className="py-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>조회 결과가 없습니다.</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHead>
                      <TableHeader>날짜</TableHeader>
                      <TableHeader>구분</TableHeader>
                      <TableHeader>항목명</TableHeader>
                      <TableHeader>카테고리</TableHeader>
                      <TableHeader>금액</TableHeader>
                      <TableHeader>결제수단</TableHeader>
                      <TableHeader>메모</TableHeader>
                      <TableHeader>액션</TableHeader>
                    </TableHead>
                    <TableBody>
                      {sortedRecords.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.date}</TableCell>
                          <TableCell>
                            <TypeBadge type={r.type} />
                          </TableCell>
                          <TableCell>{r.title}</TableCell>
                          <TableCell>
                            <CategoryBadge category={r.category} />
                          </TableCell>
                          <TableCell
                            className={
                              r.type === "income"
                                ? "font-medium text-green-600"
                                : "font-medium text-red-600"
                            }
                          >
                            {formatAmount(r.amount)}원
                          </TableCell>
                          <TableCell>{r.paymentMethod || "-"}</TableCell>
                          <TableCell className="max-w-[120px] truncate">
                            {r.memo || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(r)}
                              >
                                수정
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(r.id)}
                                disabled={deletingId === r.id}
                              >
                                {deletingId === r.id ? "삭제 중..." : "삭제"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="md:hidden space-y-3">
                  {sortedRecords.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-slate-600">{r.date}</span>
                        <TypeBadge type={r.type} />
                      </div>
                      <p className="font-medium text-slate-800">{r.title}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <CategoryBadge category={r.category} />
                        <span
                          className={`font-semibold ${
                            r.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatAmount(r.amount)}원
                        </span>
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => openEdit(r)}
                        >
                          수정
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
                        >
                          {deletingId === r.id ? "삭제 중..." : "삭제"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </>
      )}

      {tab === "settings" && (
        <div className="space-y-6">
          {settingsLoading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner className="w-8 h-8" />
            </div>
          ) : (
            <>
              {(
                [
                  {
                    title: "수입 카테고리",
                    type: "incomeCategory" as const,
                    items: settings?.incomeCategories ?? [],
                  },
                  {
                    title: "지출 카테고리",
                    type: "expenseCategory" as const,
                    items: settings?.expenseCategories ?? [],
                  },
                  {
                    title: "결제수단",
                    type: "paymentMethod" as const,
                    items: settings?.paymentMethods ?? [],
                  },
                ] as const
              ).map(({ title, type, items }) => (
                <Card key={type}>
                  <div className="flex items-center gap-3 mb-4">
                    <Settings className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-primary">{title}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSettingsModal({
                          type,
                          action: "add",
                        });
                        setSettingsModalValue("");
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      추가
                    </Button>
                  </div>
                  <ul className="space-y-2">
                    {items.map((v) => (
                      <li
                        key={v}
                        className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                      >
                        <span className="text-slate-700">{v}</span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSettingsModal({
                                type,
                                action: "edit",
                                value: v,
                                oldValue: v,
                              });
                              setSettingsModalValue(v);
                            }}
                          >
                            수정
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleSettingsDelete(type, v)}
                          >
                            삭제
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      <Modal
        isOpen={!!editId}
        onClose={() => setEditId(null)}
        title="수입·지출 수정"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              구분
            </label>
            <select
              value={editForm.type || ""}
              onChange={(e) =>
                setEditForm((p) => ({
                  ...p,
                  type: e.target.value as "income" | "expense",
                }))
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="income">수입</option>
              <option value="expense">지출</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              날짜
            </label>
            <Input
              type="date"
              value={editForm.date || ""}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, date: e.target.value }))
              }
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              항목명
            </label>
            <Input
              type="text"
              value={editForm.title || ""}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, title: e.target.value }))
              }
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              금액
            </label>
            <Input
              type="number"
              min={0}
              value={editForm.amount ?? ""}
              onChange={(e) =>
                setEditForm((p) => ({
                  ...p,
                  amount: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              카테고리
            </label>
            <Input
              type="text"
              value={editForm.category || ""}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, category: e.target.value }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              결제수단
            </label>
            <Input
              type="text"
              value={editForm.paymentMethod || ""}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, paymentMethod: e.target.value }))
              }
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              메모
            </label>
            <textarea
              value={editForm.memo || ""}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, memo: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3 min-h-[60px]"
            />
          </div>
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

      <Modal
        isOpen={!!settingsModal}
        onClose={() => setSettingsModal(null)}
        title={
          settingsModal?.action === "add"
            ? "항목 추가"
            : "항목 수정"
        }
      >
        <form onSubmit={handleSettingsModalSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              값
            </label>
            <Input
              type="text"
              value={settingsModalValue}
              onChange={(e) => setSettingsModalValue(e.target.value)}
              className="w-full"
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSettingsModal(null)}
            >
              취소
            </Button>
            <Button
              type="submit"
              variant="accent"
              disabled={settingsModalLoading}
            >
              {settingsModalLoading ? "처리 중..." : "저장"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
