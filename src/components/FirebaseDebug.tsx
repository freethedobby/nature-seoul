"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function FirebaseDebug() {
  const [status, setStatus] = useState<string>("Testing...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function testFirebase() {
      try {
        setStatus("Testing Firebase connection...");

        // Test if db is available
        if (!db) {
          setError("Firebase db is not available");
          return;
        }

        setStatus("Testing Firestore query...");

        // Try to query the users collection
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);

        setStatus(`✅ Firebase working! Found ${snapshot.size} users`);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(`❌ Firebase error: ${errorMessage}`);
        console.error("Firebase test error:", err);
      }
    }

    testFirebase();
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return null; // Only show in development
  }

  return (
    <div className="shadow-lg fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold">Firebase Debug</h3>
      <p className="mb-2 text-xs">{status}</p>
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <div className="text-gray-500 mt-2 text-xs">
        <p>API Key: {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅" : "❌"}</p>
        <p>
          Project ID:{" "}
          {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅" : "❌"}
        </p>
        <p>
          Auth Domain:{" "}
          {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅" : "❌"}
        </p>
      </div>
    </div>
  );
}
