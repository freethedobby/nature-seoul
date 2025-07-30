"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { pageview, GA_TRACKING_ID } from "@/lib/gtag";

export default function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (GA_TRACKING_ID && pathname) {
      pageview(pathname);
    }
  }, [pathname]);

  // This component doesn't render anything
  return null;
}
