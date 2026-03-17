import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const createReservation = functions.https.onCall(
  async (
    data: { token: string; date: string; timeSlot: string },
    _context
  ) => {
    const { token, date, timeSlot } = data;
    if (!token || !date || !timeSlot) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "token, date, and timeSlot are required"
      );
    }

    const db = admin.firestore();
    const vehiclesSnap = await db
      .collection("vehicles")
      .where("linkToken", "==", token)
      .limit(1)
      .get();

    if (vehiclesSnap.empty) {
      throw new functions.https.HttpsError("not-found", "Vehicle not found");
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
      throw new functions.https.HttpsError(
        "already-exists",
        "해당 날짜/시간에 이미 예약이 있습니다."
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      reservationId: reservationRef.id,
      date,
      timeSlot,
    };
  }
);
