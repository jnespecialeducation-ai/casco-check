"use client";

import { ChevronDown } from "lucide-react";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";

const FAQ_ITEMS = [
  {
    q: "예약 없이도 방문 가능한가요?",
    a: "네, 예약 없이도 검사받으실 수 있습니다. 다만 예약을 하시면 대기 시간을 줄일 수 있어 편리합니다.",
  },
  {
    q: "예약은 어떻게 하나요?",
    a: "홈 화면에서 '검사 예약'을 선택하시거나, 차량을 먼저 등록한 후 예약하기 버튼을 눌러 날짜와 시간을 선택해 주세요.",
  },
  {
    q: "예약 변경·취소는 어떻게 하나요?",
    a: "예약 변경이나 취소가 필요하시면 전화(062-267-9494)로 연락해 주시면 됩니다.",
  },
  {
    q: "검사에 필요한 서류는 무엇인가요?",
    a: "자동차 등록증만 지참해 주시면 됩니다.",
  },
  {
    q: "검사 소요 시간은 얼마나 되나요?",
    a: "차량 상태에 따라 다르며, 일반적으로 30분~1시간 정도 소요됩니다.",
  },
  {
    q: "검사기간과 과태료는 어떻게 되나요?",
    a: "검사기간: 유효기간 만료일 전 90일 ~ 만료일 후 31일 이내로 안내됩니다. 과태료: 만료일 다음 날부터 30일 이내 4만원, 31일째부터는 매 3일 초과 2만원씩 가산, 115일 경과 시 최대 60만원까지 부과될 수 있습니다. (출처: TS한국교통안전공단)",
  },
  {
    q: "과태료를 피하려면?",
    a: "검사기간을 놓치면 과태료가 누적될 수 있으니, 만료일이 코앞이면 바로 예약을 권장드립니다.",
  },
  {
    q: "정기검사와 종합검사 차이는?",
    a: "정기검사와 종합검사는 구분되며, 종합검사는 특정 지역/차량에 따라 추가 검사가 포함될 수 있습니다. (출처: TS한국교통안전공단)",
  },
  {
    q: "정기검사·종합검사 비용은?",
    a: "정기검사 3만원, 종합검사 6만원입니다. 자세한 내용은 전화(062-267-9494)로 문의해 주세요.",
  },
  {
    q: "점심 휴식시간이 있나요?",
    a: "평일 12시~13시는 점심 휴식시간입니다. 이 시간은 피해서 방문해 주세요.",
  },
  {
    q: "검사 유효기간은 어디서 확인하나요?",
    a: "차량등록증 또는 한국교통안전공단 사이버검사소(cyberts.kr)에서 차량 등록번호로 조회할 수 있습니다.",
  },
];

export default function FAQSection() {
  return (
    <section className="py-8 px-4">
      <SectionHeader
        title="자주 묻는 질문"
        description="예약 및 검사 관련 문의사항"
        className="mb-4"
      />
      <Card>
        <div className="divide-y divide-slate-100">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              className="group [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none py-3 pr-2 hover:bg-slate-50/50 rounded-lg -mx-1 px-1 transition-colors">
                <span className="font-medium text-primary text-sm sm:text-base select-none">
                  {item.q}
                </span>
                <ChevronDown className="w-5 h-5 shrink-0 text-secondary transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="pt-1 pb-3 pl-0">
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.a}
                </p>
              </div>
            </details>
          ))}
        </div>
      </Card>
    </section>
  );
}
