"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Car } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CustomerHeader from "@/components/CustomerHeader";
import { useToast } from "@/components/ui/Toast";
import { formatPhone } from "@/lib/utils/format";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
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
    if (!name.trim() || !phone.trim() || !carNum) {
      setError("이름, 휴대폰 번호, 차량번호를 입력해 주세요.");
      return;
    }
    if (carNum.length < 6) {
      setError("차량번호는 6자 이상 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vehicles/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          carNumber: carNum,
          nextDueDate: dueDate || undefined,
          smsOptIn,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "등록에 실패했습니다.");
      toast?.show("차량 등록이 완료되었습니다.");
      router.push(`/v/${data.token}`);
    } catch (e) {
      const err = e as { message?: string };
      setError(err.message || "등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerHeader title="차량 등록" />
      <main className="pt-16 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">차량 등록</h1>
              <p className="text-caption text-secondary">
                차량 등록 후 만료일 확인 및 예약하기
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
                  이름 <span className="text-error">*</span>
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
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
                  다음 검사 예정일 <span className="text-secondary">(선택)</span>
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  차량등록증 또는{" "}
                  <a
                    href="https://cyberts.kr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline"
                  >
                    한국교통안전공단 사이버검사소
                  </a>
                  에서 확인한 만료일을 입력해 주세요.
                </p>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsOptIn}
                  onChange={(e) => setSmsOptIn(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-slate-600">
                  검사일 알림 문자 받기
                </span>
              </label>
              {error && <p className="text-error text-sm">{error}</p>}
              <Button
                type="submit"
                variant="accent"
                disabled={loading}
                className="w-full"
              >
                {loading ? "등록 중..." : "차량 등록 및 조회"}
              </Button>
            </form>
          </Card>
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
