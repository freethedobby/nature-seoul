"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface MembershipBadgeProps {
  kycStatus: "pending" | "approved" | "rejected" | "none";
  treatmentDone?: boolean;
}

const MEMBERSHIP_INFO = {
  traveler: {
    icon: "🔓",
    label: "미인증 고객",
    description: "인증 완료 후 예약이 가능해요.",
    variant: "secondary" as const,
  },
  private: {
    icon: "✅",
    label: "예약가능 회원",
    description: "정식 인증을 마친 고객님입니다. 예약 기능이 활성화돼요.",
    variant: "outline" as const,
  },
  signature: {
    icon: "🌟",
    label: "시그니처 멤버",
    description: "시술까지 마친 VIP 고객님입니다. 재방문 혜택이 제공돼요.",
    variant: "default" as const,
  },
};

export function MembershipBadge({
  kycStatus,
  treatmentDone = false,
}: MembershipBadgeProps) {
  const getMembershipInfo = () => {
    if (treatmentDone && kycStatus === "approved") {
      return MEMBERSHIP_INFO.signature;
    }
    if (kycStatus === "approved") {
      return MEMBERSHIP_INFO.private;
    }
    return MEMBERSHIP_INFO.traveler;
  };

  const membershipInfo = getMembershipInfo();

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center gap-2">
        <Badge variant={membershipInfo.variant} className="text-sm">
          {membershipInfo.icon} {membershipInfo.label}
        </Badge>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 hover:bg-transparent"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{membershipInfo.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {(kycStatus === "none" || kycStatus === "rejected") && (
        <Link href="/kyc">
          <Button variant="default" size="sm" className="whitespace-nowrap">
            인증하기
          </Button>
        </Link>
      )}
    </div>
  );
}
