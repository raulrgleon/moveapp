"use client";

import { useEffect, useState } from "react";
import {
  registerPaywallHandler,
  type PaywallPayload,
} from "@/lib/billing/paywall-bridge";
import { PaywallModal } from "@/components/billing/paywall-modal";

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<PaywallPayload | null>(null);

  useEffect(() => {
    registerPaywallHandler((next) => setPayload(next));
    return () => registerPaywallHandler(null);
  }, []);

  return (
    <>
      {children}
      <PaywallModal
        open={Boolean(payload)}
        payload={payload}
        onClose={() => setPayload(null)}
      />
    </>
  );
}
