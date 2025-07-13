"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, ArrowLeft } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

interface AdminUser {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
}

export default function AdminManagement() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!loading && user?.email) {
        try {
          const response = await fetch("/api/admin/check", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: user.email }),
          });

          if (response.ok) {
            const data = await response.json();
            setIsAuthorized(data.isAdmin);
            if (!data.isAdmin) {
              router.push("/admin/login");
            }
          } else {
            setIsAuthorized(false);
            router.push("/admin/login");
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAuthorized(false);
          router.push("/admin/login");
        }
      } else if (!loading && !user) {
        router.push("/admin/login");
      }
    };

    checkAdminStatus();
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !isAuthorized) return;

    // Subscribe to admins
    const adminsQuery = query(collection(db, "admins"));

    const unsubAdmins = onSnapshot(adminsQuery, (snapshot) => {
      const adminData: AdminUser[] = [];
      snapshot.forEach((doc) => {
        adminData.push({ id: doc.id, ...doc.data() } as AdminUser);
      });

      // Add hardcoded admins (blacksheepwall emails)
      const hardcodedAdmins: AdminUser[] = [
        {
          id: "blacksheepwall-xyz",
          email: "blacksheepwall.xyz@gmail.com",
          isActive: true,
          createdAt: new Date("2024-01-01"), // Default date for hardcoded admins
        },
        {
          id: "blacksheepwall-google",
          email: "blacksheepwall.xyz@google.com",
          isActive: true,
          createdAt: new Date("2024-01-01"), // Default date for hardcoded admins
        },
      ];

      // Combine Firestore admins with hardcoded admins, avoiding duplicates
      const allAdmins = [...adminData];
      hardcodedAdmins.forEach((hardcodedAdmin) => {
        if (!allAdmins.some((admin) => admin.email === hardcodedAdmin.email)) {
          allAdmins.push(hardcodedAdmin);
        }
      });

      allAdmins.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAdmins(allAdmins);
    });

    return () => {
      unsubAdmins();
    };
  }, [user, isAuthorized]);

  const handleAddAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newAdminEmail }),
      });

      if (response.ok) {
        setNewAdminEmail("");
        alert("관리자가 성공적으로 추가되었습니다.");
      } else {
        const error = await response.json();
        alert(error.error || "관리자 추가에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      alert("관리자 추가 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    // Prevent removal of hardcoded blacksheepwall admins
    if (email.includes("blacksheepwall")) {
      alert("blacksheepwall 관리자는 제거할 수 없습니다.");
      return;
    }

    if (!confirm(`정말로 ${email}을(를) 관리자에서 제거하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch("/api/admin/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        alert("관리자가 성공적으로 제거되었습니다.");
      } else {
        const error = await response.json();
        alert(error.error || "관리자 제거에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error removing admin:", error);
      alert("관리자 제거 중 오류가 발생했습니다.");
    }
  };

  if (loading || !isAuthorized) {
    return (
      <div className="bg-gradient-to-br from-gray-50 min-h-screen to-white p-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center">
            <div className="animate-spin border-black mb-4 h-8 w-8 rounded-full border-b-2"></div>
            <p>Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 min-h-screen to-white p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push("/admin")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                뒤로
              </Button>
              <h1 className="text-gray-900 font-sans text-3xl font-extrabold tracking-tight">
                관리자 관리
              </h1>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              router.push("/dashboard");
            }}
            className="flex items-center gap-2"
          >
            사용자 페이지로
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>새 관리자 추가</CardTitle>
              <CardDescription>
                새로운 관리자의 이메일 주소를 입력하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAdmin} className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="관리자 이메일 주소"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  추가
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>관리자 목록</CardTitle>
              <CardDescription>
                현재 등록된 관리자 목록입니다. 총 {admins.length}명의 관리자가
                있습니다.
                {admins.some((admin) =>
                  admin.email.includes("blacksheepwall")
                ) && (
                  <span className="text-purple-600 mt-1 block text-xs">
                    * 시스템 관리자는 제거할 수 없습니다.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {admins.length === 0 ? (
                <div className="text-gray-500 py-8 text-center">
                  <p>등록된 관리자가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="hover:bg-gray-50 flex items-center justify-between rounded-lg border p-4 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-200 flex h-8 w-8 items-center justify-center rounded-full">
                            <span className="text-gray-600 text-sm font-medium">
                              {admin.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium">
                              {admin.email}
                            </p>
                            <p className="text-gray-500 text-sm">
                              등록일:{" "}
                              {new Date(admin.createdAt).toLocaleDateString(
                                "ko-KR",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={admin.isActive ? "default" : "secondary"}
                          className={
                            admin.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {admin.isActive ? "활성" : "비활성"}
                        </Badge>
                        {admin.isActive &&
                          admin.email !== user?.email &&
                          !admin.email.includes("blacksheepwall") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveAdmin(admin.email)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        {admin.email.includes("blacksheepwall") && (
                          <Badge
                            variant="outline"
                            className="text-purple-600 border-purple-200"
                          >
                            시스템 관리자
                          </Badge>
                        )}
                        {admin.email === user?.email && (
                          <Badge
                            variant="outline"
                            className="text-blue-600 border-blue-200"
                          >
                            현재 사용자
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
