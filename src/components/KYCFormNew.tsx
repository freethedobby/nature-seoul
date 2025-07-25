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
import { Loader2, CheckCircle, AlertCircle, ImagePlus, X } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  serverTimestamp,
  setDoc,
  doc as firestoreDoc,
} from "firebase/firestore";

import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { createNotification, notificationTemplates } from "@/lib/notifications";
import AddressSelector from "@/components/AddressSelector";

// 출생년도 생성 (1950년부터 현재까지)
const currentYear = new Date().getFullYear();
const birthYears = Array.from(
  { length: currentYear - 1949 },
  (_, i) => currentYear - i
);

// KYC 스키마
const kycSchema = z.object({
  name: z
    .string()
    .min(1, "이름을 입력해주세요")
    .max(30, "이름은 30자 이하여야 합니다"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "성별을 선택해주세요",
  }),
  birthYear: z.string().min(1, "출생년도를 선택해주세요"),
  contact: z
    .string()
    .min(11, "연락처를 정확히 입력해주세요")
    .max(11, "연락처는 11자리여야 합니다"),
  province: z.string().min(1, "시도를 선택해주세요"),
  district: z.string().min(1, "시군구를 선택해주세요"),
  dong: z.string().min(1, "읍면동을 선택해주세요"),
  detailedAddress: z.string().optional(), // 상세주소는 선택항목
  skinType: z.enum(
    ["oily", "dry", "normal", "combination", "unknown", "other"],
    {
      required_error: "피부타입을 선택해주세요",
    }
  ),
  skinTypeOther: z.string().optional(), // 기타 선택 시 상세 내용
  hasPreviousTreatment: z.enum(["yes", "no"], {
    required_error: "기존 시술 여부를 선택해주세요",
  }),
  eyebrowPhotoLeft: z.instanceof(File).optional(), // 좌측 사진
  eyebrowPhotoFront: z.instanceof(File).optional(), // 정면 사진
  eyebrowPhotoRight: z.instanceof(File).optional(), // 우측 사진
});

type KYCFormData = z.infer<typeof kycSchema>;

interface KYCFormProps {
  onSuccess?: () => void;
}

