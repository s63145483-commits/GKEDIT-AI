import React, { useEffect, useRef, useState } from 'react';
import { AppIconItem, APP_ICONS } from '../services/appIconService.ts';

const SPRITE_URL = '/assets/aistudio/1793104839417_9dacee45.png';

// Global shared image cache to eliminate duplicate network decodes
let cachedImage: HTMLImageElement | null = null;
let imageLoadPromise: Promise<HTMLImageElement> | null = null;

function getSpriteImage(): Promise<HTMLImageElement> {
  if (cachedImage && cachedImage.complete && cachedImage.naturalWidth > 0) {
    return Promise.resolve(cachedImage);
  }
  if (!imageLoadPromise) {
    imageLoadPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.src = SPRITE_URL;
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        cachedImage = img;
        resolve(img);
      };
      img.onerror = (e) => reject(e);
    });
  }
  return imageLoadPromise;
}

interface GkAppIconProps {
  icon: AppIconItem | string;
  size?: number; // Size in pixels, default 64
  className?: string;
  showMetallicBezel?: boolean;
  isActive?: boolean;
}

export const GkAppIcon: React.FC<GkAppIconProps> = ({
  icon,
  size = 64,
  className = '',
  showMetallicBezel = true,
  isActive = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  const iconItem =
    typeof icon === 'string'
      ? APP_ICONS.find((i) => i.id === icon) || APP_ICONS[0]
      : icon;

  useEffect(() => {
    let isCancelled = false;
    getSpriteImage()
      .then((img) => {
        if (isCancelled || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        // Total dimensions of the sprite: 2048 x 2048 (5 cols x 4 rows)
        const cellW = 2048 / 5; // 409.6
        const cellH = 2048 / 4; // 512
        const iconSize = 368;
        const offsetX = (cellW - iconSize) / 2; // ~20.8px
        const offsetY = 24; // padding from top of cell

        const sx = iconItem.col * cellW + offsetX;
        const sy = iconItem.row * cellH + offsetY;

        // Clear canvas and draw smooth cropped icon
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw the cropped rounded square icon
        ctx.drawImage(img, sx, sy, iconSize, iconSize, 0, 0, canvas.width, canvas.height);
        setIsRendered(true);
      })
      .catch(() => {
        setIsRendered(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [iconItem.id, size]);

  // CSS percentage fallback coordinates for 5 cols x 4 rows
  const posX = iconItem.col * 25; // 0%, 25%, 50%, 75%, 100%
  const posY = (iconItem.row / 3) * 100; // 0%, 33.333%, 66.667%, 100%

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none overflow-hidden rounded-2xl ${
        showMetallicBezel
          ? 'bg-gradient-to-b from-slate-800 via-slate-900 to-black p-[2px] shadow-lg shadow-black/80'
          : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer Metallic Bezel Glow */}
      {showMetallicBezel && (
        <div
          className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 ${
            isActive
              ? 'ring-2 ring-cyan-400 shadow-[0_0_16px_rgba(0,240,255,0.7)]'
              : 'border border-cyan-400/25 group-hover:border-cyan-400/60'
          }`}
        />
      )}

      {/* HTML5 Canvas with hardware-accelerated sharp render */}
      <canvas
        ref={canvasRef}
        width={size * 2} // 2x for Retina / HiDPI crispness
        height={size * 2}
        className={`w-full h-full object-cover rounded-xl transition-opacity duration-200 ${
          isRendered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Instant CSS sprite fallback while canvas initial load resolves */}
      {!isRendered && (
        <div
          className="w-full h-full rounded-xl bg-no-repeat"
          style={{
            backgroundImage: `url(${SPRITE_URL})`,
            backgroundSize: '500% 400%',
            backgroundPosition: `${posX}% ${posY}%`,
          }}
        />
      )}

      {/* Subtle glossy holographic reflex overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none rounded-xl" />
    </div>
  );
};
