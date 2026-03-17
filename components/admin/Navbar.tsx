"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import Button from "@/components/ui/Button";

export default function AdminNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    // 관리자 인증은 쿠키 기반. API로 쿠키만 삭제하고 리다이렉트
    await fetch("/api/auth/admin/logout", { method: "POST", credentials: "include" });
    router.replace("/admin/login");
  };

  const links = [
    { href: "/admin", label: "대시보드" },
    { href: "/admin/reservations", label: "예약관리" },
    { href: "/admin/customers", label: "고객" },
    { href: "/admin/vehicles", label: "차량" },
    { href: "/admin/due", label: "만료예정" },
    { href: "/admin/finance", label: "수입·지출 관리" },
    { href: "/admin/sms-templates", label: "문자 템플릿" },
    { href: "/admin/sms-logs", label: "문자 발송 로그" },
    { href: "/admin/settings", label: "설정" },
  ];

  return (
    <nav className="bg-primary text-white p-4 flex flex-wrap items-center justify-between gap-4 shadow-card">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/admin" className="font-bold text-lg">
          카스코 관리자
        </Link>
        <div className="flex flex-wrap gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm px-3 py-2 rounded-lg transition ${
                pathname === l.href
                  ? "bg-white/20 font-medium"
                  : "opacity-80 hover:opacity-100 hover:bg-white/10"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {user && (
          <span className="text-sm opacity-80 hidden sm:inline">
            {user.email || "관리자"}
          </span>
        )}
        <Button
          variant="ghost"
          type="button"
          onClick={handleLogout}
          className="text-white border border-white/50 hover:bg-white/10 hover:border-white cursor-pointer z-10 relative"
        >
          로그아웃
        </Button>
      </div>
    </nav>
  );
}
