import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";

const PhoneRegex = /^01[0-9]-[0-9]{4}-[0-9]{4}$/;
const schema = z.object({
  name: z.string().min(1, "이름을 입력해 주세요."),
  phone: z
    .string()
    .regex(PhoneRegex, "휴대폰 번호를 010-0000-0000 형식으로 입력해 주세요."),
  carNumber: z
    .string()
    .transform((s) => s.replace(/\s/g, ""))
    .refine((s) => s.length >= 6, "차량번호는 6자 이상 입력해 주세요."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "예약일을 선택해 주세요."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "예약시간을 선택해 주세요."),
  type: z.enum(["periodic", "comprehensive"]).optional().default("periodic"),
  note: z.string().max(500).optional().default(""),
});

export const createReservationPublic = functions.https.onCall(
  async (data: unknown, _context) => {
    const parseResult = schema.safeParse(data);
    if (!parseResult.success) {
      const msg = parseResult.error.issues[0]?.message ?? "입력 값을 확인해 주세요.";
      throw new functions.https.HttpsError("invalid-argument", msg);
    }
    const { name, phone, carNumber, date, time, type, note } = parseResult.data;

    const db = admin.firestore();
    const customersRef = db.collection("customers");
    const vehiclesRef = db.collection("vehicles");
    const reservationsRef = db.collection("reservations");

    // 중복 검사: 동일 차량번호 + 날짜 + 시간
    const existing = await reservationsRef
      .where("carNumber", "==", carNumber)
      .where("date", "==", date)
      .where("timeSlot", "==", time)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new functions.https.HttpsError(
        "already-exists",
        "해당 차량으로 이미 같은 날짜/시간에 예약이 있습니다."
      );
    }

    // 시간 슬롯 중복(다른 차량)
    const slotExisting = await reservationsRef
      .where("date", "==", date)
      .where("timeSlot", "==", time)
      .limit(1)
      .get();
    if (!slotExisting.empty) {
      throw new functions.https.HttpsError(
        "already-exists",
        "해당 날짜/시간에 이미 예약이 있습니다. 다른 시간을 선택해 주세요."
      );
    }

    let customerId: string;
    const customerSnap = await customersRef
      .where("phone", "==", phone)
      .limit(1)
      .get();

    if (customerSnap.empty) {
      const customerRef = await customersRef.add({
        phone,
        name,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      customerId = customerRef.id;
    } else {
      customerId = customerSnap.docs[0].id;
      await customerSnap.docs[0].ref.update({
        name: name || admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    let vehicleId: string;
    const vehicleSnap = await vehiclesRef
      .where("carNumber", "==", carNumber)
      .limit(1)
      .get();

    if (vehicleSnap.empty) {
      const vehicleRef = await vehiclesRef.add({
        customerId,
        carNumber,
        inspectionType: type,
        nextDueDate: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        ),
        linkToken: "", // 공개 예약은 토큰 없음
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      vehicleId = vehicleRef.id;
    } else {
      vehicleId = vehicleSnap.docs[0].id;
      await vehicleSnap.docs[0].ref.update({
        customerId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      date,
      timeSlot: time,
    };
  }
);
