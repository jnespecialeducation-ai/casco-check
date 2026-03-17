import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { generateLinkToken } from "@/lib/utils/tokenGenerator";

const schema = z.object({
  name: z.string().min(1, "이름을 입력해 주세요."),
  phone: z.string().min(1, "휴대폰 번호를 입력해 주세요."),
  carNumber: z.string().transform((s) => s.replace(/\s/g, "")).refine((s) => s.length >= 6, "차량번호는 6자 이상 입력해 주세요."),
  inspectionType: z.enum(["periodic", "comprehensive"]).optional().default("periodic"),
  nextDueDate: z.string().optional(),
  smsOptIn: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parseResult = schema.safeParse(body);
    if (!parseResult.success) {
      const msg = parseResult.error.issues[0]?.message ?? "입력 값을 확인해 주세요.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { name, phone, carNumber, inspectionType, nextDueDate, smsOptIn } = parseResult.data;

    const db = getAdminFirestore();
    const vehiclesRef = db.collection("vehicles");
    const customersRef = db.collection("customers");

    let customerId: string;
    const existingCustomer = await customersRef.where("phone", "==", phone).limit(1).get();

    if (existingCustomer.empty) {
      const customerRef = await customersRef.add({
        phone,
        name,
        createdAt: FieldValue.serverTimestamp(),
      });
      customerId = customerRef.id;
    } else {
      customerId = existingCustomer.docs[0].id;
    }

    let token: string;
    let attempts = 0;
    const maxAttempts = 5;
    do {
      token = generateLinkToken(10, 14);
      const existing = await vehiclesRef.where("linkToken", "==", token).limit(1).get();
      if (existing.empty) break;
      attempts++;
    } while (attempts < maxAttempts);

    const dueDate = nextDueDate
      ? Timestamp.fromDate(new Date(nextDueDate))
      : Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));

    const vehicleRef = await vehiclesRef.add({
      customerId,
      carNumber,
      inspectionType,
      nextDueDate: dueDate,
      linkToken: token,
      smsOptIn,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      token,
      vehicleId: vehicleRef.id,
      customerId,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "차량 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
