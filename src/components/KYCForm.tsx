"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/contexts/AuthContext";

// Form validation schema
const kycSchema = z.object({
  name: z.string().min(2, "이름은 2글자 이상 입력해주세요"),
  contact: z.string().min(10, "연락처를 정확히 입력해주세요"),
  hasPreviousTreatment: z.enum(["yes", "no"], {
    required_error: "기존 시술 여부를 선택해주세요",
  }),
  eyebrowPhoto: z
    .instanceof(File)
    .refine((file) => file instanceof File, "눈썹 사진을 업로드해주세요"),
});

type KYCFormData = z.infer<typeof kycSchema>;

interface KYCFormProps {
  onSuccess?: () => void;
}

export default function KYCForm({ onSuccess }: KYCFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<KYCFormData>({
    resolver: zodResolver(kycSchema),
  });

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setValue("eyebrowPhoto", file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Firebase Storage
  const uploadImage = async (file: File): Promise<string> => {
    if (!user) throw new Error("User not authenticated");

    const timestamp = Date.now();
    const fileName = `kyc/${user.uid}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  };

  // Submit form
  const onSubmit = async (data: KYCFormData) => {
    if (!user) {
      setSubmitStatus("error");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Check if Firebase is properly configured
      if (!db || !storage) {
        // Development mode - just show success
        console.log("Development mode - KYC form data:", {
          name: data.name,
          contact: data.contact,
          hasPreviousTreatment: data.hasPreviousTreatment === "yes",
          photoFileName: data.eyebrowPhoto.name,
        });

        setSubmitStatus("success");
        reset();
        setPreviewImage(null);
        onSuccess?.();
        return;
      }

      // Upload image
      const imageUrl = await uploadImage(data.eyebrowPhoto);

      // Save to Firestore
      await addDoc(collection(db, "kyc_applications"), {
        userId: user.uid,
        userEmail: user.email,
        name: data.name,
        contact: data.contact,
        hasPreviousTreatment: data.hasPreviousTreatment === "yes",
        eyebrowPhotoUrl: imageUrl,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setSubmitStatus("success");
      reset();
      setPreviewImage(null);
      onSuccess?.();
    } catch (error) {
      console.error("KYC submission error:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === "success") {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            <CheckCircle className="text-green-500 mx-auto h-16 w-16" />
            <h3 className="text-gray-900 text-xl font-semibold">신청 완료!</h3>
            <p className="text-gray-600">
              KYC 신청이 성공적으로 제출되었습니다.
              <br />
              검토 후 연락드리겠습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-xl font-light">
          상담 신청서
        </CardTitle>
        <p className="text-gray-600 text-center text-sm">
          맞춤 상담을 위한 정보를 입력해주세요
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              이름 *
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="이름을 입력해주세요"
              className="text-base h-12"
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          {/* Contact Input */}
          <div className="space-y-2">
            <Label htmlFor="contact" className="text-sm font-medium">
              연락처 *
            </Label>
            <Input
              id="contact"
              {...register("contact")}
              placeholder="전화번호 또는 이메일"
              className="text-base h-12"
            />
            {errors.contact && (
              <p className="text-red-500 text-sm">{errors.contact.message}</p>
            )}
          </div>

          {/* Previous Treatment Radio */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              기존 눈썹 시술 경험이 있으신가요? *
            </Label>
            <RadioGroup
              onValueChange={(value) =>
                setValue("hasPreviousTreatment", value as "yes" | "no")
              }
              className="flex flex-row space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes" className="text-base cursor-pointer">
                  예
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no" className="text-base cursor-pointer">
                  아니오
                </Label>
              </div>
            </RadioGroup>
            {errors.hasPreviousTreatment && (
              <p className="text-red-500 text-sm">
                {errors.hasPreviousTreatment.message}
              </p>
            )}
          </div>

          {/* Photo Upload */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">현재 눈썹 사진 *</Label>

            {previewImage ? (
              <div className="space-y-3">
                <div className="relative">
                  <img
                    src={previewImage}
                    alt="눈썹 미리보기"
                    className="h-48 w-full rounded-lg border object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setPreviewImage(null);
                      setValue("eyebrowPhoto", undefined as unknown as File);
                    }}
                  >
                    변경
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Camera Capture */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="camera-input"
                  />
                  <Label
                    htmlFor="camera-input"
                    className="border-gray-300 hover:border-gray-400 flex h-12 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors"
                  >
                    <Camera className="mr-2 h-5 w-5" />
                    <span className="text-base">카메라로 촬영</span>
                  </Label>
                </div>

                {/* File Upload */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                  />
                  <Label
                    htmlFor="file-input"
                    className="border-gray-300 hover:border-gray-400 flex h-12 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    <span className="text-base">갤러리에서 선택</span>
                  </Label>
                </div>
              </div>
            )}

            {errors.eyebrowPhoto && (
              <p className="text-red-500 text-sm">
                {errors.eyebrowPhoto.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-gray-900 via-black to-gray-900 hover:from-gray-800 hover:via-gray-900 hover:to-gray-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 group relative h-14 w-full transform text-lg font-medium text-white transition-all duration-300 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="bg-gradient-to-r absolute inset-0 from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <div className="relative flex items-center justify-center">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-3 h-6 w-6" />
                  <span>제출 중...</span>
                </>
              ) : (
                <>
                  <div className="p-1.5 mr-3 rounded-lg bg-white/10 transition-colors duration-300 group-hover:bg-white/20">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </div>
                  <span>상담 신청하기</span>
                </>
              )}
            </div>
          </Button>

          {submitStatus === "error" && (
            <div className="text-red-600 bg-red-50 flex items-center space-x-2 rounded-lg p-3">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">
                신청 중 오류가 발생했습니다. 다시 시도해주세요.
              </span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
