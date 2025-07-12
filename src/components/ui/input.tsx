import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "border-gray-200 text-base placeholder:text-gray-400 focus:border-black focus:ring-black/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-gray-100 dark:focus:ring-gray-100/20 flex h-12 w-full rounded-xl border bg-white px-4 py-3 transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
