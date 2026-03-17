import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

/**
 * GET /api/reservations/slots?date=YYYY-MM-DD
 * 해당 날짜에 이미 예약된 시간대 목록 반환 (취소 제외)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "올바른 날짜 형식(YYYY-MM-DD)이 필요합니다." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const snapshot = await db
      .collection("reservations")
      .where("date", "==", date)
      .get();

    const booked: string[] = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const status = data.status;
      if (status !== "cancelled") {
        const slot = data.timeSlot;
        if (slot && typeof slot === "string" && !booked.includes(slot)) {
          booked.push(slot);
        }
      }
    });

    return NextResponse.json({ booked });
  } catch (e) {
    console.error("GET /api/reservations/slots:", e);
    return NextResponse.json(
      { error: "예약 가능 시간을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}
