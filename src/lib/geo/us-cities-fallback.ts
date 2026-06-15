import type { AddressSuggestion } from "@/lib/geo/nominatim";

/** Major US cities for offline / API-failure fallback (name, state, lat, lon). */
const US_CITIES: { name: string; state: string; lat: number; lon: number }[] = [
  { name: "New York", state: "New York", lat: 40.7128, lon: -74.006 },
  { name: "Los Angeles", state: "California", lat: 34.0522, lon: -118.2437 },
  { name: "Chicago", state: "Illinois", lat: 41.8781, lon: -87.6298 },
  { name: "Houston", state: "Texas", lat: 29.7604, lon: -95.3698 },
  { name: "Phoenix", state: "Arizona", lat: 33.4484, lon: -112.074 },
  { name: "Philadelphia", state: "Pennsylvania", lat: 39.9526, lon: -75.1652 },
  { name: "San Antonio", state: "Texas", lat: 29.4241, lon: -98.4936 },
  { name: "San Diego", state: "California", lat: 32.7157, lon: -117.1611 },
  { name: "Dallas", state: "Texas", lat: 32.7767, lon: -96.797 },
  { name: "Austin", state: "Texas", lat: 30.2672, lon: -97.7431 },
  { name: "Jacksonville", state: "Florida", lat: 30.3322, lon: -81.6557 },
  { name: "San Jose", state: "California", lat: 37.3382, lon: -121.8863 },
  { name: "Fort Worth", state: "Texas", lat: 32.7555, lon: -97.3308 },
  { name: "Columbus", state: "Ohio", lat: 39.9612, lon: -82.9988 },
  { name: "Charlotte", state: "North Carolina", lat: 35.2271, lon: -80.8431 },
  { name: "Indianapolis", state: "Indiana", lat: 39.7684, lon: -86.1581 },
  { name: "San Francisco", state: "California", lat: 37.7749, lon: -122.4194 },
  { name: "Seattle", state: "Washington", lat: 47.6062, lon: -122.3321 },
  { name: "Denver", state: "Colorado", lat: 39.7392, lon: -104.9903 },
  { name: "Washington", state: "District of Columbia", lat: 38.9072, lon: -77.0369 },
  { name: "Nashville", state: "Tennessee", lat: 36.1627, lon: -86.7816 },
  { name: "Oklahoma City", state: "Oklahoma", lat: 35.4676, lon: -97.5164 },
  { name: "El Paso", state: "Texas", lat: 31.7619, lon: -106.485 },
  { name: "Boston", state: "Massachusetts", lat: 42.3601, lon: -71.0589 },
  { name: "Portland", state: "Oregon", lat: 45.5152, lon: -122.6784 },
  { name: "Las Vegas", state: "Nevada", lat: 36.1699, lon: -115.1398 },
  { name: "Detroit", state: "Michigan", lat: 42.3314, lon: -83.0458 },
  { name: "Memphis", state: "Tennessee", lat: 35.1495, lon: -90.049 },
  { name: "Louisville", state: "Kentucky", lat: 38.2527, lon: -85.7585 },
  { name: "Baltimore", state: "Maryland", lat: 39.2904, lon: -76.6122 },
  { name: "Milwaukee", state: "Wisconsin", lat: 43.0389, lon: -87.9065 },
  { name: "Albuquerque", state: "New Mexico", lat: 35.0844, lon: -106.6504 },
  { name: "Tucson", state: "Arizona", lat: 32.2226, lon: -110.9747 },
  { name: "Fresno", state: "California", lat: 36.7378, lon: -119.7871 },
  { name: "Sacramento", state: "California", lat: 38.5816, lon: -121.4944 },
  { name: "Atlanta", state: "Georgia", lat: 33.749, lon: -84.388 },
  { name: "Miami", state: "Florida", lat: 25.7617, lon: -80.1918 },
  { name: "Tampa", state: "Florida", lat: 27.9506, lon: -82.4572 },
  { name: "Orlando", state: "Florida", lat: 28.5383, lon: -81.3792 },
  { name: "Raleigh", state: "North Carolina", lat: 35.7796, lon: -78.6382 },
  { name: "Minneapolis", state: "Minnesota", lat: 44.9778, lon: -93.265 },
  { name: "Cleveland", state: "Ohio", lat: 41.4993, lon: -81.6944 },
  { name: "Kansas City", state: "Missouri", lat: 39.0997, lon: -94.5786 },
  { name: "St. Louis", state: "Missouri", lat: 38.627, lon: -90.1994 },
  { name: "Pittsburgh", state: "Pennsylvania", lat: 40.4406, lon: -79.9959 },
  { name: "Cincinnati", state: "Ohio", lat: 39.1031, lon: -84.512 },
  { name: "Salt Lake City", state: "Utah", lat: 40.7608, lon: -111.891 },
  { name: "Huntington", state: "West Virginia", lat: 38.4192, lon: -82.4452 },
  { name: "Charleston", state: "West Virginia", lat: 38.3498, lon: -81.6326 },
  { name: "Richmond", state: "Virginia", lat: 37.5407, lon: -77.436 },
  { name: "Virginia Beach", state: "Virginia", lat: 36.8529, lon: -75.978 },
  { name: "New Orleans", state: "Louisiana", lat: 29.9511, lon: -90.0715 },
  { name: "Honolulu", state: "Hawaii", lat: 21.3069, lon: -157.8583 },
  { name: "Anchorage", state: "Alaska", lat: 61.2181, lon: -149.9003 },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function searchUsCitiesFallback(query: string): AddressSuggestion[] {
  const q = normalize(query);
  if (q.length < 2) return [];

  const parts = q.split(",").map((p) => p.trim());
  const cityPart = parts[0];
  const statePart = parts[1] ?? "";

  const matches = US_CITIES.filter((c) => {
    const name = normalize(c.name);
    const state = normalize(c.state);
    const nameMatch = name.startsWith(cityPart) || name.includes(cityPart);
    const stateMatch = !statePart || state.startsWith(statePart) || state.includes(statePart);
    return nameMatch && stateMatch;
  });

  return matches.slice(0, 8).map((c, i) => ({
    placeId: `fallback-${c.name}-${c.state}-${i}`,
    displayName: `${c.name}, ${c.state}, United States`,
    lat: c.lat,
    lon: c.lon,
    city: c.name,
    state: c.state,
    country: "United States",
  }));
}
