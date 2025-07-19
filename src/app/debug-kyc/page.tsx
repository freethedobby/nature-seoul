"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugKYCPage() {
  const { user } = useAuth();
  const [debugData, setDebugData] = useState<{
    userExists?: boolean;
    userData?: Record<string, unknown>;
    userId?: string;
    userEmail?: string;
    totalUsers?: number;
    allUsers?: Record<string, unknown>[];
    pendingKYC?: number;
    apiDebug?: Record<string, unknown>;
    testSubmission?: Record<string, unknown>;
    formTest?: Record<string, unknown>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkKYCData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if user exists in Firestore
      if (user?.uid) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        console.log("User document exists:", userDoc.exists());
        console.log("User document data:", userDoc.data());

        if (userDoc.exists()) {
          setDebugData({
            userExists: true,
            userData: userDoc.data(),
            userId: user.uid,
            userEmail: user.email || undefined,
          });
        } else {
          setDebugData({
            userExists: false,
            userId: user.uid,
            userEmail: user.email || undefined,
          });
        }
      }

      // Check all users in collection
      const usersSnapshot = await getDocs(collection(db, "users"));
      const allUsers = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setDebugData((prev) => ({
        ...prev,
        totalUsers: allUsers.length,
        allUsers: allUsers.slice(0, 5), // Show first 5 users
        pendingKYC: allUsers.filter(
          (u) => (u as Record<string, unknown>).kycStatus === "pending"
        ).length,
      }));
    } catch (err) {
      console.error("Debug error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const testAPIDebug = async () => {
    try {
      const response = await fetch("/api/debug/kyc-test");
      const data = await response.json();
      console.log("API Debug response:", data);
      setDebugData((prev) => ({
        ...prev,
        apiDebug: data,
      }));
    } catch (err) {
      console.error("API Debug error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const testKYCSubmission = async () => {
    try {
      const response = await fetch("/api/test-kyc-submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user?.email || "test@example.com",
          name: "Test User",
          contact: "010-1234-5678",
        }),
      });
      const data = await response.json();
      console.log("Test KYC submission response:", data);
      setDebugData((prev) => ({
        ...prev,
        testSubmission: data,
      }));

      // Refresh the data after test submission
      setTimeout(() => {
        checkKYCData();
      }, 1000);
    } catch (err) {
      console.error("Test KYC submission error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const testFormSubmission = async () => {
    try {
      const testFormData = {
        name: "Test User",
        contact: "01012345678",
        hasPreviousTreatment: "no",
        eyebrowPhoto: "test-file-data",
      };

      const response = await fetch("/api/test-form-submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testFormData),
      });
      const data = await response.json();
      console.log("Form submission test response:", data);
      setDebugData((prev) => ({
        ...prev,
        formTest: data,
      }));
    } catch (err) {
      console.error("Form submission test error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  useEffect(() => {
    if (user) {
      checkKYCData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div className="bg-gray-50 min-h-screen p-4">
        <Card className="mx-auto max-w-2xl">
          <CardContent className="pt-6">
            <p>Please log in to debug KYC data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="mx-auto max-w-4xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>KYC Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={checkKYCData} disabled={loading}>
                {loading ? "Loading..." : "Refresh KYC Data"}
              </Button>
              <Button onClick={testAPIDebug} variant="outline">
                Test API Debug
              </Button>
              <Button
                onClick={testKYCSubmission}
                variant="outline"
                className="bg-green-100 text-green-700 hover:bg-green-200"
              >
                Test KYC Submission
              </Button>
              <Button
                onClick={testFormSubmission}
                variant="outline"
                className="bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                Test Form API
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 border-red-200 rounded-md border p-4">
                <p className="text-red-800">Error: {error}</p>
              </div>
            )}

            {debugData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="bg-blue-50 rounded-md p-4">
                    <h3 className="font-semibold">User Status</h3>
                    <p>Exists: {debugData.userExists ? "✅ Yes" : "❌ No"}</p>
                    <p>Email: {debugData.userEmail}</p>
                    <p>UID: {debugData.userId}</p>
                  </div>

                  <div className="bg-green-50 rounded-md p-4">
                    <h3 className="font-semibold">Collection Stats</h3>
                    <p>Total Users: {debugData.totalUsers}</p>
                    <p>Pending KYC: {debugData.pendingKYC}</p>
                  </div>

                  <div className="bg-yellow-50 rounded-md p-4">
                    <h3 className="font-semibold">Firebase Config</h3>
                    <p>
                      API Key:{" "}
                      {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅" : "❌"}
                    </p>
                    <p>
                      Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}
                    </p>
                  </div>
                </div>

                {debugData.userData && (
                  <div className="bg-gray-50 rounded-md p-4">
                    <h3 className="mb-2 font-semibold">Current User Data</h3>
                    <pre className="overflow-auto text-sm">
                      {JSON.stringify(debugData.userData, null, 2)}
                    </pre>
                  </div>
                )}

                {debugData.allUsers && debugData.allUsers.length > 0 && (
                  <div className="bg-gray-50 rounded-md p-4">
                    <h3 className="mb-2 font-semibold">
                      Recent Users (First 5)
                    </h3>
                    <pre className="overflow-auto text-sm">
                      {JSON.stringify(debugData.allUsers, null, 2)}
                    </pre>
                  </div>
                )}

                {debugData.apiDebug && (
                  <div className="bg-purple-50 rounded-md p-4">
                    <h3 className="mb-2 font-semibold">API Debug Response</h3>
                    <pre className="overflow-auto text-sm">
                      {JSON.stringify(debugData.apiDebug, null, 2)}
                    </pre>
                  </div>
                )}

                {debugData.testSubmission && (
                  <div className="bg-green-50 rounded-md p-4">
                    <h3 className="mb-2 font-semibold">
                      Test KYC Submission Result
                    </h3>
                    <pre className="overflow-auto text-sm">
                      {JSON.stringify(debugData.testSubmission, null, 2)}
                    </pre>
                  </div>
                )}

                {debugData.formTest && (
                  <div className="bg-blue-50 rounded-md p-4">
                    <h3 className="mb-2 font-semibold">Form API Test Result</h3>
                    <pre className="overflow-auto text-sm">
                      {JSON.stringify(debugData.formTest, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
