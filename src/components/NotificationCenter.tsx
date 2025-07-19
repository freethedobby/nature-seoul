"use client";

import { useState, useEffect } from "react";
import { Bell, X, CheckCircle, AlertCircle, Clock, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";

interface Notification {
  id: string;
  userId: string;
  type:
    | "kyc_submitted"
    | "kyc_approved"
    | "kyc_rejected"
    | "reservation_created"
    | "reservation_cancelled"
    | "admin_kyc_new";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  data?: Record<string, unknown>;
}

interface NotificationCenterProps {
  variant?: "customer" | "admin";
}

export default function NotificationCenter({
  variant = "customer",
}: NotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let q;
    if (variant === "admin") {
      // Admin notifications - show all KYC submissions and admin-specific notifications
      q = query(
        collection(db, "notifications"),
        where("userId", "==", "admin"),
        orderBy("createdAt", "desc")
      );
    } else if (user?.uid) {
      // Customer notifications - show only user's notifications
      q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
    } else {
      // Guest notifications - show notifications for anonymous users
      q = query(
        collection(db, "notifications"),
        where("userId", "==", "guest"),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notifs.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Notification);
      });

      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    });

    return () => unsubscribe();
  }, [user, variant]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read);
      const updatePromises = unreadNotifications.map((notification) =>
        updateDoc(doc(db, "notifications", notification.id), { read: true })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "kyc_approved":
        return <CheckCircle className="text-green-500 h-5 w-5" />;
      case "kyc_rejected":
        return <AlertCircle className="text-red-500 h-5 w-5" />;
      case "kyc_submitted":
      case "admin_kyc_new":
        return <User className="text-blue-500 h-5 w-5" />;
      case "reservation_created":
        return <CheckCircle className="text-green-500 h-5 w-5" />;
      case "reservation_cancelled":
        return <AlertCircle className="text-orange-500 h-5 w-5" />;
      default:
        return <Clock className="text-gray-500 h-5 w-5" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "방금 전";
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-600 hover:text-gray-900 p-1.5 relative transition-colors"
      >
        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
        {unreadCount > 0 && (
          <span className="bg-red-500 absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-xs text-white sm:h-5 sm:w-5">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="w-72 sm:w-80 shadow-lg border-gray-200 absolute right-0 z-50 mt-2 rounded-lg border bg-white sm:right-0">
          {/* Mobile overlay to prevent screen cutoff */}
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative z-50">
            <div className="border-gray-200 border-b p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-gray-900 text-lg font-semibold">알림</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      모두 읽음
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-gray-500 p-4 text-center">
                  알림이 없습니다
                </div>
              ) : (
                <div className="divide-gray-100 divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`hover:bg-gray-50 cursor-pointer p-4 transition-colors ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-900 text-sm font-medium">
                            {notification.title}
                          </p>
                          <p className="text-gray-600 mt-1 text-sm">
                            {notification.message}
                          </p>
                          <p className="text-gray-400 mt-2 text-xs">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="bg-blue-500 mt-2 h-2 w-2 flex-shrink-0 rounded-full" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
