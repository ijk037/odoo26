/**
 * Haversine formula — calculate distance between two GPS coordinates in meters.
 * This runs server-side only. Never expose company coordinates to the client.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Returns true if employee is within the allowed radius of the company.
 */
export function isWithinRadius(
  employeeLat: number,
  employeeLon: number,
  companyLat: number,
  companyLon: number,
  allowedRadiusMeters: number
): { valid: boolean; distance: number } {
  const distance = haversineDistance(
    employeeLat,
    employeeLon,
    companyLat,
    companyLon
  )
  return { valid: distance <= allowedRadiusMeters, distance }
}
