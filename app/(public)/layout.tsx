/**
 * 고객용 공개 페이지 레이아웃
 * - 예약 서비스형 밝고 친절한 UI
 * - 관리자 메뉴 노출 없음
 */
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
