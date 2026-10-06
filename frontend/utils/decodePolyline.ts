export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Converts a Google encoded polyline into map coordinates.
 * Google Routes API polylines use precision 5.
 */
export function decodePolyline(
  encoded: string | null | undefined
): MapCoordinate[] {
  if (!encoded) return [];

  const coordinates: MapCoordinate[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      if (index >= encoded.length) return coordinates;

      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const latitudeChange =
      result & 1 ? ~(result >> 1) : result >> 1;

    latitude += latitudeChange;

    result = 0;
    shift = 0;

    do {
      if (index >= encoded.length) return coordinates;

      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const longitudeChange =
      result & 1 ? ~(result >> 1) : result >> 1;

    longitude += longitudeChange;

    coordinates.push({
      latitude: latitude / 1e5,
      longitude: longitude / 1e5,
    });
  }

  return coordinates;
}