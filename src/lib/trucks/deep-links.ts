export function buildTruckDeepLink(
  company: string,
  origin: string,
  destination: string,
  moveDate: string
): string {
  const pickup = encodeURIComponent(origin);
  const dropoff = encodeURIComponent(destination);
  const date = encodeURIComponent(moveDate);

  if (/u-?haul/i.test(company)) {
    return `https://www.uhaul.com/Truck-Rentals/?pickupLocation=${pickup}&dropoffLocation=${dropoff}&pickupDate=${date}`;
  }
  if (/penske/i.test(company)) {
    return `https://www.penske.com/truck-rental/reservation/?pickupLocation=${pickup}&dropoffLocation=${dropoff}&pickupDate=${date}`;
  }
  if (/budget/i.test(company)) {
    return `https://www.budgettruck.com/reservation.html?pickupLocation=${pickup}&dropoffLocation=${dropoff}&pickupDate=${date}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`${company} truck rental ${origin} ${destination}`)}`;
}
