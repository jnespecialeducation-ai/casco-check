/**
 * Admin API 인증 유틸 - 서버(API Routes) 전용
 * cookie 기반 세션 검증
 */

import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { ADMIN_COOKIE_NAME } from "@/lib/auth";

export function getSessionSignature(): string {
  const secret = process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD;
  if (!secret) return "";
  return createHmac("sha256", secret).update("admin").digest("hex");
}

export function isAdminAuthenticated(req: NextRequest): boolean {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const expected = getSessionSignature();
  return !!expected && cookie === expected;
}
