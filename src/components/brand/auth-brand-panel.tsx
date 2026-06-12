"use client";

import { MapPin, Route, Sparkles } from "lucide-react";
import { useT } from "@/contexts/locale-context";
import { BrandLogo } from "./brand-logo";

/** Left brand panel for login / onboarding on desktop */
export function AuthBrandPanel() {
  const t = useT();

  const pillars = [
    { icon: Sparkles, label: t("brand.pillarPlan") },
    { icon: Route, label: t("brand.pillarRoute") },
    { icon: MapPin, label: t("brand.pillarMove") },
  ];

  return (
    <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col justify-between brand-auth-panel text-white p-10 xl:p-14 relative overflow-hidden">
      <div className="brand-auth-glow absolute inset-0 pointer-events-none" />
      <BrandLogo
        variant="light"
        size="lg"
        showTagline
        tagline={t("tagline")}
        className="relative z-10"
      />
      <div className="relative z-10 space-y-8 max-w-md">
        <div>
          <p className="text-brand-accent font-semibold text-sm uppercase tracking-widest mb-3">
            {t("brand.authEyebrow")}
          </p>
          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight text-balance">
            {t("brand.authHeadline")}
          </h1>
          <p className="mt-4 text-white/75 text-lg leading-relaxed">
            {t("brand.authSubline")}
          </p>
        </div>
        <ul className="space-y-4">
          {pillars.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-white/90">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                <Icon className="h-5 w-5 text-brand-accent" />
              </span>
              <span className="font-medium">{label}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="relative z-10 text-sm text-white/50">movepilotai.com</p>
    </div>
  );
}
