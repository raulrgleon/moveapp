/** English category strings stored in DB — mapped to i18n keys for display. */
const BUDGET_CATEGORY_KEYS: Record<string, string> = {
  Fuel: "budget.categories.fuel",
  "Truck rental": "budget.categories.truckRental",
  "Trailer rental": "budget.categories.trailerRental",
  "Professional movers": "budget.categories.professionalMovers",
  "Packing supplies": "budget.categories.packingSupplies",
  Hotels: "budget.categories.hotels",
  "Meals on the road": "budget.categories.mealsOnRoad",
  "Utility setup fees": "budget.categories.utilitySetupFees",
  "Insurance updates": "budget.categories.insuranceUpdates",
  "Housing deposit": "budget.categories.housingDeposit",
  "Vehicle transport": "budget.categories.vehicleTransport",
  Miscellaneous: "budget.categories.miscellaneous",
};

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function budgetCategoryLabel(category: string, t: TranslateFn): string {
  const key = BUDGET_CATEGORY_KEYS[category];
  if (key) {
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return category;
}
