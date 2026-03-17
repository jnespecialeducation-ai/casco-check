import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection("reservations")
      .orderBy("date", "asc")
      .orderBy("timeSlot", "asc")
      .get();

    const list: Record<string, unknown>[] = [];

    for (const d of snapshot.docs) {
      const data = d.data();
      let carNumber = (data.carNumber as string) || "";
      let phone = (data.phone as string) || "";
      let name = (data.name as string) || "";

      if (!carNumber && data.vehicleId) {
        const vSnap = await db.collection("vehicles").doc(data.vehicleId as string).get();
        carNumber = vSnap.data()?.carNumber || "";
      }
      if ((!phone || !name) && data.customerId) {
        const cSnap = await db.collection("customers").doc(data.customerId as string).get();
        const cData = cSnap.data();
        if (!phone) phone = cData?.phone || "";
        if (!name) name = cData?.name || name;
      }

      list.push({
        id: d.id,
        ...data,
        carNumber,
        phone,
        name,
      });
    }

    return NextResponse.json(list);
  } catch (e) {
    console.error("Admin reservations GET error:", e);
    return NextResponse.json(
      { error: "예약 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body as { id?: string; status?: string };

    if (!id || !status) {
      return NextResponse.json(
        { error: "id와 status가 필요합니다." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    await db.collection("reservations").doc(id).update({ status });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin reservations PATCH error:", e);
    return NextResponse.json(
      { error: "상태 변경에 실패했습니다." },
      { status: 500 }
    );
  }
}
