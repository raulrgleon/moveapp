"use client";

import { useT } from "@/contexts/locale-context";

export function LoadingText({ messageKey = "common.loading" }: { messageKey?: string }) {
  const t = useT();
  return <>{t(messageKey)}</>;
}
