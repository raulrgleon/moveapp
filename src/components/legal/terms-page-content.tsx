"use client";

import { LegalDocument } from "@/components/legal/legal-document";
import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { useLocale, useT } from "@/contexts/locale-context";
import { LEGAL_LAST_UPDATED, TERMS_SECTIONS } from "@/lib/legal/documents";

export function TermsPageContent() {
  const t = useT();
  const { locale } = useLocale();

  return (
    <LegalPageShell title={t("legal.termsTitle")} lastUpdated={LEGAL_LAST_UPDATED[locale]}>
      <LegalDocument intro={t("legal.termsIntro")} sections={TERMS_SECTIONS} />
    </LegalPageShell>
  );
}
