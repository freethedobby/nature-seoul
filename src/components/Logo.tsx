import Link from "next/link";

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
      <div className={`${iconSizes[variant]} flex items-center justify-center`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-full w-full"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <span className="font-light tracking-wide">nature.seoul</span>
    </Link>
  );
}
