import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAdminFirestore } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/vehicles/lookup?carNumber=12가3456&phone=010-1234-5678
 * 차량번호 + 휴대폰으로 등록된 차량 조회. 본인 확인 후 token 반환
 */
export async function GET(req: NextRequest) {
  await headers();
  try {
    const searchParams = req.nextUrl.searchParams;
    const carNumber = searchParams.get("carNumber")?.replace(/\s/g, "").trim() || "";
    const phone = searchParams.get("phone")?.replace(/-/g, "") || "";

    if (carNumber.length < 6) {
      return NextResponse.json(
        { error: "차량번호를 6자 이상 입력해 주세요." },
        { status: 400 }
      );
    }
    if (phone.length < 10) {
      return NextResponse.json(
        { error: "휴대폰 번호를 입력해 주세요." },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const vehiclesSnap = await db
      .collection("vehicles")
      .where("carNumber", "==", carNumber)
      .limit(5)
      .get();

    if (vehiclesSnap.empty) {
      return NextResponse.json(
        { error: "등록된 차량을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    for (const doc of vehiclesSnap.docs) {
      const vehicle = doc.data();
      const customerSnap = await db.collection("customers").doc(vehicle.customerId).get();
      const customer = customerSnap.data();
      const custPhone = (customer?.phone as string)?.replace(/-/g, "") || "";
      if (custPhone === phone) {
        return NextResponse.json({
          token: vehicle.linkToken,
          carNumber: vehicle.carNumber,
        });
      }
    }

    return NextResponse.json(
      { error: "차량번호와 휴대폰 번호가 일치하는 차량이 없습니다." },
      { status: 404 }
    );
  } catch (e) {
    console.error("GET /api/vehicles/lookup:", e);
    return NextResponse.json(
      { error: "차량 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
