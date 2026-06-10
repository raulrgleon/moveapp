import { cn } from "@/lib/utils";

interface TableScrollProps {
  children: React.ReactNode;
  className?: string;
}

export function TableScroll({ children, className }: TableScrollProps) {
  return (
    <div className={cn("-mx-4 sm:mx-0 overflow-x-auto", className)}>
      <div className="inline-block min-w-full align-middle px-4 sm:px-0">
        {children}
      </div>
    </div>
  );
}
