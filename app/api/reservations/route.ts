import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, date, timeSlot } = body;
    if (!token || !date || !timeSlot) {
      return NextResponse.json(
        { error: "token, date, timeSlot이 필요합니다." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const vehiclesSnap = await db.collection("vehicles").where("linkToken", "==", token).limit(1).get();

    if (vehiclesSnap.empty) {
      return NextResponse.json({ error: "차량 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    const vehicleDoc = vehiclesSnap.docs[0];
    const vehicle = vehicleDoc.data();
    const vehicleId = vehicleDoc.id;
    const customerId = vehicle.customerId;
    const carNumber = vehicle.carNumber || "";

    let name = "";
    let phone = "";
    if (customerId) {
      const cust = await db.collection("customers").doc(customerId).get();
      const c = cust.data();
      name = c?.name || "";
      phone = c?.phone || "";
    }

    const existing = await db
      .collection("reservations")
      .where("date", "==", date)
      .where("timeSlot", "==", timeSlot)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: "해당 날짜/시간에 이미 예약이 있습니다." },
        { status: 409 }
      );
    }

    const reservationRef = await db.collection("reservations").add({
      vehicleId,
      customerId,
      name,
      phone,
      carNumber,
      date,
      timeSlot,
      type: vehicle.inspectionType || "periodic",
      note: "",
      status: "requested",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      reservationId: reservationRef.id,
      date,
      timeSlot,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "예약 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
