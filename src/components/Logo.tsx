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
    "flex flex-col items-center transition-opacity hover:opacity-80";

  const sizeClasses = {
    header: "text-sm sm:text-base",
    footer: "text-base",
    hero: "text-lg sm:text-xl",
  };

  const classes = `${baseClasses} ${sizeClasses[variant]} ${className}`;

  return (
    <Link href="/" className={classes}>
      <div className="flex flex-col items-center">
        <span className="text-black font-light tracking-wide">
          nature.seoul
        </span>
        <span className="text-gray-400 text-[10px] tracking-wide">
          premium studio
        </span>
      </div>
    </Link>
  );
}
