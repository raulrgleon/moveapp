import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Extra bottom padding for mobile bottom nav (dashboard only). */
  withMobileNavPad?: boolean;
}

export function PageContainer({
  children,
  className,
  withMobileNavPad = true,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 space-y-6 sm:space-y-8 animate-fade-in",
        "max-w-full min-w-0 overflow-x-hidden",
        withMobileNavPad
          ? "pb-[calc(6.5rem+env(safe-area-inset-bottom,0px)+3rem)] lg:pb-24 xl:pb-8"
          : "pb-4 sm:pb-6 lg:pb-8",
        className
      )}
    >
      {children}
    </div>
  );
}
