import type { Metadata } from "next";
import "./globals.css";
import { Noto_Sans_KR } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";

const notoSans = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "카스코자동차검사소",
  description: "민간 자동차검사소 - 예약 및 검사 만료일 확인",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={notoSans.variable}>
      <body className="antialiased font-sans text-slate-700 relative min-h-screen">
        <ToastProvider>
          <div className="relative z-10 min-h-screen">{children}</div>
          <footer className="fixed bottom-3 right-3 z-0 text-xs text-slate-400/80 select-none pointer-events-none">
            제작 스페스
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
