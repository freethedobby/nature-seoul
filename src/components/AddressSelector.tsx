"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronUp, MapPin } from "lucide-react";
import { getProvinces, getDistricts, getDongs } from "@/lib/address-data";

interface AddressSelectorProps {
  value: {
    province: string;
    district: string;
    dong: string;
  };
  onChange: (address: {
    province: string;
    district: string;
    dong: string;
  }) => void;
  error?: string;
}

export default function AddressSelector({
  value,
  onChange,
  error,
}: AddressSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<
    "province" | "district" | "dong"
  >("province");
  const [selectedProvince, setSelectedProvince] = useState(value.province);
  const [selectedDistrict, setSelectedDistrict] = useState(value.district);
  const [selectedDong, setSelectedDong] = useState(value.dong);

  const provinces = getProvinces();
  const districts = selectedProvince ? getDistricts(selectedProvince) : [];
  const dongs = selectedDistrict ? getDongs(selectedDistrict) : [];

  const getDisplayText = () => {
    if (!value.province) return "주소를 선택하세요";

    const provinceLabel =
      provinces.find((p) => p.value === value.province)?.label ||
      value.province;
    const districtLabel =
      districts.find((d) => d.value === value.district)?.label ||
      value.district;
    const dongLabel =
      dongs.find((d) => d.value === value.dong)?.label || value.dong;

    if (value.province && value.district && value.dong) {
      return `${provinceLabel} ${districtLabel} ${dongLabel}`;
    } else if (value.province && value.district) {
      return `${provinceLabel} ${districtLabel}`;
    } else {
      return provinceLabel;
    }
  };

  const handleProvinceSelect = (provinceValue: string) => {
    setSelectedProvince(provinceValue);
    setSelectedDistrict("");
    setSelectedDong("");
    setCurrentStep("district");
  };

  const handleDistrictSelect = (districtValue: string) => {
    setSelectedDistrict(districtValue);
    setSelectedDong("");
    setCurrentStep("dong");
  };

  const handleDongSelect = (dongValue: string) => {
    setSelectedDong(dongValue);
    onChange({
      province: selectedProvince,
      district: selectedDistrict,
      dong: dongValue,
    });
    setIsOpen(false);
    setCurrentStep("province");
  };

  const handleBack = () => {
    if (currentStep === "dong") {
      setCurrentStep("district");
    } else if (currentStep === "district") {
      setCurrentStep("province");
    }
  };

  const handleReset = () => {
    setSelectedProvince("");
    setSelectedDistrict("");
    setSelectedDong("");
    setCurrentStep("province");
    onChange({ province: "", district: "", dong: "" });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "province":
        return (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {provinces.map((province) => (
              <button
                key={province.value}
                onClick={() => handleProvinceSelect(province.value)}
                className="border-gray-200 hover:bg-blue-50 hover:border-blue-300 rounded-lg border p-2 text-left transition-colors"
              >
                <div className="text-gray-900 text-sm font-medium">
                  {province.label}
                </div>
              </button>
            ))}
          </div>
        );

      case "district":
        return (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {districts.map((district) => (
              <button
                key={district.value}
                onClick={() => handleDistrictSelect(district.value)}
                className="border-gray-200 hover:bg-blue-50 hover:border-blue-300 rounded-lg border p-2 text-left transition-colors"
              >
                <div className="text-gray-900 text-sm font-medium">
                  {district.label}
                </div>
              </button>
            ))}
          </div>
        );

      case "dong":
        return (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {dongs.map((dong) => (
              <button
                key={dong.value}
                onClick={() => handleDongSelect(dong.value)}
                className="border-gray-200 hover:bg-blue-50 hover:border-blue-300 rounded-lg border p-2 text-left transition-colors"
              >
                <div className="text-gray-900 text-sm font-medium">
                  {dong.label}
                </div>
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-gray-800 text-xs font-semibold uppercase tracking-wide sm:text-sm">
        주소 *
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`
          w-full rounded-lg border p-3 text-left transition-colors
          ${
            error
              ? "border-red-500 bg-red-50"
              : "border-gray-300 hover:border-gray-600 hover:bg-gray-50 bg-white"
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="text-gray-500 h-4 w-4" />
            <span
              className={value.province ? "text-gray-900" : "text-gray-500"}
            >
              {getDisplayText()}
            </span>
          </div>
          <ChevronUp className="text-gray-500 h-4 w-4" />
        </div>
      </button>

      {error && (
        <p className="text-red-500 bg-red-50 border-red-200 rounded border p-2 text-sm">
          {error}
        </p>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>주소 선택</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col space-y-4">
            {/* Breadcrumb */}
            <div className="bg-gray-50 flex items-center space-x-2 rounded-lg p-3">
              <span className="text-gray-600 text-sm">시/도</span>
              {currentStep !== "province" && (
                <>
                  <span className="text-gray-400">›</span>
                  <span className="text-gray-600 text-sm">시/군/구</span>
                </>
              )}
              {currentStep === "dong" && (
                <>
                  <span className="text-gray-400">›</span>
                  <span className="text-gray-600 text-sm">읍/면/동</span>
                </>
              )}
            </div>

            {/* Selected Address Display */}
            {selectedProvince && (
              <div className="bg-green-100 border-green-300 rounded-lg border p-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="text-green-600 h-4 w-4" />
                  <span className="text-green-800 text-sm font-medium">
                    {provinces.find((p) => p.value === selectedProvince)?.label}
                    {selectedDistrict &&
                      ` ${
                        districts.find((d) => d.value === selectedDistrict)
                          ?.label
                      }`}
                    {selectedDong &&
                      ` ${dongs.find((d) => d.value === selectedDong)?.label}`}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <div className="flex space-x-2">
                {currentStep !== "province" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBack}
                  >
                    뒤로
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  초기화
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                취소
              </Button>
            </div>

            {/* Content - Scrollable */}
            <div className="pb-4">{renderStepContent()}</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
