"use client";

import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { useT } from "@/contexts/locale-context";

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@movepilotai.com";

export function SiteFooter() {
  const t = useT();

  const links = [
    { href: "/pricing", label: t("footer.pricing") },
    { href: "/terms", label: t("footer.terms") },
    { href: "/privacy", label: t("footer.privacy") },
    { href: "/refunds", label: t("footer.refunds") },
    {
      href: `mailto:${SUPPORT_EMAIL}`,
      label: t("footer.support"),
      external: true,
    },
  ] as const;

  return (
    <footer className="border-t py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <Logo showTagline />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {links.map((link) =>
              "external" in link && link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>
        </div>
        <p className="text-sm text-muted-foreground">{t("landing.copyright")}</p>
      </div>
    </footer>
  );
}
