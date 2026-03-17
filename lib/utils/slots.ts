/**
 * 예약 슬롯 유틸 - 요일에 따른 운영시간 반영
 * 평일 08:40~17:30 (12:00~13:00 점심 제외), 토요일 08:40~12:00, 일요일 휴무
 */

import { BUSINESS_HOURS } from "@/lib/constants";

/** YYYY-MM-DD 형식의 날짜에서 요일 반환 (0=일, 6=토) */
function getDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getDay();
}

/** 해당 날짜에 대한 예약 가능 시간 슬롯 반환 (일요일은 빈 배열) */
export function getTimeSlotsForDate(dateStr: string): string[] {
  const day = getDayOfWeek(dateStr);
  if (day === 0) return []; // 일요일 휴무

  const [sh, sm] = BUSINESS_HOURS.start.split(":").map(Number);
  const endStr = day === 6 ? BUSINESS_HOURS.saturdayEnd : BUSINESS_HOURS.end;
  const [eh, em] = endStr.split(":").map(Number);

  const [lhStart] = BUSINESS_HOURS.lunchStart.split(":").map(Number);
  const [lhEnd] = BUSINESS_HOURS.lunchEnd.split(":").map(Number);
  const lunchStartMin = lhStart * 60;
  const lunchEndMin = lhEnd * 60;

  const slots: string[] = [];
  let m = sh * 60 + sm;
  const end = eh * 60 + em;
  while (m < end) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const slotMin = h * 60 + min;
    const inLunch = day !== 6 && slotMin >= lunchStartMin && slotMin < lunchEndMin;
    if (!inLunch) {
      slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    }
    m += BUSINESS_HOURS.slotMinutes;
  }
  return slots;
}

/** 예약 가능한 다음 N일 (일요일 제외) */
export function getNextBusinessDays(count: number): { date: string; label: string }[] {
  const result: { date: string; label: string }[] = [];
  const today = new Date();
  let added = 0;
  for (let i = 0; added < count && i < 21; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 0) continue; // 일요일 제외
    const dateStr = d.toISOString().slice(0, 10);
    const label =
      i === 0 ? "오늘" : i === 1 ? "내일" : `${d.getMonth() + 1}/${d.getDate()}`;
    result.push({ date: dateStr, label });
    added++;
  }
  return result;
}
