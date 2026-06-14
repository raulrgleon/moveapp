import type { Locale } from "@/lib/i18n";
import type { MoveProfile } from "@/lib/move-profile";

export function buildMovingPlanInsight(profile: MoveProfile, locale: Locale): string {
  const moveDate = new Date(profile.moveDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  moveDate.setHours(0, 0, 0, 0);
  const days = Math.round((moveDate.getTime() - today.getTime()) / 86400000);

  const origin = profile.origin.split(",")[0];
  const dest = profile.destination.split(",")[0];

  if (locale === "es") {
    if (days < 0) {
      return `Tu mudanza de ${origin} a ${dest} ya pasó. Usa el checklist para cerrar pendientes en tu nuevo hogar.`;
    }
    if (days === 0) {
      return `¡Hoy es el día! Enfócate en lo esencial: carga final, ruta, y marcar cajas entregadas en Inventario.`;
    }
    if (days <= 7) {
      return `Quedan ${days} días para llegar a ${dest}. Prioriza servicios, documentos y confirmar transporte esta semana.`;
    }
    if (days <= 30) {
      return `Con ${days} días hasta ${dest}, reserva camión o remolque, confirma utilities y empaca por habitaciones.`;
    }
    return `Tienes ${days} días para planificar ${origin} → ${dest}. Empieza por checklist y presupuesto; el cronograma abajo se ajusta a tu fecha.`;
  }

  if (days < 0) {
    return `Your ${origin} → ${dest} move date has passed. Use the checklist to finish settling in.`;
  }
  if (days === 0) {
    return `It's move day! Focus on final loading, your route, and marking delivered boxes in Inventory.`;
  }
  if (days <= 7) {
    return `${days} days until ${dest}. Prioritize utilities, documents, and confirming transport this week.`;
  }
  if (days <= 30) {
    return `With ${days} days until ${dest}, book truck or trailer, confirm utilities, and pack room by room.`;
  }
  return `${days} days to plan ${origin} → ${dest}. Start with checklist and budget — the timeline below follows your move date.`;
}
