"use client";

import { MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/constants";
import Card from "@/components/ui/Card";

export default function LocationSection() {
  return (
    <section id="location" className="py-8 px-4 scroll-mt-6">
      <Card className="overflow-hidden p-0 hover:shadow-card-hover transition-shadow">
        <h3 className="text-lg font-bold text-primary px-6 pt-6 pb-2">
          찾아오시는 길
        </h3>
        <p className="text-slate-600 text-sm px-6 pb-4">
          이 표지판을 보시면 입구입니다
        </p>
        <div className="relative aspect-[16/10] w-full bg-slate-200 overflow-hidden">
          <img
            src="/images/location-entrance.png"
            alt="카스코자동차검사소 입구"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 space-y-3">
          <p className="flex items-start gap-2 text-sm text-slate-700">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
            <span>{SITE.address}</span>
          </p>
          <a
            href={`tel:${SITE.phone.replace(/-/g, "")}`}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Phone className="w-4 h-4 shrink-0" />
            {SITE.phone}
          </a>
          <a
            href={SITE.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-white transition mt-4"
          >
            지도에서 보기
          </a>
        </div>
      </Card>
    </section>
  );
}
