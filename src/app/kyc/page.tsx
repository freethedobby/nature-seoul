"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import KYCForm from "@/components/KYCForm";
import FirebaseDebug from "@/components/FirebaseDebug";
import Logo from "@/components/Logo";

export default function KYCPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="animate-spin border-gray-900 h-8 w-8 rounded-full border-b-2"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-gray-200 sticky top-0 z-50 border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="hover:bg-gray-100 mr-4 rounded-full p-2 transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <Logo variant="header" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="text-gray-900 mb-2 text-2xl font-light">
              맞춤 상담 신청
            </h2>
            <p className="text-gray-600">
              고객님의 눈썹 상태를 정확히 파악하여
              <br />
              최적의 시술 방법을 제안해드리겠습니다.
            </p>
          </div>

          <KYCForm
            onSuccess={() => {
              // 성공 후 대시보드로 이동
              setTimeout(() => {
                router.push("/dashboard");
              }, 2000);
            }}
          />
        </div>
      </main>
      <FirebaseDebug />
    </div>
  );
}
