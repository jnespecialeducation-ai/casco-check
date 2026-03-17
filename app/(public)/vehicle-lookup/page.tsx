"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileSearch } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CustomerHeader from "@/components/CustomerHeader";
import { formatPhone } from "@/lib/utils/format";

export default function VehicleLookupPage() {
  const router = useRouter();
  const [carNumber, setCarNumber] = useState("");
  const [phone, setPhone] = useState("");
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
    if (!carNum || carNum.length < 6) {
      setError("차량번호를 6자 이상 입력해 주세요.");
      return;
    }
    if (!phone.trim()) {
      setError("휴대폰 번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        carNumber: carNum,
        phone: phone.trim(),
      });
      const res = await fetch(`/api/vehicles/lookup?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "차량을 찾을 수 없습니다.");
      if (data.token) {
        router.push(`/v/${data.token}`);
      } else {
        throw new Error("차량 정보를 불러올 수 없습니다.");
      }
    } catch (e) {
      const err = e as { message?: string };
      setError(err.message || "차량 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerHeader title="차량 조회" />
      <main className="pt-16 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <FileSearch className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">차량 조회</h1>
              <p className="text-caption text-secondary">
                등록 시 등록한 차량번호와 휴대폰 번호로 조회하세요
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
              {error && <p className="text-error text-sm">{error}</p>}
              <Button
                type="submit"
                variant="accent"
                disabled={loading}
                className="w-full"
              >
                {loading ? "조회 중..." : "차량 조회"}
              </Button>
            </form>
          </Card>

          <p className="mt-6 text-center">
            <Link
              href="/my-car"
              className="text-caption text-secondary hover:text-primary transition"
            >
              차량 등록 및 조회로 돌아가기
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
