import React, { useRef, useEffect } from 'react';

interface WaterWallpaperProps {
  className?: string;
}

export function WaterWallpaper({ className = '' }: WaterWallpaperProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Simulation resolution (keeps simulation ultra smooth at 60fps)
    const simWidth = 160;
    const simHeight = 100;
    const bufferSize = simWidth * simHeight;

    let buffer1 = new Float32Array(bufferSize);
    let buffer2 = new Float32Array(bufferSize);
    let current = buffer1;
    let previous = buffer2;

    const damping = 0.975;
    let animationFrameId: number;
    let isInteracting = false;
    let lastDropTime = Date.now();

    // Off-screen canvas for rendering the ripple texture
    const offCanvas = document.createElement('canvas');
    offCanvas.width = simWidth;
    offCanvas.height = simHeight;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;
    const imgData = offCtx.createImageData(simWidth, simHeight);
    const pixels = imgData.data;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    resize();
    window.addEventListener('resize', resize);

    function disturb(cx: number, cy: number, radius: number, strength: number) {
      if (!canvas) return;
      const scaleX = simWidth / canvas.width;
      const scaleY = simHeight / canvas.height;
      const sx = Math.floor(cx * scaleX);
      const sy = Math.floor(cy * scaleY);

      const r = Math.max(1, Math.floor(radius * scaleX));
      const r2 = r * r;

      const minX = Math.max(1, sx - r);
      const maxX = Math.min(simWidth - 2, sx + r);
      const minY = Math.max(1, sy - r);
      const maxY = Math.min(simHeight - 2, sy + r);

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const dist2 = (x - sx) * (x - sx) + (y - sy) * (y - sy);
          if (dist2 < r2) {
            const factor = Math.cos((Math.sqrt(dist2) / r) * (Math.PI / 2));
            const idx = y * simWidth + x;
            current[idx] += strength * factor;
          }
        }
      }
    }

    // Interactive event handlers
    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      disturb(x, y, 16, 28);
      isInteracting = true;
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      disturb(x, y, 26, 65);
      isInteracting = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      disturb(x, y, 20, 35);
      isInteracting = true;
    };

    canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
    canvas.addEventListener('pointerdown', handlePointerDown, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Initial gentle ripples
    setTimeout(() => {
      disturb(canvas.width * 0.5, canvas.height * 0.35, 24, 50);
    }, 400);

    function render() {
      if (!canvas || !ctx) return;

      // Wave equation update step
      for (let y = 1; y < simHeight - 1; y++) {
        const row = y * simWidth;
        const topRow = (y - 1) * simWidth;
        const bottomRow = (y + 1) * simWidth;

        for (let x = 1; x < simWidth - 1; x++) {
          const idx = row + x;
          const val =
            (previous[idx - 1] +
              previous[idx + 1] +
              previous[topRow + x] +
              previous[bottomRow + x]) *
              0.5 -
            current[idx];

          current[idx] = val * damping;
        }
      }

      // Occasional organic ambient drop if user is idle
      const now = Date.now();
      if (!isInteracting && now - lastDropTime > 4000) {
        lastDropTime = now;
        const rx = Math.floor(Math.random() * (simWidth - 20)) + 10;
        const ry = Math.floor(Math.random() * (simHeight - 20)) + 10;
        disturb((rx / simWidth) * canvas.width, (ry / simHeight) * canvas.height, 18, 40);
      }
      if (isInteracting && now - lastDropTime > 800) {
        isInteracting = false;
      }

      // Convert heightmap to caustics and refracted cyan/blue highlights
      let pixelIdx = 0;
      for (let y = 0; y < simHeight; y++) {
        const row = y * simWidth;
        for (let x = 0; x < simWidth; x++) {
          const idx = row + x;
          const h = current[idx];

          // Compute surface slope / normal
          const dx = x < simWidth - 1 ? current[idx + 1] - h : 0;
          const dy = y < simHeight - 1 ? current[row + simWidth + x] - h : 0;

          // Caustic specular highlight
          const shading = dx * 1.8 - dy * 1.8;
          const specular = Math.max(0, Math.min(255, shading * 40));

          // Base fluid water colors: Deep cyan/blue gradient with glowing liquid highlights
          const baseR = 4;
          const baseG = 22 + Math.floor(specular * 0.45);
          const baseB = 48 + Math.floor(specular * 0.85);

          // Alpha modulation based on ripple displacement
          const rippleStrength = Math.min(220, Math.abs(h) * 12 + specular * 0.6);

          pixels[pixelIdx] = Math.min(255, baseR + specular * 0.5);
          pixels[pixelIdx + 1] = Math.min(255, baseG + specular * 0.7);
          pixels[pixelIdx + 2] = Math.min(255, baseB + specular);
          pixels[pixelIdx + 3] = Math.min(180, Math.floor(rippleStrength * 0.7 + 30));

          pixelIdx += 4;
        }
      }

      offCtx?.putImageData(imgData, 0, 0);

      // Draw smoothed off-screen canvas to visible canvas with subtle liquid blur
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(offCanvas, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Swap buffers
      const temp = current;
      current = previous;
      previous = temp;

      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div className={`absolute inset-0 pointer-events-auto overflow-hidden ${className}`}>
      {/* Underwater Caustic Glow Layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020917]/70 via-[#031530]/50 to-[#020817]/90 pointer-events-none" />
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair opacity-85 mix-blend-screen"
        style={{ touchAction: 'none' }}
      />
      {/* Soft Ambient Radial Vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#020713]/40 to-[#020713]/85 pointer-events-none" />
    </div>
  );
}
