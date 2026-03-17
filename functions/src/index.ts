import * as admin from "firebase-admin";

admin.initializeApp();

export { ensureLinkToken } from "./ensureLinkToken";
export { sendSmsByTemplate } from "./sendSmsByTemplate";
export { createReservation } from "./createReservation";
export { createReservationPublic } from "./createReservationPublic";
export { getVehicleByToken } from "./getVehicleByToken";
export { registerVehicle } from "./registerVehicle";
