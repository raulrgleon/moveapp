"use client";

import type { LegalSection } from "@/lib/legal/documents";
import { useLocale } from "@/contexts/locale-context";

type LegalDocumentProps = {
  intro: string;
  sections: LegalSection[];
};

export function LegalDocument({ intro, sections }: LegalDocumentProps) {
  const { locale } = useLocale();

  return (
    <>
      <p className="text-base">{intro}</p>
      {sections.map((section) => (
        <section key={section.id} id={section.id}>
          <h2 className="font-display text-lg font-semibold text-foreground">
            {section.title[locale]}
          </h2>
          <div className="mt-3 whitespace-pre-line">{section.body[locale]}</div>
        </section>
      ))}
    </>
  );
}
