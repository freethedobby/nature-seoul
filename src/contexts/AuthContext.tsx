"use client";

import { User as FirebaseUser } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export interface User extends FirebaseUser {
  kycStatus?: "pending" | "approved" | "rejected" | "none";
  treatmentDone?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        // Subscribe to Firestore user document
        const userDoc = doc(db, "users", firebaseUser.uid);
        const unsubscribeFirestore = onSnapshot(userDoc, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setUser({
              ...firebaseUser,
              kycStatus: userData.kycStatus || "none",
              treatmentDone: userData.treatmentDone || false,
            });
          } else {
            setUser(firebaseUser);
          }
          setLoading(false);
        });

        return () => {
          unsubscribeFirestore();
        };
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};
