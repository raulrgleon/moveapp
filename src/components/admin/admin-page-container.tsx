import { PageContainer } from "@/components/dashboard/page-container";

/** Admin pages have no mobile bottom nav — skip extra bottom padding. */
export function AdminPageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <PageContainer withMobileNavPad={false} className={className}>
      {children}
    </PageContainer>
  );
}
