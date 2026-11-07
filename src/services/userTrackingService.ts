import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, FirebaseUser } from './firebase.ts';
import { isCreatorAdmin } from './adminAuth.ts';

export interface DetectedLocation {
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  formatted: string;
  source: 'gps' | 'ip' | 'fallback';
}

let cachedUserLocation: string = '';

export function getCachedUserLocation(): string {
  if (cachedUserLocation) return cachedUserLocation;
  try {
    const saved = localStorage.getItem('gkedit_cached_location');
    if (saved) {
      cachedUserLocation = saved;
      return saved;
    }
  } catch {}
  return '';
}

export function setCachedUserLocation(loc: string): void {
  if (!loc) return;
  cachedUserLocation = loc;
  try {
    localStorage.setItem('gkedit_cached_location', loc);
  } catch {}
}

/**
 * Attempts high-precision GPS geolocation with reverse geocoding first.
 * If permission is denied, unavailable, or times out, cleanly falls back to IP-based lookup via https://ipapi.co/json/.
 */
export async function detectUserLocation(): Promise<DetectedLocation> {
  // 1. Try high-precision device GPS
  if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 6000,
          maximumAge: 60000,
          enableHighAccuracy: true,
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to resolve city & state/region
      try {
        const geoRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const city = geoData.city || geoData.locality || '';
          const region = geoData.principalSubdivision || '';
          const country = geoData.countryName || '';
          const parts = [city, region, country].filter(Boolean);
          const formatted = parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;

          const resLoc: DetectedLocation = {
            city,
            region,
            country,
            latitude,
            longitude,
            formatted,
            source: 'gps',
          };
          setCachedUserLocation(formatted);
          return resLoc;
        }
      } catch (revErr) {
        console.warn('GPS reverse geocode note, using coordinates:', revErr);
      }

      const resGps: DetectedLocation = {
        latitude,
        longitude,
        formatted: `${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°`,
        source: 'gps',
      };
      setCachedUserLocation(resGps.formatted);
      return resGps;
    } catch (gpsErr) {
      // Geolocation denied, unavailable, or timed out -> Proceed to IP fallback
      console.info('GPS geolocation unavailable/dismissed, falling back to IP location lookup.');
    }
  }

  // 2. IP-based location lookup fallback via https://ipapi.co/json/
  try {
    const ipRes = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000),
    });
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      const city = ipData.city || '';
      const region = ipData.region || ipData.region_code || '';
      const country = ipData.country_name || '';
      const parts = [city, region, country].filter(Boolean);
      const formatted = parts.length > 0 ? parts.join(', ') : 'Global Network';

      const resIp: DetectedLocation = {
        city,
        region,
        country,
        latitude: ipData.latitude,
        longitude: ipData.longitude,
        formatted,
        source: 'ip',
      };
      setCachedUserLocation(formatted);
      return resIp;
    }
  } catch (ipErr) {
    console.warn('IP location service fallback note:', ipErr);
  }

  // 3. Clean default fallback
  return {
    formatted: 'Unknown Location',
    source: 'fallback',
  };
}

export interface DetectedClientDevice {
  browser: string;
  browserVersion: string;
  os: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  screenResolution: string;
  viewportSize: string;
  pixelRatio: number;
  language: string;
  timeZone: string;
  onlineStatus: string;
  connectionType?: string;
  cpuCores?: number;
  memoryGB?: number;
  touchSupport: boolean;
  userAgent: string;
}

/**
 * Extracts comprehensive browser, OS, hardware, and runtime environment metadata
 * from the active browser session.
 */
