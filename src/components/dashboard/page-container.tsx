import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fade-in",
        "max-w-full min-w-0 overflow-x-hidden",
        "page-bottom-pad",
        className
      )}
    >
      {children}
    </div>
  );
}
