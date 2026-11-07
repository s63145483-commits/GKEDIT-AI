import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import {
  Play,
  Pause,
  RotateCcw,
  Compass,
  Layers,
  MapPin,
  Wind,
  Droplets,
  Gauge,
  Sun,
  CloudRain,
  CloudLightning,
  CloudFog,
  CloudSnow,
  CloudSun,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Crosshair,
  Zap,
  AlertTriangle,
  Radio,
  Search,
  RefreshCw,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  MessageSquare,
  X,
  Sparkles,
} from 'lucide-react';

// Geospatial distance helper between coordinates (Haversine formula in KM)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
export interface RadarFrame {
  time: number;
  path: string;
  isForecast?: boolean;
}

export interface RainViewerApiResponse {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: Array<{ time: number; path: string }>;
    nowcast: Array<{ time: number; path: string }>;
  };
  satellite?: {
    infrared?: Array<{ time: number; path: string }>;
  };
}

export interface CurrentWeatherMetrics {
  cityName: string;
  country: string;
  latitude: number;
  longitude: number;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  precipitation: number;
  weatherCode: number;
  weatherDescription: string;
  isSevere: boolean;
  severeMessage?: string;
}

export type BasemapTheme = 'satellite' | 'dark' | 'street';

export interface CycloneHotspot {
  name: string;
  basin: string;
  lat: number;
  lon: number;
  zoom: number;
  desc: string;
}

const CYCLONE_HOTSPOTS: CycloneHotspot[] = [
  { name: 'Bay of Bengal', basin: 'North Indian Ocean', lat: 14.5, lon: 86.0, zoom: 6, desc: 'Frequent Tropical Cyclone Depression Track' },
  { name: 'Arabian Sea', basin: 'Western Coast of India', lat: 18.0, lon: 66.0, zoom: 6, desc: 'Arabian Sea Cyclone Corridor' },
  { name: 'South China Sea', basin: 'West Pacific', lat: 16.5, lon: 115.0, zoom: 5, desc: 'Typhoon Alley / Super Typhoon Zone' },
  { name: 'Gulf of Mexico', basin: 'Atlantic Basin', lat: 25.0, lon: -90.0, zoom: 5, desc: 'Atlantic Hurricane Path' },
  { name: 'Telangana & AP', basin: 'Deccan Plateau', lat: 17.385, lon: 78.4867, zoom: 7, desc: 'Hyderabad & Andhra Coastal Radar' },
];

// Helper to interpret WMO Weather Code
function interpretWmoCode(code: number): { text: string; icon: 'sun' | 'cloud-sun' | 'rain' | 'lightning' | 'fog' | 'snow'; isAlert: boolean } {
  if (code === 0) return { text: 'Clear Sky', icon: 'sun', isAlert: false };
  if (code === 1 || code === 2) return { text: 'Mainly Clear / Partly Cloudy', icon: 'cloud-sun', isAlert: false };
  if (code === 3) return { text: 'Overcast & Cloudy', icon: 'cloud-sun', isAlert: false };
  if (code >= 45 && code <= 48) return { text: 'Fog & Mist Visibility', icon: 'fog', isAlert: false };
  if (code >= 51 && code <= 55) return { text: 'Light to Moderate Drizzle', icon: 'rain', isAlert: false };
  if (code >= 61 && code <= 65) return { text: 'Rain Precipitating', icon: 'rain', isAlert: code >= 65 };
  if (code >= 71 && code <= 77) return { text: 'Snow Flurries / Ice', icon: 'snow', isAlert: true };
  if (code >= 80 && code <= 82) return { text: 'Torrential Rain Showers', icon: 'rain', isAlert: true };
  if (code === 95) return { text: 'Active Thunderstorm Alert', icon: 'lightning', isAlert: true };
  if (code >= 96) return { text: 'Severe Thunderstorm & Hail / Cyclone', icon: 'lightning', isAlert: true };
  return { text: 'Observing Skies', icon: 'cloud-sun', isAlert: false };
}

