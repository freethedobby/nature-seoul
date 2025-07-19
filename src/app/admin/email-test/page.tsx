"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Send, CheckCircle, XCircle } from "lucide-react";

export default function EmailTestPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [testType, setTestType] = useState("kyc");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Check admin status
  if (!loading && !user) {
    router.push("/login?redirectTo=/admin/email-test");
    return null;
  }

  const handleTestEmail = async () => {
    if (!email.trim()) {
      setResult({ success: false, message: "이메일 주소를 입력해주세요." });
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          testType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `테스트 이메일이 성공적으로 전송되었습니다! (${email})`,
        });
      } else {
        setResult({
          success: false,
          message: `이메일 전송 실패: ${data.error || "알 수 없는 오류"}`,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `네트워크 오류: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/kyc")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          KYC 관리로 돌아가기
        </Button>
        <h1 className="text-3xl font-bold">이메일 테스트</h1>
        <p className="text-gray-600 mt-2">
          KYC 승인/반려 이메일 템플릿을 테스트할 수 있습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>테스트 이메일 전송</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">받는 사람 이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>테스트 이메일 타입</Label>
            <RadioGroup
              value={testType}
              onValueChange={setTestType}
              className="flex flex-row space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="kyc" id="kyc" />
                <Label htmlFor="kyc" className="cursor-pointer">
                  KYC 승인 이메일
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rejection" id="rejection" />
                <Label htmlFor="rejection" className="cursor-pointer">
                  KYC 반려 이메일
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button
            onClick={handleTestEmail}
            disabled={isSending || !email.trim()}
            className="w-full"
          >
            {isSending ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent" />
                전송 중...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                테스트 이메일 전송
              </>
            )}
          </Button>

          {result && (
            <div
              className={`rounded-lg border p-4 ${
                result.success
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-center">
                {result.success ? (
                  <CheckCircle className="mr-2 h-5 w-5" />
                ) : (
                  <XCircle className="mr-2 h-5 w-5" />
                )}
                <span className="font-medium">
                  {result.success ? "성공" : "실패"}
                </span>
              </div>
              <p className="mt-1">{result.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>테스트 방법</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 font-semibold">1. 이메일 주소 입력</h3>
            <p className="text-gray-600">
              테스트할 이메일 주소를 입력하세요. 실제 이메일이 전송됩니다.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">2. 이메일 타입 선택</h3>
            <p className="text-gray-600">
              KYC 승인 또는 반려 이메일 템플릿을 선택하세요.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">3. 전송 및 확인</h3>
            <p className="text-gray-600">
              전송 버튼을 클릭하고 지정된 이메일로 테스트 이메일이 도착하는지
              확인하세요.
            </p>
          </div>
          <div className="bg-yellow-50 border-yellow-200 rounded-lg border p-4">
            <h3 className="text-yellow-800 mb-2 font-semibold">⚠️ 주의사항</h3>
            <p className="text-yellow-700 text-sm">
              • 실제 이메일이 전송되므로 신중하게 테스트하세요.
              <br />
              • 스팸 폴더도 확인해보세요.
              <br />• Gmail 환경변수(EMAIL_USER, EMAIL_PASS)가 설정되어 있어야
              합니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
