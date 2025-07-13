"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Eye } from "lucide-react";

export default function AdminModeToggle() {
  const { isAdmin, isAdminMode, setIsAdminMode } = useAuth();
  const router = useRouter();

  if (!isAdmin) return null;

  return (
    <>
      {/* Mobile: Only show a single toggle button */}
      <Button
        variant="ghost"
        size="sm"
        className="justify-center sm:hidden"
        onClick={() => {
          if (isAdminMode) {
            setIsAdminMode(false);
          } else {
            setIsAdminMode(true);
            router.push("/admin");
          }
        }}
      >
        {isAdminMode ? (
          <>
            <Eye className="mr-2 inline h-4 w-4" /> 사용자 모드 전환
          </>
        ) : (
          <>
            <Shield className="mr-2 inline h-4 w-4" /> 관리자 모드 전환
          </>
        )}
      </Button>

      {/* Desktop: Show badge + button as before */}
      <div className="hidden items-center gap-2 sm:flex">
        <Badge
          variant={isAdminMode ? "default" : "secondary"}
          className={
            isAdminMode
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-600"
          }
        >
          {isAdminMode ? "관리자 모드" : "사용자 모드"}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (isAdminMode) {
              setIsAdminMode(false);
            } else {
              setIsAdminMode(true);
              router.push("/admin");
            }
          }}
          className="text-gray-600 hover:text-gray-900"
        >
          {isAdminMode ? (
            <>
              <Eye className="mr-2 h-4 w-4" /> 사용자 보기
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" /> 관리자
            </>
          )}
        </Button>
      </div>
    </>
  );
}
