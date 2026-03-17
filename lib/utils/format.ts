/**
 * 휴대폰 번호 입력 시 자동 하이픈 포맷 (3-4-4 형식: 010-XXXX-XXXX)
 * - 010 → 010- (다음 숫자부터 두 번째 그룹)
 * - 0103 → 010-3
 * - 0103729 → 010-3729
 * - 01037293939 → 010-3729-3939
 * - 삭제 시 trailing hyphen 없이 표시하여 처음까지 백스페이스 가능
 */
export function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  if (digits.length === 3) return `${digits}-`; // 010- 로 다음 그룹 안내
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

/** 금액 천 단위 콤마 포맷 */
export function formatAmount(n: number): string {
  return n.toLocaleString("ko-KR");
}
