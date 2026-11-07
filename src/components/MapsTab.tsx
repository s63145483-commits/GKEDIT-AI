import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  Search,
  MapPin,
  Navigation,
  ExternalLink,
  Building,
  Fuel,
  Utensils,
  Church,
  Radio,
  Wind,
  Droplets,
  CloudRain,
  Compass,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issues in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface PlaceResult {
  name: string;
  lat: number;
  lon: number;
  type?: string;
}

export interface MapWeatherData {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  weatherDescription: string;
  isDay: boolean;
}

// ============================================================================
// LOTTIE-STYLE ANIMATED WEATHER ICONS (Pure CSS/SVG GPU-Accelerated Animations)
// ============================================================================
export const LottieWeatherIcon = memo(function LottieWeatherIcon({
  code,
  className = 'w-12 h-12',
}: {
  code: number;
  className?: string;
}) {
  // 1. Clear Sky (WMO 0) -> Rotating golden sun with glowing rays
  if (code === 0) {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        {/* Rotating Sun Rays Ring */}
        <svg viewBox="0 0 100 100" className="w-full h-full anim-weather-sun-spin" aria-hidden="true">
          <circle cx="50" cy="50" r="18" fill="none" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <line
              key={i}
              x1="50"
              y1="16"
              x2="50"
              y2="7"
              stroke="#fbbf24"
              strokeWidth="4.5"
              strokeLinecap="round"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
        </svg>
        {/* Pulsing Sun Center Core */}
        <div className="absolute w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.85)] anim-weather-sun-pulse" />
      </div>
    );
  }

  // 2. Mainly Clear / Partly Cloudy (WMO 1, 2) -> Sun with drifting cloud
  if (code === 1 || code === 2) {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        {/* Background Sun Core */}
        <div className="absolute -top-1 -right-0.5 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.8)] anim-weather-sun-spin" />
        {/* Floating Drifting Cloud */}
        <svg viewBox="0 0 64 64" className="w-9 h-9 anim-weather-cloud-drift relative z-10 drop-shadow-md" aria-hidden="true">
          <defs>
            <linearGradient id="cloudGradPartly" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          <path
            d="M20 44 h24 a12 12 0 0 0 0 -24 a16 16 0 0 0 -30 -4 a10 10 0 0 0 -6 18 a8 8 0 0 0 12 10 z"
            fill="url(#cloudGradPartly)"
          />
        </svg>
      </div>
    );
  }

  // 3. Overcast (WMO 3) -> Layered pulsing clouds
  if (code === 3) {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-8 h-8 absolute top-0 -left-1 opacity-60 anim-weather-cloud-drift" aria-hidden="true">
          <path
            d="M20 44 h24 a12 12 0 0 0 0 -24 a16 16 0 0 0 -30 -4 a10 10 0 0 0 -6 18 a8 8 0 0 0 12 10 z"
            fill="#475569"
          />
        </svg>
        <svg viewBox="0 0 64 64" className="w-10 h-10 anim-weather-cloud-pulse relative z-10 drop-shadow-lg" aria-hidden="true">
          <defs>
            <linearGradient id="overcastGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>
          <path
            d="M20 44 h24 a12 12 0 0 0 0 -24 a16 16 0 0 0 -30 -4 a10 10 0 0 0 -6 18 a8 8 0 0 0 12 10 z"
            fill="url(#overcastGrad)"
          />
        </svg>
      </div>
    );
  }

  // 4. Fog & Mist (WMO 45, 48) -> Drifting misty vapor waves
  if (code >= 45 && code <= 48) {
    return (
      <div className={`relative flex flex-col items-center justify-center gap-1 shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-8 h-8 opacity-75 mb-0.5" aria-hidden="true">
          <path
            d="M20 38 h24 a10 10 0 0 0 0 -20 a14 14 0 0 0 -26 -3 a8 8 0 0 0 -8 15 a6 6 0 0 0 10 8 z"
            fill="#94a3b8"
          />
        </svg>
        <div className="w-8 h-1 rounded-full bg-slate-300 anim-weather-fog-1 shadow-[0_0_6px_rgba(203,213,225,0.7)]" />
        <div className="w-6 h-1 rounded-full bg-slate-400 anim-weather-fog-2" />
      </div>
    );
  }

  // 5. Rain / Drizzle / Showers (WMO 51-67, 80-82) -> Cloud with liquid cascading raindrops
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return (
      <div className={`relative flex flex-col items-center justify-center shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-9 h-9 anim-weather-cloud-pulse relative z-10" aria-hidden="true">
          <defs>
            <linearGradient id="rainCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
          </defs>
          <path
            d="M20 42 h24 a12 12 0 0 0 0 -24 a16 16 0 0 0 -30 -4 a10 10 0 0 0 -6 18 a8 8 0 0 0 12 10 z"
            fill="url(#rainCloudGrad)"
          />
        </svg>
        <div className="flex items-center gap-1.5 -mt-1 relative z-20">
          <div className="w-1 h-3 rounded-full bg-cyan-400 anim-weather-rain-1 shadow-[0_0_4px_#06b6d4]" />
          <div className="w-1 h-3.5 rounded-full bg-sky-400 anim-weather-rain-2 shadow-[0_0_4px_#0ea5e9]" />
          <div className="w-1 h-3 rounded-full bg-cyan-300 anim-weather-rain-3 shadow-[0_0_4px_#22d3ee]" />
        </div>
      </div>
    );
  }

  // 6. Thunderstorm / Atmospheric Squall (WMO 95, 96, 99) -> Cloud with electric flashing lightning
  if (code >= 95) {
    return (
      <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-10 h-10 anim-weather-cloud-pulse relative z-10" aria-hidden="true">
          <defs>
            <linearGradient id="thunderCloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <path
            d="M20 42 h24 a12 12 0 0 0 0 -24 a16 16 0 0 0 -30 -4 a10 10 0 0 0 -6 18 a8 8 0 0 0 12 10 z"
            fill="url(#thunderCloudGrad)"
          />
        </svg>
        <svg viewBox="0 0 24 24" className="w-6 h-6 absolute -bottom-1 text-amber-400 anim-weather-lightning z-20" aria-hidden="true">
          <path
            d="M13 2 L3 14 h7 l-2 8 l11 -12 h-7 l3 -8 z"
            fill="#facc15"
            stroke="#ca8a04"
            strokeWidth="0.5"
          />
        </svg>
      </div>
    );
  }

  // 7. Snow (WMO 71-77, 85-86) -> Cloud with floating snowflakes
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return (
      <div className={`relative flex flex-col items-center justify-center shrink-0 ${className}`}>
        <svg viewBox="0 0 64 64" className="w-9 h-9 anim-weather-cloud-pulse relative z-10" aria-hidden="true">
          <path
            d="M20 42 h24 a12 12 0 0 0 0 -24 a16 16 0 0 0 -30 -4 a10 10 0 0 0 -6 18 a8 8 0 0 0 12 10 z"
            fill="#cbd5e1"
          />
        </svg>
        <div className="flex items-center gap-2 -mt-1 relative z-20 text-[10px]">
          <span className="text-cyan-200 anim-weather-snow-1">❄</span>
          <span className="text-white anim-weather-snow-2">❄</span>
        </div>
      </div>
    );
  }

  // Default / Clear Fallback
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.8)] anim-weather-sun-spin" />
    </div>
  );
});

