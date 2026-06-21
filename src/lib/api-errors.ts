import { NextResponse } from "next/server";
import { translate, type Locale } from "@/lib/i18n";

export type ApiErrorKey =
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "invalidPassword"
  | "passwordRequired"
  | "passwordTooShort"
  | "passwordMismatch"
  | "emailRequired"
  | "validEmailRequired"
  | "userExists"
  | "verificationRequired"
  | "verificationCodeInvalid"
  | "verificationCodeExpired"
  | "verificationTooManyAttempts"
  | "registrationFailed"
  | "loginFailed"
  | "noMove"
  | "readOnly"
  | "saveFailed"
  | "deleteFailed"
  | "inviteSelf"
  | "alreadyInvited"
  | "ownerOnly"
  | "taskNotFound"
  | "idRequired"
  | "emailConfirmMismatch"
  | "phoneRequired"
  | "phoneInvalid"
  | "verificationRateLimit";

const ERROR_KEYS: Record<ApiErrorKey, string> = {
  unauthorized: "apiErrors.unauthorized",
  forbidden: "apiErrors.forbidden",
  notFound: "apiErrors.notFound",
  invalidPassword: "apiErrors.invalidPassword",
  passwordRequired: "apiErrors.passwordRequired",
  passwordTooShort: "apiErrors.passwordTooShort",
  passwordMismatch: "apiErrors.passwordMismatch",
  emailRequired: "apiErrors.emailRequired",
  validEmailRequired: "apiErrors.validEmailRequired",
  userExists: "apiErrors.userExists",
  verificationRequired: "apiErrors.verificationRequired",
  verificationCodeInvalid: "apiErrors.verificationCodeInvalid",
  verificationCodeExpired: "apiErrors.verificationCodeExpired",
  verificationTooManyAttempts: "apiErrors.verificationTooManyAttempts",
  registrationFailed: "apiErrors.registrationFailed",
  loginFailed: "apiErrors.loginFailed",
  noMove: "apiErrors.noMove",
  readOnly: "apiErrors.readOnly",
  saveFailed: "apiErrors.saveFailed",
  deleteFailed: "apiErrors.deleteFailed",
  inviteSelf: "apiErrors.inviteSelf",
  alreadyInvited: "apiErrors.alreadyInvited",
  ownerOnly: "apiErrors.ownerOnly",
  taskNotFound: "apiErrors.taskNotFound",
  idRequired: "apiErrors.idRequired",
  emailConfirmMismatch: "apiErrors.emailConfirmMismatch",
  phoneRequired: "apiErrors.phoneRequired",
  phoneInvalid: "apiErrors.phoneInvalid",
  verificationRateLimit: "apiErrors.verificationRateLimit",
};

export function apiErrorMessage(key: ApiErrorKey, locale: Locale = "en"): string {
  return translate(locale, ERROR_KEYS[key]);
}

export function resolveRequestLocale(req: Request): Locale {
  const explicit = req.headers.get("X-Locale")?.toLowerCase();
  if (explicit === "es" || explicit === "en") return explicit;
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(/movepilot_locale=(en|es)/);
  if (match?.[1] === "es") return "es";
  if (match?.[1] === "en") return "en";
  const header = req.headers.get("Accept-Language")?.toLowerCase() ?? "";
  if (header.startsWith("es")) return "es";
  return "en";
}

export function jsonError(key: ApiErrorKey, status: number, locale?: Locale) {
  const loc = locale ?? "en";
  return NextResponse.json({ error: apiErrorMessage(key, loc), errorKey: key }, { status });
}
