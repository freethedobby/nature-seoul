"use client";

import { User as FirebaseUser } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export interface User extends FirebaseUser {
  kycStatus?: "pending" | "approved" | "rejected" | "none";
  treatmentDone?: boolean;
  rejectReason?: string;
  noticeConfirmed?: boolean;
  noticeConfirmedAt?: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdminMode: boolean;
  setIsAdminMode: (mode: boolean) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdminMode: false,
  setIsAdminMode: () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email);

      // Clean up previous Firestore listener if it exists
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (firebaseUser) {
        // Remove: setUser(firebaseUser);
        setLoading(false);

        // Subscribe to Firestore user document for additional data
        const userDoc = doc(db, "users", firebaseUser.uid);
        console.log(
          "Setting up Firestore listener for user:",
          firebaseUser.uid,
          "Document path:",
          `users/${firebaseUser.uid}`
        );

        // Test Firestore connection first
        console.log("Testing Firestore connection...");

        unsubscribeFirestore = onSnapshot(
          userDoc,
          (doc) => {
            console.log("Firestore snapshot received:", doc.exists(), doc.id);
            if (doc.exists()) {
              const userData = doc.data();
              console.log("Firestore user data received:", userData);
              console.log("kycStatus from Firestore:", userData.kycStatus);

              const mergedUser = {
                ...firebaseUser,
                ...userData, // Merge all Firestore fields (including kycStatus, treatmentDone, etc.)
                kycStatus: userData.kycStatus || "none",
                treatmentDone: userData.treatmentDone || false,
                rejectReason: userData.rejectReason || "",
                noticeConfirmed: userData.noticeConfirmed || false,
                noticeConfirmedAt: userData.noticeConfirmedAt || undefined,
              };
              console.log("Merged user object:", mergedUser);
              console.log("Final kycStatus:", mergedUser.kycStatus);
              setUser(mergedUser);
            } else {
              console.log(
                "No Firestore document found for user:",
                firebaseUser.uid,
                "This means the document doesn't exist at users/" +
                  firebaseUser.uid
              );
              // If no Firestore doc, still provide the Auth user with default fields
              setUser({
                ...firebaseUser,
                kycStatus: "none",
                treatmentDone: false,
                rejectReason: "",
                noticeConfirmed: false,
                noticeConfirmedAt: undefined,
              });
            }
          },
          (error) => {
            console.error("Firestore listener error:", error);
            console.error("Error details:", error.message, error.code);
            // Keep the user logged in even if Firestore fails
            setUser({
              ...firebaseUser,
              kycStatus: "none",
              treatmentDone: false,
            });
          }
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  // Check if user is admin when user changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user?.email) {
        try {
          const { checkIsAdmin } = await import("@/lib/admin-client");
          const adminStatus = await checkIsAdmin(user.email);
          setIsAdmin(adminStatus);
          // Reset admin mode if user is no longer admin
          if (!adminStatus) {
            setIsAdminMode(false);
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
          setIsAdminMode(false);
        }
      } else {
        setIsAdmin(false);
        setIsAdminMode(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdminMode, setIsAdminMode, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
