"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatPhone } from "@/lib/utils/format";

export default function CustomerForm({ onSuccess }: { onSuccess?: () => void }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError("휴대폰 번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          phone: phone.trim(),
          carNumber: carNumber.trim() || null,
          gender: gender || null,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "고객 등록에 실패했습니다.");
      }
      toast?.show("고객이 등록되었습니다.");
      setName("");
      setCarNumber("");
      setPhone("");
      setGender("");
      onSuccess?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
      <Input
        type="text"
        placeholder="이름 (선택)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 min-w-[120px]"
      />
      <Input
        type="text"
        placeholder="차량번호 (선택)"
        value={carNumber}
        onChange={(e) => setCarNumber(e.target.value)}
        className="flex-1 min-w-[120px]"
      />
      <select
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        className="flex-1 min-w-[80px] rounded-xl border border-slate-300 px-4 py-3 text-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
      >
        <option value="">성별</option>
        <option value="male">남</option>
        <option value="female">여</option>
      </select>
      <Input
        type="tel"
        placeholder="휴대폰"
        value={phone}
        onChange={handlePhoneChange}
        onInput={handlePhoneChange}
        onPaste={handlePhonePaste}
        maxLength={13}
        className="flex-1 min-w-[140px]"
        required
      />
      <Button type="submit" variant="accent" disabled={loading}>
        {loading ? "저장 중..." : "추가"}
      </Button>
      {error && <p className="text-red-600 text-sm w-full">{error}</p>}
    </form>
  );
}
