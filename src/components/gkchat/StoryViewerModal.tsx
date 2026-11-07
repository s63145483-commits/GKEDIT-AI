import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { GKStory } from '../../types/gkChat.ts';
import { gkMessengerService } from '../../services/gkMessengerService.ts';

interface StoryViewerModalProps {
  initialStory: GKStory | null;
  onClose: () => void;
}

export function StoryViewerModal({ initialStory, onClose }: StoryViewerModalProps) {
  const [stories, setStories] = useState<GKStory[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const list = gkMessengerService.getStories();
    setStories(list);
    if (initialStory) {
      const idx = list.findIndex((s) => s.id === initialStory.id);
      if (idx !== -1) setCurrentIndex(idx);
    }
  }, [initialStory]);

  const currentStory = stories[currentIndex];

  // Auto-advance progress bar
  useEffect(() => {
    if (!currentStory) return;
    gkMessengerService.markStoryViewed(currentStory.id);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          handleNext();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, currentStory?.id]);

  if (!currentStory) return null;

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center liquid-glass-modal-backdrop p-2 sm:p-4 select-none animate-in fade-in">
      <div className="relative w-full max-w-sm sm:max-w-md h-[85vh] max-h-[750px] rounded-3xl overflow-hidden liquid-glass-modal-container flex flex-col">
        <div className="liquid-glass-modal-glare" />
        {/* Progress Bars at Top */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {stories.map((s, idx) => (
            <div key={s.id} className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
              <div
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
                className="h-full bg-cyan-400 transition-all duration-100 ease-linear"
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white drop-shadow-md">
          <div className="flex items-center gap-2">
            <img
              src={currentStory.contactAvatar}
              alt={currentStory.contactName}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-400"
            />
            <div>
              <h4 className="text-xs font-bold">{currentStory.contactName}</h4>
              <p className="text-[10px] text-slate-300">{currentStory.timestamp}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Media (Image with full bleed) */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          <img
            src={currentStory.mediaUrl}
            alt="AI Story"
            className="w-full h-full object-cover"
          />

          {/* Navigation Tap Zones */}
          <div
            onClick={handlePrev}
            className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
          />
          <div
            onClick={handleNext}
            className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
          />

          {/* Previous / Next Chevron Buttons */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 z-20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 z-20"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Story Caption at Bottom */}
        {currentStory.caption && (
          <div className="p-4 bg-gradient-to-t from-black via-black/90 to-transparent absolute bottom-0 left-0 right-0 z-20 text-center">
            <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed drop-shadow-md">
              {currentStory.caption}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
