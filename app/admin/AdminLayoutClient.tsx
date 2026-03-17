"use client";

import { usePathname } from "next/navigation";
import AdminNavbar from "@/components/admin/Navbar";

/**
 * 관리자 레이아웃
 * - 인증은 미들웨어(쿠키)에서 검사하므로, Firebase Auth 로딩을 기다리지 않고 즉시 렌더링
 */
export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  return (
    <div className="min-h-screen bg-slate-50">
      {!isLoginPage && <AdminNavbar />}
      <main className="p-6">{children}</main>
    </div>
  );
}
