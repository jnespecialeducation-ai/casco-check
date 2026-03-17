import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection("reservations").get();
    const todayKey = getTodayKey();

    let todayCount = 0;
    let requested = 0;
    let confirmed = 0;
    let cancelled = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.date === todayKey) todayCount++;
      if (data.status === "requested") requested++;
      else if (data.status === "confirmed") confirmed++;
      else if (data.status === "cancelled") cancelled++;
    }

    return NextResponse.json({
      todayCount,
      requested,
      confirmed,
      cancelled,
    });
  } catch (e) {
    console.error("Admin stats error:", e);
    return NextResponse.json(
      { error: "데이터를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
