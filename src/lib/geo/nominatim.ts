export interface AddressSuggestion {
  placeId: string;
  displayName: string;
  lat: number;
  lon: number;
  city?: string;
  state?: string;
  postcode?: string;
  street?: string;
  country?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export function parseNominatimResult(item: NominatimResult): AddressSuggestion {
  const addr = item.address ?? {};
  const city = addr.city ?? addr.town ?? addr.village ?? "";
  const street = [addr.house_number, addr.road].filter(Boolean).join(" ");

  return {
    placeId: String(item.place_id),
    displayName: item.display_name,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    city,
    state: addr.state,
    postcode: addr.postcode,
    street: street || undefined,
    country: addr.country,
  };
}

export function formatDestinationLabel(suggestion: AddressSuggestion): string {
  const parts = [suggestion.city, suggestion.state].filter(Boolean);
  return parts.join(", ") || suggestion.displayName.split(",").slice(-2).join(",").trim();
}
