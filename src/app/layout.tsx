import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Script from "next/script";
import { GA_TRACKING_ID } from "@/lib/gtag";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nature.seoul 당신의 눈썹을 더 자연스럽게",
  description:
    "개인 맞춤형 디자인으로 당신만의 완벽한 눈썹을 만들어드립니다. 용산 스튜디오에서 펼쳐지는 예술적 눈썹 조각.",
  keywords:
    "눈썹, 반영구, 서울, 용산, nature seoul, 맞춤형눈썹, 눈썹시술, 예약제눈썹, 고급눈썹시술",
  openGraph: {
    title: "nature.seoul 당신의 눈썹을 더 자연스럽게",
    description:
      "개인 맞춤형 디자인으로 당신만의 완벽한 눈썹을 만들어드립니다.",
    url: "https://natureseoul.com",
    siteName: "Nature Seoul",
    images: [
      {
        url: "https://natureseoul.com/kakao-thumbnail.png",
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
    images: ["https://natureseoul.com/kakao-thumbnail.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://natureseoul.com",
  },
};

export const viewport =
  "width=device-width, initial-scale=1, user-scalable=no, maximum-scale=1";

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
        {/* Google Analytics */}
        {GA_TRACKING_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            />
            <Script
              id="gtag-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_TRACKING_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        <AuthProvider>
          <GoogleAnalytics />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
