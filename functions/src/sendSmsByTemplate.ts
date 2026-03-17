import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const BASE_URL = "https://casco-check.kr";

export const sendSmsByTemplate = functions.https.onCall(
  async (
    data: { vehicleId: string; templateKey: string; date?: string; time?: string },
    context
  ) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Admin authentication required"
      );
    }
    const { vehicleId, templateKey } = data;
    if (!vehicleId || !templateKey) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "vehicleId and templateKey are required"
      );
    }

    const db = admin.firestore();
    const vehicleSnap = await db.collection("vehicles").doc(vehicleId).get();
    if (!vehicleSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Vehicle not found");
    }

    const vehicle = vehicleSnap.data()!;
    const customerSnap = await db.collection("customers").doc(vehicle.customerId).get();
    const customer = customerSnap.data();
    const phone = customer?.phone || "";

    const templateSnap = await db
      .collection("sms_templates")
      .where("key", "==", templateKey)
      .limit(1)
      .get();

    if (templateSnap.empty) {
      throw new functions.https.HttpsError(
        "not-found",
        `Template "${templateKey}" not found`
      );
    }

    const template = templateSnap.docs[0].data();
    const carNumber = vehicle.carNumber || "차량";
    let dueStr = "";
    if (vehicle.nextDueDate) {
      const d =
        typeof vehicle.nextDueDate.toDate === "function"
          ? vehicle.nextDueDate.toDate()
          : vehicle.nextDueDate;
      dueStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
    }
    const link = `${BASE_URL}/v/${vehicle.linkToken || ""}`;

    const typeStr =
      vehicle.inspectionType === "comprehensive" ? "종합검사" : "정기검사";

    const dateStr = templateKey === "reservationConfirmed" ? (data.date || "") : "";
    const timeStr = templateKey === "reservationConfirmed" ? (data.time || "") : "";

    const body = template.body
      .replace(/\{CAR\}/g, carNumber)
      .replace(/\{DUE\}/g, dueStr)
      .replace(/\{LINK\}/g, link)
      .replace(/\{TYPE\}/gi, typeStr)
      .replace(/\{DATE\}/g, dateStr)
      .replace(/\{TIME\}/g, timeStr);

    // DEV 모드: 콘솔 로그 + sms_logs 저장
    console.log("[SMS DEV]", { phone, templateKey, body });
    const logRef = await db.collection("sms_logs").add({
      phone,
      templateKey,
      body,
      vehicleId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      result: "DEV_LOGGED",
    });

    await db.collection("vehicles").doc(vehicleId).update({
      lastSmsSentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, logId: logRef.id };
  }
);
