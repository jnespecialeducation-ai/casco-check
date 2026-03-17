import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { generateLinkToken } from "./utils/helpers";

export const ensureLinkToken = functions.https.onCall(
  async (data: { vehicleId: string }, context) => {
    if (!data?.vehicleId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "vehicleId is required"
      );
    }
    const { vehicleId } = data;
    const db = admin.firestore();
    const vehicleRef = db.collection("vehicles").doc(vehicleId);
    const vehicleSnap = await vehicleRef.get();

    if (!vehicleSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Vehicle not found");
    }

    const vehicle = vehicleSnap.data()!;
    let token = vehicle.linkToken as string | undefined;

    if (token) {
      return { token };
    }

    const vehiclesRef = db.collection("vehicles");
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      token = generateLinkToken(10, 14);
      const existing = await vehiclesRef.where("linkToken", "==", token).limit(1).get();
      if (existing.empty) {
        break;
      }
      attempts++;
    }

    if (!token) {
      throw new functions.https.HttpsError(
        "internal",
        "Failed to generate unique token"
      );
    }

    await vehicleRef.update({ linkToken: token });
    return { token };
  }
);
