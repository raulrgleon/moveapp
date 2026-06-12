import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-9 w-9 rounded-xl",
  lg: "h-12 w-12 rounded-2xl",
};

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 28,
};

/** Compass / pilot mark for MovePilotAi */
export function BrandMark({ className, size = "md" }: BrandMarkProps) {
  const s = iconSizes[size];
  return (
    <div
      className={cn(
        "brand-mark flex shrink-0 items-center justify-center bg-gradient-to-br from-brand-navy to-brand-blue text-white shadow-md shadow-brand-blue/25",
        sizes[size],
        className
      )}
    >
      <svg
        width={s}
        height={s}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
        <path
          d="M12 4L13.8 12.2L12 20L10.2 12.2L12 4Z"
          fill="currentColor"
        />
        <path
          d="M4 12L12.2 10.2L20 12L12.2 13.8L4 12Z"
          fill="currentColor"
          opacity="0.85"
        />
        <circle cx="12" cy="12" r="2" fill="white" />
      </svg>
    </div>
  );
}
