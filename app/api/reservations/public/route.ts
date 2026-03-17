import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { hashReservationPassword } from "@/lib/utils/password";

const schema = z.object({
  name: z.string().min(1, "이름을 입력해 주세요."),
  phone: z.string().regex(/^01[0-9]-[0-9]{4}-[0-9]{4}$/, "휴대폰 번호를 010-0000-0000 형식으로 입력해 주세요."),
  carNumber: z.string().transform((s) => s.replace(/\s/g, "")).refine((s) => s.length >= 6, "차량번호는 6자 이상 입력해 주세요."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "예약일을 선택해 주세요."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "예약시간을 선택해 주세요."),
  type: z.enum(["periodic", "comprehensive", "unknown"]).optional().default("periodic"),
  note: z.string().max(500).optional().default(""),
  password: z.string().regex(/^\d{4}$/, "조회용 비밀번호 4자리를 입력해 주세요."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = schema.safeParse(body);
    if (!parseResult.success) {
      const msg = parseResult.error.issues[0]?.message ?? "입력 값을 확인해 주세요.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { name, phone, carNumber, date, time, type, note, password } = parseResult.data;

    const db = getAdminFirestore();
    const customersRef = db.collection("customers");
    const vehiclesRef = db.collection("vehicles");
    const reservationsRef = db.collection("reservations");

    const existing = await reservationsRef
      .where("carNumber", "==", carNumber)
      .where("date", "==", date)
      .where("timeSlot", "==", time)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: "해당 차량으로 이미 같은 날짜/시간에 예약이 있습니다." },
        { status: 409 }
      );
    }

    const slotExisting = await reservationsRef
      .where("date", "==", date)
      .where("timeSlot", "==", time)
      .limit(1)
      .get();
    if (!slotExisting.empty) {
      return NextResponse.json(
        { error: "해당 날짜/시간에 이미 예약이 있습니다. 다른 시간을 선택해 주세요." },
        { status: 409 }
      );
    }

    let customerId: string;
    const customerSnap = await customersRef.where("phone", "==", phone).limit(1).get();

    if (customerSnap.empty) {
      const customerRef = await customersRef.add({
        phone,
        name,
        createdAt: FieldValue.serverTimestamp(),
      });
      customerId = customerRef.id;
    } else {
      customerId = customerSnap.docs[0].id;
      await customerSnap.docs[0].ref.update({
        name: name || FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    let vehicleId: string;
    const vehicleSnap = await vehiclesRef.where("carNumber", "==", carNumber).limit(1).get();

    if (vehicleSnap.empty) {
      const vehicleRef = await vehiclesRef.add({
        customerId,
        carNumber,
        inspectionType: type,
        nextDueDate: Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
        linkToken: "",
        createdAt: FieldValue.serverTimestamp(),
      });
      vehicleId = vehicleRef.id;
    } else {
      vehicleId = vehicleSnap.docs[0].id;
      await vehicleSnap.docs[0].ref.update({
        customerId,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const passwordHash = hashReservationPassword(password);

    await reservationsRef.add({
      vehicleId,
      customerId,
      name,
      phone,
      carNumber,
      date,
      timeSlot: time,
      type,
      note,
      status: "requested",
      passwordHash,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, date, timeSlot: time });
  } catch (e) {
    const err = e as Error;
    console.error("POST /api/reservations/public:", err);
    const isCredentialError =
      err.message?.includes("GOOGLE_APPLICATION_CREDENTIALS") ||
      err.message?.includes("credential") ||
      err.message?.includes("Could not load");
    if (isCredentialError) {
      return NextResponse.json(
        {
          error:
            "서버 설정이 필요합니다. Firebase Console에서 서비스 계정 키를 다운로드한 뒤 .env.local에 GOOGLE_APPLICATION_CREDENTIALS 또는 FIREBASE_SERVICE_ACCOUNT_KEY를 추가해 주세요.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "예약 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
