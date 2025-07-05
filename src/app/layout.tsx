import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NATURE PREMIUM | 프라이빗 눈썹 아트 스튜디오",
  description:
    "강남 프라이빗 스튜디오에서 펼쳐지는 예술적 눈썹 조각. 완전 맞춤형 디자인과 독점적 뷰티 경험을 제공하는 프리미엄 눈썹 아트 전문가.",
  keywords:
    "프리미엄눈썹시술, 강남눈썹, 프라이빗뷰티, 맞춤형눈썹, 럭셔리뷰티, 눈썹아트, 예약제눈썹, 고급눈썹시술, 네이쳐프리미엄",
  openGraph: {
    title: "NATURE PREMIUM | 프라이빗 눈썹 아트 스튜디오",
    description:
      "강남 프라이빗 스튜디오에서 펼쳐지는 예술적 눈썹 조각. 완전 맞춤형 디자인과 독점적 뷰티 경험.",
    type: "website",
    locale: "ko_KR",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
