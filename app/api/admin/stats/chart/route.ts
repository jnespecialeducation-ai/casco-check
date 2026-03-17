import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

type Period = "day" | "week" | "month" | "year";

function getPeriodKey(dateStr: string, period: Period): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  if (period === "day") return dateStr;
  if (period === "week") {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    return start.toISOString().slice(0, 10);
  }
  if (period === "month") return `${y}-${String(m).padStart(2, "0")}`;
  return String(y);
}

function getLabel(key: string, period: Period): string {
  if (period === "day") return key.slice(5); // MM-DD
  if (period === "week") {
    const [y, m, d] = key.split("-").map(Number);
    const d2 = new Date(y, m - 1, d);
    const end = new Date(d2);
    end.setDate(end.getDate() + 6);
    return `${m}/${d}~${end.getMonth() + 1}/${end.getDate()}`;
  }
  if (period === "month") return key; // YYYY-MM
  return key; // YYYY
}

function generateRange(period: Period): string[] {
  const now = new Date();
  const keys: string[] = [];
  const limit = period === "day" ? 14 : period === "week" ? 12 : period === "month" ? 12 : 5;

  for (let i = limit - 1; i >= 0; i--) {
    const d = new Date(now);
    if (period === "day") {
      d.setDate(d.getDate() - i);
      keys.push(d.toISOString().slice(0, 10));
    } else if (period === "week") {
      d.setDate(d.getDate() - i * 7);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(d);
      mon.setDate(diff);
      keys.push(mon.toISOString().slice(0, 10));
    } else if (period === "month") {
      d.setMonth(d.getMonth() - i);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    } else {
      d.setFullYear(d.getFullYear() - i);
      keys.push(String(d.getFullYear()));
    }
  }
  return keys;
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get("period") || "day") as Period;
    if (!["day", "week", "month", "year"].includes(period)) {
      return NextResponse.json(
        { error: "period는 day, week, month, year 중 하나여야 합니다." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const snapshot = await db.collection("reservations").get();

    const map = new Map<string, number>();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const dateStr = data.date as string;
      if (!dateStr) continue;
      const key = getPeriodKey(dateStr, period);
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    const range = generateRange(period);
    const data = range.map((key) => ({
      label: getLabel(key, period),
      key,
      count: map.get(key) ?? 0,
    }));

    return NextResponse.json({ data });
  } catch (e) {
    console.error("Admin stats chart error:", e);
    return NextResponse.json(
      { error: "차트 데이터를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
