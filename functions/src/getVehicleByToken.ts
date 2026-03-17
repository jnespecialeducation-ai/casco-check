import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const getVehicleByToken = functions.https.onCall(
  async (data: { token: string }, _context) => {
    const { token } = data;
    if (!token) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "token is required"
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

    const doc = vehiclesSnap.docs[0];
    const vehicle = doc.data();
    const customerSnap = await db.collection("customers").doc(vehicle.customerId).get();
    const customer = customerSnap.data();

    return {
      id: doc.id,
      carNumber: vehicle.carNumber,
      inspectionType: vehicle.inspectionType,
      nextDueDate: vehicle.nextDueDate,
      linkToken: vehicle.linkToken,
      customerName: customer?.name,
      customerPhone: customer?.phone,
    };
  }
);
