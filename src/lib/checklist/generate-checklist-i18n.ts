import type { Locale } from "@/lib/i18n";
import type { MoveProfile } from "@/lib/move-profile";
import type { ChecklistTask } from "@/lib/types";
import {
  addDaysLocal,
  daysBetweenLocal,
  formatLocalISO,
  parseLocalDate,
  startOfDay,
} from "@/lib/dates/local-date";

const IDEAL_PLAN_DAYS = 56;

interface TaskTemplate {
  title: string;
  category: string;
  daysBeforeMove: number;
  priority: ChecklistTask["priority"];
}

const EN_BASE_TASKS: TaskTemplate[] = [
  { title: "Set moving budget and timeline", category: "Planning", daysBeforeMove: 56, priority: "high" },
  { title: "Research destination neighborhoods", category: "Housing", daysBeforeMove: 49, priority: "medium" },
  { title: "Notify current landlord of move-out date", category: "Housing", daysBeforeMove: 45, priority: "high" },
  { title: "Compare truck vs trailer vs movers", category: "Travel", daysBeforeMove: 42, priority: "high" },
  { title: "Reserve moving truck or trailer", category: "Travel", daysBeforeMove: 35, priority: "high" },
  { title: "Start decluttering and donating items", category: "Packing", daysBeforeMove: 35, priority: "medium" },
  { title: "Order packing supplies", category: "Packing", daysBeforeMove: 28, priority: "medium" },
  { title: "Set up utilities at new address", category: "Utilities", daysBeforeMove: 21, priority: "high" },
  { title: "Update USPS mail forwarding", category: "Address change", daysBeforeMove: 21, priority: "high" },
  { title: "Transfer or cancel internet service", category: "Utilities", daysBeforeMove: 18, priority: "medium" },
  { title: "Pack non-essential rooms", category: "Packing", daysBeforeMove: 14, priority: "medium" },
  { title: "Confirm moving day logistics", category: "Travel", daysBeforeMove: 7, priority: "high" },
  { title: "Pack essentials box for first night", category: "Packing", daysBeforeMove: 3, priority: "high" },
  { title: "Final walkthrough of old home", category: "Housing", daysBeforeMove: 1, priority: "high" },
];

const ES_BASE_TASKS: TaskTemplate[] = [
  { title: "Definir presupuesto y cronograma de mudanza", category: "Planning", daysBeforeMove: 56, priority: "high" },
  { title: "Investigar barrios en el destino", category: "Housing", daysBeforeMove: 49, priority: "medium" },
  { title: "Notificar al arrendador la fecha de salida", category: "Housing", daysBeforeMove: 45, priority: "high" },
  { title: "Comparar camión vs remolque vs mudanceros", category: "Travel", daysBeforeMove: 42, priority: "high" },
  { title: "Reservar camión o remolque de mudanza", category: "Travel", daysBeforeMove: 35, priority: "high" },
  { title: "Empezar a despejar y donar artículos", category: "Packing", daysBeforeMove: 35, priority: "medium" },
  { title: "Pedir materiales de empaque", category: "Packing", daysBeforeMove: 28, priority: "medium" },
  { title: "Contratar servicios en la nueva dirección", category: "Utilities", daysBeforeMove: 21, priority: "high" },
  { title: "Actualizar reenvío de correo USPS", category: "Address change", daysBeforeMove: 21, priority: "high" },
  { title: "Transferir o cancelar servicio de internet", category: "Utilities", daysBeforeMove: 18, priority: "medium" },
  { title: "Empacar habitaciones no esenciales", category: "Packing", daysBeforeMove: 14, priority: "medium" },
  { title: "Confirmar logística del día de mudanza", category: "Travel", daysBeforeMove: 7, priority: "high" },
  { title: "Empacar caja de esenciales para la primera noche", category: "Packing", daysBeforeMove: 3, priority: "high" },
  { title: "Recorrido final del hogar anterior", category: "Housing", daysBeforeMove: 1, priority: "high" },
];

const EN_HOUSING_TASKS: TaskTemplate[] = [
  { title: "Apply for housing at destination", category: "Housing", daysBeforeMove: 42, priority: "high" },
  { title: "Review lease or purchase agreement", category: "Documents", daysBeforeMove: 28, priority: "high" },
];

const ES_HOUSING_TASKS: TaskTemplate[] = [
  { title: "Solicitar vivienda en el destino", category: "Housing", daysBeforeMove: 42, priority: "high" },
  { title: "Revisar contrato de arrendamiento o compra", category: "Documents", daysBeforeMove: 28, priority: "high" },
];

const EN_PET_TASKS: TaskTemplate[] = [
  { title: "Update pet vaccination records", category: "Pets", daysBeforeMove: 30, priority: "medium" },
  { title: "Find pet-friendly hotels for travel days", category: "Pets", daysBeforeMove: 21, priority: "medium" },
];

const ES_PET_TASKS: TaskTemplate[] = [
  { title: "Actualizar registros de vacunas de mascotas", category: "Pets", daysBeforeMove: 30, priority: "medium" },
  { title: "Buscar hoteles pet-friendly para el viaje", category: "Pets", daysBeforeMove: 21, priority: "medium" },
];

