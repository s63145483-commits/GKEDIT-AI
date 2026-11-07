import { useRef, useCallback } from 'react';

export interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // Minimum horizontal distance in px (default 40px)
  maxVerticalRatio?: number; // Vertical distance must not exceed horizontal * ratio (default 0.75)
  maxDurationMs?: number; // Swipe must complete within this time in ms (default 550ms)
  minVelocity?: number; // Minimum velocity px/ms (default 0.18)
  disabled?: boolean;
}

interface GestureTrackingState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  isIgnored: boolean;
  isVerticalScrollLocked: boolean;
  pointerId?: number;
}

/**
 * Checks whether the interaction started inside an interactive element that requires
 * native scroll/drag (e.g. Leaflet map panes, drawing canvas, inputs, textareas, sliders).
 */
function shouldIgnoreElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;

  // 1. Explicit swipe-ignore attributes
  if (target.closest('[data-no-swipe="true"], [data-no-tab-swipe="true"]')) {
    return true;
  }

  // 2. Interactive form controls & editable areas
  if (
    target.closest(
      'input, textarea, select, [contenteditable="true"], button, a, [role="slider"], [role="tablist"], [role="scrollbar"]'
    )
  ) {
    return true;
  }

  // 3. Leaflet or interactive map containers
  if (
    target.closest(
      '.leaflet-container, .leaflet-pane, .leaflet-control-container, [id*="map"], [class*="map-container"]'
    )
  ) {
    return true;
  }

  // 4. Drawing canvas, camera viewfinder, or video elements
  if (target.closest('canvas, video, audio')) {
    return true;
  }

  // 5. Horizontally scrollable containers (e.g., code blocks, pills lists, table wrappers)
  let curr: Element | null = target;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    if (curr.scrollWidth > curr.clientWidth + 16) {
      const style = window.getComputedStyle(curr);
      const overflowX = style.overflowX;
      if (overflowX === 'auto' || overflowX === 'scroll') {
        return true;
      }
    }
    curr = curr.parentElement;
  }

  return false;
}

/**
 * Unified Touch and Pointer Gestures Hook for Mobile & Desktop.
 * Provides reliable, responsive swipe transitions (threshold 40px) across both mobile touch screens
 * and desktop trackpad/mouse pointer events without conflicting with vertical scrolling.
 */
export function useSwipeGestures({
  onSwipeLeft,
  onSwipeRight,
  threshold = 40,
  maxVerticalRatio = 0.75,
  maxDurationMs = 550,
  minVelocity = 0.18,
  disabled = false,
}: UseSwipeOptions) {
  const stateRef = useRef<GestureTrackingState | null>(null);

  // -------------------------------------------------------------
  // Mobile Touch Events (onTouchStart, onTouchMove, onTouchEnd)
  // -------------------------------------------------------------
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      if (e.touches.length !== 1) {
        stateRef.current = null;
        return;
      }
      const touch = e.touches[0];
      stateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        startTime: Date.now(),
        isIgnored: shouldIgnoreElement(e.target),
        isVerticalScrollLocked: false,
      };
    },
    [disabled]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || !stateRef.current) return;
      if (e.touches.length !== 1) return;
      const state = stateRef.current;
      if (state.isIgnored) return;

      const touch = e.touches[0];
      state.currentX = touch.clientX;
      state.currentY = touch.clientY;

      const deltaX = Math.abs(state.currentX - state.startX);
      const deltaY = Math.abs(state.currentY - state.startY);

      // If user starts scrolling vertically first, lock out horizontal swipe to preserve 60fps vertical scroll
      if (!state.isVerticalScrollLocked && deltaY > 12 && deltaY > deltaX * 1.3) {
        state.isVerticalScrollLocked = true;
      }
    },
    [disabled]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || !stateRef.current) return;
      const state = stateRef.current;
      stateRef.current = null;

      if (state.isIgnored || state.isVerticalScrollLocked) return;

      let endX = state.currentX;
      let endY = state.currentY;
      if (e.changedTouches.length > 0) {
        endX = e.changedTouches[0].clientX;
        endY = e.changedTouches[0].clientY;
      }

      const deltaX = endX - state.startX;
      const deltaY = endY - state.startY;
      const duration = Date.now() - state.startTime;

      if (duration > maxDurationMs) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Enforce responsive 40px threshold and direction ratio
      if (absX < threshold) return;
      if (absY > absX * maxVerticalRatio) return;

      const velocity = absX / duration;
      if (velocity < minVelocity && absX < threshold * 1.5) return;

      if (deltaX < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    },
    [disabled, maxDurationMs, maxVerticalRatio, minVelocity, onSwipeLeft, onSwipeRight, threshold]
  );

  const onTouchCancel = useCallback(() => {
    stateRef.current = null;
  }, []);

  // -------------------------------------------------------------
  // Desktop Pointer Events (Mouse drag / Trackpad swipe support)
  // -------------------------------------------------------------
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      // Skip touch pointers to let native touch handlers manage multi-touch
      if (e.pointerType === 'touch') return;
      // Mouse must be primary button
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      stateRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
        startTime: Date.now(),
        isIgnored: shouldIgnoreElement(e.target),
        isVerticalScrollLocked: false,
        pointerId: e.pointerId,
      };
    },
    [disabled]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || !stateRef.current) return;
      if (e.pointerType === 'touch') return;
      const state = stateRef.current;
      if (state.isIgnored) return;

      state.currentX = e.clientX;
      state.currentY = e.clientY;

      const deltaX = Math.abs(state.currentX - state.startX);
      const deltaY = Math.abs(state.currentY - state.startY);

      if (!state.isVerticalScrollLocked && deltaY > 12 && deltaY > deltaX * 1.3) {
        state.isVerticalScrollLocked = true;
      }
    },
    [disabled]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || !stateRef.current) return;
      if (e.pointerType === 'touch') return;
      const state = stateRef.current;
      stateRef.current = null;

      if (state.isIgnored || state.isVerticalScrollLocked) return;

      const deltaX = e.clientX - state.startX;
      const deltaY = e.clientY - state.startY;
      const duration = Date.now() - state.startTime;

      if (duration > maxDurationMs) return;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX < threshold) return;
      if (absY > absX * maxVerticalRatio) return;

      const velocity = absX / duration;
      if (velocity < minVelocity && absX < threshold * 1.5) return;

      if (deltaX < 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    },
    [disabled, maxDurationMs, maxVerticalRatio, minVelocity, onSwipeLeft, onSwipeRight, threshold]
  );

  const onPointerCancel = useCallback(() => {
    stateRef.current = null;
  }, []);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
}
