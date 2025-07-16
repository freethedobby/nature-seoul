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
import {
  UserPlus,
  Trash2,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Settings,
  RefreshCw,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

interface AdminUser {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: unknown; // Can be Date, Firestore Timestamp, or string
}

interface ConfigStatus {
  isConfigured: boolean;
  hasProjectId: boolean;
  hasClientEmail: boolean;
  hasPrivateKey: boolean;
  adminTest: boolean;
  adminError: string | null;
  environment: string;
}

export default function AdminManagement() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [isCheckingConfig, setIsCheckingConfig] = useState(false);

  // Helper function to safely convert createdAt to Date
  const getDateFromCreatedAt = (createdAt: unknown): Date => {
    if (createdAt && typeof createdAt === "object" && "toDate" in createdAt) {
      return (createdAt as { toDate(): Date }).toDate();
    } else if (createdAt) {
      return new Date(createdAt as string | number | Date);
    }
    return new Date(0); // Default date for sorting
  };

  const checkConfigStatus = async () => {
    setIsCheckingConfig(true);
    try {
      const response = await fetch("/api/admin/check-config");
      if (response.ok) {
        const data = await response.json();
        setConfigStatus(data);
      } else {
        console.error("Failed to check config status");
      }
    } catch (error) {
      console.error("Error checking config status:", error);
    } finally {
      setIsCheckingConfig(false);
    }
  };

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
            } else {
              // Check config status after confirming admin access
              checkConfigStatus();
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
          getDateFromCreatedAt(b.createdAt).getTime() -
          getDateFromCreatedAt(a.createdAt).getTime()
      );
      setAdmins(allAdmins);
    });

    return () => {
      unsubAdmins();
    };
  }, [user, isAuthorized]);

  const handleAddAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!configStatus?.adminTest) {
      alert("Firebase 설정이 완료되지 않았습니다. 설정 상태를 확인해주세요.");
      return;
    }

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
        let errorMessage = error.error || "관리자 추가에 실패했습니다.";

        // Provide more specific error messages
        if (errorMessage.includes("Admin functionality not configured")) {
          errorMessage =
            "Firebase Admin 설정이 완료되지 않았습니다. 환경 변수를 확인해주세요.";
        } else if (errorMessage.includes("Internal server error")) {
          errorMessage =
            "서버 오류가 발생했습니다. Firebase 연결을 확인해주세요.";
        }

        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      alert(
        "관리자 추가 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요."
      );
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
          {/* Configuration Status Card */}
          {configStatus && (
            <Card
              className={
                configStatus.isConfigured && configStatus.adminTest
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    <CardTitle className="text-lg">관리자 설정 상태</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={checkConfigStatus}
                    disabled={isCheckingConfig}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        isCheckingConfig ? "animate-spin" : ""
                      }`}
                    />
                    새로고침
                  </Button>
                </div>
                <CardDescription>
                  Firebase Admin SDK 설정 상태를 확인합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Environment Variables Status */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="flex items-center gap-2">
                      {configStatus.hasProjectId ? (
                        <CheckCircle className="text-green-600 h-4 w-4" />
                      ) : (
                        <AlertTriangle className="text-red-600 h-4 w-4" />
                      )}
                      <span className="text-sm">Project ID</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {configStatus.hasClientEmail ? (
                        <CheckCircle className="text-green-600 h-4 w-4" />
                      ) : (
                        <AlertTriangle className="text-red-600 h-4 w-4" />
                      )}
                      <span className="text-sm">Client Email</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {configStatus.hasPrivateKey ? (
                        <CheckCircle className="text-green-600 h-4 w-4" />
                      ) : (
                        <AlertTriangle className="text-red-600 h-4 w-4" />
                      )}
                      <span className="text-sm">Private Key</span>
                    </div>
                  </div>

                  {/* Connection Test */}
                  <div className="flex items-center gap-2">
                    {configStatus.adminTest ? (
                      <CheckCircle className="text-green-600 h-4 w-4" />
                    ) : (
                      <AlertTriangle className="text-red-600 h-4 w-4" />
                    )}
                    <span className="text-sm">
                      {configStatus.adminTest
                        ? "Firebase 연결 성공"
                        : "Firebase 연결 실패"}
                    </span>
                  </div>

                  {/* Error Message */}
                  {configStatus.adminError && (
                    <div className="bg-red-100 border-red-200 rounded-md border p-3">
                      <p className="text-red-800 text-sm font-medium">
                        연결 오류:
                      </p>
                      <p className="text-red-700 mt-1 text-xs">
                        {configStatus.adminError}
                      </p>
                    </div>
                  )}

                  {/* Setup Instructions */}
                  {(!configStatus.isConfigured || !configStatus.adminTest) && (
                    <div className="bg-yellow-100 border-yellow-200 rounded-md border p-3">
                      <p className="text-yellow-800 text-sm font-medium">
                        설정이 필요합니다:
                      </p>
                      <div className="text-yellow-700 mt-2 space-y-1 text-xs">
                        <p>
                          1. Firebase Console에서 서비스 계정 키를
                          다운로드하세요
                        </p>
                        <p>2. 환경 변수를 설정하세요:</p>
                        <code className="bg-yellow-200 mt-1 block rounded px-2 py-1 text-xs">
                          FIREBASE_PROJECT_ID=your-project-id
                          <br />
                          FIREBASE_CLIENT_EMAIL=your-service-account-email
                          <br />
                          FIREBASE_PRIVATE_KEY=&quot;-----BEGIN PRIVATE
                          KEY-----\nYour Private Key\n-----END PRIVATE
                          KEY-----&quot;
                        </code>
                        <p className="mt-2">
                          3. Vercel에 환경 변수를 추가하고 재배포하세요
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
                    disabled={!configStatus?.adminTest}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || !configStatus?.adminTest}
                  title={
                    !configStatus?.adminTest
                      ? "Firebase 설정이 완료되지 않았습니다"
                      : ""
                  }
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  추가
                </Button>
              </form>
              {!configStatus?.adminTest && (
                <p className="text-red-600 mt-2 text-sm">
                  ⚠️ 관리자 추가를 위해서는 Firebase 설정을 완료해야 합니다.
                </p>
              )}
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
                              {(() => {
                                try {
                                  const date = getDateFromCreatedAt(
                                    admin.createdAt
                                  );

                                  // Check if date is valid
                                  if (
                                    isNaN(date.getTime()) ||
                                    date.getTime() === 0
                                  ) {
                                    return "날짜 정보 없음";
                                  }

                                  return date.toLocaleDateString("ko-KR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  });
                                } catch {
                                  return "날짜 정보 없음";
                                }
                              })()}
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
