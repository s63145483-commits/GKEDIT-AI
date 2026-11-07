import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Compass,
  Rocket,
  Info,
  Layers,
  Thermometer,
  Weight,
  Clock,
  Globe2,
  Sun,
  Eye,
  Sliders,
  Check,
  Calendar,
  Search,
} from 'lucide-react';
import {
  SOLAR_SYSTEM_DATA,
  CelestialBody,
  NasaMission,
} from '../data/solarSystemData.ts';

// ----------------------------------------------------------------------------
// PROPS INTERFACE
// ----------------------------------------------------------------------------
interface SolarSystemExplorerProps {
  onBackToTools: () => void;
}

type ViewMode = 'all' | 'inner' | 'outer';

export function SolarSystemExplorer({ onBackToTools }: SolarSystemExplorerProps) {
  // --------------------------------------------------------------------------
  // 1. ORBIT SIMULATION & CANVAS STATE
  // --------------------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [showOrbitTrails, setShowOrbitTrails] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [hoveredPlanet, setHoveredPlanet] = useState<CelestialBody | null>(null);
  const [selectedPlanet, setSelectedPlanet] = useState<CelestialBody | null>(null);
  const [userWeightKg, setUserWeightKg] = useState<number>(70);
  const [dossierSearchQuery, setDossierSearchQuery] = useState<string>('');

  // Simulation angles for each celestial body in radians
  const anglesRef = useRef<{ [id: string]: number }>({
    sun: 0,
    mercury: 0.8,
    venus: 2.1,
    earth: 3.4,
    mars: 4.6,
    jupiter: 1.2,
    saturn: 2.9,
    uranus: 4.1,
    neptune: 5.3,
    pluto: 0.4,
  });

  // Cached planet screen coordinates for raycasting / hit testing
  const planetPositionsRef = useRef<
    { id: string; x: number; y: number; radius: number; body: CelestialBody }[]
  >([]);

  // --------------------------------------------------------------------------
  // SEARCH & FILTER LOGIC (Planets & Missions in Offline JSON Factstore)
  // --------------------------------------------------------------------------
  const searchLower = dossierSearchQuery.trim().toLowerCase();

  const matchingPlanets = searchLower
    ? SOLAR_SYSTEM_DATA.filter((body) => {
        const matchName = body.name.toLowerCase().includes(searchLower);
        const matchClass = body.classification.toLowerCase().includes(searchLower);
        const matchTag = body.tagline.toLowerCase().includes(searchLower);
        const matchFacts = body.facts.some((f) => f.toLowerCase().includes(searchLower));
        const matchAtmosphere = body.atmosphere.some((a) => a.toLowerCase().includes(searchLower));
        const matchMissions = body.missions.some(
          (m) =>
            m.name.toLowerCase().includes(searchLower) ||
            m.significance.toLowerCase().includes(searchLower) ||
            m.type.toLowerCase().includes(searchLower) ||
            m.agency.toLowerCase().includes(searchLower)
        );
        return matchName || matchClass || matchTag || matchFacts || matchAtmosphere || matchMissions;
      })
    : SOLAR_SYSTEM_DATA;

  const filteredMissionsForCurrent = selectedPlanet
    ? searchLower
      ? selectedPlanet.missions.filter(
          (m) =>
            m.name.toLowerCase().includes(searchLower) ||
            m.significance.toLowerCase().includes(searchLower) ||
            m.type.toLowerCase().includes(searchLower) ||
            m.agency.toLowerCase().includes(searchLower) ||
            m.year.toLowerCase().includes(searchLower)
        )
      : selectedPlanet.missions
    : [];

  const otherPlanetsWithMatchingMissions =
    searchLower && selectedPlanet
      ? SOLAR_SYSTEM_DATA.filter(
          (body) =>
            body.id !== selectedPlanet.id &&
            body.missions.some(
              (m) =>
                m.name.toLowerCase().includes(searchLower) ||
                m.significance.toLowerCase().includes(searchLower) ||
                m.type.toLowerCase().includes(searchLower) ||
                m.agency.toLowerCase().includes(searchLower)
            )
        )
      : [];

  // --------------------------------------------------------------------------
  // 2. KEYBOARD NAVIGATION & MODAL DISMISSAL
  // --------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused = (e.target as HTMLElement)?.tagName === 'INPUT';
      if (e.key === 'Escape') {
        if (dossierSearchQuery) {
          setDossierSearchQuery('');
        } else {
          setSelectedPlanet(null);
        }
      } else if (!isInputFocused && e.key === 'ArrowRight' && selectedPlanet) {
        // Next planet
        const currentIndex = SOLAR_SYSTEM_DATA.findIndex((b) => b.id === selectedPlanet.id);
        const nextIndex = (currentIndex + 1) % SOLAR_SYSTEM_DATA.length;
        setSelectedPlanet(SOLAR_SYSTEM_DATA[nextIndex]);
      } else if (!isInputFocused && e.key === 'ArrowLeft' && selectedPlanet) {
        // Previous planet
        const currentIndex = SOLAR_SYSTEM_DATA.findIndex((b) => b.id === selectedPlanet.id);
        const prevIndex = (currentIndex - 1 + SOLAR_SYSTEM_DATA.length) % SOLAR_SYSTEM_DATA.length;
        setSelectedPlanet(SOLAR_SYSTEM_DATA[prevIndex]);
      } else if (!isInputFocused && e.key === ' ') {
        // Spacebar toggle pause
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPlanet, dossierSearchQuery]);

  // --------------------------------------------------------------------------
  // 3. PLANET ORBIT SYSTEM (HTML5 Canvas 60 FPS Render Loop)
  // --------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    // Generate static deep space starfield
    const stars: { x: number; y: number; size: number; alpha: number; twinkleSpeed: number }[] = [];
    for (let i = 0; i < 160; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.6 + 0.4,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.003 + 0.001,
      });
    }

    const render = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      // Center of canvas
      const centerX = width / 2;
      const centerY = height / 2;

      // Viewport scale based on viewMode
      let zoomScale = 1.0;
      if (viewMode === 'inner') {
        zoomScale = 1.95;
      } else if (viewMode === 'outer') {
        zoomScale = 0.78;
      } else {
        // 'all' responsive scale
        zoomScale = Math.min(width, height) / 780;
      }
      zoomScale = Math.max(0.48, Math.min(2.4, zoomScale));

      // 1. Deep Space Cosmic Background
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Subtle cosmic nebulae glow
      const nebulaGrad = ctx.createRadialGradient(centerX, centerY, 40, centerX, centerY, width * 0.7);
      nebulaGrad.addColorStop(0, 'rgba(30, 27, 75, 0.45)');
      nebulaGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.25)');
      nebulaGrad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Starfield Rendering with gentle twinkle
      stars.forEach((star) => {
        const starX = star.x * width;
        const starY = star.y * height;
        const twinkle = Math.sin(currentTime * star.twinkleSpeed + star.x * 10) * 0.35 + 0.65;
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(starX, starY, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Clear cached screen positions for hover/click detection
      const currentPositions: { id: string; x: number; y: number; radius: number; body: CelestialBody }[] = [];

      ctx.save();
      ctx.translate(centerX, centerY);

      // 3. Render Concentric Orbit Rings
      SOLAR_SYSTEM_DATA.forEach((body) => {
        if (body.visual.orbitRadiusCanvas > 0) {
          const orbitR = body.visual.orbitRadiusCanvas * zoomScale;

          ctx.beginPath();
          ctx.arc(0, 0, orbitR, 0, Math.PI * 2);
          ctx.strokeStyle =
            hoveredPlanet?.id === body.id || selectedPlanet?.id === body.id
              ? 'rgba(6, 182, 212, 0.65)'
              : 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = hoveredPlanet?.id === body.id ? 1.5 : 1;
          ctx.setLineDash([3, 5]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Orbit AU Distance Tag
          if (viewMode !== 'inner' || body.orderFromSun <= 4) {
            ctx.save();
            ctx.font = '8px monospace';
            ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
            ctx.textAlign = 'center';
            ctx.fillText(`${body.distanceFromSunAu} AU`, orbitR + 2, 9);
            ctx.restore();
          }
        }
      });

      // 4. Update Orbital Angles (if playing)
      if (isPlaying) {
        SOLAR_SYSTEM_DATA.forEach((body) => {
          if (body.visual.orbitSpeedFactor > 0) {
            // Speed base calibrated so Earth orbits every ~25 seconds at 1x
            const baseRadPerSec = 0.25;
            const deltaAngle = baseRadPerSec * body.visual.orbitSpeedFactor * speedMultiplier * dt;
            anglesRef.current[body.id] = (anglesRef.current[body.id] + deltaAngle) % (Math.PI * 2);
          }
        });
      }

      // 5. Render Orbit Trails (optional fading wakes)
      if (showOrbitTrails) {
        SOLAR_SYSTEM_DATA.forEach((body) => {
          if (body.visual.orbitRadiusCanvas > 0) {
            const orbitR = body.visual.orbitRadiusCanvas * zoomScale;
            const currentAngle = anglesRef.current[body.id] || 0;
            const trailLength = (Math.PI / 4) * Math.min(1.5, body.visual.orbitSpeedFactor);

            ctx.beginPath();
            ctx.arc(0, 0, orbitR, currentAngle - trailLength, currentAngle, false);
            ctx.strokeStyle = body.visual.glowColor;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      }

      // 6. Render the Central Sun
      const sunBody = SOLAR_SYSTEM_DATA[0];
      const sunRadius = sunBody.visual.radiusCanvas * Math.max(0.7, Math.min(1.3, zoomScale * 0.85));

      // Sun Coronal Pulsing Rays
      const sunPulse = Math.sin(currentTime * 0.003) * 3 + sunRadius;
      const sunHalo = ctx.createRadialGradient(0, 0, sunRadius * 0.5, 0, 0, sunPulse * 2.2);
      sunHalo.addColorStop(0, 'rgba(253, 224, 71, 0.95)');
      sunHalo.addColorStop(0.3, 'rgba(245, 158, 11, 0.6)');
      sunHalo.addColorStop(0.7, 'rgba(220, 38, 38, 0.2)');
      sunHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.beginPath();
      ctx.arc(0, 0, sunPulse * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = sunHalo;
      ctx.fill();

      // Sun Core Sphere
      const sunGrad = ctx.createRadialGradient(-sunRadius * 0.3, -sunRadius * 0.3, 2, 0, 0, sunRadius);
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.3, '#fef08a');
      sunGrad.addColorStop(0.7, '#f59e0b');
      sunGrad.addColorStop(1, '#b45309');

      ctx.beginPath();
      ctx.arc(0, 0, sunRadius, 0, Math.PI * 2);
      ctx.fillStyle = sunGrad;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 25;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Register Sun hit box
      currentPositions.push({
        id: sunBody.id,
        x: centerX,
        y: centerY,
        radius: sunRadius + 6,
        body: sunBody,
      });

      // 7. Render All Major Planets + Pluto
      SOLAR_SYSTEM_DATA.slice(1).forEach((body) => {
        const orbitR = body.visual.orbitRadiusCanvas * zoomScale;
        const angle = anglesRef.current[body.id] || 0;
        const px = Math.cos(angle) * orbitR;
        const py = Math.sin(angle) * orbitR;

        const pRadius = Math.max(3.2, body.visual.radiusCanvas * Math.max(0.75, Math.min(1.2, zoomScale)));
        const isHovered = hoveredPlanet?.id === body.id;
        const isSelected = selectedPlanet?.id === body.id;

        // Hover / Select Highlight Ring
        if (isHovered || isSelected) {
          ctx.beginPath();
          ctx.arc(px, py, pRadius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Saturn & Uranus Ring System
        if (body.visual.hasRings) {
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(Math.PI / 6); // Ring tilt
          ctx.scale(1, 0.35); // Elliptical projection

          ctx.beginPath();
          ctx.arc(0, 0, (body.visual.ringOuterRadius || 26) * zoomScale, 0, Math.PI * 2);
          ctx.strokeStyle = body.visual.ringColor || 'rgba(253, 224, 71, 0.45)';
          ctx.lineWidth = 3.5;
          ctx.stroke();
          ctx.restore();
        }

        // Planet Atmosphere / Glow Halo
        const glow = ctx.createRadialGradient(px, py, pRadius * 0.8, px, py, pRadius * 1.8);
        glow.addColorStop(0, body.visual.glowColor);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(px, py, pRadius * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Planet Shaded Sphere (Lit from Sun at 0,0)
        // Light angle points toward center (0,0)
        const lightDirX = -Math.cos(angle);
        const lightDirY = -Math.sin(angle);
        const lightOffsetX = px + lightDirX * (pRadius * 0.4);
        const lightOffsetY = py + lightDirY * (pRadius * 0.4);

        const sphereGrad = ctx.createRadialGradient(
          lightOffsetX,
          lightOffsetY,
          1,
          px,
          py,
          pRadius
        );
        sphereGrad.addColorStop(0, body.visual.gradient[0] || body.visual.color);
        sphereGrad.addColorStop(0.5, body.visual.gradient[1] || body.visual.color);
        sphereGrad.addColorStop(1, body.visual.gradient[2] || '#0f172a');

        ctx.beginPath();
        ctx.arc(px, py, pRadius, 0, Math.PI * 2);
        ctx.fillStyle = sphereGrad;
        ctx.shadowColor = body.visual.color;
        ctx.shadowBlur = isHovered ? 12 : 5;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Earth's Orbiting Moon (Luna)
        if (body.id === 'earth') {
          const moonOrbitR = pRadius + 8;
          const moonAngle = (currentTime * 0.003) % (Math.PI * 2);
          const mx = px + Math.cos(moonAngle) * moonOrbitR;
          const my = py + Math.sin(moonAngle) * moonOrbitR;

          ctx.beginPath();
          ctx.arc(mx, my, 1.4, 0, Math.PI * 2);
          ctx.fillStyle = '#e2e8f0';
          ctx.fill();
        }

        // Planet Name Label
        ctx.save();
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = isHovered || isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.75)';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(body.name.split(' ')[0], px, py + pRadius + 11);
        ctx.restore();

        // Register absolute screen position for hit testing
        currentPositions.push({
          id: body.id,
          x: centerX + px,
          y: centerY + py,
          radius: Math.max(14, pRadius + 8),
          body,
        });
      });

      ctx.restore(); // restore translation

      planetPositionsRef.current = currentPositions;
      animationFrameId = requestAnimationFrame(render);
    };

    // Auto resize canvas
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, speedMultiplier, showOrbitTrails, viewMode, hoveredPlanet, selectedPlanet]);

  // --------------------------------------------------------------------------
  // 4. INTERACTION HANDLERS: HOVER & CLICK HIT-TESTING
  // --------------------------------------------------------------------------
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const hit = planetPositionsRef.current.find((p) => {
      const dx = p.x - x;
      const dy = p.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= p.radius;
    });

    if (hit) {
      setHoveredPlanet(hit.body);
    } else {
      setHoveredPlanet(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const hit = planetPositionsRef.current.find((p) => {
      const dx = p.x - x;
      const dy = p.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= p.radius;
    });

    if (hit) {
      setSelectedPlanet(hit.body);
    }
  };

  const handleResetPositions = () => {
    anglesRef.current = {
      sun: 0,
      mercury: 0,
      venus: 0,
      earth: 0,
      mars: 0,
      jupiter: 0,
      saturn: 0,
      uranus: 0,
      neptune: 0,
      pluto: 0,
    };
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* -------------------------------------------------------------------- */}
      {/* TOP HEADER & MISSION CONTROL HUD */}
      {/* -------------------------------------------------------------------- */}
      <div className="relative rounded-3xl bg-[#030712]/95 border border-amber-500/30 p-5 backdrop-blur-2xl shadow-[0_0_40px_rgba(245,158,11,0.12)] overflow-hidden">
        {/* Subtle starry background grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.06),transparent_60%)] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-400/40 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest">
                <Sparkles className="w-3 h-3 text-amber-400" />
                OFFLINE EASTER EGG · NASA JPL
              </span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> 100% SELF-CONTAINED
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
              SOLAR SYSTEM EXPLORER
            </h1>
            <p className="text-xs text-slate-300/80 mt-0.5">
              Verified NASA Planetary Factsheets &bull; 60 FPS Orbital Physics &bull; Deep Space Mission Dossiers
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedPlanet(SOLAR_SYSTEM_DATA[3])} // Earth default inspect
              className="px-3 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 text-xs font-mono font-bold text-cyan-300 transition cursor-pointer flex items-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5" />
              <span>EARTH DOSSIER</span>
            </button>

            <button
              onClick={onBackToTools}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-xs font-mono text-slate-300 hover:text-white transition cursor-pointer"
            >
              &larr; BACK TO TOOLS
            </button>
          </div>
        </div>

        {/* Orbit Control Ribbon */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-800/80 flex-wrap">
          {/* Play/Pause & Speed */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isPlaying ? 'Pause Orbits (Spacebar)' : 'Play Orbits (Spacebar)'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-white" />}
              <span className="hidden sm:inline">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>

            <button
              onClick={handleResetPositions}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Reset Alignment"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Speed Multipliers */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
              {[0.5, 1, 2, 5, 10].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeedMultiplier(spd)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    speedMultiplier === spd
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* View Modes & Orbit Trails Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOrbitTrails(!showOrbitTrails)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono border transition cursor-pointer ${
                showOrbitTrails
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
            >
              <span>TRAILS: {showOrbitTrails ? 'ON' : 'OFF'}</span>
            </button>

            {/* View Zoom Presets */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
              {(['all', 'inner', 'outer'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono uppercase font-bold transition cursor-pointer ${
                    viewMode === mode
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode === 'all' ? 'FULL SYSTEM' : mode === 'inner' ? 'INNER 4' : 'GIANTS'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. INTERACTIVE 2D ORBITAL CANVAS VIEWPORT */}
      {/* -------------------------------------------------------------------- */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[560px] rounded-3xl bg-[#020617] border-2 border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
          className="w-full h-full block cursor-crosshair"
        />

        {/* Floating Quick Tooltip on Hover */}
        {hoveredPlanet && (
          <div className="absolute top-4 left-4 p-3 rounded-2xl bg-black/85 border border-cyan-500/40 backdrop-blur-md shadow-xl text-xs font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: hoveredPlanet.visual.color }}
              />
              <span className="font-bold text-white text-sm">{hoveredPlanet.name}</span>
              <span className="text-[10px] text-cyan-400 uppercase">[{hoveredPlanet.classification}]</span>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-3">
              <span>Dist: {hoveredPlanet.distanceFromSunAu} AU</span>
              <span>&bull;</span>
              <span>Year: {hoveredPlanet.orbitalPeriodDisplay}</span>
            </div>
            <p className="text-[10px] text-amber-300 font-sans italic">
              Tap or click to inspect full NASA mission dossier &rarr;
            </p>
          </div>
        )}

        {/* Orbit legend hint */}
        <div className="absolute bottom-3 right-4 flex items-center gap-2 px-3 py-1 rounded-full bg-black/75 border border-slate-800 text-[10px] font-mono text-slate-400 pointer-events-none">
          <Eye className="w-3 h-3 text-cyan-400" />
          <span>Click any planet for NASA mission facts</span>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. CELESTIAL QUICK-SELECT BAR */}
      {/* -------------------------------------------------------------------- */}
      <div className="p-3 rounded-2xl bg-[#030712]/90 border border-slate-800 space-y-2">
        <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">
          QUICK SELECT CELESTIAL BODY
        </span>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {SOLAR_SYSTEM_DATA.map((body) => {
            const isSelected = selectedPlanet?.id === body.id;
            return (
              <button
                key={body.id}
                onClick={() => setSelectedPlanet(body)}
                className={`py-2 px-1 rounded-xl text-center border transition cursor-pointer flex flex-col items-center gap-1 ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full shadow-sm"
                  style={{ backgroundColor: body.visual.color }}
                />
                <span className="text-[10px] font-mono font-bold truncate max-w-full">
                  {body.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 4. OVERLAY INSPECTOR DRAWER / NASA MISSION DOSSIER MODAL */}
      {/* -------------------------------------------------------------------- */}
      {selectedPlanet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedPlanet(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl bg-[#040816] border-2 border-amber-500/40 p-6 overflow-y-auto shadow-[0_0_60px_rgba(245,158,11,0.2)] text-white space-y-6"
            onClick={(e) => e.stopPropagation()} // Prevent close on modal content click
          >
            {/* Top Close & Planet Cycle Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const currentIndex = SOLAR_SYSTEM_DATA.findIndex((b) => b.id === selectedPlanet.id);
                    const prevIndex = (currentIndex - 1 + SOLAR_SYSTEM_DATA.length) % SOLAR_SYSTEM_DATA.length;
                    setSelectedPlanet(SOLAR_SYSTEM_DATA[prevIndex]);
                  }}
                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Previous Celestial Body (&larr; Left Arrow)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const currentIndex = SOLAR_SYSTEM_DATA.findIndex((b) => b.id === selectedPlanet.id);
                    const nextIndex = (currentIndex + 1) % SOLAR_SYSTEM_DATA.length;
                    setSelectedPlanet(SOLAR_SYSTEM_DATA[nextIndex]);
                  }}
                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Next Celestial Body (&rarr; Right Arrow)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono text-slate-400 ml-2">
                  Use &larr; &rarr; arrow keys or ESC to dismiss
                </span>
              </div>

              <button
                onClick={() => setSelectedPlanet(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                title="Close Dossier (Escape)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* NASA Mission & Planet Search Bar (Offline JSON Database Filter) */}
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4 text-cyan-400" />
                </div>
                <input
                  type="text"
                  value={dossierSearchQuery}
                  onChange={(e) => setDossierSearchQuery(e.target.value)}
                  placeholder="Search planets & NASA missions (e.g. Voyager, Apollo, Rover, Ice, Titan)..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-black/75 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 text-xs text-white placeholder:text-slate-500 font-mono transition outline-none"
                />
                {dossierSearchQuery && (
                  <button
                    onClick={() => setDossierSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                    title="Clear Search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtered Planet Quick-Jump Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                  {dossierSearchQuery ? `Matches (${matchingPlanets.length}):` : 'Quick Jump:'}
                </span>
                {matchingPlanets.map((planet) => {
                  const isCurrent = selectedPlanet.id === planet.id;
                  return (
                    <button
                      key={planet.id}
                      onClick={() => setSelectedPlanet(planet)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 shrink-0 border transition cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: planet.visual.color }}
                      />
                      <span>{planet.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search active status */}
              {dossierSearchQuery && (
                <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300 px-1 pt-0.5">
                  <span>
                    Viewing {selectedPlanet.name}: {filteredMissionsForCurrent.length} matching missions
                  </span>
                  <button
                    onClick={() => setDossierSearchQuery('')}
                    className="text-[10px] text-slate-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>

            {/* Planet Header Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Planetary Visual Avatar */}
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-xl relative overflow-hidden"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${selectedPlanet.visual.gradient[0]}, ${selectedPlanet.visual.gradient[1] || selectedPlanet.visual.color}, ${selectedPlanet.visual.gradient[2] || '#0f172a'})`,
                }}
              >
                {selectedPlanet.visual.hasRings && (
                  <div className="absolute inset-0 border border-amber-300/40 rounded-full scale-125 rotate-45" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold">
                    NASA JPL FACTSHEET
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
                    {selectedPlanet.classification}
                  </span>
                  {selectedPlanet.orderFromSun > 0 && (
                    <span className="text-[10px] font-mono text-slate-400">
                      #{selectedPlanet.orderFromSun} from Sun
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black tracking-wide mt-1 text-white">
                  {selectedPlanet.name}
                </h2>
                <p className="text-xs text-slate-300 font-sans mt-0.5">
                  {selectedPlanet.tagline}
                </p>
              </div>
            </div>

            {/* Physical Metric Comparison Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-black/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">DIAMETER</span>
                <span className="text-base font-mono font-bold text-cyan-300">
                  {selectedPlanet.diameterKm.toLocaleString()} km
                </span>
                <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
                  {selectedPlanet.id === 'earth'
                    ? '1.0 Earth Radii'
                    : `${(selectedPlanet.diameterKm / 12742).toFixed(2)}x Earth`}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-black/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">ORBITAL PERIOD (YEAR)</span>
                <span className="text-base font-mono font-bold text-amber-300">
                  {selectedPlanet.orbitalPeriodDays > 0 ? `${selectedPlanet.orbitalPeriodDays} d` : 'Galactic'}
                </span>
                <span className="text-[9px] font-mono text-slate-500 block mt-0.5 truncate">
                  {selectedPlanet.orbitalPeriodDisplay}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-black/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">DAY LENGTH (ROTATION)</span>
                <span className="text-base font-mono font-bold text-emerald-300">
                  {Math.abs(selectedPlanet.rotationPeriodHours)} hrs
                </span>
                <span className="text-[9px] font-mono text-slate-500 block mt-0.5 truncate">
                  {selectedPlanet.rotationPeriodDisplay}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-black/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">SURFACE GRAVITY</span>
                <span className="text-base font-mono font-bold text-purple-300">
                  {selectedPlanet.gravityRelativeG}g
                </span>
                <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
                  {Math.round(selectedPlanet.gravityRelativeG * 100)}% of Earth
                </span>
              </div>
            </div>

            {/* Interactive Relative Gravity / Weight Comparison */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 via-slate-900/60 to-black/60 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5 uppercase">
                  <Weight className="w-3.5 h-3.5" />
                  YOUR WEIGHT ON {selectedPlanet.name.toUpperCase()}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-slate-400">Earth Weight:</span>
                  <input
                    type="number"
                    min="20"
                    max="250"
                    value={userWeightKg}
                    onChange={(e) => setUserWeightKg(Math.max(1, parseInt(e.target.value) || 70))}
                    className="w-14 px-1.5 py-0.5 rounded bg-black border border-slate-700 text-center text-white font-bold"
                  />
                  <span className="text-slate-400">kg</span>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-mono font-black text-white">
                  {(userWeightKg * selectedPlanet.gravityRelativeG).toFixed(1)} kg
                </span>
                <span className="text-xs font-mono text-purple-300">
                  ({((userWeightKg * selectedPlanet.gravityRelativeG) * 2.20462).toFixed(1)} lbs)
                </span>
                <span className="text-xs text-slate-400 ml-auto font-mono">
                  {selectedPlanet.gravityRelativeG < 1 ? '✨ Lighter feeling' : 'Heavy gravity'}
                </span>
              </div>
            </div>

            {/* Atmosphere & Temperature Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-black/60 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-red-400" />
                  THERMAL CONDITIONS
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-mono font-bold text-red-300">
                    {selectedPlanet.meanSurfaceTempC}&deg;C
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ({Math.round(selectedPlanet.meanSurfaceTempC * 1.8 + 32)}&deg;F)
                  </span>
                </div>
                {selectedPlanet.minTempC !== undefined && (
                  <p className="text-[11px] font-mono text-slate-400">
                    Min: {selectedPlanet.minTempC}&deg;C &bull; Max: {selectedPlanet.maxTempC}&deg;C
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-black/60 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Globe2 className="w-3 h-3 text-cyan-400" />
                  ATMOSPHERE & MOONS ({selectedPlanet.moonsCount} Moons)
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedPlanet.atmosphere.map((gas, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-[10px] font-mono text-slate-300"
                    >
                      {gas}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Curated NASA Scientific Facts */}
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                CURATED NASA SCIENTIFIC FACTS
              </span>
              <ul className="space-y-2 text-xs text-slate-200 font-sans leading-relaxed list-disc list-inside">
                {selectedPlanet.facts.map((fact, idx) => (
                  <li key={idx} className="marker:text-cyan-400">
                    {fact}
                  </li>
                ))}
              </ul>
            </div>

            {/* NASA Historical Missions Timeline (Filtered) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5" />
                  HISTORICAL EXPLORATION & NASA MISSIONS
                </span>
                {dossierSearchQuery && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                    {filteredMissionsForCurrent.length} Matched on {selectedPlanet.name.split(' ')[0]}
                  </span>
                )}
              </div>

              {filteredMissionsForCurrent.length === 0 ? (
                <div className="p-4 rounded-2xl bg-black/40 border border-dashed border-slate-800 text-center space-y-3">
                  <p className="text-xs font-mono text-slate-400">
                    {dossierSearchQuery
                      ? `No NASA missions matching "${dossierSearchQuery}" recorded for ${selectedPlanet.name}.`
                      : 'No recorded direct spacecraft missions for this body.'}
                  </p>

                  {/* Cross-reference notice: Other worlds that have matching missions */}
                  {otherPlanetsWithMatchingMissions.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <p className="text-[11px] font-mono text-amber-300 mb-2">
                        Matching missions found on other planetary bodies:
                      </p>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {otherPlanetsWithMatchingMissions.map((other) => (
                          <button
                            key={other.id}
                            onClick={() => setSelectedPlanet(other)}
                            className="px-2.5 py-1 rounded-xl bg-slate-900 border border-amber-500/40 hover:border-amber-400 text-amber-200 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer hover:scale-105"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: other.visual.color }}
                            />
                            <span>Explore {other.name} &rarr;</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMissionsForCurrent.map((mission, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-black/60 border border-slate-800 space-y-1 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono">{mission.name}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                            {mission.type}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" /> {mission.year}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300/90 leading-relaxed font-sans">
                        {mission.significance}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Also show other matching planets at the bottom if any */}
              {dossierSearchQuery && otherPlanetsWithMatchingMissions.length > 0 && filteredMissionsForCurrent.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-slate-400">
                    &quot;{dossierSearchQuery}&quot; also found on:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {otherPlanetsWithMatchingMissions.map((other) => (
                      <button
                        key={other.id}
                        onClick={() => setSelectedPlanet(other)}
                        className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-[10px] font-mono text-slate-300 hover:text-white transition cursor-pointer"
                      >
                        {other.name.split(' ')[0]} &rarr;
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
