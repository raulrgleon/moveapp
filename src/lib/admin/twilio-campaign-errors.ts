import type { Locale } from "@/lib/i18n";

export type TwilioErrorKind = "unverified_number" | "trial_limit" | "generic";

export function classifyTwilioError(raw: string): TwilioErrorKind {
  const lower = raw.toLowerCase();
  if (lower.includes("unverified") || lower.includes("verify ") && lower.includes("twilio.com")) {
    return "unverified_number";
  }
  if (lower.includes("trial") && (lower.includes("cannot") || lower.includes("upgrade"))) {
    return "trial_limit";
  }
  return "generic";
}

export function formatCampaignSmsError(
  userName: string,
  raw: string,
  locale: Locale = "en"
): { message: string; kind: TwilioErrorKind } {
  const kind = classifyTwilioError(raw);
  const isEs = locale === "es";

  if (kind === "unverified_number") {
    return {
      kind,
      message: isEs
        ? `SMS a ${userName}: el número no está verificado en Twilio. Con cuenta trial solo puedes enviar a números que verifiques en console.twilio.com → Phone Numbers → Verified Caller IDs. Para enviar a cualquier cliente, actualiza la cuenta Twilio (añade método de pago).`
        : `SMS to ${userName}: number not verified in Twilio. Trial accounts can only text numbers verified at console.twilio.com → Phone Numbers → Verified Caller IDs. Upgrade your Twilio account to text any customer.`,
    };
  }

  if (kind === "trial_limit") {
    return {
      kind,
      message: isEs
        ? `SMS a ${userName}: límite de cuenta trial de Twilio. Actualiza tu cuenta en Twilio para enviar a clientes reales.`
        : `SMS to ${userName}: Twilio trial account limit. Upgrade Twilio to send to real customers.`,
    };
  }

  return {
    kind,
    message: isEs ? `SMS a ${userName}: ${raw}` : `SMS to ${userName}: ${raw}`,
  };
}
