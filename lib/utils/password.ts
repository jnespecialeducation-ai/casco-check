import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const SALT_LEN = 16;
const KEY_LEN = 32;

/**
 * 예약 조회용 4자리 비밀번호 해시
 */
export function hashReservationPassword(pin: string): string {
  const salt = randomBytes(SALT_LEN).toString("hex");
  const hash = scryptSync(pin, salt, KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * 예약 조회용 비밀번호 검증
 */
export function verifyReservationPassword(pin: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const verify = scryptSync(pin, salt, KEY_LEN);
    return timingSafeEqual(Buffer.from(hash, "hex"), verify);
  } catch {
    return false;
  }
}
