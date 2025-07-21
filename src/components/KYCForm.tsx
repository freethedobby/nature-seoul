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

// 시도별 시군구 데이터
const districts = {
  seoul: [
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
  ],
  gyeonggi: [
    { value: "suwon", label: "수원시" },
    { value: "seongnam", label: "성남시" },
    { value: "bucheon", label: "부천시" },
    { value: "anyang", label: "안양시" },
    { value: "ansan", label: "안산시" },
    { value: "pyeongtaek", label: "평택시" },
    { value: "siheung", label: "시흥시" },
    { value: "gwangmyeong", label: "광명시" },
    { value: "gwangju_gyeonggi", label: "광주시" },
    { value: "yongin", label: "용인시" },
    { value: "paju", label: "파주시" },
    { value: "icheon", label: "이천시" },
    { value: "anseong", label: "안성시" },
    { value: "gimpo", label: "김포시" },
    { value: "hwaseong", label: "화성시" },
    { value: "gwangju_gyeonggi", label: "광주시" },
    { value: "yeoju", label: "여주시" },
    { value: "pocheon", label: "포천시" },
    { value: "dongducheon", label: "동두천시" },
    { value: "goyang", label: "고양시" },
    { value: "namyangju", label: "남양주시" },
    { value: "osan", label: "오산시" },
    { value: "hanam", label: "하남시" },
    { value: "uijeongbu", label: "의정부시" },
    { value: "yangju", label: "양주시" },
    { value: "gunpo", label: "군포시" },
    { value: "uiwang", label: "의왕시" },
    { value: "gwachon", label: "과천시" },
    { value: "guri", label: "구리시" },
    { value: "namyangju", label: "남양주시" },
    { value: "yeoncheon", label: "연천군" },
    { value: "gapyeong", label: "가평군" },
    { value: "yangpyeong", label: "양평군" },
  ],
  incheon: [
    { value: "junggu_incheon", label: "중구" },
    { value: "donggu", label: "동구" },
    { value: "michuhol", label: "미추홀구" },
    { value: "yeonsu", label: "연수구" },
    { value: "namdong", label: "남동구" },
    { value: "bupyeong", label: "부평구" },
    { value: "gyeyang", label: "계양구" },
    { value: "seo_incheon", label: "서구" },
    { value: "ganghwa", label: "강화군" },
    { value: "ongjin", label: "옹진군" },
  ],
  other: [{ value: "other", label: "기타" }],
};

const provinces = [
  { value: "seoul", label: "서울특별시" },
  { value: "gyeonggi", label: "경기도" },
  { value: "incheon", label: "인천광역시" },
  { value: "other", label: "기타" },
];

