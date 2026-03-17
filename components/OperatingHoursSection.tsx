"use client";

import { Clock } from "lucide-react";
import { BUSINESS_HOURS } from "@/lib/constants";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";

export default function OperatingHoursSection() {
  return (
    <section className="py-8 px-4">
      <SectionHeader
        title="운영시간"
        description="평일 08:40~17:30, 토요일 08:40~12:00 (일·공휴일 휴무)"
        className="mb-4"
      />
      <Card>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-primary">
              평일 {BUSINESS_HOURS.start} ~ {BUSINESS_HOURS.end}
            </p>
            <p className="font-semibold text-primary mt-1">
              토요일 {BUSINESS_HOURS.start} ~ {BUSINESS_HOURS.saturdayEnd}
            </p>
            <p className="text-caption text-secondary mt-0.5">
              일·공휴일 휴무
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
}