const EN_VEHICLE_TASKS: TaskTemplate[] = [
  { title: "Plan vehicle transport or towing setup", category: "Vehicle", daysBeforeMove: 35, priority: "high" },
  { title: "Update auto insurance for new state", category: "Vehicle", daysBeforeMove: 14, priority: "high" },
  { title: "Register vehicle in new state", category: "Vehicle", daysBeforeMove: -14, priority: "medium" },
];

const ES_VEHICLE_TASKS: TaskTemplate[] = [
  { title: "Planificar transporte o remolque de vehículos", category: "Vehicle", daysBeforeMove: 35, priority: "high" },
  { title: "Actualizar seguro de auto para el nuevo estado", category: "Vehicle", daysBeforeMove: 14, priority: "high" },
  { title: "Registrar vehículo en el nuevo estado", category: "Vehicle", daysBeforeMove: -14, priority: "medium" },
];

const EN_CHILD_TASKS: TaskTemplate[] = [
  { title: "Research schools at destination", category: "School", daysBeforeMove: 49, priority: "high" },
  { title: "Gather school enrollment documents", category: "School", daysBeforeMove: 28, priority: "high" },
];

const ES_CHILD_TASKS: TaskTemplate[] = [
  { title: "Investigar escuelas en el destino", category: "School", daysBeforeMove: 49, priority: "high" },
  { title: "Reunir documentos de inscripción escolar", category: "School", daysBeforeMove: 28, priority: "high" },
];

function hasChild(household: string): boolean {
  return /child|kid|niño|hijo|daughter|son/i.test(household);
}

function templatesForLocale(locale: Locale) {
  const es = locale === "es";
  return {
    base: es ? ES_BASE_TASKS : EN_BASE_TASKS,
    housing: es ? ES_HOUSING_TASKS : EN_HOUSING_TASKS,
    pets: es ? ES_PET_TASKS : EN_PET_TASKS,
    vehicle: EN_VEHICLE_TASKS,
    vehicleEs: ES_VEHICLE_TASKS,
    child: es ? ES_CHILD_TASKS : EN_CHILD_TASKS,
    licenseTitle: (dest: string) =>
      es
        ? `Actualizar licencia de conducir — ${dest}`
        : `Update driver's license — ${dest}`,
  };
}

export function generateChecklistFromProfileI18n(
  profile: MoveProfile,
  locale: Locale = "en"
): Omit<ChecklistTask, "id">[] {
  const moveDate = parseLocalDate(profile.moveDate);
  const today = startOfDay(new Date());
  const daysUntilMove = Math.max(0, daysBetweenLocal(today, moveDate));
  const t = templatesForLocale(locale);
  const templates = [...t.base];

  if (profile.needsHousingHelp) templates.push(...t.housing);
  if (profile.pets) templates.push(...t.pets);
  if (profile.needsVehicleTransport) {
    templates.push(...(locale === "es" ? t.vehicleEs : t.vehicle));
  }
  if (hasChild(profile.household)) templates.push(...t.child);

  const destCity = profile.destination.split(",")[0]?.trim() || (locale === "es" ? "nuevo estado" : "new state");
  templates.push({
    title: t.licenseTitle(destCity),
    category: "Address change",
    daysBeforeMove: -30,
    priority: "medium",
  });

  return templates.map((task) => {
    let daysBefore = task.daysBeforeMove;

    if (daysBefore > 0 && daysUntilMove > 0 && daysBefore > daysUntilMove) {
      const scale = daysUntilMove / IDEAL_PLAN_DAYS;
      daysBefore = Math.max(1, Math.round(task.daysBeforeMove * scale));
    }

    let due = addDaysLocal(moveDate, -daysBefore);
    if (daysBefore > 0 && due < today) {
      due = today;
    }

    return {
      title: task.title,
      category: task.category,
      status: "pending" as const,
      dueDate: formatLocalISO(due),
      priority: task.priority,
    };
  });
}

const EN_STARTER_DOCS = [
  { name: "Lease or purchase agreement", category: "Housing", status: "pending" as const },
  { name: "Proof of identity", category: "Documents", status: "pending" as const },
  { name: "Renter's or homeowner's insurance", category: "Insurance", status: "pending" as const },
];

const ES_STARTER_DOCS = [
  { name: "Contrato de arrendamiento o compra", category: "Housing", status: "pending" as const },
  { name: "Prueba de identidad", category: "Documents", status: "pending" as const },
  { name: "Seguro de inquilino o propietario", category: "Insurance", status: "pending" as const },
];

export function generateStarterDocumentsI18n(profile: MoveProfile, locale: Locale = "en") {
  const docs = locale === "es" ? [...ES_STARTER_DOCS] : [...EN_STARTER_DOCS];
  if (profile.pets) {
    docs.push({
      name: locale === "es" ? "Registros de vacunas de mascotas" : "Pet vaccination records",
      category: "Pets",
      status: "pending",
    });
  }
  if (hasChild(profile.household)) {
    docs.push({
      name: locale === "es" ? "Formularios de inscripción escolar" : "School enrollment forms",
      category: "School",
      status: "pending",
    });
  }
  return docs;
}
