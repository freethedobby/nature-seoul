import { ButtonHTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  children,
  className,
  variant = "primary",
  loading = false,
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "relative flex items-center justify-center px-6 py-3 text-base font-medium transition-all duration-200 rounded-lg";

  const variants = {
    primary: "bg-black text-white hover:bg-gray-800 disabled:bg-gray-300",
    secondary:
      "bg-white text-black border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100",
  };

  const widthClass = fullWidth ? "w-full" : "w-auto";

  return (
    <button
      className={twMerge(
        baseStyles,
        variants[variant],
        widthClass,
        "disabled:cursor-not-allowed",
        loading && "cursor-wait",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="opacity-0">{children}</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-gray-300 animate-spin h-5 w-5 rounded-full border-2 border-t-white"></div>
          </div>
        </>
      ) : (
        children
      )}
    </button>
  );
}