export default function KYCFormNew({ onSuccess }: KYCFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [previewImages, setPreviewImages] = useState<{
    left: string | null;
    front: string | null;
    right: string | null;
  }>({ left: null, front: null, right: null });
  const [, setSelectedFiles] = useState<{
    left: File | null;
    front: File | null;
    right: File | null;
  }>({ left: null, front: null, right: null });
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    watch,
  } = useForm<KYCFormData>({
    resolver: zodResolver(kycSchema),
  });

  // Watch form values for debugging
  const watchedValues = watch();
  console.log("Form values:", watchedValues);
  console.log("Form errors:", errors);

  // Handle file change for specific photo type
  // 파일 크기 검증 함수 (50MB = 50 * 1024 * 1024 bytes)
  const validateFileSize = (file: File): boolean => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    return file.size <= maxSize;
  };

  const handleFileChange =
    (photoType: "left" | "front" | "right") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // 파일 크기 검증
        if (!validateFileSize(file)) {
          alert("파일 크기가 50MB를 초과합니다. 더 작은 파일을 선택해주세요.");
          event.target.value = ""; // 파일 선택 초기화
          return;
        }

        setSelectedFiles((prev) => ({ ...prev, [photoType]: file }));
        setValue(
          `eyebrowPhoto${
            photoType.charAt(0).toUpperCase() + photoType.slice(1)
          }` as keyof KYCFormData,
          file
        );
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImages((prev) => ({
            ...prev,
            [photoType]: e.target?.result as string,
          }));
        };
        reader.readAsDataURL(file);
      }
    };

  // Handle file drop for specific photo type
  const handleDrop =
    (photoType: "left" | "front" | "right") =>
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) {
        // 파일 크기 검증
        if (!validateFileSize(file)) {
          alert("파일 크기가 50MB를 초과합니다. 더 작은 파일을 선택해주세요.");
          return;
        }

        setSelectedFiles((prev) => ({ ...prev, [photoType]: file }));
        setValue(
          `eyebrowPhoto${
            photoType.charAt(0).toUpperCase() + photoType.slice(1)
          }` as keyof KYCFormData,
          file
        );
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewImages((prev) => ({
            ...prev,
            [photoType]: e.target?.result as string,
          }));
        };
        reader.readAsDataURL(file);
      }
    };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Image compression function
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      img.onload = () => {
        // Calculate new dimensions (max 800px width/height)
        const maxSize = 800;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            } else {
              reject(new Error("이미지 압축에 실패했습니다"));
            }
          },
          "image/jpeg",
          0.8
        );
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Upload image function (now only compresses and returns base64)
  const uploadImage = async (file: File): Promise<string> => {
    try {
      console.log("Compressing image...");
      const compressedImage = await compressImage(file);
      console.log("Image compressed successfully");
      return compressedImage;
    } catch (error) {
      console.error("Image compression failed:", error);
      throw error;
    }
  };

  const onSubmit = async (data: KYCFormData) => {
    if (!user?.uid) {
      setErrorMessage("로그인이 필요합니다.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    // Set timeout for submission
    const timeoutId = setTimeout(() => {
      setIsSubmitting(false);
      setErrorMessage("제출 시간이 초과되었습니다. 다시 시도해주세요.");
    }, 30000); // 30초 타임아웃

    try {
      const userId = user.uid;
      const userEmail = user.email || "";
      const isGuest = !user.email;

      console.log("=== KYC SUBMISSION START ===");
      console.log("User ID:", userId);
      console.log("User Email:", userEmail);
      console.log("Is Guest:", isGuest);

      // Test Firebase connectivity
      console.log("=== TESTING FIREBASE CONNECTIVITY ===");
      console.log("Network status:", navigator.onLine);

      try {
        firestoreDoc(db, "test", "connectivity");
        console.log("✅ Firestore doc reference created successfully");
      } catch (firestoreError) {
        console.error("❌ Firestore doc reference failed:", firestoreError);
        if (!navigator.onLine) {
          throw new Error("인터넷 연결을 확인해주세요.");
        }
        throw new Error("Firestore not accessible");
      }

      console.log("Starting image uploads...");

      // Upload all three images
      const imageUrls: { left: string; front: string; right: string } = {
        left: "",
        front: "",
        right: "",
      };

      const photoTypes = ["left", "front", "right"] as const;

      for (const photoType of photoTypes) {
        const photoKey = `eyebrowPhoto${
          photoType.charAt(0).toUpperCase() + photoType.slice(1)
        }` as keyof KYCFormData;
        const photoFile = data[photoKey] as File;

        if (!photoFile) {
          throw new Error(
            `${
              photoType === "left"
                ? "좌측"
                : photoType === "front"
                ? "정면"
                : "우측"
            } 사진을 업로드해주세요.`
          );
        }

        // 파일 크기 재검증 (제출 시점)
        if (!validateFileSize(photoFile)) {
          throw new Error(
            `${
              photoType === "left"
                ? "좌측"
                : photoType === "front"
                ? "정면"
                : "우측"
            } 사진의 크기가 50MB를 초과합니다. 더 작은 파일을 선택해주세요.`
          );
        }

        try {
          console.log(
            `=== ${photoType.toUpperCase()} IMAGE UPLOAD ATTEMPT ===`
          );
          console.log("File to upload:", photoFile);
          console.log("File type:", photoFile?.type);
          console.log("File size:", photoFile?.size);

          const imageUrl = await uploadImage(photoFile);
          imageUrls[photoType] = imageUrl;
          console.log(
            `${photoType} image processed successfully, URL type:`,
            imageUrl.startsWith("data:") ? "base64" : "firebase-storage"
          );
        } catch (uploadError) {
          console.error(
            `=== ${photoType.toUpperCase()} IMAGE UPLOAD FAILED ===`
          );
          console.error("Upload error:", uploadError);
          console.error("Using fallback to base64...");

          // Fallback: convert to base64
          try {
            const imageUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () =>
                reject(new Error("파일 읽기에 실패했습니다"));
              reader.readAsDataURL(photoFile);
            });
            imageUrls[photoType] = imageUrl;
            console.log(`✅ ${photoType} Base64 fallback successful`);
          } catch (base64Error) {
            console.error(
              `❌ ${photoType} Base64 fallback also failed:`,
              base64Error
            );
            throw new Error(
              `${
                photoType === "left"
                  ? "좌측"
                  : photoType === "front"
                  ? "정면"
                  : "우측"
              } 사진 처리에 실패했습니다. 파일 형식을 확인해주세요.`
            );
          }
        }
      }

      // Save to Firestore in users collection
      const userData = {
        userId: userId,
        email: userEmail,
        name: data.name,
        gender: data.gender,
        birthYear: data.birthYear,
        contact: data.contact,
        province: data.province,
        district: data.district,
        dong: data.dong,
        detailedAddress: data.detailedAddress || "",
        skinType: data.skinType,
        skinTypeOther: data.skinTypeOther || "",
        photoURLs: {
          left: imageUrls.left,
          front: imageUrls.front,
          right: imageUrls.right,
        },
        photoType: imageUrls.left.startsWith("data:")
          ? "base64"
          : "firebase-storage",
        kycStatus: "pending",
        hasPreviousTreatment: data.hasPreviousTreatment === "yes",
        createdAt: serverTimestamp(),
        submittedAt: serverTimestamp(),
        isGuest: isGuest,
      };

      console.log("Saving user data to Firestore...");
      console.log("User data to save:", userData);
      console.log("Document path: users/", userId);

      try {
        await setDoc(firestoreDoc(db, "users", userId), userData, {
          merge: true,
        });
        console.log("✅ User data saved successfully with UID as doc ID");
        console.log("Document ID:", userId);
        console.log("KYC Status: pending");
      } catch (firestoreError) {
        console.error("❌ Firestore save failed:", firestoreError);
        throw firestoreError;
      }

      console.log("Setting final success status");
      clearTimeout(timeoutId);
      setSubmitStatus("success");
      setIsSubmitting(false);
      reset();
      setPreviewImages({ left: null, front: null, right: null });
      setSelectedFiles({ left: null, front: null, right: null });

      // Create notifications
      try {
        // Create customer notification
        await createNotification({
          userId: userId,
          type: "kyc_submitted",
          title: "KYC 신청 완료",
          message:
            "KYC 신청이 성공적으로 제출되었습니다. 검토 후 연락드리겠습니다.",
        });

        // Create admin notification for all admins
        const adminNotification = notificationTemplates.adminKycNew(
          data.name,
          userEmail
        );
        await createNotification({
          userId: "admin", // Special ID for admin notifications
          type: "admin_kyc_new",
          title: adminNotification.title,
          message: adminNotification.message,
          data: {
            customerName: data.name,
            customerEmail: userEmail,
            customerId: userId,
          },
        });
      } catch (notificationError) {
        console.error("Error creating notifications:", notificationError);
        // Don't fail the form submission if notifications fail
      }

      onSuccess?.();
    } catch (error) {
      console.error("=== KYC SUBMISSION ERROR ===");
      console.error("Error:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        user: user.email,
        formData: data,
      });

      // Set specific error message
      const errorMsg =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다. 다시 시도해주세요.";

      clearTimeout(timeoutId);
      setErrorMessage(errorMsg);
      setSubmitStatus("error");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-2 sm:p-4">
      <Card className="shadow-lg">
        <CardHeader className="pb-2 pt-4 text-center">
          <CardTitle className="text-gray-800 text-xl font-bold sm:text-2xl">
            고객등록 신청서
          </CardTitle>
          <p className="text-gray-600 sm:text-base text-sm">
            정확한 정보를 입력해주시면 빠른 상담이 가능합니다.
          </p>
        </CardHeader>

        <CardContent className="pt-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Privacy Consent */}
            <div className="border-blue-300 shadow-sm rounded-lg border-2 bg-white p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <CheckCircle className="text-blue-600 h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-gray-900 sm:text-base mb-2 text-sm font-bold">
                    개인정보 동의서
                  </h3>
                  <p className="text-gray-900 text-xs leading-relaxed sm:text-sm">
                    본 고객등록 신청서에 기입해주신 정보는 당사의{" "}
                    <strong>고객 관리 및 내부 운영 목적</strong>으로만
                    사용됩니다. 제출해주신 정보는 관련 법령에 따라{" "}
                    <strong>3년</strong>간 안전하게 보관되며, 보관 기간이 만료된
                    후에는 즉시 폐기됩니다. 본인은 이에 동의하며, 제출한 정보가
                    내부 관리 목적 외에는 사용되지 않음을 확인합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-gray-50 border-gray-200 rounded-lg border p-4 sm:p-6">
              <h3 className="text-gray-800 text-base mb-4 flex items-center font-semibold sm:text-lg">
                <div className="bg-gray-200 mr-2 rounded-full p-1">
                  <CheckCircle className="text-gray-600 h-4 w-4" />
                </div>
                기본 정보
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-gray-800 text-xs font-semibold uppercase tracking-wide sm:text-sm"
                  >
                    이름 *
                  </Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="이름을 입력하세요"
                    className={cn(
                      "border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full rounded-lg border bg-white px-3 py-2 text-xs transition-colors duration-200 focus:outline-none focus:ring-2 sm:text-sm",
                      errors.name &&
                        "border-red-500 focus:border-red-500 focus:ring-red-200"
                    )}
                  />
                  {errors.name && (
                    <p className="text-red-500 bg-red-50 border-red-200 rounded border p-2 text-xs sm:text-sm">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label className="text-gray-800 text-xs font-semibold uppercase tracking-wide sm:text-sm">
                    성별 *
                  </Label>
                  <RadioGroup
                    onValueChange={(value) =>
                      setValue("gender", value as "male" | "female" | "other")
                    }
                    className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0"
                  >
                    <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="text-xs sm:text-sm">
                        남성
                      </Label>
                    </div>
                    <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="text-xs sm:text-sm">
                        여성
                      </Label>
                    </div>
                    <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other" className="text-xs sm:text-sm">
                        기타
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.gender && (
                    <p className="text-red-500 bg-red-50 border-red-200 rounded border p-2 text-sm">
                      {errors.gender.message}
                    </p>
                  )}
                </div>

                {/* Birth Year */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="birthYear"
                      className="text-gray-800 text-xs font-semibold uppercase tracking-wide sm:text-sm"
                    >
                      출생년도 *
                    </Label>
                    <button
                      type="button"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-300 flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold transition-colors duration-200"
                      onClick={() => alert("미성년자 작업 불가")}
                      title="미성년자 작업 불가"
                    >
                      ?
                    </button>
                  </div>
                  <select
                    id="birthYear"
                    {...register("birthYear")}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full rounded-lg border bg-white px-3 py-2 text-xs transition-colors duration-200 focus:outline-none focus:ring-2 sm:text-sm"
                  >
                    <option value="">출생년도를 선택하세요</option>
                    {birthYears.map((year) => (
                      <option key={year} value={year.toString()}>
                        {year}년
                      </option>
                    ))}
                  </select>
                  {errors.birthYear && (
                    <p className="text-red-500 bg-red-50 border-red-200 rounded border p-2 text-xs sm:text-sm">
                      {errors.birthYear.message}
                    </p>
                  )}
                </div>

                {/* Contact */}
                <div className="space-y-2">
                  <Label
                    htmlFor="contact"
                    className="text-gray-800 text-xs font-semibold uppercase tracking-wide sm:text-sm"
                  >
                    연락처 *
                  </Label>
                  <Input
                    id="contact"
                    {...register("contact")}
                    placeholder="연락처를 입력하세요 (예: 01012345678)"
                    maxLength={11}
                    className={cn(
                      "border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full rounded-lg border bg-white px-3 py-2 text-xs transition-colors duration-200 focus:outline-none focus:ring-2 sm:text-sm",
                      errors.contact &&
                        "border-red-500 focus:border-red-500 focus:ring-red-200"
                    )}
                    onChange={(e) => {
                      // 숫자만 입력 허용
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      e.target.value = value;
                      setValue("contact", value);
                    }}
                  />
                  <p className="text-gray-500 text-xs sm:text-sm">
                    숫자만 입력하세요
                  </p>
                  {errors.contact && (
                    <p className="text-red-500 bg-red-50 border-red-200 rounded border p-2 text-xs sm:text-sm">
                      {errors.contact.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-gray-50 border-gray-200 rounded-lg border p-4 sm:p-6">
              <h3 className="text-gray-800 text-base mb-4 flex items-center font-semibold sm:text-lg">
                <div className="bg-gray-200 mr-2 rounded-full p-1">
                  <CheckCircle className="text-gray-600 h-4 w-4" />
                </div>
                주소 정보
              </h3>

              <div className="space-y-4">
                {/* Address Selector */}
                <AddressSelector
                  value={{
                    province: watch("province") || "",
                    district: watch("district") || "",
                    dong: watch("dong") || "",
                  }}
                  onChange={(address) => {
                    setValue("province", address.province);
                    setValue("district", address.district);
                    setValue("dong", address.dong);
                  }}
                  error={
                    errors.province?.message ||
                    errors.district?.message ||
                    errors.dong?.message
                  }
                />
              </div>

              {/* Detailed Address */}
              <div className="mt-4 space-y-2">
                <Label
                  htmlFor="detailedAddress"
                  className="text-gray-800 text-sm font-semibold uppercase tracking-wide"
                >
                  상세주소
                </Label>
                <Input
                  id="detailedAddress"
                  {...register("detailedAddress")}
                  placeholder="상세주소를 입력하세요 (선택사항)"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors duration-200 focus:outline-none focus:ring-2"
                />
              </div>
            </div>

            {/* Skin Type and Previous Treatment */}
            <div className="bg-gray-50 border-gray-200 rounded-lg border p-4 sm:p-6">
              <h3 className="text-gray-800 text-base mb-4 flex items-center font-semibold sm:text-lg">
                <div className="bg-gray-200 mr-2 rounded-full p-1">
                  <CheckCircle className="text-gray-600 h-4 w-4" />
                </div>
                시술 관련 정보
              </h3>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Skin Type */}
                <div className="space-y-2">
                  <Label className="text-gray-800 text-xs font-semibold uppercase tracking-wide sm:text-sm">
                    피부타입 *
                  </Label>
                  <RadioGroup
                    onValueChange={(value) =>
                      setValue(
                        "skinType",
                        value as
                          | "oily"
                          | "dry"
                          | "normal"
                          | "combination"
                          | "unknown"
                          | "other"
                      )
                    }
                    className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                  >
                    <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                      <RadioGroupItem value="oily" id="oily" />
                      <Label htmlFor="oily" className="text-xs sm:text-sm">
                        지성
                      </Label>
                    </div>
                    <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                      <RadioGroupItem value="dry" id="dry" />
                      <Label htmlFor="dry" className="text-xs sm:text-sm">
                        건성
                      </Label>
                    </div>
                    <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                      <RadioGroupItem value="normal" id="normal" />
                      <Label htmlFor="normal" className="text-xs sm:text-sm">
                        중성
                      </Label>
                    </div>
                    <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                      <RadioGroupItem value="combination" id="combination" />
                      <Label
                        htmlFor="combination"
                        className="text-xs sm:text-sm"
                      >
                        복합성
                      </Label>
                    </div>
                    <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                      <RadioGroupItem value="unknown" id="unknown" />
                      <Label htmlFor="unknown" className="text-xs sm:text-sm">
                        모르겠음
                      </Label>
                    </div>
                    <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                      <RadioGroupItem value="other" id="other-skin" />
                      <Label
                        htmlFor="other-skin"
                        className="text-xs sm:text-sm"
                      >
                        기타
                      </Label>
                    </div>
                  </RadioGroup>
                  {watch("skinType") === "other" && (
                    <div className="space-y-3">
                      <div className="bg-gray-50 text-gray-700 border-gray-200 rounded-lg border p-3 text-xs sm:text-sm">
                        <p className="font-medium">
                          특이 체질이 있으시다면 기타에 적어주세요
                        </p>
                        <p className="text-gray-600">
                          예) 켈로이드, 피부염, 아토피 등
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="skinTypeOther"
                          className="text-gray-700 text-xs font-medium sm:text-sm"
                        >
                          상세 내용
                        </Label>
                        <textarea
                          id="skinTypeOther"
                          {...register("skinTypeOther")}
                          placeholder="특이 체질이나 피부 상태를 자세히 적어주세요"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-200 min-h-[80px] w-full resize-none rounded-lg border bg-white px-3 py-2 text-xs transition-colors duration-200 focus:outline-none focus:ring-2 sm:text-sm"
                        />
                      </div>
                    </div>
                  )}
                  {errors.skinType && (
                    <p className="text-red-500 bg-red-50 border-red-200 rounded border p-2 text-xs sm:text-sm">
                      {errors.skinType.message}
                    </p>
                  )}
                </div>

                {/* Previous Treatment */}
                <div className="space-y-2">
                  <Label className="text-gray-800 text-sm font-semibold uppercase tracking-wide">
                    기존 시술 여부 *
                  </Label>
                  <RadioGroup
                    onValueChange={(value) =>
                      setValue("hasPreviousTreatment", value as "yes" | "no")
                    }
                    className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0"
                  >
                    <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                      <RadioGroupItem value="yes" id="yes" />
                      <Label htmlFor="yes" className="text-sm">
                        있음
                      </Label>
                    </div>
                    <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                      <RadioGroupItem value="no" id="no" />
                      <Label htmlFor="no" className="text-sm">
                        없음
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.hasPreviousTreatment && (
                    <p className="text-red-500 bg-red-50 border-red-200 rounded border p-2 text-sm">
                      {errors.hasPreviousTreatment.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="bg-gray-50 border-gray-200 rounded-lg border p-4 sm:p-6">
              <h3 className="text-gray-800 mb-4 flex items-center text-lg font-semibold">
                <div className="bg-gray-200 mr-2 rounded-full p-1">
                  <ImagePlus className="text-gray-600 h-4 w-4" />
                </div>
                현재 눈썹 사진 *
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                좌측, 정면, 우측 사진을 각각 업로드해주세요. (JPG, PNG, 최대
                50MB)
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Left Photo */}
                <div className="space-y-2">
                  <Label className="text-gray-800 text-sm font-semibold uppercase tracking-wide">
                    좌측 사진 *
                  </Label>
                  <label
                    htmlFor="left-photo"
                    className={cn(
                      "h-32 block w-full cursor-pointer rounded-lg border-2 border-dashed transition-colors duration-200",
                      isDragging
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400",
                      previewImages.left && "border-green-400 bg-green-50"
                    )}
                    onDrop={handleDrop("left")}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <div className="flex h-full flex-col items-center justify-center">
                      {previewImages.left ? (
                        <div className="relative h-full w-full">
                          <Image
                            src={previewImages.left}
                            alt="Left eyebrow preview"
                            fill
                            className="rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setPreviewImages((prev) => ({
                                ...prev,
                                left: null,
                              }));
                              setValue("eyebrowPhotoLeft", undefined);
                            }}
                            className="bg-red-500 hover:bg-red-600 absolute top-1 right-1 rounded-full p-1 text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <ImagePlus className="text-gray-400 mb-2 h-8 w-8" />
                          <p className="text-gray-500 text-sm">
                            클릭하여 업로드
                          </p>
                        </>
                      )}
                    </div>
                  </label>
                  <input
                    id="left-photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange("left")}
                    className="hidden"
                  />
                </div>

                {/* Front Photo */}
                <div className="space-y-2">
                  <Label className="text-gray-800 text-sm font-semibold uppercase tracking-wide">
                    정면 사진 *
                  </Label>
                  <label
                    htmlFor="front-photo"
                    className={cn(
                      "h-32 block w-full cursor-pointer rounded-lg border-2 border-dashed transition-colors duration-200",
                      isDragging
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400",
                      previewImages.front && "border-green-400 bg-green-50"
                    )}
                    onDrop={handleDrop("front")}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <div className="flex h-full flex-col items-center justify-center">
                      {previewImages.front ? (
                        <div className="relative h-full w-full">
                          <Image
                            src={previewImages.front}
                            alt="Front eyebrow preview"
                            fill
                            className="rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setPreviewImages((prev) => ({
                                ...prev,
                                front: null,
                              }));
                              setValue("eyebrowPhotoFront", undefined);
                            }}
                            className="bg-red-500 hover:bg-red-600 absolute top-1 right-1 rounded-full p-1 text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <ImagePlus className="text-gray-400 mb-2 h-8 w-8" />
                          <p className="text-gray-500 text-sm">
                            클릭하여 업로드
                          </p>
                        </>
                      )}
                    </div>
                  </label>
                  <input
                    id="front-photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange("front")}
                    className="hidden"
                  />
                </div>

                {/* Right Photo */}
                <div className="space-y-2">
                  <Label className="text-gray-800 text-sm font-semibold uppercase tracking-wide">
                    우측 사진 *
                  </Label>
                  <label
                    htmlFor="right-photo"
                    className={cn(
                      "h-32 block w-full cursor-pointer rounded-lg border-2 border-dashed transition-colors duration-200",
                      isDragging
                        ? "border-blue-400 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400",
                      previewImages.right && "border-green-400 bg-green-50"
                    )}
                    onDrop={handleDrop("right")}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <div className="flex h-full flex-col items-center justify-center">
                      {previewImages.right ? (
                        <div className="relative h-full w-full">
                          <Image
                            src={previewImages.right}
                            alt="Right eyebrow preview"
                            fill
                            className="rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setPreviewImages((prev) => ({
                                ...prev,
                                right: null,
                              }));
                              setValue("eyebrowPhotoRight", undefined);
                            }}
                            className="bg-red-500 hover:bg-red-600 absolute top-1 right-1 rounded-full p-1 text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <ImagePlus className="text-gray-400 mb-2 h-8 w-8" />
                          <p className="text-gray-500 text-sm">
                            클릭하여 업로드
                          </p>
                        </>
                      )}
                    </div>
                  </label>
                  <input
                    id="right-photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange("right")}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gray-900 hover:bg-gray-800 w-full rounded-lg px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    제출중...
                  </>
                ) : (
                  "신청서 제출하기"
                )}
              </Button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border-red-200 rounded-lg border p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="text-red-600 h-5 w-5" />
                  <p className="text-red-700">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {submitStatus === "success" && (
              <div className="bg-green-50 border-green-200 rounded-lg border p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-600 h-5 w-5" />
                  <p className="text-green-700">
                    신청서가 성공적으로 제출되었습니다! 검토 후
                    연락드리겠습니다.
                  </p>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
