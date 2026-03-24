import { haversineDistance, ADMIN_LAT, ADMIN_LON } from './haversine';

export interface GeoInfo {
  country: string;
  state: string;
  city: string;
  latitude: number;
  longitude: number;
  distanceFromAdmin: number;
}

export async function getGeoFromIP(ip: string): Promise<GeoInfo | null> {
  // Skip private/local IPs
  if (
    !ip ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.')
  ) {
    return {
      country: 'Local',
      state: 'Local',
      city: 'Local',
      latitude: ADMIN_LAT,
      longitude: ADMIN_LON,
      distanceFromAdmin: 0,
    };
  }

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'ViralBoostAI/1.0' },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.error) return null;

    const lat = parseFloat(data.latitude) || 0;
    const lon = parseFloat(data.longitude) || 0;

    return {
      country: data.country_name || 'Unknown',
      state: data.region || 'Unknown',
      city: data.city || 'Unknown',
      latitude: lat,
      longitude: lon,
      distanceFromAdmin: haversineDistance(ADMIN_LAT, ADMIN_LON, lat, lon),
    };
  } catch {
    return null;
  }
}

export function getClientIP(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  if (xff) return xff.split(',')[0].trim();
  if (realIp) return realIp.trim();
  return '127.0.0.1';
}
