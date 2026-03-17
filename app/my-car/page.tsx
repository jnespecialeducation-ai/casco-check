"use client";

import Link from "next/link";
import { Car, FileSearch } from "lucide-react";
import CustomerHeader from "@/components/CustomerHeader";
import Card from "@/components/ui/Card";

export default function MyCarPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerHeader title="차량 등록 및 조회" />
      <main className="pt-16 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">차량 등록 및 조회</h1>
              <p className="text-caption text-secondary">
                차량을 등록하거나 등록한 차량을 조회하세요
              </p>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Link href="/register" className="block h-full">
              <Card hover className="h-full group">
                <div className="flex flex-col items-center text-center gap-3 p-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition">
                    <Car className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-primary">차량 등록</h3>
                  <p className="text-caption text-secondary">
                    새 차량을 등록하고 만료일 확인
                  </p>
                </div>
              </Card>
            </Link>
            <Link href="/vehicle-lookup" className="block h-full">
              <Card hover className="h-full group">
                <div className="flex flex-col items-center text-center gap-3 p-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition">
                    <FileSearch className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-primary">차량 조회</h3>
                  <p className="text-caption text-secondary">
                    등록한 차량 정보 확인 및 예약
                  </p>
                </div>
              </Card>
            </Link>
          </div>

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