export function detectClientDevice(): DetectedClientDevice {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      browser: 'Unknown Browser',
      browserVersion: 'N/A',
      os: 'Unknown OS',
      deviceType: 'Desktop',
      screenResolution: 'N/A',
      viewportSize: 'N/A',
      pixelRatio: 1,
      language: 'en',
      timeZone: 'UTC',
      onlineStatus: 'Online',
      connectionType: 'Broadband',
      touchSupport: false,
      userAgent: 'N/A',
    };
  }

  const ua = navigator.userAgent || '';

  // 1. Operating System Detection
  let os = 'Unknown OS';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10 / 11';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.2/i.test(ua)) os = 'Windows 8';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPad|iPadOS/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) os = 'iPadOS';
  else if (/iPhone/i.test(ua)) os = 'iOS (iPhone)';
  else if (/Android/i.test(ua)) {
    const match = ua.match(/Android\s+([0-9.]+)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    const match = ua.match(/Mac OS X\s+([0-9_]+)/i);
    os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS';
  } else if (/CrOS/i.test(ua)) os = 'ChromeOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // 2. Browser & Version Detection
  let browser = 'Unknown Browser';
  let browserVersion = '';

  if (/Edg\/([0-9.]+)/i.test(ua)) {
    browser = 'Microsoft Edge';
    browserVersion = ua.match(/Edg\/([0-9.]+)/i)?.[1] || '';
  } else if (/OPR\/([0-9.]+)/i.test(ua) || /Opera/i.test(ua)) {
    browser = 'Opera';
    browserVersion = ua.match(/OPR\/([0-9.]+)/i)?.[1] || '';
  } else if (/SamsungBrowser\/([0-9.]+)/i.test(ua)) {
    browser = 'Samsung Internet';
    browserVersion = ua.match(/SamsungBrowser\/([0-9.]+)/i)?.[1] || '';
  } else if (/Chrome\/([0-9.]+)/i.test(ua)) {
    browser = 'Google Chrome';
    browserVersion = ua.match(/Chrome\/([0-9.]+)/i)?.[1] || '';
  } else if (/Firefox\/([0-9.]+)/i.test(ua)) {
    browser = 'Mozilla Firefox';
    browserVersion = ua.match(/Firefox\/([0-9.]+)/i)?.[1] || '';
  } else if (/Version\/([0-9.]+).*Safari/i.test(ua)) {
    browser = 'Apple Safari';
    browserVersion = ua.match(/Version\/([0-9.]+)/i)?.[1] || '';
  }

  // 3. Device Form Factor
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  const isTablet = /iPad|Tablet|PlayBook/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobile = /Mobile|iPhone|Android|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  if (isTablet) {
    deviceType = 'Tablet';
  } else if (isMobile) {
    deviceType = 'Mobile';
  } else {
    deviceType = 'Desktop';
  }

  // 4. Connection Details
  const navConn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  let connectionType = navigator.onLine ? 'Broadband / WiFi' : 'Offline';
  if (navConn?.effectiveType) {
    connectionType = `${navConn.effectiveType.toUpperCase()} ${navConn.downlink ? `(${navConn.downlink} Mbps)` : ''}`.trim();
  }

  // 5. Display & Hardware Properties
  const screenResolution = typeof window.screen !== 'undefined' ? `${window.screen.width} × ${window.screen.height}` : 'N/A';
  const viewportSize = `${window.innerWidth} × ${window.innerHeight}`;
  const pixelRatio = window.devicePixelRatio ? Math.round(window.devicePixelRatio * 10) / 10 : 1;

  // 6. Timezone & Localization
  let timeZone = 'UTC';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {}

  const language = navigator.language || (navigator.languages && navigator.languages[0]) || 'en-US';
  const touchSupport = 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
  const cpuCores = navigator.hardwareConcurrency || undefined;
  const memoryGB = (navigator as any).deviceMemory || undefined;

  return {
    browser,
    browserVersion,
    os,
    deviceType,
    screenResolution,
    viewportSize,
    pixelRatio,
    language,
    timeZone,
    onlineStatus: navigator.onLine ? 'Online' : 'Offline',
    connectionType,
    cpuCores,
    memoryGB,
    touchSupport,
    userAgent: ua,
  };
}

/**
 * Automatically tracks and synchronizes authenticated user profile, location,
 * and browser/OS session telemetry into the Firestore path: users/{userId}.
 */
export async function trackUserAuthentication(user: FirebaseUser | { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null }): Promise<void> {
  if (!user || !user.uid) return;

  const userId = user.uid;
  const userRef = doc(db, 'users', userId);

  try {
    // 1. Detect location & device telemetry concurrently
    const [location, device] = await Promise.all([
      detectUserLocation(),
      Promise.resolve(detectClientDevice()),
    ]);

    // 2. Check if user document already exists
    let isInitialRegistration = false;
    try {
      const existingDoc = await getDoc(userRef);
      isInitialRegistration = !existingDoc.exists();
    } catch {
      // If read fails or doc doesn't exist, treat as creation
      isInitialRegistration = true;
    }

    const email = (user.email || '').trim().toLowerCase();
    const displayName = user.displayName?.trim() || (email ? email.split('@')[0] : 'Anonymous');
    const photoURL = user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`;
    const isAdmin = isCreatorAdmin(email);

    // 3. Prepare payload conforming to Firestore schema
    const payload: Record<string, any> = {
      uid: userId,
      id: userId,
      displayName,
      name: displayName,
      email,
      photoURL,
      avatar: photoURL,
      role: isAdmin ? 'creator' : 'explorer',
      location: {
        city: location.city || '',
        region: location.region || '',
        country: location.country || '',
        latitude: location.latitude ?? null,
        longitude: location.longitude ?? null,
        formatted: location.formatted,
        source: location.source,
      },
      device: {
        browser: device.browser,
        browserVersion: device.browserVersion,
        os: device.os,
        deviceType: device.deviceType,
        screenResolution: device.screenResolution,
        viewportSize: device.viewportSize,
        pixelRatio: device.pixelRatio,
        language: device.language,
        timeZone: device.timeZone,
        onlineStatus: device.onlineStatus,
        connectionType: device.connectionType || 'Broadband',
        cpuCores: device.cpuCores ?? null,
        memoryGB: device.memoryGB ?? null,
        touchSupport: device.touchSupport,
        userAgent: device.userAgent,
      },
      lastActive: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (isInitialRegistration) {
      payload.createdAt = serverTimestamp();
    }

    // 4. Merge document in Firestore users/{userId}
    await setDoc(userRef, payload, { merge: true });
  } catch (error) {
    console.error(`Failed to track user activity for ${userId}:`, error);
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
}
