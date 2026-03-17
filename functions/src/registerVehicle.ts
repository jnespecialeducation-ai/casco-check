import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";
import { generateLinkToken } from "./utils/helpers";

const schema = z.object({
  phone: z.string().min(1, "휴대폰 번호를 입력해 주세요."),
  carNumber: z
    .string()
    .transform((s) => s.replace(/\s/g, ""))
    .refine((s) => s.length >= 6, "차량번호는 6자 이상 입력해 주세요."),
  name: z.string().optional(),
  inspectionType: z.enum(["periodic", "comprehensive"]).optional().default("periodic"),
  nextDueDate: z.string().optional(),
  smsOptIn: z.boolean().optional().default(false),
});

export const registerVehicle = functions.https.onCall(
  async (data: unknown, _context) => {
    const parseResult = schema.safeParse(data);
    if (!parseResult.success) {
      const msg = parseResult.error.issues[0]?.message ?? "입력 값을 확인해 주세요.";
      throw new functions.https.HttpsError("invalid-argument", msg);
    }
    const {
      phone,
      carNumber,
      name,
      inspectionType,
      nextDueDate,
      smsOptIn,
    } = parseResult.data;

    const db = admin.firestore();
    const vehiclesRef = db.collection("vehicles");
    const customersRef = db.collection("customers");

    let customerId: string;
    const existingCustomer = await customersRef
      .where("phone", "==", phone)
      .limit(1)
      .get();

    if (existingCustomer.empty) {
      const customerRef = await customersRef.add({
        phone,
        name: name || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
      ? admin.firestore.Timestamp.fromDate(new Date(nextDueDate))
      : admin.firestore.Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));

    const vehicleRef = await vehiclesRef.add({
      customerId,
      carNumber,
      inspectionType,
      nextDueDate: dueDate,
      linkToken: token,
      smsOptIn,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      token,
      vehicleId: vehicleRef.id,
      customerId,
    };
  }
);
