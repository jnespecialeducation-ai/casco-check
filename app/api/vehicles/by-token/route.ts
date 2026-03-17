import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "token이 필요합니다." }, { status: 400 });
    }

    const db = getAdminFirestore();
    const vehiclesSnap = await db.collection("vehicles").where("linkToken", "==", token).limit(1).get();

    if (vehiclesSnap.empty) {
      return NextResponse.json({ error: "차량 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    const doc = vehiclesSnap.docs[0];
    const vehicle = doc.data();
    const customerSnap = await db.collection("customers").doc(vehicle.customerId).get();
    const customer = customerSnap.data();

    const nd = vehicle.nextDueDate as { seconds?: number; nanoseconds?: number } | null;
    const serializedDue = nd && typeof nd.seconds === "number" ? { seconds: nd.seconds, nanoseconds: nd.nanoseconds ?? 0 } : nd;

    return NextResponse.json({
      id: doc.id,
      carNumber: vehicle.carNumber,
      inspectionType: vehicle.inspectionType,
      nextDueDate: serializedDue,
      linkToken: vehicle.linkToken,
      customerName: customer?.name,
      customerPhone: customer?.phone,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "차량 정보를 불러올 수 없습니다." },
      { status: 500 }
    );
  }
}
