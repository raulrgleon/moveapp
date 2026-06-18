/** Downsample GeoJSON [lon, lat] pairs for map display and API payloads. */
export function simplifyRouteCoordinates(
  coords: [number, number][],
  maxPoints = 200
): [number, number][] {
  if (coords.length <= maxPoints) return coords;
  const step = Math.max(1, Math.floor(coords.length / maxPoints));
  const simplified: [number, number][] = [];
  for (let i = 0; i < coords.length; i += step) {
    simplified.push(coords[i]);
  }
  const last = coords[coords.length - 1];
  const tail = simplified[simplified.length - 1];
  if (!tail || tail[0] !== last[0] || tail[1] !== last[1]) {
    simplified.push(last);
  }
  return simplified;
}
