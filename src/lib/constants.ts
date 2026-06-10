import {
  LayoutDashboard,
  Map,
  Wallet,
  Route,
  Truck,
  Car,
  Building2,
  CheckSquare,
  Package,
  FileText,
  Store,
  Bot,
  Settings,
  ClipboardList,
  Zap,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/moving-plan", label: "Moving Plan", icon: ClipboardList },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/route", label: "Route", icon: Route },
  { href: "/trucks", label: "Trucks & Trailers", icon: Truck },
  { href: "/vehicles", label: "Vehicles", icon: Car },
  { href: "/utilities", label: "Home Utilities", icon: Zap },
  { href: "/city-comparison", label: "City Comparison", icon: Building2 },
  { href: "/checklist", label: "Checklist", icon: CheckSquare },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const MOBILE_NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/utilities", label: "Utilities", icon: Zap },
  { href: "/checklist", label: "Tasks", icon: CheckSquare },
  { href: "/marketplace", label: "Services", icon: Store },
  { href: "/assistant", label: "AI", icon: Bot },
] as const;

export const UTILITY_CATEGORIES = [
  { id: "all", label: "All services" },
  { id: "electricity", label: "Electricity" },
  { id: "water", label: "Water & sewer" },
  { id: "gas", label: "Gas" },
  { id: "internet", label: "Internet" },
  { id: "fiber", label: "Fiber" },
  { id: "cable", label: "Cable & TV" },
  { id: "waste", label: "Waste & recycling" },
  { id: "security", label: "Home security" },
] as const;

export const CHECKLIST_CATEGORIES = [
  "Housing",
  "Utilities",
  "Address change",
  "Vehicle",
  "School",
  "Medical",
  "Pets",
  "Documents",
  "Packing",
  "Travel",
] as const;
