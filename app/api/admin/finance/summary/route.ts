import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function getMonthRange(monthKey: string): { start: string; end: string } {
  const [y, m] = monthKey.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function getLast7Days(): string[] {
  const keys: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

function getLast12Months(): { key: string; label: string }[] {
  const result: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    result.push({ key, label: key });
  }
  return result;
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month") || "";
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthKey = /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : defaultMonth;

    const db = getAdminFirestore();
    const snapshot = await db
      .collection("financeRecords")
      .orderBy("date", "desc")
      .get();

    const records = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Array<{
      id: string;
      type: string;
      date: string;
      title: string;
      amount: number;
      category: string;
      paymentMethod: string;
      memo?: string;
      createdAt?: { seconds: number };
    }>;

    const { start: monthStart, end: monthEnd } = getMonthRange(monthKey);
    const thisMonthRecords = records.filter(
      (r) => r.date >= monthStart && r.date <= monthEnd
    );

    const monthlyIncome = thisMonthRecords
      .filter((r) => r.type === "income")
      .reduce((s, r) => s + (r.amount || 0), 0);
    const monthlyExpense = thisMonthRecords
      .filter((r) => r.type === "expense")
      .reduce((s, r) => s + (r.amount || 0), 0);

    const monthly = {
      totalIncome: monthlyIncome,
      totalExpense: monthlyExpense,
      balance: monthlyIncome - monthlyExpense,
      count: thisMonthRecords.length,
    };

    const monthKeys = getLast12Months();
    const monthlyChart = monthKeys.map(({ key, label }) => {
      const [y, m] = key.split("-").map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const monthEnd = `${key}-${String(lastDay).padStart(2, "0")}`;
      const monthRecs = records.filter(
        (r) => r.date >= `${key}-01` && r.date <= monthEnd
      );
      const income = monthRecs
        .filter((r) => r.type === "income")
        .reduce((s, r) => s + (r.amount || 0), 0);
      const expense = monthRecs
        .filter((r) => r.type === "expense")
        .reduce((s, r) => s + (r.amount || 0), 0);
      return { label, income, expense };
    });

    const expenseThisMonth = thisMonthRecords.filter((r) => r.type === "expense");
    const categorySum = new Map<string, number>();
    for (const r of expenseThisMonth) {
      const cat = r.category || "기타";
      categorySum.set(cat, (categorySum.get(cat) || 0) + (r.amount || 0));
    }
    const expensePie = Array.from(categorySum.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    const dayKeys = getLast7Days();
    const dailyTrend = dayKeys.map((key) => {
      const count = records.filter((r) => r.date === key).length;
      return { label: key.slice(5), key, count };
    });

    const recent5 = thisMonthRecords.slice(0, 5).map((r) => ({
      id: (r as { id?: string })?.id,
      type: r.type,
      date: r.date,
      title: r.title,
      amount: r.amount,
      category: r.category,
      paymentMethod: r.paymentMethod,
      memo: r.memo,
    }));

    return NextResponse.json({
      monthly,
      monthlyChart,
      expensePie,
      dailyTrend,
      recent5,
      monthKey,
    });
  } catch (e) {
    console.error("Admin finance summary GET error:", e);
    return NextResponse.json(
      { error: "요약 데이터를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
