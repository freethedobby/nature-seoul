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

// 서울시 시군구 데이터
const districts = [
  { value: "gangnam", label: "강남구" },
  { value: "gangdong", label: "강동구" },
  { value: "gangbuk", label: "강북구" },
  { value: "gangseo", label: "강서구" },
  { value: "gwanak", label: "관악구" },
  { value: "gwangjin", label: "광진구" },
  { value: "guro", label: "구로구" },
  { value: "geumcheon", label: "금천구" },
  { value: "nowon", label: "노원구" },
  { value: "dobong", label: "도봉구" },
  { value: "dongdaemun", label: "동대문구" },
  { value: "dongjak", label: "동작구" },
  { value: "mapo", label: "마포구" },
  { value: "seodaemun", label: "서대문구" },
  { value: "seocho", label: "서초구" },
  { value: "seongbuk", label: "성북구" },
  { value: "songpa", label: "송파구" },
  { value: "yangcheon", label: "양천구" },
  { value: "yeongdeungpo", label: "영등포구" },
  { value: "yongsan", label: "용산구" },
  { value: "eunpyeong", label: "은평구" },
  { value: "jongno", label: "종로구" },
  { value: "junggu", label: "중구" },
  { value: "jungnang", label: "중랑구" },
];

// Form validation schema
const kycSchema = z.object({
  name: z
    .string()
    .min(2, "이름은 2글자 이상 입력해주세요")
    .max(30, "이름은 30자 이하로 입력해주세요"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "성별을 선택해주세요",
  }),
  birthYear: z.string().min(4, "출생년도를 선택해주세요"),
  contact: z
    .string()
    .length(11, "연락처는 11자리로 입력해주세요")
    .regex(/^[0-9]+$/, "숫자만 입력해주세요"),
  district: z.enum(
    [
      "gangnam",
      "gangdong",
      "gangbuk",
      "gangseo",
      "gwanak",
      "gwangjin",
      "guro",
      "geumcheon",
      "nowon",
      "dobong",
      "dongdaemun",
      "dongjak",
      "mapo",
      "seodaemun",
      "seocho",
      "seongbuk",
      "songpa",
      "yangcheon",
      "yeongdeungpo",
      "yongsan",
      "eunpyeong",
      "jongno",
      "junggu",
      "jungnang",
    ],
    {
      required_error: "시군구를 선택해주세요",
    }
  ),
  detailedAddress: z.string().optional(), // 상세주소는 선택항목
  skinType: z.enum(
    ["oily", "dry", "normal", "combination", "unknown", "other"],
    {
      required_error: "피부타입을 선택해주세요",
    }
  ),
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

export default function KYCForm({ onSuccess }: KYCFormProps) {
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
  const handleFileChange =
    (photoType: "left" | "front" | "right") =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
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

  // Compress image function
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const maxDimension = 1200;

        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
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
              reject(new Error("Failed to compress image"));
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

  // Upload image function
  const uploadImage = async (file: File): Promise<string> => {
    try {
      console.log("=== UPLOAD IMAGE START ===");
      console.log("Original file:", file.name, file.size, file.type);

      // Skip Firebase Storage due to CORS issues and use Base64 directly
      console.log(
        "🔄 Using Base64 encoding (Firebase Storage CORS issues detected)"
      );

      // Compress and encode image
      console.log("Compressing and encoding image...");
      const compressedImageDataUrl = await compressImage(file);
      console.log("✅ Image compressed and encoded successfully");

      return compressedImageDataUrl;
    } catch (error) {
      console.error("❌ Image processing failed:", error);
      throw error;
    }
  };

  const onSubmit = async (data: KYCFormData) => {
    console.log("=== KYC SUBMISSION START ===");
    console.log("Form data:", data);
    console.log("User:", user?.email);
    console.log("Firebase db available:", !!db);

    // Handle both logged-in users and guests
    const isGuest = !user;
    const userId = user?.uid || "guest";
    const userEmail = user?.email || "guest@example.com";

    console.log("Setting isSubmitting to true");
    setIsSubmitting(true);
    setSubmitStatus("idle");

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log("Submission timeout - forcing completion");
      setIsSubmitting(false);
      setSubmitStatus("error");
    }, 30000); // 30 second timeout

    try {
      // Check if Firebase is properly configured
      if (!db) {
        console.error("❌ Firebase not configured");
        setSubmitStatus("error");
        return;
      }

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
              reader.onerror = reject;
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
              } 사진 처리에 실패했습니다.`
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
        district: data.district,
        detailedAddress: data.detailedAddress || "",
        skinType: data.skinType,
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
        user: userEmail,
        formData: data,
      });

      // Set specific error message
      const errorMsg =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";
      setErrorMessage(errorMsg);

      clearTimeout(timeoutId);
      setSubmitStatus("error");
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
              KYC 신청이 성공적으로 제출되었습니다. 검토 후 연락드리겠습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generate birth year options (1950-2010)
  const birthYears = Array.from({ length: 61 }, (_, i) => 1950 + i).reverse();

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-center">고객등록 신청서</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">기본 정보</h3>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="이름을 입력하세요"
                className={cn(errors.name && "border-red-500")}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label>성별 *</Label>
              <RadioGroup
                onValueChange={(value) =>
                  setValue("gender", value as "male" | "female" | "other")
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">남성</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">여성</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">기타</Label>
                </div>
              </RadioGroup>
              {errors.gender && (
                <p className="text-red-500 text-sm">{errors.gender.message}</p>
              )}
            </div>

            {/* Birth Year */}
            <div className="space-y-2">
              <Label htmlFor="birthYear">출생년도 *</Label>
              <select
                id="birthYear"
                {...register("birthYear")}
                className="border-gray-300 focus:ring-blue-500 w-full rounded-md border p-2 focus:outline-none focus:ring-2"
              >
                <option value="">출생년도를 선택하세요</option>
                {birthYears.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}년
                  </option>
                ))}
              </select>
              {errors.birthYear && (
                <p className="text-red-500 text-sm">
                  {errors.birthYear.message}
                </p>
              )}
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <Label htmlFor="contact">연락처 *</Label>
              <Input
                id="contact"
                {...register("contact")}
                placeholder="연락처를 입력하세요 (예: 01012345678)"
                maxLength={11}
                className={cn(errors.contact && "border-red-500")}
                onChange={(e) => {
                  // 숫자만 입력 허용
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  e.target.value = value;
                  setValue("contact", value);
                }}
              />
              <p className="text-gray-500 text-sm">숫자만 입력하세요</p>
              {errors.contact && (
                <p className="text-red-500 text-sm">{errors.contact.message}</p>
              )}
            </div>

            {/* District */}
            <div className="space-y-2">
              <Label htmlFor="district">시군구 *</Label>
              <select
                id="district"
                {...register("district")}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  errors.district && "border-red-500"
                )}
              >
                <option value="">시군구를 선택하세요</option>
                {districts.map((district) => (
                  <option key={district.value} value={district.value}>
                    {district.label}
                  </option>
                ))}
              </select>
              {errors.district && (
                <p className="text-red-500 text-sm">
                  {errors.district.message}
                </p>
              )}
            </div>

            {/* Detailed Address */}
            <div className="space-y-2">
              <Label htmlFor="detailedAddress">상세주소</Label>
              <Input
                id="detailedAddress"
                {...register("detailedAddress")}
                placeholder="상세주소를 입력하세요 (선택사항)"
                className={cn(errors.detailedAddress && "border-red-500")}
              />
              <p className="text-gray-500 text-sm">선택사항입니다</p>
              {errors.detailedAddress && (
                <p className="text-red-500 text-sm">
                  {errors.detailedAddress.message}
                </p>
              )}
            </div>

            {/* Skin Type */}
            <div className="space-y-2">
              <Label>피부타입 *</Label>
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
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="oily" id="oily" />
                  <Label htmlFor="oily">지성</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dry" id="dry" />
                  <Label htmlFor="dry">건성</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal">중성</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="combination" id="combination" />
                  <Label htmlFor="combination">복합성</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unknown" id="unknown" />
                  <Label htmlFor="unknown">모르겠음</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other-skin" />
                  <Label htmlFor="other-skin">기타</Label>
                </div>
              </RadioGroup>
              {errors.skinType && (
                <p className="text-red-500 text-sm">
                  {errors.skinType.message}
                </p>
              )}
            </div>

            {/* Previous Treatment */}
            <div className="space-y-2">
              <Label>기존 시술 여부 *</Label>
              <RadioGroup
                onValueChange={(value) =>
                  setValue("hasPreviousTreatment", value as "yes" | "no")
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes">있음</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no">없음</Label>
                </div>
              </RadioGroup>
              {errors.hasPreviousTreatment && (
                <p className="text-red-500 text-sm">
                  {errors.hasPreviousTreatment.message}
                </p>
              )}
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">현재 눈썹 사진 *</h3>
            <p className="text-gray-600 text-sm">
              좌측, 정면, 우측 각각의 사진을 업로드해주세요.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Left Photo */}
              <div className="space-y-2">
                <Label>좌측 사진</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange("left")}
                  className="hidden"
                  id="left-photo"
                />
                <label
                  htmlFor="left-photo"
                  className={cn(
                    "block cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors",
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400",
                    previewImages.left ? "border-green-500 bg-green-50" : ""
                  )}
                  onDrop={handleDrop("left")}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {previewImages.left ? (
                    <div className="relative">
                      <Image
                        src={previewImages.left}
                        alt="좌측 눈썹"
                        width={200}
                        height={200}
                        className="mx-auto rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPreviewImages((prev) => ({ ...prev, left: null }));
                          setSelectedFiles((prev) => ({ ...prev, left: null }));
                        }}
                        className="bg-red-500 hover:bg-red-600 absolute -top-2 -right-2 rounded-full p-1 text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImagePlus className="text-gray-400 mx-auto h-8 w-8" />
                      <p className="text-gray-600 text-sm">
                        드래그 앤 드롭 또는 클릭
                      </p>
                      <span className="text-blue-600 hover:text-blue-800 text-sm">
                        파일 선택
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {/* Front Photo */}
              <div className="space-y-2">
                <Label>정면 사진</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange("front")}
                  className="hidden"
                  id="front-photo"
                />
                <label
                  htmlFor="front-photo"
                  className={cn(
                    "block cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors",
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400",
                    previewImages.front ? "border-green-500 bg-green-50" : ""
                  )}
                  onDrop={handleDrop("front")}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {previewImages.front ? (
                    <div className="relative">
                      <Image
                        src={previewImages.front}
                        alt="정면 눈썹"
                        width={200}
                        height={200}
                        className="mx-auto rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPreviewImages((prev) => ({
                            ...prev,
                            front: null,
                          }));
                          setSelectedFiles((prev) => ({
                            ...prev,
                            front: null,
                          }));
                        }}
                        className="bg-red-500 hover:bg-red-600 absolute -top-2 -right-2 rounded-full p-1 text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImagePlus className="text-gray-400 mx-auto h-8 w-8" />
                      <p className="text-gray-600 text-sm">
                        드래그 앤 드롭 또는 클릭
                      </p>
                      <span className="text-blue-600 hover:text-blue-800 text-sm">
                        파일 선택
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {/* Right Photo */}
              <div className="space-y-2">
                <Label>우측 사진</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange("right")}
                  className="hidden"
                  id="right-photo"
                />
                <label
                  htmlFor="right-photo"
                  className={cn(
                    "block cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors",
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400",
                    previewImages.right ? "border-green-500 bg-green-50" : ""
                  )}
                  onDrop={handleDrop("right")}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {previewImages.right ? (
                    <div className="relative">
                      <Image
                        src={previewImages.right}
                        alt="우측 눈썹"
                        width={200}
                        height={200}
                        className="mx-auto rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPreviewImages((prev) => ({
                            ...prev,
                            right: null,
                          }));
                          setSelectedFiles((prev) => ({
                            ...prev,
                            right: null,
                          }));
                        }}
                        className="bg-red-500 hover:bg-red-600 absolute -top-2 -right-2 rounded-full p-1 text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImagePlus className="text-gray-400 mx-auto h-8 w-8" />
                      <p className="text-gray-600 text-sm">
                        드래그 앤 드롭 또는 클릭
                      </p>
                      <span className="text-blue-600 hover:text-blue-800 text-sm">
                        파일 선택
                      </span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border-red-200 rounded-lg border p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="text-red-500 h-5 w-5" />
                <p className="text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                제출 중...
              </>
            ) : (
              "KYC 신청 제출"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
