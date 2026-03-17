/**
 * 카스코자동차검사소 - 상수/설정 (코드에서 분리)
 */

export const SITE = {
  /** 고객 전용 도메인 */
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://casco-check.kr",
  /** 주소 */
  address: "광주 북구 동문대로266번길 43 (우)61137",
  /** 문의/전화번호 */
  phone: "062-267-9494",
  /** 수신거부 번호 */
  optOutPhone: "062-267-9494",
  /** 지도 링크 - 네이버 지도 (업체명 검색) */
  mapUrl: "https://map.naver.com/v5/search/카스코정비공업사",
  /** 하위 호환용 alias */
  kakaoMapUrl: "https://map.naver.com/v5/search/카스코정비공업사",
} as const;

/** 운영시간 (예약 슬롯) */
export const BUSINESS_HOURS = {
  /** 시작 HH:mm (08:40 오픈) */
  start: "08:40",
  /** 평일 종료 HH:mm */
  end: "17:30",
  /** 토요일 종료 HH:mm (12시까지) */
  saturdayEnd: "12:00",
  /** 점심 휴식 (평일만, 해당 시간 슬롯 제외) */
  lunchStart: "12:00",
  lunchEnd: "13:00",
  /** 슬롯 간격 (분) */
  slotMinutes: 30,
} as const;

/** 만료 D-day 필터 옵션 (일) */
export const DUE_FILTER_DAYS = [60, 30, 14, 7] as const;

/** linkToken 길이 */
export const LINK_TOKEN_LENGTH = { min: 10, max: 14 } as const;
