import React from 'react';
import { FlagshipHyperOsCamera } from './FlagshipHyperOsCamera.tsx';

export interface RealCameraSubtabProps {
  onNavigateToChat?: (prompt: string) => void;
  onBack?: () => void;
}

export { FlagshipHyperOsCamera };

/**
 * RealCameraSubtab: Flagship Xiaomi HyperOS / Mi Camera integration.
 * Renders the native-grade dark glass viewfinder, curved rotary zoom dial,
 * 35mm equivalent focal lengths, Leica dual-camera watermark, and video recording.
 */
export function RealCameraSubtab({ onNavigateToChat, onBack }: RealCameraSubtabProps) {
  return (
    <div className="w-full h-full min-h-[100dvh]">
      <FlagshipHyperOsCamera onNavigateToChat={onNavigateToChat} onClose={onBack} />
    </div>
  );
}

export default RealCameraSubtab;
