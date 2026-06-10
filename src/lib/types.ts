export type TaskStatus = "completed" | "in_progress" | "pending" | "blocked";
export type TaskPriority = "high" | "medium" | "low";
export type DocumentStatus = "verified" | "pending" | "expired" | "missing";

export interface UserProfile {
  name: string;
  email: string;
  origin: string;
  destination: string;
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
}

export interface InventoryBox {
  id: string;
  boxNumber: number;
  room: string;
  contents: string;
  hasPhoto: boolean;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  status: DocumentStatus;
  uploadedAt?: string;
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
