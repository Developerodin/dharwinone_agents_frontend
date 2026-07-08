import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  compact?: boolean;
  showText?: boolean;
  className?: string;
};

export function BrandLogo({
  href,
  compact = false,
  showText = true,
  className = "",
}: BrandLogoProps) {
  const markSize = compact ? 28 : 34;

  const content = (
    <div className="flex items-center gap-2.5 min-w-0">
      <Image
        src="/images/logo-mark.svg"
        alt="Dharwin One"
        width={markSize}
        height={markSize}
        className="shrink-0"
        priority
      />

      {showText && (
        <div
          className={`flex flex-col leading-none font-semibold tracking-tight text-[#111827] whitespace-nowrap ${
            compact ? "text-[0.9375rem]" : "text-[14px]"
          }`}
          style={{ fontFamily: "var(--font-inter-family), Inter, sans-serif" }}
        >
          <span>Dharwin</span>
          <span>One</span>
        </div>
      )}
    </div>
  );

  const wrapperClass = `inline-flex items-center min-w-0 ${className}`;

  if (href) {
    return (
      <Link href={href} className={`${wrapperClass} transition-opacity hover:opacity-90`}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
