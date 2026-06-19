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
        "p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fade-in",
        "max-w-full min-w-0 overflow-x-hidden",
        withMobileNavPad && "page-bottom-pad",
        className
      )}
    >
      {children}
    </div>
  );
}
