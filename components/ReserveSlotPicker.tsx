"use client";

import { useState, useMemo, useEffect } from "react";
import { getTimeSlotsForDate } from "@/lib/utils/slots";
import { getBusinessDaysForMonth, getSelectableMonths } from "@/lib/utils/holidays";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface ReserveSlotPickerProps {
  token: string;
  onSuccess: (date: string, timeSlot: string) => void;
}

export default function ReserveSlotPicker({
  token,
  onSuccess,
}: ReserveSlotPickerProps) {
  const monthOptions = useMemo(() => getSelectableMonths(6), []);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const first = monthOptions[0];
    return first ? { year: first.year, month: first.month } : { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  });
  const dateOptions = useMemo(
    () => getBusinessDaysForMonth(selectedMonth.year, selectedMonth.month),
    [selectedMonth.year, selectedMonth.month]
  );
  const [date, setDate] = useState("");
  const timeSlots = useMemo(() => (date ? getTimeSlotsForDate(date) : []), [date]);
  const [timeSlot, setTimeSlot] = useState("09:00");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  useEffect(() => {
    if (dateOptions.length > 0) {
      setDate((prev) => {
        const inOptions = dateOptions.some((o) => o.date === prev);
        return inOptions ? prev : dateOptions[0].date;
      });
    } else {
      setDate("");
    }
  }, [dateOptions]);

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
      if (!timeSlots.includes(timeSlot)) {
        const first = timeSlots.find((s) => !bookedSlots.includes(s));
        setTimeSlot(first ?? timeSlots[0]);
      } else if (bookedSlots.includes(timeSlot)) {
        const first = timeSlots.find((s) => !bookedSlots.includes(s));
        setTimeSlot(first ?? timeSlots[0]);
      }
    }
  }, [date, timeSlots, timeSlot, bookedSlots]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMonthClick = (e: React.MouseEvent | React.PointerEvent) => {
    const el = (e.target as HTMLElement).closest("[data-month]");
    if (el) {
      const y = Number(el.getAttribute("data-year"));
      const m = Number(el.getAttribute("data-month"));
      if (!isNaN(y) && !isNaN(m)) setSelectedMonth({ year: y, month: m });
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
      if (t) setTimeSlot(t);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !timeSlot) {
      setError("날짜와 시간을 선택해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, date, timeSlot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "예약에 실패했습니다.");
      onSuccess(date, timeSlot);
    } catch (e) {
      const err = e as { message?: string };
      setError(err.message || "예약에 실패했습니다.");
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
      <div className="relative z-10">
        <label className="block text-sm font-medium text-primary mb-2">
          날짜 선택
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
                    setSelectedMonth({ year: mo.year, month: mo.month });
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
      <div className="relative z-10">
        <label className="block text-sm font-medium text-primary mb-2">
          시간 선택
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
            const checked = timeSlot === s;
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
                    setTimeSlot(s);
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
      {error && (
        <p className="text-error text-sm">{error}</p>
      )}
      <Button
        type="submit"
        variant="primary"
        disabled={loading}
        className="w-full"
      >
        {loading ? "예약 중..." : "예약 확정"}
      </Button>
    </form>
  );
}