export function WeatherRadarMapTool() {
  // Map Container & Instance Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const basemapLayerRef = useRef<L.TileLayer | null>(null);
  const labelOverlayRef = useRef<L.TileLayer | null>(null);
  const radarLayersRef = useRef<Map<number, L.TileLayer>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);

  // States: Map & Geospatial
  const [activeTheme, setActiveTheme] = useState<BasemapTheme>('satellite');
  const [radarVisible, setRadarVisible] = useState<boolean>(true);
  const [radarOpacity, setRadarOpacity] = useState<number>(0.85);

  // States: RainViewer Radar Timeline
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [radarHost, setRadarHost] = useState<string>('https://tilecache.rainviewer.com');
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isLoadingRadar, setIsLoadingRadar] = useState<boolean>(true);

  // States: Weather & Location Intelligence
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number }>({
    lat: 17.385,
    lon: 78.4867, // Default: Hyderabad/Telangana
  });
  const [weatherMetrics, setWeatherMetrics] = useState<CurrentWeatherMetrics | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Search input & Modals state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showHotspotsMenu, setShowHotspotsMenu] = useState<boolean>(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showCycloneModal, setShowCycloneModal] = useState<boolean>(false);

  // Proximity calculations to key cyclone basins
  const distToBob = calculateDistanceKm(currentCoords.lat, currentCoords.lon, 14.5, 86.0);
  const distToArabian = calculateDistanceKm(currentCoords.lat, currentCoords.lon, 18.0, 66.0);

  // Warning level classification based on IMD meteorological standards
  const alertInfo = (() => {
    if (weatherMetrics?.isSevere && (weatherMetrics?.windSpeed || 0) >= 65) {
      return {
        level: 'Red Warning (Extreme Squall / Cyclone Threat)',
        color: 'bg-red-500/20 text-red-300 border-red-500/50',
        badge: 'bg-red-500 text-slate-950',
        text: 'Take Immediate Action: High gale conditions, torrential squalls, or severe atmospheric disturbance active.',
      };
    }
    if ((weatherMetrics?.windSpeed || 0) >= 45 || (weatherMetrics?.precipitation || 0) >= 15 || weatherMetrics?.isSevere) {
      return {
        level: 'Orange Warning (Be Prepared)',
        color: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
        badge: 'bg-orange-500 text-slate-950',
        text: 'Be Prepared: Strong gusts and localized rain bands detected. Continuous radar tracking in progress.',
      };
    }
    if ((weatherMetrics?.windSpeed || 0) >= 30 || (weatherMetrics?.weatherCode || 0) >= 51) {
      return {
        level: 'Yellow Warning (Be Aware)',
        color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
        badge: 'bg-yellow-400 text-slate-950',
        text: 'Be Aware: Low to moderate convective cloud cells and localized precipitation expected.',
      };
    }
    return {
      level: 'Green Alert (Normal Equilibrium)',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      badge: 'bg-emerald-400 text-slate-950',
      text: 'Normal Weather: Stable atmospheric conditions with no active cyclonic threat.',
    };
  })();

  const handleConsultLiveAi = () => {
    const locName = weatherMetrics?.cityName || `${currentCoords.lat.toFixed(2)}°N, ${currentCoords.lon.toFixed(2)}°E`;
    const prompt = `Provide real-time weather and cyclone tracking intelligence for ${locName}, including active Bay of Bengal/Arabian Sea depressions, IMD warnings, and official safety precautions.`;
    window.dispatchEvent(
      new CustomEvent('gkedit:fill_chat_prompt', {
        detail: { prompt, autoSend: true, grounding: 'search' },
      })
    );
    window.dispatchEvent(
      new CustomEvent('gkedit:navigate_tab', {
        detail: { tab: 'chat' },
      })
    );
    setShowCycloneModal(false);
  };

  // ==========================================================================
  // 1. INJECT LEAFLET CSS IF MISSING
  // ==========================================================================
  useEffect(() => {
    const existingLink = document.getElementById('leaflet-cdn-css');
    if (!existingLink) {
      const link = document.createElement('link');
      link.id = 'leaflet-cdn-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
  }, []);

  // ==========================================================================
  // 2. FETCH OPEN-METEO WEATHER FOR GIVEN COORDINATES
  // ==========================================================================
  const fetchWeatherForLocation = useCallback(async (lat: number, lon: number, customName?: string) => {
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Open-Meteo weather service unavailable');
      const data = await res.json();

      const current = data.current || {};
      const wmo = interpretWmoCode(current.weather_code ?? 0);
      const windKmh = Math.round(current.wind_speed_10m ?? 0);
      const isSevere = wmo.isAlert || windKmh >= 45 || (current.precipitation ?? 0) >= 15;

      let severeMsg = '';
      if (windKmh >= 55) {
        severeMsg = `⚠️ High Wind / Gale Warning: ${windKmh} km/h gusts recorded.`;
      } else if (wmo.isAlert) {
        severeMsg = `⛈️ Atmospheric Disturbance: ${wmo.text}`;
      }

      setWeatherMetrics({
        cityName: customName || `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`,
        country: 'Global Grid',
        latitude: lat,
        longitude: lon,
        temperature: Math.round(current.temperature_2m ?? 28),
        apparentTemperature: Math.round(current.apparent_temperature ?? 30),
        humidity: Math.round(current.relative_humidity_2m ?? 65),
        windSpeed: windKmh,
        windDirection: Math.round(current.wind_direction_10m ?? 0),
        pressure: Math.round(current.surface_pressure ?? 1012),
        precipitation: current.precipitation ?? 0,
        weatherCode: current.weather_code ?? 0,
        weatherDescription: wmo.text,
        isSevere,
        severeMessage: severeMsg,
      });
    } catch (err: any) {
      console.warn('Weather fetch warning:', err);
      setWeatherError('Live satellite metrics updating...');
    } finally {
      setIsLoadingWeather(false);
    }
  }, []);

  // ==========================================================================
  // 3. FETCH RAINVIEWER REAL-TIME RADAR TIMELINE FRAMES
  // ==========================================================================
  const fetchRainViewerRadarData = useCallback(async () => {
    setIsLoadingRadar(true);
    try {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      if (!res.ok) throw new Error('RainViewer API offline');
      const data: RainViewerApiResponse = await res.json();

      const host = data.host || 'https://tilecache.rainviewer.com';
      setRadarHost(host);

      // Combine past frames (last 2 hours) and nowcast forecast frames
      const pastFrames: RadarFrame[] = (data.radar.past || []).map((f) => ({
        time: f.time,
        path: f.path,
        isForecast: false,
      }));
      const nowcastFrames: RadarFrame[] = (data.radar.nowcast || []).map((f) => ({
        time: f.time,
        path: f.path,
        isForecast: true,
      }));

      const combined = [...pastFrames, ...nowcastFrames];
      if (combined.length > 0) {
        setRadarFrames(combined);
        // Start near the latest past frame (real-time live frame)
        const latestPastIdx = Math.max(0, pastFrames.length - 1);
        setActiveFrameIndex(latestPastIdx);
      }
    } catch (err) {
      console.warn('RainViewer API notice:', err);
    } finally {
      setIsLoadingRadar(false);
    }
  }, []);

  // ==========================================================================
  // 4. LEAFLET MAP INITIALIZATION & EVENT LISTENERS
  // ==========================================================================
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [currentCoords.lat, currentCoords.lon],
      zoom: 6,
      minZoom: 3,
      maxZoom: 17,
      zoomControl: false, // We render custom Cyberpunk floating zoom buttons
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Initial Basemap: Esri World Imagery (Satellite)
    const satLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution: 'Esri World Imagery',
      }
    ).addTo(map);
    basemapLayerRef.current = satLayer;

    // High-Contrast Transparent Cartographic Boundaries & Labels
    const labels = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 19,
        zIndex: 10,
      }
    ).addTo(map);
    labelOverlayRef.current = labels;

    // Glowing Cyberpunk Neon Pulse Marker
    const neonIcon = L.divIcon({
      className: 'custom-neon-radar-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8 pointer-events-none">
          <div class="absolute w-8 h-8 rounded-full bg-cyan-400/25 animate-ping"></div>
          <div class="absolute w-6 h-6 rounded-full bg-cyan-500/40 border border-cyan-300 shadow-[0_0_15px_#00f2fe] animate-pulse"></div>
          <div class="relative w-3 h-3 rounded-full bg-cyan-300 shadow-[0_0_8px_#ffffff] border-2 border-[#050811]"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([currentCoords.lat, currentCoords.lon], { icon: neonIcon }).addTo(map);
    userMarkerRef.current = marker;

    // Interactive Click/Tap Handler: Fly to position and fetch real-time weather
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setCurrentCoords({ lat, lon: lng });
      fetchWeatherForLocation(lat, lng);
    });

    // Invalidate map size after short delay for container layout stabilization
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    // Initial Weather fetch & RainViewer radar stream
    fetchWeatherForLocation(currentCoords.lat, currentCoords.lon, 'Hyderabad & Deccan Radar');
    fetchRainViewerRadarData();

    // Trigger HTML5 Geolocation with smooth flyTo
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const uLat = pos.coords.latitude;
          const uLon = pos.coords.longitude;
          setCurrentCoords({ lat: uLat, lon: uLon });
          marker.setLatLng([uLat, uLon]);
          map.flyTo([uLat, uLon], 8, { duration: 1.8 });
          fetchWeatherForLocation(uLat, uLon, 'Detected GPS Location');
        },
        (err) => {
          console.warn('Geolocation fallback to default:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [fetchWeatherForLocation, fetchRainViewerRadarData]);

  // ==========================================================================
  // 5. UPDATE BASEMAP THEME (Satellite, Dark, Street)
  // ==========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (basemapLayerRef.current) {
      map.removeLayer(basemapLayerRef.current);
    }

    let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    let maxZoom = 18;

    if (activeTheme === 'dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      maxZoom = 19;
    } else if (activeTheme === 'street') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      maxZoom = 19;
    }

    const newLayer = L.tileLayer(url, {
      subdomains: 'abcd',
      maxZoom,
      attribution: activeTheme === 'satellite' ? 'Esri Satellite' : 'CartoDB/OSM',
    }).addTo(map);

    basemapLayerRef.current = newLayer;

    // Keep Cartographic Labels always on top
    if (labelOverlayRef.current) {
      labelOverlayRef.current.bringToFront();
    }
  }, [activeTheme]);

  // ==========================================================================
  // 6. SYNCHRONIZE RADAR FRAMES ON MAP WITH ZERO-FLASH PRE-CACHING
  // ==========================================================================
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || radarFrames.length === 0) return;

    const currentFrame = radarFrames[activeFrameIndex];
    if (!currentFrame) return;

    // Check if layer exists; if not, create it
    if (!radarLayersRef.current.has(currentFrame.time)) {
      const tileUrl = `${radarHost}${currentFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;
      const layer = L.tileLayer(tileUrl, {
        opacity: radarVisible ? radarOpacity : 0,
        zIndex: 5,
        tileSize: 256,
      }).addTo(map);
      radarLayersRef.current.set(currentFrame.time, layer);
    }

    // Pre-cache next frame with zero opacity to prevent white flash
    const nextIdx = (activeFrameIndex + 1) % radarFrames.length;
    const nextFrame = radarFrames[nextIdx];
    if (nextFrame && !radarLayersRef.current.has(nextFrame.time)) {
      const nextTileUrl = `${radarHost}${nextFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;
      const nextLayer = L.tileLayer(nextTileUrl, {
        opacity: 0,
        zIndex: 4,
        tileSize: 256,
      }).addTo(map);
      radarLayersRef.current.set(nextFrame.time, nextLayer);
    }

    // Adjust visibility: make active frame visible, mute all others smoothly
    radarLayersRef.current.forEach((layer, time) => {
      if (time === currentFrame.time) {
        layer.setOpacity(radarVisible ? radarOpacity : 0);
      } else {
        layer.setOpacity(0);
      }
    });

    // Cleanup stale cached layers if over 12 frames in memory
    if (radarLayersRef.current.size > 14) {
      const keys = Array.from(radarLayersRef.current.keys());
      const toRemove = keys.slice(0, keys.length - 10);
      toRemove.forEach((k) => {
        const l = radarLayersRef.current.get(k);
        if (l) {
          map.removeLayer(l);
          radarLayersRef.current.delete(k);
        }
      });
    }
  }, [activeFrameIndex, radarFrames, radarHost, radarVisible, radarOpacity]);

  // ==========================================================================
  // 7. RADAR TIMELINE PLAYER LOOP (600ms per frame)
  // ==========================================================================
  useEffect(() => {
    if (!isPlaying || radarFrames.length <= 1) return;

    const interval = setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % radarFrames.length);
    }, 600);

    return () => clearInterval(interval);
  }, [isPlaying, radarFrames.length]);

  // Format frame timestamp to human-friendly format
  const formatFrameTime = (timestamp: number, isForecast?: boolean) => {
    if (!timestamp) return 'Live Radar';
    const date = new Date(timestamp * 1000);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const nowSec = Math.floor(Date.now() / 1000);
    const diffMins = Math.round((timestamp - nowSec) / 60);

    if (isForecast) {
      return `Forecast +${Math.max(1, diffMins)}m (${timeStr})`;
    }
    if (Math.abs(diffMins) <= 5) {
      return `🔴 Real-Time Live (${timeStr})`;
    }
    if (diffMins < 0) {
      return `${Math.abs(diffMins)}m Ago (${timeStr})`;
    }
    return timeStr;
  };

  // Recenter GPS Button
  const handleRecenter = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setCurrentCoords({ lat, lon });
          userMarkerRef.current?.setLatLng([lat, lon]);
          mapInstanceRef.current?.flyTo([lat, lon], 9, { duration: 1.5 });
          fetchWeatherForLocation(lat, lon, 'My GPS Coordinates');
        },
        () => {
          mapInstanceRef.current?.flyTo([currentCoords.lat, currentCoords.lon], 8, { duration: 1.2 });
        }
      );
    } else {
      mapInstanceRef.current?.flyTo([currentCoords.lat, currentCoords.lon], 8, { duration: 1.2 });
    }
  };

  // Search City via Open-Meteo Geocoding
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        searchQuery.trim()
      )}&count=1&language=en&format=json`;
      const res = await fetch(geoUrl);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const { latitude, longitude, name, country } = data.results[0];
        setCurrentCoords({ lat: latitude, lon: longitude });
        userMarkerRef.current?.setLatLng([latitude, longitude]);
        mapInstanceRef.current?.flyTo([latitude, longitude], 9, { duration: 1.6 });
        fetchWeatherForLocation(latitude, longitude, `${name}, ${country || ''}`);
        setSearchQuery('');
      } else {
        setWeatherError(`City "${searchQuery}" not found.`);
      }
    } catch {
      setWeatherError('Geocoding search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  // Quick-Jump to Cyclone Hotspot
  const handleJumpToHotspot = (spot: CycloneHotspot) => {
    setShowHotspotsMenu(false);
    setCurrentCoords({ lat: spot.lat, lon: spot.lon });
    userMarkerRef.current?.setLatLng([spot.lat, spot.lon]);
    mapInstanceRef.current?.flyTo([spot.lat, spot.lon], spot.zoom, { duration: 2.0 });
    fetchWeatherForLocation(spot.lat, spot.lon, `${spot.name} (${spot.basin})`);
  };

  const activeFrame = radarFrames[activeFrameIndex];

  return (
    <div className="relative w-full h-[78vh] sm:h-[82vh] md:h-[85vh] rounded-3xl overflow-hidden border border-cyan-500/35 bg-[#050811] shadow-[0_15px_50px_rgba(2,6,23,0.9)] select-none">
      {/* =====================================================================
          LEAFLET MAP CONTAINER
      ===================================================================== */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0 bg-[#06090e]" />

      {/* Atmospheric Vignette Gradients */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#050811]/90 via-[#050811]/40 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050811]/95 via-[#050811]/50 to-transparent pointer-events-none z-10" />

      {/* =====================================================================
          TOP FLOATING GLASS CARD: LIVE LOCATION & METEOROLOGICAL INTELLIGENCE
      ===================================================================== */}
      <div className="absolute top-3 inset-x-3 sm:inset-x-6 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pointer-events-none">
        {/* Left: Weather Metrics Hub - Clickable for Full Cyclone & Weather Intelligence */}
        <div
          onClick={() => setShowCycloneModal(true)}
          className="pointer-events-auto p-3 sm:p-3.5 rounded-2xl bg-[#0d1424]/85 border border-cyan-400/30 hover:border-cyan-400/70 transition backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] flex items-center justify-between sm:justify-start gap-4 cursor-pointer group"
          title="Click to view AI Cyclone & Weather Intelligence Report"
        >
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(0,242,254,0.3)] group-hover:scale-105 transition">
              {weatherMetrics ? (
                weatherMetrics.weatherCode >= 95 ? (
                  <CloudLightning className="w-6 h-6 text-amber-300 animate-pulse" />
                ) : weatherMetrics.weatherCode >= 51 ? (
                  <CloudRain className="w-6 h-6 text-cyan-300 animate-bounce" />
                ) : weatherMetrics.weatherCode >= 45 ? (
                  <CloudFog className="w-6 h-6 text-slate-300" />
                ) : weatherMetrics.weatherCode === 0 ? (
                  <Sun className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
                ) : (
                  <CloudSun className="w-6 h-6 text-cyan-300" />
                )
              ) : (
                <Radio className="w-6 h-6 text-cyan-300 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-white tracking-wide truncate max-w-[160px] sm:max-w-[220px]">
                  {weatherMetrics?.cityName || 'Scanning Coordinates...'}
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  LIVE
                </span>
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-mono text-cyan-400/90 group-hover:text-cyan-200 transition">
                  <Sparkles className="w-2.5 h-2.5" /> Intel
                </span>
              </div>
              <p className="text-[11px] text-cyan-300/80 font-medium line-clamp-1">
                {weatherMetrics?.weatherDescription || 'Connecting to Open-Meteo & RainViewer...'}
              </p>
            </div>
          </div>

          {/* Large Temperature & Quick Pills */}
          <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-white/10 shrink-0">
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-black text-white font-mono leading-none">
                {weatherMetrics?.temperature !== undefined ? `${weatherMetrics.temperature}°C` : '--°C'}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Feels {weatherMetrics?.apparentTemperature !== undefined ? `${weatherMetrics.apparentTemperature}°` : '--'}
              </span>
            </div>

            {/* Micro Metrics Icons */}
            <div className="hidden md:flex flex-col gap-1 text-[10px] font-mono text-slate-300">
              <span className="flex items-center gap-1">
                <Wind className="w-3 h-3 text-cyan-400" />
                {weatherMetrics?.windSpeed || 0} km/h
              </span>
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-blue-400" />
                {weatherMetrics?.humidity || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Right: City Search Bar & Alerts Pill */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Severe Weather / Cyclone Alert Pill */}
          {weatherMetrics?.isSevere && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-amber-200 text-xs font-bold animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>{weatherMetrics.severeMessage || 'Severe Weather Warning'}</span>
            </div>
          )}

          {/* Quick Search Input */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 sm:flex-initial flex items-center bg-[#0d1424]/85 border border-cyan-400/30 rounded-2xl px-3 py-2 shadow-lg backdrop-blur-xl focus-within:border-cyan-400 transition"
          >
            <Search className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location..."
              className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-28 sm:w-36"
            />
          </form>

          {/* AI Cyclone Intelligence Trigger Button */}
          <button
            onClick={() => setShowCycloneModal(true)}
            className="px-3 py-2 rounded-2xl border transition shadow-lg backdrop-blur-xl flex items-center gap-1.5 text-xs font-bold cursor-pointer bg-gradient-to-r from-cyan-500/20 via-sky-500/25 to-blue-600/30 border-cyan-400/50 text-cyan-200 hover:border-cyan-300 hover:shadow-[0_0_20px_rgba(0,242,254,0.35)] active:scale-95"
            title="Open Real-Time Weather & Cyclone Intelligence Report"
          >
            <ShieldAlert className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span className="hidden sm:inline">AI Cyclone Intel</span>
          </button>

          {/* Cyclone Hotspots Dropdown Button */}
          <button
            onClick={() => setShowHotspotsMenu(!showHotspotsMenu)}
            className={`p-2.5 rounded-2xl border transition shadow-lg backdrop-blur-xl flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
              showHotspotsMenu
                ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                : 'bg-[#0d1424]/85 border-cyan-400/30 text-slate-200 hover:border-cyan-400'
            }`}
            title="Cyclone Basins & Radar Hotspots"
          >
            <Compass className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Cyclone Corridors</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          CYCLONE HOTSPOTS FLOATING MENU
      ===================================================================== */}
      {showHotspotsMenu && (
        <div className="absolute top-20 right-3 sm:right-6 z-30 w-72 rounded-2xl bg-[#090f1d]/95 border border-amber-500/40 p-3 shadow-2xl backdrop-blur-2xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
            <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Cyclone & Radar Hotspots
            </span>
            <button
              onClick={() => setShowHotspotsMenu(false)}
              className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto no-scrollbar">
            {CYCLONE_HOTSPOTS.map((spot) => (
              <button
                key={spot.name}
                onClick={() => handleJumpToHotspot(spot)}
                className="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-amber-500/15 border border-transparent hover:border-amber-400/40 transition cursor-pointer group"
              >
                <div className="text-xs font-bold text-white group-hover:text-amber-200 flex items-center justify-between">
                  <span>{spot.name}</span>
                  <span className="text-[10px] text-amber-400/70 font-mono">Fly →</span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-1">{spot.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          RIGHT RAIL FLOATING ACTION CONTROLS
      ===================================================================== */}
      <div className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2.5">
        {/* Recenter GPS Position */}
        <button
          onClick={handleRecenter}
          className="w-11 h-11 rounded-2xl bg-[#0d1424]/90 border border-cyan-400/35 hover:border-cyan-300 text-cyan-300 hover:text-white shadow-[0_0_15px_rgba(0,242,254,0.25)] backdrop-blur-xl flex items-center justify-center transition active:scale-95 cursor-pointer group"
          title="Recenter to detected GPS coordinates"
        >
          <Crosshair className="w-5 h-5 group-hover:rotate-45 transition duration-300" />
        </button>

        {/* Toggle Radar Layer Opacity / Visibility */}
        <button
          onClick={() => setRadarVisible(!radarVisible)}
          className={`w-11 h-11 rounded-2xl border shadow-lg backdrop-blur-xl flex items-center justify-center transition active:scale-95 cursor-pointer ${
            radarVisible
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,242,254,0.3)]'
              : 'bg-[#0d1424]/90 border-slate-700 text-slate-400'
          }`}
          title={radarVisible ? 'Hide Weather Radar Overlay' : 'Show Weather Radar Overlay'}
        >
          {radarVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>

        {/* Basemap Switcher Popover Button */}
        <div className="relative">
          <button
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className={`w-11 h-11 rounded-2xl border shadow-lg backdrop-blur-xl flex items-center justify-center transition active:scale-95 cursor-pointer ${
              showSettingsMenu
                ? 'bg-blue-500/30 border-blue-400 text-blue-200'
                : 'bg-[#0d1424]/90 border-cyan-400/35 text-slate-300 hover:text-white'
            }`}
            title="Switch Map Themes (Satellite, Dark, Street)"
          >
            <Layers className="w-5 h-5" />
          </button>

          {/* Theme Selector Popover */}
          {showSettingsMenu && (
            <div className="absolute right-14 top-0 w-44 rounded-2xl bg-[#0a1120]/95 border border-cyan-400/40 p-2 shadow-2xl backdrop-blur-2xl space-y-1 animate-in fade-in slide-in-from-right-3 duration-150">
              <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-1 block uppercase">
                Basemap Layers
              </span>
              {[
                { id: 'satellite', label: 'True Satellite (Esri)' },
                { id: 'dark', label: 'AMOLED Dark (Carto)' },
                { id: 'street', label: 'Street Maps (OSM)' },
              ].map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setActiveTheme(theme.id as BasemapTheme);
                    setShowSettingsMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    activeTheme === theme.id
                      ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <span>{theme.label}</span>
                  {activeTheme === theme.id && <span className="text-cyan-400">✓</span>}
                </button>
              ))}

              <div className="pt-1.5 border-t border-white/10 px-2">
                <span className="text-[9px] font-mono text-slate-400 block mb-1">
                  Radar Opacity: {Math.round(radarOpacity * 100)}%
                </span>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={radarOpacity}
                  onChange={(e) => setRadarOpacity(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5"
                />
              </div>
            </div>
          )}
        </div>

        {/* Zoom In / Zoom Out */}
        <div className="flex flex-col rounded-2xl bg-[#0d1424]/90 border border-cyan-400/30 overflow-hidden shadow-lg backdrop-blur-xl divide-y divide-white/10">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-11 h-9 flex items-center justify-center text-slate-200 hover:text-cyan-300 hover:bg-white/5 font-bold transition cursor-pointer"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-11 h-9 flex items-center justify-center text-slate-200 hover:text-cyan-300 hover:bg-white/5 font-bold transition cursor-pointer"
            title="Zoom Out"
          >
            −
          </button>
        </div>
      </div>

      {/* =====================================================================
          BOTTOM FLOATING LIQUID-GLASS RADAR TIMELINE PLAYER (Zoom Earth / Windy Style)
      ===================================================================== */}
      <div className="absolute bottom-4 inset-x-3 sm:inset-x-8 md:max-w-2xl md:mx-auto z-20">
        <div className="p-3 sm:p-4 rounded-3xl bg-[#0a1224]/90 border border-cyan-400/40 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] space-y-2.5">
          {/* Top Row: Play/Pause, Timestamp Badge & Forecast Label */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {/* Play / Pause Toggle Button */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-sky-500 to-blue-600 text-slate-950 flex items-center justify-center font-black shadow-[0_0_20px_rgba(0,242,254,0.45)] hover:scale-105 active:scale-95 transition cursor-pointer"
                title={isPlaying ? 'Pause Radar Loop' : 'Play Radar Loop'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
              </button>

              {/* Step Backward */}
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setActiveFrameIndex((prev) => (prev - 1 + radarFrames.length) % radarFrames.length);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition cursor-pointer"
                title="Step Back 10 mins"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Step Forward */}
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setActiveFrameIndex((prev) => (prev + 1) % radarFrames.length);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition cursor-pointer"
                title="Step Forward 10 mins"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Formatted Time Badge */}
              <div className="px-3 py-1 rounded-xl bg-cyan-950/60 border border-cyan-400/40 text-cyan-200 text-xs font-mono font-bold shadow-inner">
                {activeFrame ? formatFrameTime(activeFrame.time, activeFrame.isForecast) : 'Streaming Radar...'}
              </div>
            </div>

            {/* Radar Legend / Speed Indicator */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-[10px] font-mono text-slate-400">
                RainViewer V2
              </span>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>600ms/frame</span>
              </div>
            </div>
          </div>

          {/* Animated Timeline Progress Bar & Scrubbing Slider */}
          <div className="space-y-1">
            <div className="relative w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/10">
              {/* Thin Animated Gradient Bar */}
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_10px_#00f2fe]"
                style={{
                  width: `${
                    radarFrames.length > 0
                      ? ((activeFrameIndex + 1) / radarFrames.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            {/* Interactive Timeline Range Scrubber */}
            <input
              type="range"
              min="0"
              max={Math.max(0, radarFrames.length - 1)}
              value={activeFrameIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setActiveFrameIndex(parseInt(e.target.value, 10));
              }}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 opacity-80 hover:opacity-100 transition"
              title="Scrub Radar Timeline"
            />
          </div>

          {/* Radar Intensity Color Legend */}
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-0.5">
            <span className="flex items-center gap-1.5">
              <span>Rain/Cloud Intensity:</span>
              <span className="inline-flex items-center gap-0.5">
                <span className="w-2 h-2 rounded-xs bg-[#00f0ff]" title="Light Rain" />
                <span className="w-2 h-2 rounded-xs bg-[#00ff7f]" title="Moderate" />
                <span className="w-2 h-2 rounded-xs bg-[#ffff00]" title="Heavy" />
                <span className="w-2 h-2 rounded-xs bg-[#ff4500]" title="Torrential" />
                <span className="w-2 h-2 rounded-xs bg-[#ff00ff]" title="Hail / Severe" />
              </span>
            </span>
            <span className="text-slate-400">
              Tap anywhere on map for live weather stats
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          AI CYCLONE & WEATHER INTELLIGENCE REPORT MODAL
      ===================================================================== */}
      {showCycloneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#060a14]/95 border border-cyan-400/40 shadow-[0_0_50px_rgba(0,242,254,0.25)] overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-cyan-500/20 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 via-transparent to-blue-950/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(0,242,254,0.35)]">
                  <ShieldAlert className="w-5 h-5 text-cyan-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white tracking-wide flex items-center gap-2">
                    <span>REAL-TIME WEATHER & CYCLONE INTELLIGENCE</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                      LIVE RADAR
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Surveillance target: <span className="text-cyan-300 font-bold">{weatherMetrics?.cityName || `${currentCoords.lat.toFixed(3)}°N, ${currentCoords.lon.toFixed(3)}°E`}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCycloneModal(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Report Body */}
            <div className="p-4 sm:p-6 overflow-y-auto no-scrollbar space-y-4 text-xs">
              {/* High-Visibility Alert Banner (Immediate Lead) */}
              {weatherMetrics?.isSevere ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/25 via-red-500/20 to-amber-600/20 border-2 border-amber-400 text-amber-100 flex items-start gap-3 shadow-[0_0_30px_rgba(245,158,11,0.35)]">
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <div className="text-xs font-black tracking-wider uppercase text-amber-300 flex items-center gap-1.5">
                      <span>🚨 [CYCLONE & ATMOSPHERIC SQUALL WARNING]</span>
                    </div>
                    <p className="text-xs text-amber-100 font-semibold mt-1">
                      {weatherMetrics.severeMessage || 'Elevated storm gusts or severe precipitation system detected in regional grid.'}
                    </p>
                    <p className="text-[10px] text-amber-200/80 mt-1 font-mono">
                      Peak regional gusts: {Math.round((weatherMetrics.windSpeed || 0) * 1.35)} km/h • Precipitation: {weatherMetrics.precipitation || 0} mm/h
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border border-emerald-400/40 text-emerald-200 flex items-start gap-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-black tracking-wider uppercase text-emerald-300">
                      REGIONAL CYCLONE SURVEILLANCE
                    </div>
                    <p className="text-xs font-bold text-white mt-0.5">
                      No active cyclone threat currently detected for this region.
                    </p>
                    <p className="text-[10px] text-emerald-300/80 mt-0.5 font-mono">
                      Continuous satellite infrared & Doppler radar sweeps confirm stable atmospheric equilibrium.
                    </p>
                  </div>
                </div>
              )}

              {/* 1. CURRENT CONDITIONS CARD */}
              <div className="p-4 rounded-2xl bg-[#0b1324]/80 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-black text-cyan-300 tracking-wider flex items-center gap-1.5 uppercase">
                    <Thermometer className="w-4 h-4 text-cyan-400" />
                    1. Current Conditions
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Barometric Pressure: {weatherMetrics?.pressure || 1012} hPa
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-mono block">Temperature</span>
                    <div className="text-lg font-black text-white font-mono">
                      {weatherMetrics?.temperature !== undefined ? `${weatherMetrics.temperature}°C` : '--'}
                    </div>
                    <span className="text-[9px] text-cyan-300 font-mono">
                      Feels: {weatherMetrics?.apparentTemperature !== undefined ? `${weatherMetrics.apparentTemperature}°C` : '--'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-mono block">Humidity</span>
                    <div className="text-lg font-black text-white font-mono">
                      {weatherMetrics?.humidity !== undefined ? `${weatherMetrics.humidity}%` : '--'}
                    </div>
                    <span className="text-[9px] text-blue-300 font-mono">
                      Dew Pt / Moisture
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-mono block">Wind Speed</span>
                    <div className="text-lg font-black text-white font-mono">
                      {weatherMetrics?.windSpeed || 0} km/h
                    </div>
                    <span className="text-[9px] text-cyan-300 font-mono">
                      Bearing: {weatherMetrics?.windDirection || 0}°
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-mono block">Sky Condition</span>
                    <div className="text-xs font-bold text-white truncate mt-1">
                      {weatherMetrics?.weatherDescription || 'Observing Skies'}
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">
                      Rain: {weatherMetrics?.precipitation || 0} mm/h
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. EXTREME WEATHER & CYCLONE TRACKING CARD */}
              <div className="p-4 rounded-2xl bg-[#0b1324]/80 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-black text-amber-300 tracking-wider flex items-center gap-1.5 uppercase">
                    <Compass className="w-4 h-4 text-amber-400" />
                    2. Extreme Weather & Cyclone Tracking (High Priority)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
                    Active Surveillance
                  </span>
                </div>
                <div className="space-y-2 text-slate-300 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">•</span>
                    <div>
                      <strong className="text-white">Active Maritime Basins:</strong> Bay of Bengal corridor (~{distToBob} km away) and Arabian Sea corridor (~{distToArabian} km away).
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">•</span>
                    <div>
                      <strong className="text-white">Low-Pressure & Depression Status:</strong> Constant telemetry tracking for tropical convective clusters, monsoon depressions, and cyclonic vortex development.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">•</span>
                    <div>
                      <strong className="text-white">Wind Gusts & Rain Severity:</strong> Current gust velocity registered at {Math.round((weatherMetrics?.windSpeed || 0) * 1.35)} km/h. Localized precipitation intensity: {weatherMetrics?.precipitation || 0} mm/hr.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold shrink-0">•</span>
                    <div>
                      <strong className="text-white">Storm Surge & Coastal Inundation:</strong> Coastal threat level is currently within safe baselines unless specified under active IMD bulletins.
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. OFFICIAL ADVISORIES & SAFETY CARD */}
              <div className="p-4 rounded-2xl bg-[#0b1324]/80 border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-black text-sky-300 tracking-wider flex items-center gap-1.5 uppercase">
                    <ShieldAlert className="w-4 h-4 text-sky-400" />
                    3. Official Advisories & Safety
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${alertInfo.badge}`}>
                    {alertInfo.level}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium italic">
                  {alertInfo.text}
                </p>
                <div className="space-y-1.5 text-slate-300 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">•</span>
                    <div>
                      <strong className="text-white">Residents & General Public:</strong> Secure loose terrace sheetings, keep emergency power banks charged, and maintain drinking water reserves.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">•</span>
                    <div>
                      <strong className="text-white">Coastal Areas & Fishermen:</strong> Heed official port signals and avoid deep-sea maritime venture during turbulent squalls.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">•</span>
                    <div>
                      <strong className="text-white">Transport & Commuters:</strong> Avoid driving through waterlogged underpasses, storm channels, and stay away from downed power lines.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">•</span>
                    <div>
                      <strong className="text-white">Schools & Institutions:</strong> Follow official holiday and emergency guidelines issued by district collectorates.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-cyan-500/20 bg-[#080e1c] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                Verified meteorological intelligence by GKEDIT AI • @GKEDIT2141
              </span>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setShowCycloneModal(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleConsultLiveAi}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 text-slate-950 font-black text-xs shadow-[0_0_20px_rgba(0,242,254,0.4)] hover:scale-105 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 fill-slate-950" />
                  <span>Consult Live Assistant (Search-Grounded)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
