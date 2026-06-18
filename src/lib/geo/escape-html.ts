/** Escape text for safe HTML interpolation in Leaflet popups. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Compact lon,lat pairs for weather API (sampled along route). */
export function encodeRouteCoords(coords: [number, number][], maxPoints = 48): string {
  if (!coords.length) return "";
  const step = Math.max(1, Math.floor(coords.length / maxPoints));
  const parts: string[] = [];
  for (let i = 0; i < coords.length; i += step) {
    const [lon, lat] = coords[i];
    parts.push(`${lon},${lat}`);
  }
  const last = coords[coords.length - 1];
  const tail = `${last[0]},${last[1]}`;
  if (parts[parts.length - 1] !== tail) parts.push(tail);
  return parts.join(";");
}
