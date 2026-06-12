/** Evenly sample points along a GeoJSON line (excluding endpoints). */
export function samplePointsAlongRoute(
  coordinates: [number, number][],
  sampleCount: number
): { lat: number; lon: number }[] {
  if (coordinates.length < 2 || sampleCount < 1) return [];

  const count = Math.min(sampleCount, coordinates.length - 2);
  const points: { lat: number; lon: number }[] = [];

  for (let i = 1; i <= count; i++) {
    const idx = Math.floor((coordinates.length - 1) * (i / (count + 1)));
    const [lon, lat] = coordinates[idx];
    points.push({ lat, lon });
  }

  return points;
}

export function weatherSampleCount(distanceMiles: number): number {
  if (distanceMiles < 200) return 3;
  if (distanceMiles < 600) return 4;
  if (distanceMiles < 1200) return 6;
  return 8;
}
