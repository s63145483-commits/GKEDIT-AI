import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';

export interface LiquidGlassNavProps {
  activeId: string | number;
  children: React.ReactNode;
  className?: string;
  variant?: 'dark' | 'light';
  pillPadding?: number; // inner padding around button
}

interface PillStyle {
  left: number;
  top: number;
  width: number;
  height: number;
  ready: boolean;
}

/**
 * Apple iOS-Style "Liquid Glass" (Dynamic Fluid Droplet) Navigation Container
 * Features:
 * 1. Active tab state precisely drives the bubble's X/Y position via translate3d with fluid easing.
 * 2. Proper containment and overflow-hidden prevent clipping or bleeding outside the dock boundary.
 * 3. True glassy look with backdrop-filter blur, semi-transparent gradient, soft inner border, and overlay blend.
 */
export function LiquidGlassNav({
  activeId,
  children,
  className = '',
  variant = 'dark',
  pillPadding = 0,
}: LiquidGlassNavProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pillStyle, setPillStyle] = useState<PillStyle>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    ready: false,
  });

  const updatePillPosition = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const activeEl = container.querySelector(`[data-nav-id="${activeId}"]`) as HTMLElement | null;

    if (!activeEl) {
      // Hide pill gracefully if activeId is not in this navigation container
      setPillStyle((prev) => (prev.ready ? { ...prev, ready: false } : prev));
      return;
    }

    // Precise offset measurement relative to container content
    let left = activeEl.offsetLeft;
    let top = activeEl.offsetTop;
    let width = activeEl.offsetWidth;
    let height = activeEl.offsetHeight;

    // Fallback if offset is 0 but bounding rect exists (e.g. during display transitions)
    if (width === 0 || height === 0) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      if (activeRect.width > 0) {
        left = activeRect.left - containerRect.left + container.scrollLeft;
        top = activeRect.top - containerRect.top + container.scrollTop;
        width = activeRect.width;
        height = activeRect.height;
      }
    }

    // Apply pillPadding if specified
    left -= pillPadding;
    top -= pillPadding;
    width += pillPadding * 2;
    height += pillPadding * 2;

    // Boundary containment: prevent pill from bleeding outside container top/bottom/left/right
    const maxLeft = Math.max(0, container.scrollWidth - width);
    const maxTop = Math.max(0, container.scrollHeight - height);
    left = Math.max(0, Math.min(left, maxLeft));
    top = Math.max(0, Math.min(top, maxTop));

    setPillStyle({
      left,
      top,
      width,
      height,
      ready: true,
    });

    // Auto-scroll active item into visible view if overflowing
    if (container.scrollWidth > container.clientWidth) {
      const elLeft = activeEl.offsetLeft;
      const elRight = elLeft + activeEl.offsetWidth;
      const viewLeft = container.scrollLeft;
      const viewRight = viewLeft + container.clientWidth;

      if (elLeft < viewLeft || elRight > viewRight) {
        const targetScrollLeft = elLeft - container.clientWidth / 2 + activeEl.offsetWidth / 2;
        container.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth',
        });
      }
    }
  }, [activeId, pillPadding]);

  // Measure on layout effect and schedule an RAF tick for smooth settling
  useLayoutEffect(() => {
    updatePillPosition();
    const rafId = requestAnimationFrame(() => {
      updatePillPosition();
    });
    return () => cancelAnimationFrame(rafId);
  }, [updatePillPosition]);

  useEffect(() => {
    const handleResize = () => updatePillPosition();
    window.addEventListener('resize', handleResize, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updatePillPosition();
      });
      resizeObserver.observe(containerRef.current);
    }

    const containerEl = containerRef.current;
    const handleWheel = (e: WheelEvent) => {
      if (containerEl && containerEl.scrollWidth > containerEl.clientWidth) {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
          containerEl.scrollLeft += e.deltaY;
          e.preventDefault();
        }
      }
    };

    if (containerEl) {
      containerEl.addEventListener('scroll', handleResize, { passive: true });
      containerEl.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerEl) {
        containerEl.removeEventListener('scroll', handleResize);
        containerEl.removeEventListener('wheel', handleWheel);
      }
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [updatePillPosition]);

  return (
    <div
      ref={containerRef}
      className={`liquid-glass-nav-container ${
        variant === 'light' ? 'liquid-glass-light' : ''
      } ${className}`}
    >
      {/* Dynamic Sliding Liquid Glass Droplet Indicator Pill */}
      <div
        className="liquid-pill"
        style={{
          transform: `translate3d(${pillStyle.left}px, ${pillStyle.top}px, 0)`,
          width: `${pillStyle.width}px`,
          height: `${pillStyle.height}px`,
          opacity: pillStyle.ready ? 1 : 0,
        }}
        aria-hidden="true"
      >
        <div className="glass-glare" />
      </div>

      {/* Nav Items (Z-index 2 ensures active icons and labels remain sharp and readable) */}
      <div className="relative z-10 w-full contents">
        {children}
      </div>
    </div>
  );
}

/**
 * Global utility to initialize liquid glass droplet behavior on any arbitrary DOM navigation bar
 */
export function initLiquidNav(container: HTMLElement, activeSelector: string = '.active') {
  if (!container) return () => {};

  container.classList.add('liquid-glass-nav-container');

  let pill = container.querySelector(':scope > .liquid-pill') as HTMLElement | null;
  if (!pill) {
    pill = document.createElement('div');
    pill.className = 'liquid-pill';
    const glare = document.createElement('div');
    glare.className = 'glass-glare';
    pill.appendChild(glare);
    container.insertBefore(pill, container.firstChild);
  }

  const update = () => {
    const activeEl = container.querySelector(activeSelector) as HTMLElement | null;
    if (!activeEl || !pill) return;

    let left = activeEl.offsetLeft;
    let top = activeEl.offsetTop;
    let width = activeEl.offsetWidth;
    let height = activeEl.offsetHeight;

    if (width === 0 || height === 0) {
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      left = activeRect.left - containerRect.left + container.scrollLeft;
      top = activeRect.top - containerRect.top + container.scrollTop;
      width = activeRect.width;
      height = activeRect.height;
    }

    pill.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    pill.style.width = `${width}px`;
    pill.style.height = `${height}px`;
    pill.style.opacity = '1';
  };

  update();
  const rafId = requestAnimationFrame(update);
  window.addEventListener('resize', update, { passive: true });
  container.addEventListener('scroll', update, { passive: true });
  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', update);
    container.removeEventListener('scroll', update);
  };
}
