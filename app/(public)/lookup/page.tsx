"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CustomerHeader from "@/components/CustomerHeader";
import { formatPhone } from "@/lib/utils/format";

export default function LookupPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>
  ) => {
    const raw = (e.target as HTMLInputElement).value;
    if (raw.length === 3 && phone === `${raw}-`) {
      setPhone(raw.slice(0, 2));
      return;
    }
    setPhone(formatPhone(raw));
  };
  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setPhone(formatPhone(e.clipboardData.getData("text")));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const carNum = carNumber.replace(/\s/g, "");
    if (!phone.trim() || !carNum) {
      setError("휴대폰 번호와 차량번호를 입력해 주세요.");
      return;
    }
    if (carNum.length < 6) {
      setError("차량번호는 6자 이상 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        phone: phone.trim(),
        carNumber: carNum,
      });
      if (password.trim()) params.set("password", password.trim());
      const res = await fetch(`/api/reservations/lookup?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "조회에 실패했습니다.");
      const token = crypto.randomUUID().slice(0, 12);
      sessionStorage.setItem(
        `lookup_${token}`,
        JSON.stringify({ reservations: data.reservations || [], phone: phone.trim(), carNumber: carNum })
      );
      router.push(`/lookup/result?token=${token}`);
    } catch (e) {
      const err = e as { message?: string };
      setError(err.message || "조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerHeader title="예약 조회" />
      <main className="pt-16 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">예약 조회</h1>
              <p className="text-caption text-secondary">
                예약 시 설정한 비밀번호로 조회할 수 있습니다
              </p>
            </div>
          </div>
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  차량번호 <span className="text-error">*</span>
                </label>
                <Input
                  type="text"
                  value={carNumber}
                  onChange={(e) => setCarNumber(e.target.value)}
                  placeholder="12가 3456"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  휴대폰 번호 <span className="text-error">*</span>
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  onInput={handlePhoneChange}
                  onPaste={handlePhonePaste}
                  maxLength={13}
                  placeholder="010-1234-5678"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">
                  조회용 비밀번호
                </label>
                <Input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="숫자 4자리 (신규 예약 시 설정한 비밀번호)"
                  maxLength={4}
                />
                <p className="text-caption text-slate-500 mt-1">신규 예약은 비밀번호가 필요합니다</p>
              </div>
              {error && <p className="text-error text-sm">{error}</p>}
              <Button
                type="submit"
                variant="accent"
                disabled={loading}
                className="w-full"
              >
                {loading ? "조회 중..." : "예약 조회"}
              </Button>
            </form>
          </Card>

          <div className="mt-6 text-center space-y-2">
            <p className="text-caption text-secondary">
              차량이 등록되어 있지 않으신가요?
            </p>
            <Link href="/register">
              <Button variant="outline" className="w-full sm:w-auto">
                차량 등록 및 조회
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-center">
            <Link
              href="/"
              className="text-caption text-secondary hover:text-primary transition"
            >
              홈으로 돌아가기
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