// Helper for WMO weather description
function interpretWmoCode(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1 || code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast & Cloudy';
  if (code >= 45 && code <= 48) return 'Fog & Mist';
  if (code >= 51 && code <= 55) return 'Light Drizzle';
  if (code >= 61 && code <= 65) return 'Rain Precipitating';
  if (code >= 71 && code <= 77) return 'Snow Flurries';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code === 95) return 'Thunderstorm Activity';
  if (code >= 96) return 'Severe Thunderstorm & Squalls';
  return 'Observing Atmosphere';
}

// ============================================================================
// MAIN MAPS TAB COMPONENT
// ============================================================================
export const MapsTab = memo(function MapsTab() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'info' | 'error' } | null>(null);
  const [currentCoords, setCurrentCoords] = useState<[number, number]>([17.385, 78.4867]); // Default Hyderabad

  // Current Weather State
  const [weatherData, setWeatherData] = useState<MapWeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // 1. Fetch Real-Time Open-Meteo Weather for coordinates with AbortController
  const fetchWeather = useCallback(async (lat: number, lon: number, signal?: AbortSignal) => {
    setIsLoadingWeather(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day&timezone=auto`;
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error('Weather API unavailable');
      const data = await res.json();
      const current = data.current || {};

      setWeatherData({
        temperature: Math.round(current.temperature_2m ?? 28),
        apparentTemperature: Math.round(current.apparent_temperature ?? 30),
        humidity: Math.round(current.relative_humidity_2m ?? 65),
        windSpeed: Math.round(current.wind_speed_10m ?? 12),
        precipitation: current.precipitation ?? 0,
        weatherCode: current.weather_code ?? 0,
        weatherDescription: interpretWmoCode(current.weather_code ?? 0),
        isDay: current.is_day === 1,
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Weather fetch fallback:', err);
      }
    } finally {
      setIsLoadingWeather(false);
    }
  }, []);

  // Fetch initial weather for default coordinates
  useEffect(() => {
    const controller = new AbortController();
    fetchWeather(currentCoords[0], currentCoords[1], controller.signal);
    return () => controller.abort();
  }, [currentCoords, fetchWeather]);

  // 2. Initialize Leaflet Map with Clean Unmount & Memory Cleanup
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: currentCoords,
        zoom: 13,
        zoomControl: true,
      });

      // OpenStreetMap Tiles (Fast, free, zero key required)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;

      // Add default marker
      L.marker(currentCoords)
        .addTo(markersGroup)
        .bindPopup('<b>Current Location</b><br>Hyderabad, India')
        .openPopup();
    }

    // Clean up map on unmount to completely free GPU buffers & memory
    return () => {
      if (markersGroupRef.current) {
        markersGroupRef.current.clearLayers();
        markersGroupRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Helper to update location on map
  const setLocationOnMap = useCallback((lat: number, lon: number, name: string) => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    mapInstanceRef.current.setView([lat, lon], 14);
    markersGroupRef.current.clearLayers();

    L.marker([lat, lon])
      .addTo(markersGroupRef.current)
      .bindPopup(
        `<b>${name}</b><br><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}" target="_blank" rel="noopener noreferrer" style="color:#06b6d4;font-weight:bold;">Get Directions in Google Maps</a>`
      )
      .openPopup();

    setSelectedPlace({ name, lat, lon });
    fetchWeather(lat, lon);
  }, [fetchWeather]);

  // Search form submit
  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setFeedbackMsg(null);

    const controller = new AbortController();
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery
      )}&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' }, signal: controller.signal });
      const data = await res.json();
      if (data && data.length > 0) {
        const place = data[0];
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);
        setLocationOnMap(lat, lon, place.display_name.split(',')[0]);
      } else {
        setFeedbackMsg({ text: 'Location not found. Try searching a major city or landmark.', type: 'error' });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setFeedbackMsg({ text: 'Search service busy. Please try again.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery, setLocationOnMap]);

  // GPS Location button
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setFeedbackMsg({ text: 'Geolocation is not supported by your browser.', type: 'error' });
      return;
    }
    setLoading(true);
    setFeedbackMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCurrentCoords([lat, lon]);
        setLocationOnMap(lat, lon, 'My Device Location');
      },
      () => {
        setLoading(false);
        setFeedbackMsg({ text: 'Location access denied. Please allow GPS permission in your browser.', type: 'error' });
      },
      { timeout: 8000 }
    );
  }, [setLocationOnMap]);

  // Nearby categories search
  const handleNearbySearch = useCallback(async (category: string) => {
    setLoading(true);
    setFeedbackMsg(null);
    try {
      const [lat, lon] = selectedPlace ? [selectedPlace.lat, selectedPlace.lon] : currentCoords;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        category
      )}&lat=${lat}&lon=${lon}&limit=5`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.length > 0) {
        if (markersGroupRef.current && mapInstanceRef.current) {
          markersGroupRef.current.clearLayers();
          data.forEach((item: any) => {
            const itemLat = parseFloat(item.lat);
            const itemLon = parseFloat(item.lon);
            const name = item.display_name.split(',')[0];
            L.marker([itemLat, itemLon])
              .addTo(markersGroupRef.current!)
              .bindPopup(
                `<b>${name}</b><br><a href="https://www.google.com/maps/dir/?api=1&destination=${itemLat},${itemLon}" target="_blank" rel="noopener noreferrer" style="color:#06b6d4;font-weight:bold;">Get Directions</a>`
              );
          });
          mapInstanceRef.current.setView([parseFloat(data[0].lat), parseFloat(data[0].lon)], 13);
          const topPlace = {
            name: `${category.toUpperCase()} (Nearby Result)`,
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
          };
          setSelectedPlace(topPlace);
          fetchWeather(topPlace.lat, topPlace.lon);
        }
      } else {
        setSearchQuery(`${category} near location`);
      }
    } catch {
      setFeedbackMsg({ text: 'Nearby search temporarily unavailable.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedPlace, currentCoords, fetchWeather]);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 pb-28 space-y-3.5">
      {/* =====================================================================
          CURRENT WEATHER CARD WITH LOTTIE-STYLE ANIMATED WEATHER ICONS
      ===================================================================== */}
      {weatherData && (
        <div className="relative p-3.5 sm:p-4 rounded-3xl bg-[#081226]/90 border border-cyan-500/25 shadow-lg backdrop-blur-md overflow-hidden transition-all">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            {/* Left: Lottie Animated Weather Icon + Location & Conditions */}
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              <LottieWeatherIcon code={weatherData.weatherCode} className="w-12 h-12 sm:w-14 sm:h-14" />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-white truncate max-w-[220px] sm:max-w-xs">
                    {selectedPlace?.name || 'Current Location (Hyderabad)'}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                    LIVE
                  </span>
                </div>

                {/* Anti-Slop Unboxed Metadata with Typographic Separators */}
                <div className="flex items-center flex-wrap gap-1 text-[11px] text-slate-300 mt-0.5">
                  <span className="font-semibold text-cyan-300">{weatherData.weatherDescription}</span>
                  <span className="text-slate-500">·</span>
                  <span>Feels {weatherData.apparentTemperature}°C</span>
                  <span className="text-slate-500">·</span>
                  <span className="flex items-center gap-0.5">
                    <Wind className="w-3 h-3 text-cyan-400" />
                    {weatherData.windSpeed} km/h
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="flex items-center gap-0.5">
                    <Droplets className="w-3 h-3 text-sky-400" />
                    {weatherData.humidity}%
                  </span>
                  {weatherData.precipitation > 0 && (
                    <>
                      <span className="text-slate-500">·</span>
                      <span className="flex items-center gap-0.5 text-blue-300">
                        <CloudRain className="w-3 h-3" />
                        {weatherData.precipitation} mm
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Ambient Temperature Display & Cyclone Radar Navigation */}
            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10 shrink-0">
              <div className="text-left sm:text-right">
                <div className="text-2xl sm:text-3xl font-black text-white font-mono leading-none">
                  {weatherData.temperature}°C
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  WMO Code {weatherData.weatherCode}
                </span>
              </div>

              {/* Quick Jump to Satellite Cyclone Radar */}
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('gkedit:navigate_tab', { detail: { tab: 'tools' } }));
                }}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Open Weather Map & Cyclone Radar subtab"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xs:inline">Doppler Radar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SEARCH & GPS CONTROLS
      ===================================================================== */}
      <div className="flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search place, landmark, city, or district..."
            className="w-full bg-[#081226]/85 border border-slate-700/60 rounded-2xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition"
          />
        </form>
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer shadow-md"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </button>
          <button
            onClick={handleUseMyLocation}
            disabled={loading}
            className="px-3 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Use Device GPS Location"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span>My Location</span>
          </button>
        </div>
      </div>

      {/* Non-blocking feedback message */}
      {feedbackMsg && (
        <div
          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
            feedbackMsg.type === 'error'
              ? 'bg-rose-500/15 border border-rose-500/30 text-rose-200'
              : 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-200'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Nearby Quick Category Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none pb-1 text-xs">
        <span className="text-slate-400 text-[11px] font-semibold shrink-0">Find Nearby:</span>
        <button
          onClick={() => handleNearbySearch('hospital')}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer"
        >
          <Building className="w-3.5 h-3.5 text-rose-400" />
          <span>Hospitals</span>
        </button>
        <button
          onClick={() => handleNearbySearch('temple')}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer"
        >
          <Church className="w-3.5 h-3.5 text-amber-400" />
          <span>Temples</span>
        </button>
        <button
          onClick={() => handleNearbySearch('petrol')}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer"
        >
          <Fuel className="w-3.5 h-3.5 text-cyan-400" />
          <span>Petrol Bunks</span>
        </button>
        <button
          onClick={() => handleNearbySearch('restaurant')}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer"
        >
          <Utensils className="w-3.5 h-3.5 text-emerald-400" />
          <span>Restaurants</span>
        </button>
      </div>

      {/* Interactive Map Container */}
      <div className="relative rounded-3xl overflow-hidden border border-cyan-500/20 shadow-2xl h-[380px] sm:h-[450px] bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>

      {/* Selected Location Card & Directions Link */}
      {selectedPlace && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#081226]/90 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md">
          <div>
            <p className="font-bold text-white text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>{selectedPlace.name}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Coordinates: {selectedPlace.lat.toFixed(4)}°N, {selectedPlace.lon.toFixed(4)}°E
            </p>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
          >
            <span>Directions in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
});

export default MapsTab;
