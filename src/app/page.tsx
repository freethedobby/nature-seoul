"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CustomerHeader from "@/components/CustomerHeader";
import Logo from "@/components/Logo";
import AnimatedText from "@/components/AnimatedText";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="bg-gradient-to-br from-gray-50 min-h-screen to-white">
      <CustomerHeader />

      <main className="relative flex min-h-[90vh] items-start justify-center overflow-hidden md:min-h-screen md:items-center">
        <div className="absolute bottom-16 right-0 z-0 h-2/5 w-3/4 md:right-0 md:top-0 md:bottom-0 md:h-full md:w-2/3">
          <div className="relative h-full w-full">
            <Image
              src="/eyebrow_example.jpg"
              alt="Beautiful Woman Illustration"
              fill
              className="rounded-2xl object-cover object-center"
              priority
            />
            <div className="bg-gradient-to-r absolute inset-0 rounded-2xl from-white/20 to-transparent"></div>
            {/* Shining effect */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <div className="bg-gradient-to-r animate-shine absolute inset-0 -skew-x-12 transform from-transparent via-white/30 to-transparent"></div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-1 md:py-8">
          <div className="grid min-h-[40vh] items-start gap-1 pt-12 md:min-h-[70vh] md:grid-cols-2 md:items-center md:gap-8 md:pt-0">
            <div className="text-black space-y-2 md:space-y-8">
              <div className="space-y-2 md:space-y-6">
                <h2 className="text-4xl font-bold leading-tight tracking-tight drop-shadow-2xl md:text-6xl lg:text-7xl">
                  <AnimatedText
                    text="당신의 눈썹을"
                    delay={500}
                    speed={150}
                    className="inline-block"
                  />
                  <br />
                  <AnimatedText
                    text="더 아름답게"
                    delay={2000}
                    speed={150}
                    className="inline-block font-bold"
                  />
                </h2>

                <p className="text-gray-600 text-lg font-medium leading-relaxed drop-shadow-xl md:text-xl">
                  개인 맞춤형 디자인으로 당신만의 완벽한 눈썹을 만들어드립니다.
                </p>
              </div>

              <div className="flex flex-col items-start space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                {loading ? (
                  <div className="w-32 animate-pulse bg-black/20 h-12 rounded-xl"></div>
                ) : (
                  <Link href={user ? "/dashboard" : "/login"}>
                    <Button
                      size="lg"
                      className="bg-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 group relative h-14 w-full transform text-white transition-all duration-300 sm:w-auto"
                    >
                      <div className="bg-gradient-to-r absolute inset-0 rounded-xl from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                      <div className="relative flex items-center justify-center">
                        <ArrowRight className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                        <span>예약하기</span>
                      </div>
                    </Button>
                  </Link>
                )}
              </div>

              <div className="text-black text-sm">
                <p className="font-light">용산 스튜디오</p>
                <p className="text-gray-500 text-xs">예약제</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-gray-100 border-t py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="text-center md:text-left">
              <Logo variant="footer" className="text-black" />
              <p className="text-gray-400 mt-2 text-xs">
                designed by{" "}
                <a
                  href="https://blacksheepwall.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-600 underline transition-colors"
                >
                  blacksheepwall
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
