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
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

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

    const adminsQuery = query(
      collection(db, "admins"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(adminsQuery, (snapshot) => {
      const adminUsers: AdminUser[] = [];
      snapshot.forEach((doc) => {
        adminUsers.push({ id: doc.id, ...doc.data() } as AdminUser);
      });
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

        <div className="space-y-4">
          {admins.map((admin) => (
            <Card key={admin.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{admin.email}</CardTitle>
                    <CardDescription>
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={admin.isActive ? "default" : "secondary"}
                      className={admin.isActive ? "bg-green-100" : ""}
                    >
                      {admin.isActive ? "활성" : "비활성"}
                    </Badge>
                    {admin.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleRemoveAdmin(admin.email)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
