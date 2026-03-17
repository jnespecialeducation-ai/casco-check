"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("비밀번호 또는 토큰을 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          password.trim().length > 20 ? { token: password.trim() } : { password: password.trim() }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "로그인에 실패했습니다.");
      }
      // API가 쿠키를 설정함. Firebase Auth 호출 없이 즉시 이동
      router.replace("/admin");
    } catch (e) {
      setError((e as Error).message || "로그인에 실패했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-12 px-4">
      <h1 className="text-2xl font-bold text-secondary mb-6 text-center">
        관리자 로그인
      </h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              비밀번호 또는 토큰
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="ADMIN_PASSWORD 또는 ADMIN_TOKEN"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
