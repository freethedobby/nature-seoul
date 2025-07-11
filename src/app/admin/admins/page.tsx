"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2 } from "lucide-react";
import { db, isAdmin, addAdmin, removeAdmin } from "@/lib/firebase";
import { collection, query, onSnapshot } from "firebase/firestore";

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
        const adminStatus = await isAdmin(user.email);
        setIsAuthorized(adminStatus);
        if (!adminStatus) {
          router.push("/");
        }
      } else if (!loading && !user) {
        router.push("/");
      }
    };

    checkAdminStatus();
  }, [user, loading, router]);

  useEffect(() => {
    if (!isAuthorized) return;

    const adminsQuery = query(collection(db, "admins"));

    const unsubscribe = onSnapshot(adminsQuery, (snapshot) => {
      const adminUsers: AdminUser[] = [];
      snapshot.forEach((doc) => {
        adminUsers.push({ id: doc.id, ...doc.data() } as AdminUser);
      });
      // Sort client-side to avoid composite index requirement
      adminUsers.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setAdmins(adminUsers);
    });

    return () => unsubscribe();
  }, [isAuthorized]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    setIsSubmitting(true);
    try {
      await addAdmin(newAdminEmail);
      setNewAdminEmail("");
    } catch (error) {
      console.error("Error adding admin:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    try {
      await removeAdmin(email);
    } catch (error) {
      console.error("Error removing admin:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="animate-spin border-black h-8 w-8 rounded-full border-b-2"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold">관리자 관리</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>새 관리자 추가</CardTitle>
            <CardDescription>
              새로운 관리자의 이메일 주소를 입력하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAdmin} className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="email" className="sr-only">
                  이메일
                </Label>
                <Input
                  id="email"
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
                      {admin.isActive && admin.email !== user?.email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveAdmin(admin.email)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
  );
}
