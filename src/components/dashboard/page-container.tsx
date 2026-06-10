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
        "max-w-full overflow-x-hidden",
        "pb-24 lg:pb-8 xl:pb-8",
        className
      )}
    >
      {children}
    </div>
  );
}
