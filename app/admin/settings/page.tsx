"use client";

import Card from "@/components/ui/Card";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">기본 설정</h1>
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-primary">검사소 정보</h2>
            <p className="text-caption text-secondary">운영시간, 연락처 등 기본 설정</p>
          </div>
        </div>
        <p className="text-caption text-secondary">
          기본 설정은 .env 또는 lib/constants.ts에서 관리됩니다.
        </p>
      </Card>
    </div>
  );
}
