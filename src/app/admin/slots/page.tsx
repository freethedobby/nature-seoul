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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  query,
} from "firebase/firestore";

interface SlotData {
  id: string;
  start: Date;
  end: Date;
  type: "recurring" | "custom";
  recurrence?: {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    intervalMinutes: number;
  };
  status: "available" | "booked";
  createdBy: string;
  createdAt: Date;
}

export default function SlotManagement() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [slotType, setSlotType] = useState<"recurring" | "custom">("custom");
  const [customSlot, setCustomSlot] = useState({ start: "", end: "" });
  const [recurringSlot, setRecurringSlot] = useState<{
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    intervalMinutes: number;
  }>({ daysOfWeek: [], startTime: "", endTime: "", intervalMinutes: 120 });
  const [isSlotSubmitting, setIsSlotSubmitting] = useState(false);

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
              router.push("/login?redirectTo=/admin/slots");
            }
          } else {
            setIsAuthorized(false);
            router.push("/login?redirectTo=/admin/slots");
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAuthorized(false);
          router.push("/login?redirectTo=/admin/slots");
        }
      } else if (!loading && !user) {
        router.push("/login?redirectTo=/admin/slots");
      }
    };

    checkAdminStatus();
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !isAuthorized) return;

    // Subscribe to slots
    const slotsQuery = query(collection(db, "slots"));

    const unsubSlots = onSnapshot(slotsQuery, (snapshot) => {
      const slotData: SlotData[] = [];
      snapshot.forEach((doc) => {
        slotData.push({ id: doc.id, ...doc.data() } as SlotData);
      });
      slotData.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSlots(slotData);
    });

    return () => {
      unsubSlots();
    };
  }, [user, isAuthorized]);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSlotSubmitting(true);

    try {
      if (slotType === "custom") {
        if (!customSlot.start || !customSlot.end) {
          alert("시작 시간과 종료 시간을 입력해주세요.");
          return;
        }

        const startDate = new Date(customSlot.start);
        const endDate = new Date(customSlot.end);

        if (startDate >= endDate) {
          alert("종료 시간은 시작 시간보다 늦어야 합니다.");
          return;
        }

        await addDoc(collection(db, "slots"), {
          start: Timestamp.fromDate(startDate),
          end: Timestamp.fromDate(endDate),
          type: "custom",
          status: "available",
          createdBy: user?.email,
          createdAt: Timestamp.now(),
        });
      } else {
        if (
          !recurringSlot.startTime ||
          !recurringSlot.endTime ||
          recurringSlot.daysOfWeek.length === 0
        ) {
          alert("모든 필드를 입력해주세요.");
          return;
        }

        await addDoc(collection(db, "slots"), {
          start: Timestamp.now(), // Placeholder for recurring slots
          end: Timestamp.now(), // Placeholder for recurring slots
          type: "recurring",
          recurrence: {
            daysOfWeek: recurringSlot.daysOfWeek,
            startTime: recurringSlot.startTime,
            endTime: recurringSlot.endTime,
            intervalMinutes: recurringSlot.intervalMinutes,
          },
          status: "available",
          createdBy: user?.email,
          createdAt: Timestamp.now(),
        });
      }

      setShowSlotDialog(false);
      setCustomSlot({ start: "", end: "" });
      setRecurringSlot({
        daysOfWeek: [],
        startTime: "",
        endTime: "",
        intervalMinutes: 120,
      });
    } catch (error) {
      console.error("Error creating slot:", error);
    } finally {
      setIsSlotSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await deleteDoc(doc(db, "slots", slotId));
    } catch (error) {
      console.error("Error deleting slot:", error);
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
                예약 슬롯 관리
              </h1>
            </div>
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mt-1 mb-2 h-1 w-16 rounded-full opacity-70"></div>
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
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">슬롯 목록</h2>
            <Button onClick={() => setShowSlotDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />새 슬롯 추가
            </Button>
          </div>

          {slots.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-500">등록된 슬롯이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {slots.map((slot) => (
                <Card key={slot.id}>
                  <CardHeader>
                    <CardTitle>
                      {slot.type === "recurring" ? "정기 슬롯" : "커스텀 슬롯"}
                    </CardTitle>
                    <CardDescription>
                      {slot.type === "custom" ? (
                        <>
                          {new Date(slot.start).toLocaleString()} ~{" "}
                          {new Date(slot.end).toLocaleString()}
                        </>
                      ) : (
                        <>
                          {slot.recurrence?.daysOfWeek
                            .map(
                              (day) =>
                                ["일", "월", "화", "수", "목", "금", "토"][day]
                            )
                            .join(", ")}{" "}
                          {slot.recurrence?.startTime} ~{" "}
                          {slot.recurrence?.endTime}
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge
                      variant={
                        slot.status === "available" ? "default" : "secondary"
                      }
                    >
                      {slot.status === "available" ? "예약 가능" : "예약됨"}
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteSlot(slot.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      삭제
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 슬롯 추가</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSlot} className="space-y-4">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={slotType === "custom" ? "default" : "outline"}
                  onClick={() => setSlotType("custom")}
                >
                  커스텀
                </Button>
                <Button
                  type="button"
                  variant={slotType === "recurring" ? "default" : "outline"}
                  onClick={() => setSlotType("recurring")}
                >
                  정기
                </Button>
              </div>

              {slotType === "custom" ? (
                <div className="space-y-2">
                  <label>시작 시간</label>
                  <Input
                    type="datetime-local"
                    value={customSlot.start}
                    onChange={(e) =>
                      setCustomSlot({
                        ...customSlot,
                        start: e.target.value,
                      })
                    }
                    required
                  />
                  <label>종료 시간</label>
                  <Input
                    type="datetime-local"
                    value={customSlot.end}
                    onChange={(e) =>
                      setCustomSlot({ ...customSlot, end: e.target.value })
                    }
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label>요일 선택 (여러 개 가능)</label>
                  <div className="flex gap-2">
                    {["일", "월", "화", "수", "목", "금", "토"].map(
                      (day, idx) => (
                        <Button
                          key={day}
                          type="button"
                          variant={
                            recurringSlot.daysOfWeek.includes(idx)
                              ? "default"
                              : "outline"
                          }
                          onClick={() =>
                            setRecurringSlot((prev) => ({
                              ...prev,
                              daysOfWeek: prev.daysOfWeek.includes(idx)
                                ? prev.daysOfWeek.filter((d) => d !== idx)
                                : [...prev.daysOfWeek, idx],
                            }))
                          }
                        >
                          {day}
                        </Button>
                      )
                    )}
                  </div>
                  <label>시작 시간 (예: 16:00)</label>
                  <Input
                    type="time"
                    value={recurringSlot.startTime}
                    onChange={(e) =>
                      setRecurringSlot({
                        ...recurringSlot,
                        startTime: e.target.value,
                      })
                    }
                    required
                  />
                  <label>종료 시간 (예: 20:00)</label>
                  <Input
                    type="time"
                    value={recurringSlot.endTime}
                    onChange={(e) =>
                      setRecurringSlot({
                        ...recurringSlot,
                        endTime: e.target.value,
                      })
                    }
                    required
                  />
                  <label>슬롯 간격 (분)</label>
                  <Input
                    type="number"
                    value={recurringSlot.intervalMinutes}
                    onChange={(e) =>
                      setRecurringSlot({
                        ...recurringSlot,
                        intervalMinutes: Number(e.target.value),
                      })
                    }
                    min={15}
                    step={15}
                    required
                  />
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSlotDialog(false)}
                >
                  취소
                </Button>
                <Button type="submit" disabled={isSlotSubmitting}>
                  {isSlotSubmitting ? "저장 중..." : "저장"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
