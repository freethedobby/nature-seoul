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
  Loader2,
  CheckCircle,
  AlertCircle,
  ImagePlus,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { db, storage } from "@/lib/firebase";
import {
  serverTimestamp,
  setDoc,
  doc as firestoreDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Form validation schema
const kycSchema = z.object({
  name: z.string().min(2, "이름은 2글자 이상 입력해주세요"),
  contact: z.string().min(10, "연락처를 정확히 입력해주세요"),
  hasPreviousTreatment: z.enum(["yes", "no"], {
    required_error: "기존 시술 여부를 선택해주세요",
  }),
  eyebrowPhoto: z.any(), // Temporarily simplify to debug
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  console.log(
    "KYCForm rendered - user:",
    user?.email,
    "isSubmitting:",
    isSubmitting
  );

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

  // Watch form values for debugging (only in development)
  if (process.env.NODE_ENV === "development") {
    const watchedValues = watch();
    console.log("Form values:", watchedValues);
    console.log("Form errors:", errors);
  }

  // Handle file change (for drag and drop)
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue("eyebrowPhoto", file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle file drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setValue("eyebrowPhoto", file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag over
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Upload image to Firebase Storage
  const uploadImage = async (file: File): Promise<string> => {
    console.log("=== UPLOAD IMAGE START ===");
    console.log("File:", file.name, file.size, file.type);
    console.log("User:", user?.email);

    if (!user) throw new Error("User not authenticated");

    // For development, skip Firebase Storage and use base64 directly
    if (
      process.env.NODE_ENV === "development" ||
      window.location.hostname === "localhost"
    ) {
      console.log("Development mode detected, using base64 storage directly");
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result as string;
          console.log(
            "Base64 conversion successful, length:",
            base64String.length
          );
          resolve(base64String);
        };
        reader.onerror = (error) => {
          console.error("FileReader error:", error);
          reject(error);
        };
        reader.readAsDataURL(file);
      });
    }

    try {
      console.log("Attempting Firebase Storage upload...");
      const timestamp = Date.now();
      const fileName = `kyc/${user.uid}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);

      console.log("Uploading bytes...");
      const snapshot = await uploadBytes(storageRef, file);
      console.log("Bytes uploaded, getting download URL...");
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log("Firebase Storage upload successful:", downloadURL);

      return downloadURL;
    } catch (error) {
      console.error("=== FIREBASE STORAGE UPLOAD FAILED ===");
      console.error("Error:", error);

      // Fallback: convert file to base64 and store in Firestore
      console.log("Falling back to base64 storage");
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result as string;
          console.log(
            "Base64 conversion successful, length:",
            base64String.length
          );
          resolve(base64String);
        };
        reader.onerror = (error) => {
          console.error("FileReader error:", error);
          reject(error);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Submit form
  const onSubmit = async (data: KYCFormData) => {
    console.log("=== KYC FORM SUBMISSION START ===");
    console.log("Form data:", data);
    console.log("User:", user?.email);
    console.log("Firebase db available:", !!db);
    console.log("Firebase storage available:", !!storage);

    if (!user) {
      console.error("No user found");
      setSubmitStatus("error");
      return;
    }

    console.log("Setting isSubmitting to true");
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      // Check if Firebase is properly configured
      if (!db) {
        console.log("Firebase not configured, running in development mode");
        // Development mode - just show success
        console.log("Development mode - KYC form data:", {
          name: data.name,
          contact: data.contact,
          hasPreviousTreatment: data.hasPreviousTreatment === "yes",
          photoFileName: data.eyebrowPhoto?.name || "No file",
        });

        console.log("Setting success status");
        setSubmitStatus("success");
        reset();
        setPreviewImage(null);
        setSelectedFile(null);
        onSuccess?.();
        return;
      }

      console.log("Starting image upload...");
      // Upload image (with fallback to base64 if Firebase Storage fails)
      const imageUrl = await uploadImage(data.eyebrowPhoto);
      console.log(
        "Image processed successfully, URL type:",
        imageUrl.startsWith("data:") ? "base64" : "firebase-storage"
      );

      // Save to Firestore in users collection
      const userData = {
        userId: user.uid,
        email: user.email,
        name: data.name,
        contact: data.contact,
        photoURL: imageUrl,
        photoType: imageUrl.startsWith("data:") ? "base64" : "firebase-storage",
        kycStatus: "pending",
        hasPreviousTreatment: data.hasPreviousTreatment === "yes",
        createdAt: serverTimestamp(),
        submittedAt: serverTimestamp(),
      };

      console.log("Saving user data to Firestore...");
      await setDoc(firestoreDoc(db, "users", user.uid), userData, {
        merge: true,
      });
      console.log("User data saved successfully with UID as doc ID");

      console.log("Setting final success status");
      setSubmitStatus("success");
      reset();
      setPreviewImage(null);
      setSelectedFile(null);
      onSuccess?.();
    } catch (error) {
      console.error("=== KYC SUBMISSION ERROR ===");
      console.error("Error:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        user: user?.email,
        formData: data,
      });
      setSubmitStatus("error");
    } finally {
      console.log("Setting isSubmitting to false");
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
        <form
          onSubmit={(e) => {
            console.log("Form submit event triggered");
            console.log("Form validation errors:", errors);
            console.log("Form is valid:", Object.keys(errors).length === 0);
            handleSubmit(onSubmit)(e);
          }}
          className="space-y-6"
        >
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
              {...register("contact", {
                required: "연락처를 입력해주세요",
                pattern: {
                  value: /^[0-9]{10,11}$/,
                  message: "올바른 연락처 형식이 아닙니다",
                },
                onChange: (e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  e.target.value = value.slice(0, 11);
                },
              })}
              placeholder="01012345678"
              className="text-base h-12"
              maxLength={11}
              type="tel"
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
                  <Image
                    src={previewImage}
                    alt="눈썹 미리보기"
                    width={600}
                    height={400}
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
              <div className="space-y-2">
                <div className="flex flex-col gap-4">
                  <div
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-lg border border-dashed bg-white p-6",
                      isDragging && "border-blue-500 bg-blue-50"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      required
                    />
                    <div className="flex flex-col items-center gap-2 text-center">
                      <ImagePlus className="text-gray-400 h-8 w-8" />
                      <div>
                        <p className="text-gray-600 text-sm">
                          클릭하여 파일 선택 또는 드래그하여 업로드
                        </p>
                        <p className="text-gray-500 mt-1 text-xs">
                          시술받고자 하는 눈썹 정면 사진을 업로드해 주세요
                        </p>
                        <p className="text-gray-500 text-xs">
                          JPG, PNG 파일 (최대 5MB)
                        </p>
                      </div>
                    </div>
                  </div>
                  {selectedFile && (
                    <div className="flex items-center gap-2 rounded-lg border bg-white p-3">
                      <ImageIcon className="text-blue-500 h-5 w-5" />
                      <span className="text-gray-600 flex-1 truncate text-sm">
                        {selectedFile.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-red-500 h-8 w-8"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewImage(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {/* Image Preview */}
                  {previewImage && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-white">
                      <Image
                        src={previewImage}
                        alt="눈썹 사진 미리보기"
                        fill
                        className="object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(null);
                          setSelectedFile(null);
                        }}
                        className="shadow-md hover:bg-gray-100 absolute right-2 top-2 rounded-full bg-white p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {errors.eyebrowPhoto && (
              <p className="text-red-500 text-sm">
                {errors.eyebrowPhoto.message?.toString()}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-black shadow-lg hover:shadow-xl hover:-translate-y-0.5 group relative h-14 w-full transform text-white transition-all duration-300 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="bg-gradient-to-r absolute inset-0 rounded-xl from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
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
            <div className="text-red-600 bg-red-50 border-red-100 flex items-center space-x-2 rounded-xl border p-4">
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
