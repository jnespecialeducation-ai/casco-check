/**
 * 고객용 예약 조회 API - 대기중/확정/취소 모든 상태 반환, 비밀번호 검증
 * GET /api/reservations/lookup?phone=010-1234-5678&carNumber=12가3456&password=1234
 */
import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { verifyReservationPassword } from "@/lib/utils/password";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone")?.trim();
    const carNumber = searchParams.get("carNumber")?.replace(/\s/g, "");
    const password = searchParams.get("password")?.trim();

    if (!phone || !carNumber || carNumber.length < 6) {
      return NextResponse.json(
        { error: "휴대폰 번호와 차량번호(6자 이상)를 입력해 주세요." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const reservationsRef = db.collection("reservations");

    const snap = await reservationsRef
      .where("carNumber", "==", carNumber)
      .orderBy("date", "asc")
      .orderBy("timeSlot", "asc")
      .get();

    const phoneDigits = phone.replace(/\D/g, "");
    const list: { id: string; date: string; timeSlot: string; carNumber: string; status: string }[] = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      const storedDigits = (data.phone || "").replace(/\D/g, "");
      if (!storedDigits || !phoneDigits || storedDigits !== phoneDigits) continue;

      const passwordHash = data.passwordHash as string | undefined;
      if (passwordHash) {
        if (!password) {
          continue;
        }
        if (!verifyReservationPassword(password, passwordHash)) {
          continue;
        }
      }

      list.push({
        id: doc.id,
        date: data.date,
        timeSlot: data.timeSlot,
        carNumber: data.carNumber,
        status: data.status || "requested",
      });
    }

    const hasAnyWithPassword = snap.docs.some((doc) => {
      const d = doc.data();
      const digits = (d.phone || "").replace(/\D/g, "");
      if (digits !== phoneDigits) return false;
      return !!d.passwordHash;
    });

    if (hasAnyWithPassword && list.length === 0) {
      return NextResponse.json(
        { error: "비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    return NextResponse.json({ reservations: list });
  } catch (e) {
    console.error("GET /api/reservations/lookup:", e);
    return NextResponse.json(
      { error: "예약 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
