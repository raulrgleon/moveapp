export function shoppingListStorageKey(scope: {
  userId?: string;
  email?: string;
  origin?: string;
  destination?: string;
  moveDate?: string;
}): string {
  const id = scope.userId ?? scope.email ?? "guest";
  return `movepilot_shopping_v2_${[id, scope.origin ?? "", scope.destination ?? "", scope.moveDate ?? ""].join("|")}`;
}
