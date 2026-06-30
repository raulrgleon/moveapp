/** Recommended driving stretch before a rest / bathroom break. */
export const REST_BREAK_INTERVAL_HOURS = 3;

export interface RestBreakMarker {
  hour: number;
  mile: number;
  index: number;
}

/** Break points every 3 hours of driving (not at departure or arrival). */
export function computeRestBreakMarkers(
  durationHours: number,
  distanceMiles: number
): RestBreakMarker[] {
  if (
    !Number.isFinite(durationHours) ||
    !Number.isFinite(distanceMiles) ||
    durationHours <= REST_BREAK_INTERVAL_HOURS ||
    distanceMiles <= 0
  ) {
    return [];
  }

  const markers: RestBreakMarker[] = [];
  let index = 0;
  for (
    let hour = REST_BREAK_INTERVAL_HOURS;
    hour < durationHours - 0.25;
    hour += REST_BREAK_INTERVAL_HOURS
  ) {
    markers.push({
      hour,
      mile: Math.max(1, Math.round((hour / durationHours) * distanceMiles)),
      index: ++index,
    });
  }
  return markers;
}

export function estimateRestBreakCount(durationHours: number): number {
  return computeRestBreakMarkers(durationHours, 1).length;
}
