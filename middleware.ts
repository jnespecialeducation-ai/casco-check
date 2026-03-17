import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_PATH_PREFIX, isAdminPublicPath } from "@/lib/guards";
import { ADMIN_COOKIE_NAME } from "@/lib/auth";

async function getSessionSignature(): Promise<string> {
  const secret = process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD;
  if (!secret) return "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("admin")
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const expected = await getSessionSignature();
  return !!expected && cookie === expected;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith(ADMIN_PATH_PREFIX)) {
    return NextResponse.next();
  }
  if (isAdminPublicPath(pathname)) {
    if (await isAuthenticated(req)) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }
  if (!(await isAuthenticated(req))) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
