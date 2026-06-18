"use client";

import { LegalDocument } from "@/components/legal/legal-document";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { useLocale, useT } from "@/contexts/locale-context";
import { LEGAL_LAST_UPDATED, PRIVACY_SECTIONS } from "@/lib/legal/documents";

export function PrivacyPageContent() {
  const t = useT();
  const { locale } = useLocale();

  return (
    <LegalPageShell title={t("legal.privacyTitle")} lastUpdated={LEGAL_LAST_UPDATED[locale]}>
      <LegalDocument intro={t("legal.privacyIntro")} sections={PRIVACY_SECTIONS} />
    </LegalPageShell>
  );
}
