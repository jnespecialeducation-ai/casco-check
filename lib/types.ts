import type { Timestamp } from "firebase/firestore";

/** 검사 유형 */
export type InspectionType = "periodic" | "comprehensive";

/** 예약 상태 */
export type ReservationStatus =
  | "requested"
  | "confirmed"
  | "completed"
  | "noshow";

/** 문자 템플릿 키 */
export type SmsTemplateKey =
  | "due30"
  | "due14"
  | "due7"
  | "reservationConfirmed";

export interface Customer {
  id?: string;
  name?: string;
  phone: string;
  createdAt: Timestamp | Date;
}

export interface Vehicle {
  id?: string;
  customerId: string;
  carNumber: string;
  inspectionType: InspectionType;
  nextDueDate: Timestamp | Date;
  linkToken: string;
  createdAt: Timestamp | Date;
  lastSmsSentAt?: Timestamp | Date;
}

export interface Reservation {
  id?: string;
  vehicleId: string;
  customerId: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:30"
  status: ReservationStatus;
  createdAt: Timestamp | Date;
}

export interface SmsTemplate {
  id?: string;
  key: SmsTemplateKey;
  body: string;
  updatedAt: Timestamp | Date;
}

export interface SmsLog {
  id?: string;
  phone: string;
  templateKey: string;
  body: string;
  vehicleId?: string;
  createdAt: Timestamp | Date;
  result: "DEV_LOGGED" | string;
}
