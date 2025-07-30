export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && GA_TRACKING_ID) {
    const config: Record<string, string | number | boolean> = {
      event_category: category,
    };
    
    if (label !== undefined) {
      config.event_label = label;
    }
    
    if (value !== undefined) {
      config.value = value;
    }

    window.gtag('event', action, config);
  }
};

// 타입 정의
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: Record<string, string | number | boolean>
    ) => void;
  }
} 