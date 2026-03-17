"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTimeSlotsForDate } from "@/lib/utils/slots";
import { getBusinessDaysForMonth, getSelectableMonths } from "@/lib/utils/holidays";
import { formatPhone } from "@/lib/utils/format";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

const STEPS = [
  { num: 1, label: "차량 정보" },
  { num: 2, label: "날짜" },
  { num: 3, label: "시간" },
  { num: 4, label: "연락처" },
  { num: 5, label: "완료" },
];

const PHONE_REGEX = /^01[0-9]-[0-9]{4}-[0-9]{4}$/; // 010-XXXX-XXXX 형식

export default function ReserveFullForm() {
  const router = useRouter();
  const toast = useToast();
  const monthOptions = useMemo(() => getSelectableMonths(6), []);
  const today = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, []);
  const [selectedMonth, setSelectedMonth] = useState(
    monthOptions[0] ?? { year: today.year, month: today.month, label: `${today.year}년 ${today.month}월` }
  );
  const dateOptions = useMemo(
    () => getBusinessDaysForMonth(selectedMonth.year, selectedMonth.month),
    [selectedMonth.year, selectedMonth.month]
  );
  const firstDateOfMonth = dateOptions[0]?.date ?? "";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [date, setDate] = useState("");
  const timeSlots = useMemo(() => (date ? getTimeSlotsForDate(date) : []), [date]);
  const [time, setTime] = useState("09:00");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  useEffect(() => {
    if (dateOptions.length > 0) {
      setDate((prev) => {
        const inOptions = dateOptions.some((o) => o.date === prev);
        return inOptions ? prev : firstDateOfMonth;
      });
    } else {
      setDate("");
    }
  }, [dateOptions, firstDateOfMonth]);

  useEffect(() => {
    if (!date) {
      setBookedSlots([]);
      return;
    }
    fetch(`/api/reservations/slots?date=${date}`)
      .then((res) => res.json())
      .then((data) => setBookedSlots(data.booked ?? []))
      .catch(() => setBookedSlots([]));
  }, [date]);

  useEffect(() => {
    if (date && timeSlots.length > 0) {
      if (!timeSlots.includes(time)) {
        setTime(timeSlots[0]);
      } else if (bookedSlots.includes(time)) {
        const first = timeSlots.find((s) => !bookedSlots.includes(s));
        setTime(first ?? timeSlots[0]);
      }
    }
  }, [date, timeSlots, time, bookedSlots]);
  const [type, setType] = useState<"periodic" | "comprehensive" | "unknown">("periodic");
  const [note, setNote] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement> | React.FormEvent<HTMLInputElement>
  ) => {
    const raw = (e.target as HTMLInputElement).value;
    // "010-" 등 01X- 에서 백스페이스 시 "-" 삭제로 "01X"가 들어옴 → "01"로 처리하여 처음까지 삭제 가능
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

  const handleMonthClick = (e: React.MouseEvent | React.PointerEvent) => {
    const el = (e.target as HTMLElement).closest("[data-month]");
    if (el) {
      const y = Number(el.getAttribute("data-year"));
      const m = Number(el.getAttribute("data-month"));
      if (!isNaN(y) && !isNaN(m)) {
        const mo = monthOptions.find((o) => o.year === y && o.month === m);
        if (mo) setSelectedMonth(mo);
      }
    }
  };

  const handleDateClick = (e: React.MouseEvent | React.PointerEvent) => {
    const el = (e.target as HTMLElement).closest("[data-date]");
    if (el) {
      const d = el.getAttribute("data-date");
      if (d) setDate(d);
    }
  };

  const handleTimeClick = (e: React.MouseEvent | React.PointerEvent) => {
    const el = (e.target as HTMLElement).closest("[data-time]");
    if (el) {
      const disabled = el.getAttribute("data-disabled") === "true";
      if (disabled) return;
      const t = el.getAttribute("data-time");
      if (t) setTime(t);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (!PHONE_REGEX.test(phone)) {
      setError("휴대폰 번호를 010-0000-0000 형식으로 입력해 주세요.");
      return;
    }
    const carNum = carNumber.replace(/\s/g, "");
    if (carNum.length < 6) {
      setError("차량번호는 6자 이상 입력해 주세요.");
      return;
    }
    if (!date || !time) {
      setError("예약일과 예약시간을 선택해 주세요.");
      return;
    }
    if (!/^\d{4}$/.test(password)) {
      setError("조회용 비밀번호 4자리를 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reservations/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          carNumber: carNum,
          date,
          time,
          type,
          note: note.trim() || undefined,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "예약에 실패했습니다.");
      }
      toast?.show("예약이 완료되었습니다.");
      router.push(
        `/complete?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`
      );
    } catch (e) {
      const err = e as { message?: string };
      setError(err.message || "예약에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const btnBase =
    "min-h-[48px] py-3 px-3 sm:py-4 sm:px-4 rounded-xl text-base font-medium transition-all duration-200 cursor-pointer touch-manipulation select-none";
  const btnSelected =
    "bg-primary text-white shadow-card hover:shadow-card-hover";
  const btnUnselected =
    "bg-white border border-slate-200 text-slate-600 hover:border-primary hover:text-primary active:scale-[0.98]";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-caption font-medium ${
                i < 4 ? "bg-primary/5 text-primary" : "bg-slate-100 text-secondary"
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                {s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < 4 && (
              <div className="w-3 sm:w-6 h-px bg-slate-200 mx-0.5" aria-hidden />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: 차량 정보 */}
      <div>
        <label className="block text-sm font-medium text-primary mb-2">
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

      {/* Step 2: 날짜 */}
      <div className="relative z-10">
        <label className="block text-sm font-medium text-primary mb-2">
          예약일 <span className="text-error">*</span>
        </label>
        <div
          className="flex flex-wrap gap-2 mb-3"
          role="group"
          onClick={handleMonthClick}
          onPointerDown={handleMonthClick}
        >
          {monthOptions.map((mo) => {
            const checked = selectedMonth.year === mo.year && selectedMonth.month === mo.month;
            return (
              <div
                key={`${mo.year}-${mo.month}`}
                data-year={mo.year}
                data-month={mo.month}
                role="button"
                tabIndex={0}
                onKeyDown={(k) => {
                  if (k.key === "Enter" || k.key === " ") {
                    k.preventDefault();
                    setSelectedMonth(mo);
                  }
                }}
                className={`block px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer touch-manipulation select-none ${
                  checked ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {mo.label}
              </div>
            );
          })}
        </div>
        <div
          className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3"
          onClick={handleDateClick}
          onPointerDown={handleDateClick}
        >
          {dateOptions.length === 0 ? (
            <p className="col-span-full text-sm text-slate-500 py-2">
              해당 월에는 예약 가능한 날이 없습니다.
            </p>
          ) : (
            dateOptions.map((opt) => {
              const checked = date === opt.date;
              return (
                <div
                  key={opt.date}
                  data-date={opt.date}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(k) => {
                    if (k.key === "Enter" || k.key === " ") {
                      k.preventDefault();
                      setDate(opt.date);
                    }
                  }}
                  className={`${btnBase} flex items-center justify-center ${
                    checked ? btnSelected : btnUnselected
                  }`}
                >
                  {opt.label}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Step 3: 시간 */}
      <div className="relative z-10">
        <label className="block text-sm font-medium text-primary mb-2">
          예약시간 <span className="text-error">*</span>
        </label>
        {!date ? (
          <p className="text-sm text-slate-500 py-2">날짜를 먼저 선택해 주세요</p>
        ) : timeSlots.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">해당 날짜에는 예약이 불가능합니다</p>
        ) : (
        <div
          className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3"
          onClick={handleTimeClick}
          onPointerDown={handleTimeClick}
        >
          {timeSlots.map((s) => {
            const checked = time === s;
            const disabled = bookedSlots.includes(s);
            return (
              <div
                key={s}
                data-time={s}
                data-disabled={disabled ? "true" : undefined}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(k) => {
                  if (disabled) return;
                  if (k.key === "Enter" || k.key === " ") {
                    k.preventDefault();
                    setTime(s);
                  }
                }}
                className={`${btnBase} flex items-center justify-center ${
                  disabled
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none border-slate-200"
                    : checked
                    ? btnSelected
                    : btnUnselected
                }`}
              >
                {s}
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Step 4: 연락처 확인 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-primary">연락처 확인</h3>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
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
          <label className="block text-sm font-medium text-slate-700 mb-1">
            휴대폰 <span className="text-error">*</span>
          </label>
          <Input
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            onInput={handlePhoneChange}
            onPaste={handlePhonePaste}
            maxLength={13}
            placeholder="010-0000-0000"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            조회용 비밀번호 <span className="text-error">*</span>
          </label>
          <Input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="숫자 4자리"
            maxLength={4}
            required
          />
          <p className="text-caption text-slate-500 mt-1">예약 조회 시 본인 확인용입니다</p>
        </div>
      </div>

      {/* Step 5: 검사 종류, 메모 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          검사 종류
        </label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              checked={type === "periodic"}
              onChange={() => setType("periodic")}
              className="text-primary accent-primary"
            />
            <span className="text-sm">정기검사</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              checked={type === "comprehensive"}
              onChange={() => setType("comprehensive")}
              className="text-primary accent-primary"
            />
            <span className="text-sm">종합검사</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="type"
              checked={type === "unknown"}
              onChange={() => setType("unknown")}
              className="text-primary accent-primary"
            />
            <span className="text-sm">모름</span>
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          메모 <span className="text-slate-400">(선택)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="특이사항이나 요청사항을 적어 주세요"
          rows={2}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition min-h-[88px]"
          maxLength={500}
        />
      </div>

      {error && <p className="text-error text-sm">{error}</p>}
      <Button
        type="submit"
        variant="accent"
        disabled={loading}
        className="w-full"
      >
        {loading ? "예약 중..." : "예약 확정"}
      </Button>
    </form>
  );
}
