import { NextRequest, NextResponse } from "next/server";
import { createAdminCustomToken } from "@/lib/firebase/admin";
import { createHmac } from "crypto";

const COOKIE_NAME = "admin_session";

function getSessionSignature(): string {
  const secret = process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD;
  if (!secret) return "";
  return createHmac("sha256", secret).update("admin").digest("hex");
}

function setSessionCookie(res: NextResponse) {
  const sig = getSessionSignature();
  res.cookies.set(COOKIE_NAME, sig, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // maxAge 생략 → 세션 쿠키 (브라우저 종료 시 만료)
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, token } = body;

    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminToken = process.env.ADMIN_TOKEN;

    let valid = false;
    if (password && adminPassword && password === adminPassword) {
      valid = true;
    }
    if (token && adminToken && token === adminToken) {
      valid = true;
    }

    if (!valid || (!adminPassword && !adminToken)) {
      return NextResponse.json(
        { error: "비밀번호 또는 토큰이 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const firebaseToken = await createAdminCustomToken("admin");
    const res = NextResponse.json({ token: firebaseToken });
    setSessionCookie(res);
    return res;
  } catch (e) {
    console.error("Admin login error:", e);
    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
