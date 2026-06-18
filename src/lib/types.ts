export type TaskStatus = "completed" | "in_progress" | "pending" | "blocked";
export type TaskPriority = "high" | "medium" | "low";
export type DocumentStatus = "verified" | "pending" | "expired" | "missing";

export type UtilityCategory =
  | "electricity"
  | "water"
  | "gas"
  | "internet"
  | "fiber"
  | "cable"
  | "waste"
  | "security";

export interface UserProfile {
  name: string;
  email: string;
  origin: string;
  destination: string;
  destinationAddress: string;
  moveDate: string;
  household: string;
  pets: boolean;
  vehicles: string[];
  rentalPreference: string;
  budget: number;
  needsHousingHelp: boolean;
  needsVehicleTransport: boolean;
}

export interface BudgetItem {
  id: string;
  category: string;
  estimated: number;
  actual: number;
  cheapestOption?: string;
  notes?: string;
}

export interface ChecklistTask {
  id: string;
  title: string;
  category: string;
  status: TaskStatus;
  dueDate: string;
  priority: TaskPriority;
  notes?: string;
  assigneeEmail?: string;
}

export type {
  InventoryBox,
  InventoryBoxStatus,
  InventoryRoomKey,
} from "@/lib/inventory/types";

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  status: DocumentStatus;
  uploadedAt?: string;
  expiresAt?: string;
  mimeType?: string;
}

export interface MarketplaceService {
  id: string;
  provider: string;
  category: string;
  estimatedPrice: number;
  rating: number;
  description: string;
}

export interface TruckOption {
  id: string;
  company: string;
  estimatedPrice: number;
  vehicleSize: string;
  mileagePolicy: string;
  pros: string[];
  cons: string[];
  bestFor: string;
  type: "truck" | "trailer";
}

export interface RouteStop {
  id: string;
  name: string;
  type: "gas" | "hotel" | "rest" | "pet_hotel";
  location: string;
  notes?: string;
  lat?: number;
  lon?: number;
  estimatedPrice?: number;
  gasPricePerGallon?: number;
  /** True for EV charging stops along the route. */
  isElectric?: boolean;
}

export interface CityMetric {
  label: string;
  originValue: string;
  destinationValue: string;
  trend?: "better" | "worse" | "neutral";
}

export interface MovingPlanWeek {
  week: number;
  label: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  kind?: "before" | "move_day" | "after";
  tasks: string[];
  status: "completed" | "current" | "upcoming";
}

export interface VehicleOption {
  id: string;
  title: string;
  description: string;
  estimatedCost: number;
  fuelEstimate?: number;
  wearAndTear?: number;
  recommended?: boolean;
}

export interface AlertItem {
  id: string;
  type: "warning" | "info" | "success";
  title: string;
  message: string;
}

export interface AIQuickQuestion {
  id: string;
  question: string;
  response: string;
}

export interface DestinationUtilityProvider {
  id: string;
  name: string;
  category: UtilityCategory;
  categoryLabel: string;
  rank: number;
  isBestPick: boolean;
  availableAtAddress: boolean;
  estimatedMonthlyPrice: number;
  priceUnit: string;
  speedOrCapacity?: string;
  rating: number;
  coverageNote: string;
  pros: string[];
  cons: string[];
  setupFee?: number;
  contractMonths?: number;
  websiteUrl?: string;
}
