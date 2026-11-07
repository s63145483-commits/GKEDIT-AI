import React, { useEffect, useState } from 'react';

/**
 * Synthesize a crisp, authentic mechanical camera shutter click via Web Audio API.
 * Uses dual-pulse oscillator ramps to emulate mechanical shutter curtain release and snap.
 */
export function playCameraShutterSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // First click: shutter curtain opening
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1100, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.05);

    gain1.gain.setValueAtTime(0.4, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.06);

    // Second click: shutter blade closing (40ms later)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(800, ctx.currentTime + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.1);

    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.11);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.04);
    osc2.stop(ctx.currentTime + 0.12);
  } catch {
    // AudioContext blocked or restricted, continue silently
  }
}

/**
 * Dispatch global flash event for headless / decoupled triggering.
 */
export function triggerGlobalCameraFlash() {
  window.dispatchEvent(new CustomEvent('gkedit:trigger_camera_flash'));
}

export interface CaptureFlashOverlayProps {
  /**
   * Controlled flashing state from parent component.
   */
  isFlashing?: boolean;
  /**
   * Sound enabled flag (defaults to true).
   */
  soundEnabled?: boolean;
}

/**
 * CaptureFlashOverlay
 * Triggers a full-screen white flash with a CSS transition and camera shutter sound effect
 * when capture is triggered, while keeping the UI fully responsive during subsequent API calls.
 */
export function CaptureFlashOverlay({
  isFlashing = false,
  soundEnabled = true,
}: CaptureFlashOverlayProps) {
  const [internalFlash, setInternalFlash] = useState(false);

  // Listen to global flash event
  useEffect(() => {
    const handleEvent = () => {
      if (soundEnabled) {
        playCameraShutterSound();
      }
      setInternalFlash(true);
      const timer = setTimeout(() => {
        setInternalFlash(false);
      }, 200);
      return () => clearTimeout(timer);
    };

    window.addEventListener('gkedit:trigger_camera_flash', handleEvent);
    return () => {
      window.removeEventListener('gkedit:trigger_camera_flash', handleEvent);
    };
  }, [soundEnabled]);

  // When controlled prop changes to true, trigger sound & flash
  useEffect(() => {
    if (isFlashing && soundEnabled) {
      playCameraShutterSound();
    }
  }, [isFlashing, soundEnabled]);

  const active = isFlashing || internalFlash;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-200 ease-out ${
        active ? 'opacity-95 bg-white' : 'opacity-0 bg-transparent'
      }`}
      style={{
        willChange: 'opacity',
      }}
    />
  );
}
