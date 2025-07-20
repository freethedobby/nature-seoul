import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nature Seoul - 당신의 눈썹을 더 아름답게",
  description:
    "개인 맞춤형 디자인으로 당신만의 완벽한 눈썹을 만들어드립니다. 용산 스튜디오에서 펼쳐지는 예술적 눈썹 조각.",
  keywords:
    "눈썹, 반영구, 서울, 용산, nature seoul, 맞춤형눈썹, 눈썹시술, 예약제눈썹, 고급눈썹시술",
  openGraph: {
    title: "Nature Seoul - 당신의 눈썹을 더 아름답게",
    description:
      "개인 맞춤형 디자인으로 당신만의 완벽한 눈썹을 만들어드립니다.",
    url: "https://natureseoul.com",
    siteName: "Nature Seoul",
    images: [
      {
        url: "https://natureseoul.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Nature Seoul - 당신의 눈썹을 더 아름답게",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nature Seoul - 당신의 눈썹을 더 아름답게",
    description:
      "개인 맞춤형 디자인으로 당신만의 완벽한 눈썹을 만들어드립니다.",
    images: ["https://natureseoul.com/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport:
    "width=device-width, initial-scale=1, user-scalable=no, maximum-scale=1",
  alternates: {
    canonical: "https://natureseoul.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
