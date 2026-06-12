import type { MoveProfile } from "@/lib/move-profile";
import type { ChecklistTask } from "@/lib/types";

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface TaskTemplate {
  title: string;
  category: string;
  daysBeforeMove: number;
  priority: ChecklistTask["priority"];
}

const BASE_TASKS: TaskTemplate[] = [
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

const HOUSING_TASKS: TaskTemplate[] = [
  { title: "Apply for housing at destination", category: "Housing", daysBeforeMove: 42, priority: "high" },
  { title: "Review lease or purchase agreement", category: "Documents", daysBeforeMove: 28, priority: "high" },
];

const PET_TASKS: TaskTemplate[] = [
  { title: "Update pet vaccination records", category: "Pets", daysBeforeMove: 30, priority: "medium" },
  { title: "Find pet-friendly hotels for travel days", category: "Pets", daysBeforeMove: 21, priority: "medium" },
];

const VEHICLE_TASKS: TaskTemplate[] = [
  { title: "Plan vehicle transport or towing setup", category: "Vehicle", daysBeforeMove: 35, priority: "high" },
  { title: "Update auto insurance for new state", category: "Vehicle", daysBeforeMove: 14, priority: "high" },
  { title: "Register vehicle in new state", category: "Vehicle", daysBeforeMove: -14, priority: "medium" },
];

const CHILD_TASKS: TaskTemplate[] = [
  { title: "Research schools at destination", category: "School", daysBeforeMove: 49, priority: "high" },
  { title: "Gather school enrollment documents", category: "School", daysBeforeMove: 28, priority: "high" },
];

function hasChild(household: string): boolean {
  return /child|kid|niño|hijo|daughter|son/i.test(household);
}

export function generateChecklistFromProfile(profile: MoveProfile): Omit<ChecklistTask, "id">[] {
  const moveDate = new Date(profile.moveDate);
  const templates = [...BASE_TASKS];

  if (profile.needsHousingHelp) templates.push(...HOUSING_TASKS);
  if (profile.pets) templates.push(...PET_TASKS);
  if (profile.needsVehicleTransport) templates.push(...VEHICLE_TASKS);
  if (hasChild(profile.household)) templates.push(...CHILD_TASKS);

  const destTasks: TaskTemplate[] = [
    {
      title: `Update driver's license — ${profile.destination.split(",")[0]?.trim() || "new state"}`,
      category: "Address change",
      daysBeforeMove: -30,
      priority: "medium",
    },
  ];
  templates.push(...destTasks);

  return templates.map((t) => ({
    title: t.title,
    category: t.category,
    status: "pending" as const,
    dueDate: fmt(addDays(moveDate, -t.daysBeforeMove)),
    priority: t.priority,
  }));
}

export function generateStarterDocuments(profile: MoveProfile) {
  const docs = [
    { name: "Lease or purchase agreement", category: "Housing", status: "pending" },
    { name: "Proof of identity", category: "Documents", status: "pending" },
    { name: "Renter's or homeowner's insurance", category: "Insurance", status: "pending" },
  ];
  if (profile.pets) {
    docs.push({ name: "Pet vaccination records", category: "Pets", status: "pending" });
  }
  if (hasChild(profile.household)) {
    docs.push({ name: "School enrollment forms", category: "School", status: "pending" });
  }
  return docs;
}
