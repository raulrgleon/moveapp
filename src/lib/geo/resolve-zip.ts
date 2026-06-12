const USER_AGENT = "MovePilotAI/1.0 (moving dashboard; contact@movepilot.ai)";

function extractZip(postcode?: string): string | null {
  if (!postcode) return null;
  const match = postcode.match(/\d{5}/);
  return match ? match[0] : null;
}

async function nominatimFetch(url: URL) {
  return fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 86400 },
  });
}

async function reverseGeocodeZip(lat: number, lon: number): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const res = await nominatimFetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { address?: { postcode?: string } };
  return extractZip(data.address?.postcode);
}

export async function resolveZipFromQuery(query: string): Promise<string | null> {
  const q = query.trim();
  if (q.length < 2) return null;

  const directZip = q.match(/^\d{5}(-\d{4})?$/);
  if (directZip) return directZip[0].slice(0, 5);

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "us");

    const res = await nominatimFetch(url);
    if (!res.ok) return null;

    const data = (await res.json()) as {
      lat?: string;
      lon?: string;
      address?: { postcode?: string };
    }[];

    const first = data[0];
    if (!first) return null;

    const fromSearch = extractZip(first.address?.postcode);
    if (fromSearch) return fromSearch;

    const lat = first.lat ? parseFloat(first.lat) : NaN;
    const lon = first.lon ? parseFloat(first.lon) : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return reverseGeocodeZip(lat, lon);
    }

    return null;
  } catch {
    return null;
  }
}
