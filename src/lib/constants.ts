import {
  LayoutDashboard,
  Wallet,
  Route,
  Truck,
  Car,
  Building2,
  CheckSquare,
  Package,
  FileText,
  Settings,
  ClipboardList,
  Zap,
  Shield,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/moving-plan", labelKey: "nav.movingPlan", icon: ClipboardList },
  { href: "/budget", labelKey: "nav.budget", icon: Wallet },
  { href: "/route", labelKey: "nav.route", icon: Route },
  { href: "/trucks", labelKey: "nav.trucks", icon: Truck },
  { href: "/vehicles", labelKey: "nav.vehicles", icon: Car },
  { href: "/utilities", labelKey: "nav.utilities", icon: Zap },
  { href: "/city-comparison", labelKey: "nav.cityComparison", icon: Building2 },
  { href: "/checklist", labelKey: "nav.checklist", icon: CheckSquare },
  { href: "/inventory", labelKey: "nav.inventory", icon: Package },
  { href: "/documents", labelKey: "nav.documents", icon: FileText },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
] as const;

export const ADMIN_NAV_ITEM = {
  href: "/admin",
  labelKey: "nav.admin",
  icon: Shield,
} as const;

export const MOBILE_NAV_ITEMS = [
  { href: "/dashboard", labelKey: "mobileNav.home", icon: LayoutDashboard },
  { href: "/moving-plan", labelKey: "mobileNav.plan", icon: ClipboardList },
  { href: "/checklist", labelKey: "mobileNav.tasks", icon: CheckSquare },
  { href: "/budget", labelKey: "mobileNav.budget", icon: Wallet },
  { href: "/settings", labelKey: "mobileNav.settings", icon: Settings },
] as const;

export const UTILITY_CATEGORIES = [
  { id: "all", labelKey: "utilityCategories.all" },
  { id: "electricity", labelKey: "utilityCategories.electricity" },
  { id: "water", labelKey: "utilityCategories.water" },
  { id: "gas", labelKey: "utilityCategories.gas" },
  { id: "internet", labelKey: "utilityCategories.internet" },
  { id: "fiber", labelKey: "utilityCategories.fiber" },
  { id: "cable", labelKey: "utilityCategories.cable" },
  { id: "waste", labelKey: "utilityCategories.waste" },
  { id: "security", labelKey: "utilityCategories.security" },
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
