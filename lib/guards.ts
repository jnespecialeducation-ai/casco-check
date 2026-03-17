/**
 * 라우트 권한 가드 상수 및 유틸
 */

/** 관리자 전용 경로 접두사 */
export const ADMIN_PATH_PREFIX = "/admin";

/** 로그인 없이 접근 가능한 관리자 경로 */
export const ADMIN_PUBLIC_PATHS = ["/admin/login"];

/**
 * 경로가 관리자 전용인지 여부
 */
export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith(ADMIN_PATH_PREFIX);
}

/**
 * 관리자 영역 중 로그인 없이 접근 가능한 경로인지
 */
export function isAdminPublicPath(pathname: string): boolean {
  return ADMIN_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
