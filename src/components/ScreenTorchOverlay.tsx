import React, { useState, useEffect } from 'react';
import { Flashlight, FlashlightOff, X } from 'lucide-react';
import { deviceControls } from '../services/deviceControls.ts';

export function ScreenTorchOverlay() {
  const [isActive, setIsActive] = useState<boolean>(
    () => deviceControls.state.torchOn && !!deviceControls.state.isScreenTorch
  );

  useEffect(() => {
    const unsub = deviceControls.subscribe((st) => {
      setIsActive(st.torchOn && !!st.isScreenTorch);
    });

    const handleEvent = (e: any) => {
      if (typeof e.detail?.on === 'boolean') {
        setIsActive(e.detail.on);
      }
    };
    window.addEventListener('gkedit:screen_torch_toggle', handleEvent);

    return () => {
      unsub();
      window.removeEventListener('gkedit:screen_torch_toggle', handleEvent);
    };
  }, []);

  if (!isActive) return null;

  return (
    <div
      onClick={() => deviceControls.turnOffTorch()}
      className="fixed inset-0 z-[99999] bg-white flex flex-col items-center justify-between p-6 select-none cursor-pointer animate-fade-in"
      style={{
        boxShadow: '0 0 120px 40px #ffffff',
      }}
      title="Tap anywhere to turn off Screen Torch"
    >
      {/* Top hint */}
      <div className="pt-4 text-center">
        <span className="px-4 py-1.5 rounded-full bg-slate-900/90 text-slate-100 text-xs font-black tracking-wider uppercase shadow-xl flex items-center gap-2 border border-slate-700">
          <Flashlight className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Screen Flashlight • 100% Max Lumen</span>
        </span>
      </div>

      {/* Center glowing symbol */}
      <div className="flex flex-col items-center justify-center gap-2 text-slate-950/40">
        <Flashlight className="w-24 h-24 stroke-[1.5]" />
        <p className="text-xs font-bold tracking-tight text-slate-900/60 uppercase">
          Illuminating Surroundings
        </p>
      </div>

      {/* Bottom Dismiss Pill */}
      <div className="pb-8">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            deviceControls.turnOffTorch();
          }}
          className="px-6 py-3 rounded-full bg-slate-950 text-white font-bold text-sm shadow-2xl border border-white/20 flex items-center gap-2 hover:bg-slate-900 active:scale-95 transition"
        >
          <FlashlightOff className="w-4 h-4 text-amber-400" />
          <span>Tap to Turn Off Flashlight</span>
          <X className="w-4 h-4 text-slate-400 ml-1" />
        </button>
      </div>
    </div>
  );
}
