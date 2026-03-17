/**
 * 대한민국 공휴일 (휴일, 공휴일 제외용)
 * - 일요일(0)은 운영시간 유틸에서 별도 처리
 * - 여기서는 법정 공휴일만 정의
 * - YYYY-MM-DD 형식
 */

/** 법정 공휴일 목록 (고정 공휴일 + 설/추석 연휴) - 2025~2027 */
const HOLIDAYS: Set<string> = new Set([
  // 2025
  "2025-01-01", // 신정
  "2025-01-28", "2025-01-29", "2025-01-30", // 설날
  "2025-03-01", // 삼일절
  "2025-05-05", // 어린이날
  "2025-06-06", // 현충일
  "2025-08-15", // 광복절
  "2025-10-03", "2025-10-04", "2025-10-05", "2025-10-06", // 추석+대체
  "2025-10-09", // 한글날
  "2025-12-25", // 크리스마스
  // 2026
  "2026-01-01", // 신정
  "2026-02-16", "2026-02-17", "2026-02-18", // 설날
  "2026-03-01", "2026-03-02", // 삼일절+대체
  "2026-05-05", // 어린이날
  "2026-05-24", "2026-05-25", // 부처님오신날+대체
  "2026-06-06", // 현충일
  "2026-08-15", "2026-08-17", // 광복절+대체
  "2026-09-24", "2026-09-25", "2026-09-26", // 추석
  "2026-10-03", "2026-10-05", // 개천절+대체
  "2026-10-09", // 한글날
  "2026-12-25", // 크리스마스
  // 2027
  "2027-01-01",
  "2027-02-06", "2027-02-07", "2027-02-08", "2027-02-09", // 설날
  "2027-03-01",
  "2027-05-05",
  "2027-05-13", // 부처님오신날
  "2027-06-06", "2027-06-07",
  "2027-08-15", "2027-08-16",
  "2027-09-14", "2027-09-15", "2027-09-16", // 추석
  "2027-10-03", "2027-10-04",
  "2027-10-09", "2027-10-11",
  "2027-12-25", "2027-12-27",
]);

/** 해당 날짜가 공휴일인지 */
export function isHoliday(dateStr: string): boolean {
  return HOLIDAYS.has(dateStr);
}

/** 해당 날짜가 일요일인지 */
function isSunday(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
}

/** 해당 날짜가 예약 가능한 영업일인지 (일요일·공휴일 제외) */
export function isBusinessDay(dateStr: string): boolean {
  return !isSunday(dateStr) && !isHoliday(dateStr);
}

/** 특정 연·월의 예약 가능한 날짜 목록 (일요일·공휴일 제외) */
export function getBusinessDaysForMonth(
  year: number,
  month: number
): { date: string; label: string }[] {
  const result: { date: string; label: string }[] = [];
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (!isBusinessDay(dateStr)) continue;

    if (dateStr < todayStr) continue; // 과거 날짜 제외 (오늘 포함)

    const label =
      dateStr === todayStr
        ? "오늘"
        : dateStr === tomorrowStr
          ? "내일"
          : `${month}/${d}`;
    result.push({ date: dateStr, label });
  }
  return result;
}

/** 선택 가능한 월 목록 (현재월 ~ N개월) */
export function getSelectableMonths(count: number): { year: number; month: number; label: string }[] {
  const result: { year: number; month: number; label: string }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    result.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: `${d.getFullYear()}년 ${d.getMonth() + 1}월`,
    });
  }
  return result;
}
