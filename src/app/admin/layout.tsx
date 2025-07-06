"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.email !== "blacksheepwall.xyz@google.com") {
      router.push("/login");
    }
  }, [user, router]);

  if (!user || user.email !== "blacksheepwall.xyz@google.com") {
    return null;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
