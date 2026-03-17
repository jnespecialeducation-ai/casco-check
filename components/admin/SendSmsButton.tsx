"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface SendSmsButtonProps {
  vehicleId: string;
  templateKey: string;
  date?: string;
  time?: string;
  label?: string;
}

export default function SendSmsButton({
  vehicleId,
  templateKey,
  date,
  time,
  label = "문자 보내기",
}: SendSmsButtonProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch("/api/admin/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, templateKey, date, time }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "문자 발송에 실패했습니다.");
      toast?.show("문자가 발송되었습니다.");
      setDone(true);
    } catch (e) {
      console.error(e);
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="accent"
      onClick={handleClick}
      disabled={loading}
      className="text-sm px-3 py-2"
    >
      {loading ? "발송 중..." : done ? "발송됨" : label}
    </Button>
  );
}
