/**
 * 관리자 인증 관련 유틸리티
 * - API Routes, 미들웨어 등 서버 측에서 사용
 */

export const ADMIN_COOKIE_NAME = "admin_session";

/**
 * 관리자 세션 쿠키가 유효한지 확인
 * (실제 검증은 미들웨어에서 HMAC 서명으로 수행)
 */
export function hasAdminSessionCookie(cookieHeader: string | undefined): boolean {
  if (!cookieHeader) return false;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  return cookies.some((c) => c.startsWith(`${ADMIN_COOKIE_NAME}=`) && c.length > ADMIN_COOKIE_NAME.length + 2);
}
