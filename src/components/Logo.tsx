import Link from "next/link";
import { Home } from "lucide-react";

interface LogoProps {
  variant?: "header" | "footer" | "hero";
  className?: string;
}

export default function Logo({
  variant = "header",
  className = "",
}: LogoProps) {
  const baseClasses =
    "flex items-center space-x-1 sm:space-x-2 font-semibold transition-opacity hover:opacity-80";

  const sizeClasses = {
    header: "text-sm sm:text-lg",
    footer: "text-base",
    hero: "text-xl sm:text-2xl",
  };

  const iconSizes = {
    header: "h-4 w-4 sm:h-5 sm:w-5",
    footer: "h-5 w-5",
    hero: "h-6 w-6 sm:h-8 sm:w-8",
  };

  const classes = `${baseClasses} ${sizeClasses[variant]} ${className}`;

  return (
    <Link href="/" className={classes}>
      <Home className={iconSizes[variant]} />
      <span>nature.seoul</span>
    </Link>
  );
}