// Form validation schema
const kycSchema = z.object({
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: "개인정보 수집 및 이용에 동의해주세요",
  }),
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
  province: z.enum(["seoul", "gyeonggi", "incheon", "other"], {
    required_error: "시도를 선택해주세요",
  }),
  district: z.string().min(1, "시군구를 선택해주세요"),
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
        province: data.province,
        district: data.district,
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
          {/* Privacy Consent */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              개인정보 수집 및 이용 동의
            </h3>
            <div className="bg-gray-50 text-gray-700 space-y-2 rounded-lg p-4 text-sm">
              <p>
                본 고객등록 신청서에 기입해주신 정보는 당사의 고객 관리 및 내부
                운영 목적으로만 사용됩니다.
              </p>
              <p>
                제출해주신 정보는 관련 법령에 따라 3년간 안전하게 보관되며, 보관
                기간이 만료된 후에는 즉시 폐기됩니다.
              </p>
              <p>
                본인은 이에 동의하며, 제출한 정보가 내부 관리 목적 외에는
                사용되지 않음을 확인합니다.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="privacyConsent"
                {...register("privacyConsent")}
                className="border-gray-300 text-blue-600 focus:ring-blue-500 rounded"
              />
              <Label htmlFor="privacyConsent" className="text-sm">
                위 개인정보 수집 및 이용에 동의합니다 *
              </Label>
            </div>
            {errors.privacyConsent && (
              <p className="text-red-500 text-sm">
                {errors.privacyConsent.message}
              </p>
            )}
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">기본 정보</h3>

            {/* Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-gray-800 text-sm font-semibold uppercase tracking-wide"
              >
                이름 *
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="이름을 입력하세요"
                className={cn(
                  "border-gray-300 focus:border-blue-500 focus:ring-blue-200 w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors duration-200 focus:outline-none focus:ring-2",
                  errors.name &&
                    "border-red-500 focus:border-red-500 focus:ring-red-200"
                )}
              />
              {errors.name && (
                <p className="text-red-500 bg-red-50 border-red-200 rounded border p-2 text-sm">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label className="text-gray-800 text-sm font-semibold uppercase tracking-wide">
                성별 *
              </Label>
              <RadioGroup
                onValueChange={(value) =>
                  setValue("gender", value as "male" | "female" | "other")
                }
                className="flex space-x-4"
              >
                <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="text-sm">
                    남성
                  </Label>
                </div>
                <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="text-sm">
                    여성
                  </Label>
                </div>
                <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="text-sm">
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
                  className="text-gray-800 text-sm font-semibold uppercase tracking-wide"
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
              <Label
                htmlFor="contact"
                className="text-gray-800 text-sm font-semibold uppercase tracking-wide"
              >
                연락처 *
              </Label>
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

            {/* Province and District */}
            <div className="space-y-2">
              <Label
                htmlFor="province"
                className="text-gray-800 text-sm font-semibold uppercase tracking-wide"
              >
                시도 *
              </Label>
              <select
                id="province"
                {...register("province")}
                onChange={(e) => {
                  setValue(
                    "province",
                    e.target.value as "seoul" | "gyeonggi" | "incheon" | "other"
                  );
                  setValue("district", ""); // Reset district when province changes
                }}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  errors.province && "border-red-500"
                )}
              >
                <option value="">시도를 선택하세요</option>
                {provinces.map((province) => (
                  <option key={province.value} value={province.value}>
                    {province.label}
                  </option>
                ))}
              </select>
              {errors.province && (
                <p className="text-red-500 text-sm">
                  {errors.province.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="district"
                className="text-gray-800 text-sm font-semibold uppercase tracking-wide"
              >
                시군구 *
              </Label>
              <select
                id="district"
                {...register("district")}
                disabled={!watch("province")}
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  errors.district && "border-red-500",
                  !watch("province") && "cursor-not-allowed opacity-50"
                )}
              >
                <option value="">시군구를 선택하세요</option>
                {watch("province") &&
                  districts[watch("province") as keyof typeof districts]?.map(
                    (district) => (
                      <option key={district.value} value={district.value}>
                        {district.label}
                      </option>
                    )
                  )}
              </select>
              {errors.district && (
                <p className="text-red-500 text-sm">
                  {errors.district.message}
                </p>
              )}
            </div>

            {/* Detailed Address */}
            <div className="space-y-2">
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
              <Label className="text-gray-800 text-sm font-semibold uppercase tracking-wide">
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
                className="grid grid-cols-2 gap-2"
              >
                <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                  <RadioGroupItem value="oily" id="oily" />
                  <Label htmlFor="oily" className="text-sm">
                    지성
                  </Label>
                </div>
                <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                  <RadioGroupItem value="dry" id="dry" />
                  <Label htmlFor="dry" className="text-sm">
                    건성
                  </Label>
                </div>
                <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal" className="text-sm">
                    중성
                  </Label>
                </div>
                <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                  <RadioGroupItem value="combination" id="combination" />
                  <Label htmlFor="combination" className="text-sm">
                    복합성
                  </Label>
                </div>
                <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                  <RadioGroupItem value="unknown" id="unknown" />
                  <Label htmlFor="unknown" className="text-sm">
                    모르겠음
                  </Label>
                </div>
                <div className="border-gray-200 flex items-center space-x-2 rounded-lg border bg-white p-2">
                  <RadioGroupItem value="other" id="other-skin" />
                  <Label htmlFor="other-skin" className="text-sm">
                    기타
                  </Label>
                </div>
              </RadioGroup>
              {watch("skinType") === "other" && (
                <div className="space-y-3">
                  <div className="bg-blue-50 text-blue-700 border-blue-200 rounded-lg border p-3 text-sm">
                    <p className="font-medium">
                      특이 체질이 있으시다면 기타에 적어주세요
                    </p>
                    <p className="text-blue-600">
                      예) 켈로이드, 피부염, 아토피 등
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="skinTypeOther"
                      className="text-gray-700 text-sm font-medium"
                    >
                      상세 내용
                    </Label>
                    <textarea
                      id="skinTypeOther"
                      {...register("skinTypeOther")}
                      placeholder="특이 체질이나 피부 상태를 자세히 적어주세요"
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-200 min-h-[80px] w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm transition-colors duration-200 focus:outline-none focus:ring-2"
                    />
                  </div>
                </div>
              )}
              {errors.skinType && (
                <p className="text-red-500 bg-red-50 border-red-200 rounded border p-2 text-sm">
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
                className="flex space-x-4"
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
