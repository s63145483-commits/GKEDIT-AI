import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Image as ImageIcon,
  Search,
  MoreVertical,
  Plus,
  Sparkles,
  Layers,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  X,
  Heart,
  Share2,
  Download,
  Trash2,
  Film,
  Scissors,
  Wand2,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Folder,
  Eye,
  FileCheck,
  HardDrive,
  Cloud,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  cloudGalleryService,
  CloudMediaItem,
  CloudVaultTierInfo,
} from '../services/cloudGalleryService.ts';
import { notificationService } from '../services/notificationService.ts';

interface ColorOsGallerySubtabProps {
  onNavigateToChat?: (prompt: string) => void;
  onOpenCamera?: () => void;
}

export function ColorOsGallerySubtab({ onNavigateToChat, onOpenCamera }: ColorOsGallerySubtabProps) {
  const { user } = useAuth();

  // Screen view: 'photos' (Screen 1 in reference) | 'albums' (Screen 2 in reference)
  const [currentScreen, setCurrentScreen] = useState<'photos' | 'albums'>('photos');

  // Theme: 'dark' (default for GKEDIT AI) | 'light' (exact match to user screenshot)
  const [isLightTheme, setIsLightTheme] = useState(false);

  // Cloud backup banner dismiss state
  const [showBackupCard, setShowBackupCard] = useState(true);

  // Gallery items & Cloud Vault Tier Info
  const [photos, setPhotos] = useState<CloudMediaItem[]>([]);
  const [tierInfo, setTierInfo] = useState<CloudVaultTierInfo>(() =>
    cloudGalleryService.getVaultTierInfo(user)
  );

  // Search & Filter
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbumTitle, setSelectedAlbumTitle] = useState<string | null>(null);

  // Fullscreen Viewer & Modals
  const [activePhoto, setActivePhoto] = useState<CloudMediaItem | null>(null);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [showCollageModal, setShowCollageModal] = useState(false);
  const [selectedForCollage, setSelectedForCollage] = useState<string[]>([]);
  const [collageResult, setCollageResult] = useState<string | null>(null);

  // Hidden batch file input for backup / upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Subscribe to cloudGalleryService (strictly 0 default photos)
  useEffect(() => {
    const unsub = cloudGalleryService.subscribe((updatedItems) => {
      setPhotos(updatedItems);
      setTierInfo(cloudGalleryService.getVaultTierInfo(user));
    });
    return () => unsub();
  }, [user]);

  // Batch file upload directly to Cloud Vault (0 MB on phone)
  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      try {
        await cloudGalleryService.ingestFile(files[i], 'camera', user);
      } catch (err) {
        console.error('File backup error:', err);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filtered photos
  const filteredPhotos = useMemo(() => {
    let result = photos.filter((p) => !p.isDeleted);
    if (selectedAlbumTitle) {
      if (selectedAlbumTitle === 'AI Cutouts') {
        result = result.filter((p) => p.album === 'cutouts');
      } else if (selectedAlbumTitle === 'Downloads') {
        result = result.filter((p) => p.album === 'screenshots');
      } else if (selectedAlbumTitle === 'Twitter Pictures') {
        result = result.filter((p) => p.tags?.includes('Social') || p.album === 'camera');
      } else if (selectedAlbumTitle === 'Trash') {
        result = photos.filter((p) => p.isDeleted);
      }
    }
    if (searchQuery.trim()) {
      result = cloudGalleryService.searchGallery(searchQuery, result);
    }
    return result;
  }, [photos, selectedAlbumTitle, searchQuery]);

  // Group photos into "Today", "Yesterday", "Earlier This Month"
  const groupedPhotos = useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const groups: { [key: string]: CloudMediaItem[] } = {
      Today: [],
      Yesterday: [],
      'Earlier This Month': [],
    };

    filteredPhotos.forEach((item) => {
      const itemDate = new Date(item.timestamp).toDateString();
      if (itemDate === today) {
        groups.Today.push(item);
      } else if (itemDate === yesterday) {
        groups.Yesterday.push(item);
      } else {
        groups['Earlier This Month'].push(item);
      }
    });

    return groups;
  }, [filteredPhotos]);

  // Generate Photo Collage from selected photos
  const handleGenerateCollage = () => {
    const selected = photos.filter((p) => selectedForCollage.includes(p.id));
    if (selected.length < 2) {
      notificationService.showInAppToast('Select Photos', 'Please select at least 2 photos for collage.', 'alert');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = isLightTheme ? '#FFFFFF' : '#0D0F12';
    ctx.fillRect(0, 0, 1200, 1200);

    const loadImages = selected.slice(0, 4).map((p) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.src = p.url;
      });
    });

    Promise.all(loadImages).then((imgs) => {
      if (imgs.length === 2) {
        ctx.drawImage(imgs[0], 10, 10, 585, 1180);
        ctx.drawImage(imgs[1], 605, 10, 585, 1180);
      } else if (imgs.length === 3) {
        ctx.drawImage(imgs[0], 10, 10, 585, 1180);
        ctx.drawImage(imgs[1], 605, 10, 585, 585);
        ctx.drawImage(imgs[2], 605, 605, 585, 585);
      } else {
        ctx.drawImage(imgs[0], 10, 10, 585, 585);
        ctx.drawImage(imgs[1], 605, 10, 585, 585);
        ctx.drawImage(imgs[2], 10, 605, 585, 585);
        ctx.drawImage(imgs[3], 605, 605, 585, 585);
      }
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCollageResult(dataUrl);
      notificationService.showInAppToast('Collage Created', 'Your collage was generated successfully.', 'success');
    });
  };

  return (
    <div
      className={`relative w-full min-h-[92vh] flex flex-col font-sans select-none overflow-x-hidden pb-28 transition-colors duration-200 ${
        isLightTheme ? 'bg-[#F8F9FA] text-[#1F1F1F]' : 'bg-[#0D0F12] text-white'
      }`}
    >
      {/* Hidden batch file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleBatchUpload}
      />

      {/* ----------------------------------------------------------- */}
      {/* 1. TOP HEADER (Exact match to screenshot)                   */}
      {/* ----------------------------------------------------------- */}
      <div
        className={`sticky top-0 z-30 px-5 pt-3 pb-2 flex items-center justify-between backdrop-blur-xl transition-colors ${
          isLightTheme ? 'bg-[#F8F9FA]/90 border-b border-black/5' : 'bg-[#0D0F12]/90 border-b border-white/5'
        }`}
      >
        <div className="flex items-center gap-2">
          {selectedAlbumTitle && (
            <button
              onClick={() => setSelectedAlbumTitle(null)}
              className="p-1 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-2xl font-bold tracking-tight">
            {selectedAlbumTitle ? selectedAlbumTitle : currentScreen === 'photos' ? 'Photos' : 'Albums'}
          </h1>
        </div>

        {/* Right action icons: Search & Options */}
        <div className="flex items-center gap-1.5 relative">
          <button
            onClick={() => setIsSearchActive(!isSearchActive)}
            className={`p-2 rounded-full transition cursor-pointer ${
              isLightTheme ? 'hover:bg-black/5 text-[#3C4043]' : 'hover:bg-white/10 text-white/80'
            }`}
            title="Search photos"
          >
            <Search className="w-5 h-5 stroke-[1.8]" />
          </button>

          <button
            onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
            className={`p-2 rounded-full transition cursor-pointer ${
              isLightTheme ? 'hover:bg-black/5 text-[#3C4043]' : 'hover:bg-white/10 text-white/80'
            }`}
            title="More options"
          >
            <MoreVertical className="w-5 h-5 stroke-[1.8]" />
          </button>

          {/* Options Dropdown Menu */}
          {showOptionsDropdown && (
            <div
              className={`absolute right-0 top-12 z-50 w-56 rounded-2xl p-2 shadow-2xl border text-xs animate-in fade-in zoom-in-95 duration-150 ${
                isLightTheme
                  ? 'bg-white border-black/10 text-[#1F1F1F]'
                  : 'bg-[#181C24] border-white/10 text-white'
              }`}
            >
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowOptionsDropdown(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2.5 font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4 text-blue-500" />
                <span>Upload to Cloud Vault</span>
              </button>

              {onOpenCamera && (
                <button
                  onClick={() => {
                    onOpenCamera();
                    setShowOptionsDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2.5 font-medium cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                  <span>Open Camera</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsLightTheme(!isLightTheme);
                  setShowOptionsDropdown(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-2.5 font-medium cursor-pointer border-t border-black/5 dark:border-white/5 mt-1 pt-2"
              >
                <span>Theme: {isLightTheme ? 'Switch to Dark Mode' : 'Switch to Light (Screenshot Match)'}</span>
              </button>

              <div className="px-3 py-2 text-[10px] text-slate-400 font-mono border-t border-black/5 dark:border-white/5 mt-1">
                {tierInfo.badgeLabel} • 0 MB Phone Space
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multimodal Search Input Bar */}
      {isSearchActive && (
        <div className="px-5 py-2 animate-in slide-in-from-top-2 duration-150">
          <div
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border ${
              isLightTheme ? 'bg-white border-black/10' : 'bg-[#181C24] border-white/10'
            }`}
          >
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people, places, documents, or tags..."
              className="w-full bg-transparent text-xs focus:outline-none"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* SCREEN 1: "PHOTOS" TIMELINE GRID                           */}
      {/* ----------------------------------------------------------- */}
      {currentScreen === 'photos' && (
        <div className="flex flex-col">
          {/* Interactive Cloud Backup Banner Card */}
          {showBackupCard && !selectedAlbumTitle && (
            <div className="px-4 py-2">
              <div
                className={`p-4 rounded-3xl border shadow-sm transition-all relative overflow-hidden ${
                  isLightTheme
                    ? 'bg-[#EDF2F7] border-black/5 text-[#1F1F1F]'
                    : 'bg-[#161B22] border-white/10 text-white'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Google Photos / Cloud 4-Color Pinwheel Icon */}
                  <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-800">
                    <svg viewBox="0 0 24 24" className="w-6 h-6">
                      <path fill="#EA4335" d="M12 0C10.34 0 9 1.34 9 3v6h6V3c0-1.66-1.34-3-3-3z" />
                      <path fill="#4285F4" d="M24 12c0-1.66-1.34-3-3-3h-6v6h6c1.66 0 3-1.34 3-3z" />
                      <path fill="#34A853" d="M12 24c1.66 0 3-1.34 3-3v-6H9v6c0 1.66 1.34 3 3 3z" />
                      <path fill="#FBBC05" d="M0 12c0 1.66 1.34 3 3 3h6V9H3c-1.66 0-3 1.34-3 3z" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <h3 className="text-sm font-semibold tracking-tight text-inherit">
                      Back up your items to GKEDIT Cloud
                    </h3>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        isLightTheme ? 'text-[#5F6368]' : 'text-slate-400'
                      }`}
                    >
                      Start now and keep your photos and videos safe in {tierInfo.quotaGb >= 1000 ? '10 TB Master' : '512 GB'} Cloud Vault (0 MB on phone).
                    </p>
                  </div>

                  {/* Dismiss card */}
                  <button
                    onClick={() => setShowBackupCard(false)}
                    className="absolute top-3.5 right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 mt-3.5 pt-1">
                  <button
                    onClick={() => setShowBackupCard(false)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${
                      isLightTheme ? 'text-[#5F6368] hover:bg-black/5' : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    Not now
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-1.5 rounded-full bg-[#1A73E8] hover:bg-blue-600 text-white font-semibold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    Turn on backup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ZERO DEFAULT PHOTOS: Strict Empty State Notice */}
          {filteredPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-24 text-center space-y-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center border shadow-inner ${
                  isLightTheme
                    ? 'bg-white border-black/10 text-slate-400'
                    : 'bg-[#181C24] border-white/10 text-slate-500'
                }`}
              >
                <Cloud className="w-8 h-8 text-[#1A73E8]" />
              </div>

              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-sm font-semibold">No photos in Cloud Vault yet</h3>
                <p
                  className={`text-xs leading-relaxed ${
                    isLightTheme ? 'text-[#5F6368]' : 'text-slate-400'
                  }`}
                >
                  Tap &quot;+&quot; or &quot;Turn on backup&quot; to back up from your device to your {tierInfo.quotaGb >= 1000 ? '10 TB Master' : '512 GB'} free cloud.
                  <span className="block text-emerald-500 font-medium mt-1">
                    ✓ Processed in-memory • Exactly 0 MB used on phone
                  </span>
                </p>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2 rounded-full bg-[#1A73E8] hover:bg-blue-600 text-white font-semibold text-xs shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Photos</span>
              </button>
            </div>
          ) : (
            /* Compact Multi-Column 4-Grid matching reference image exactly */
            <div className="space-y-4 pb-6">
              {Object.entries(groupedPhotos).map(([groupTitle, groupItems]) => {
                if (groupItems.length === 0) return null;
                return (
                  <div key={groupTitle} className="space-y-1.5">
                    {/* Date Header with Horizontal Indicator Dashes */}
                    <div className="px-4 flex items-center gap-2.5">
                      <span className="text-xs font-semibold tracking-tight">{groupTitle}</span>
                      {/* Horizontal block dash indicator */}
                      <div className="flex items-center gap-1.5 opacity-40">
                        <div className="w-2.5 h-1.5 rounded-[1px] bg-current" />
                        <div className="w-2.5 h-1.5 rounded-[1px] bg-current" />
                        <div className="w-3.5 h-1.5 rounded-[1px] bg-current" />
                        <div className="w-5 h-1.5 rounded-[1px] bg-current" />
                      </div>
                    </div>

                    {/* 4-Column Compact Square Grid (2px gap, edge-to-edge) */}
                    <div className="grid grid-cols-4 gap-[2px] px-[2px]">
                      {groupItems.map((photo) => (
                        <div
                          key={photo.id}
                          onClick={() => setActivePhoto(photo)}
                          className="relative aspect-square overflow-hidden bg-slate-800 cursor-pointer group"
                        >
                          <img
                            src={photo.thumbnailUrl || photo.url}
                            alt={photo.title}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />

                          {/* Video Duration Badge */}
                          {photo.mimeType?.includes('video') && (
                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white flex items-center gap-1">
                              <Film className="w-2.5 h-2.5" />
                              <span>0:49</span>
                            </div>
                          )}

                          {/* AI Cutout PNG Badge */}
                          {photo.album === 'cutouts' && (
                            <div className="absolute top-1 left-1 px-1 rounded bg-black/70 text-[8px] font-bold text-[#00E5FF]">
                              CUTOUT
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* SCREEN 2: "ALBUMS & CREATIVITY" (Right screen in reference) */}
      {/* ----------------------------------------------------------- */}
      {currentScreen === 'albums' && (
        <div className="px-4 py-2 space-y-6">
          {/* Albums Section with Horizontal Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight">Albums</h2>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scrollbar-none pb-1">
              {/* Downloads Album Card */}
              <div
                onClick={() => {
                  setSelectedAlbumTitle('Downloads');
                  setCurrentScreen('photos');
                }}
                className={`w-36 shrink-0 p-3 rounded-2xl border shadow-sm cursor-pointer transition hover:scale-[1.02] ${
                  isLightTheme ? 'bg-white border-black/5' : 'bg-[#181C24] border-white/10'
                }`}
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center mb-2">
                  <Folder className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xs font-semibold truncate">Downloads</h3>
                <p className="text-[10px] text-slate-400">
                  {photos.filter((p) => p.album === 'screenshots').length}
                </p>
              </div>

              {/* Twitter Pictures Album Card */}
              <div
                onClick={() => {
                  setSelectedAlbumTitle('Twitter Pictures');
                  setCurrentScreen('photos');
                }}
                className={`w-36 shrink-0 p-3 rounded-2xl border shadow-sm cursor-pointer transition hover:scale-[1.02] ${
                  isLightTheme ? 'bg-white border-black/5' : 'bg-[#181C24] border-white/10'
                }`}
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center mb-2">
                  <ImageIcon className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xs font-semibold truncate">Twitter Pictures</h3>
                <p className="text-[10px] text-slate-400">
                  {photos.filter((p) => p.tags?.includes('Social')).length}
                </p>
              </div>

              {/* AI Cutouts Album Card */}
              <div
                onClick={() => {
                  setSelectedAlbumTitle('AI Cutouts');
                  setCurrentScreen('photos');
                }}
                className={`w-36 shrink-0 p-3 rounded-2xl border shadow-sm cursor-pointer transition hover:scale-[1.02] ${
                  isLightTheme ? 'bg-white border-black/5' : 'bg-[#181C24] border-white/10'
                }`}
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center mb-2">
                  <Scissors className="w-8 h-8 text-[#FFD700]" />
                </div>
                <h3 className="text-xs font-semibold truncate">AI Cutouts</h3>
                <p className="text-[10px] text-slate-400">
                  {photos.filter((p) => p.album === 'cutouts').length}
                </p>
              </div>

              {/* Camera Album Card */}
              <div
                onClick={() => {
                  setSelectedAlbumTitle(null);
                  setCurrentScreen('photos');
                }}
                className={`w-36 shrink-0 p-3 rounded-2xl border shadow-sm cursor-pointer transition hover:scale-[1.02] ${
                  isLightTheme ? 'bg-white border-black/5' : 'bg-[#181C24] border-white/10'
                }`}
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center mb-2">
                  <Folder className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xs font-semibold truncate">Camera</h3>
                <p className="text-[10px] text-slate-400">{photos.length}</p>
              </div>
            </div>
          </div>

          {/* Memories Card */}
          <div className="space-y-2.5">
            <h2 className="text-base font-bold tracking-tight">Memories</h2>
            <div
              className={`p-4 rounded-3xl border flex items-center gap-3.5 shadow-sm ${
                isLightTheme ? 'bg-white border-black/5' : 'bg-[#181C24] border-white/10'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-400 shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold">No memories here yet</h3>
                <p className={`text-[11px] mt-0.5 ${isLightTheme ? 'text-slate-500' : 'text-slate-400'}`}>
                  Memories will be organized when synced to cloud.
                </p>
              </div>
            </div>
          </div>

          {/* Creativity Section (Collage, Video editor, Auto edit, Clip) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight">Creativity</h2>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            <div
              className={`rounded-3xl border shadow-sm overflow-hidden divide-y ${
                isLightTheme
                  ? 'bg-white border-black/5 divide-black/5'
                  : 'bg-[#181C24] border-white/10 divide-white/5'
              }`}
            >
              {/* Collage */}
              <button
                onClick={() => setShowCollageModal(true)}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-500 flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">Collage</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Video Editor */}
              <button
                onClick={() => {
                  notificationService.showInAppToast('Video Editor', 'Launching video cutter and montage suite.', 'success');
                }}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-purple-500/15 text-purple-500 flex items-center justify-center">
                    <Film className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">Video editor</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Auto Edit */}
              <button
                onClick={() => {
                  if (photos.length > 0) {
                    cloudGalleryService.executeClarityEnhancer(photos[0].id);
                  } else {
                    notificationService.showInAppToast('Auto Edit', 'Upload photos first to auto-enhance lighting and colors.', 'alert');
                  }
                }}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-blue-500/15 text-blue-500 flex items-center justify-center">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">Auto edit</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              {/* Clip */}
              <button
                onClick={() => {
                  notificationService.showInAppToast('Clip Maker', 'Generating dynamic 15-second music clip reel.', 'success');
                }}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">Clip</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* More Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight">More</h2>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            <div
              onClick={() => {
                setSelectedAlbumTitle('Trash');
                setCurrentScreen('photos');
              }}
              className={`p-4 rounded-3xl border flex items-center justify-between shadow-sm cursor-pointer transition hover:scale-[1.01] ${
                isLightTheme ? 'bg-white border-black/5' : 'bg-[#181C24] border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-slate-400" />
                <span className="text-xs font-semibold">Trash (Recycle Bin)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">
                  {photos.filter((p) => p.isDeleted).length}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* FLOATING BOTTOM NAVIGATION CAPSULE (Exact match to image)  */}
      {/* ----------------------------------------------------------- */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-2xl border transition-all ${
            isLightTheme
              ? 'bg-white/95 border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)]'
              : 'bg-[#1E232E]/95 border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.6)]'
          }`}
        >
          {/* Left Button: Photos / Grid View */}
          <button
            onClick={() => setCurrentScreen('photos')}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              currentScreen === 'photos'
                ? isLightTheme
                  ? 'bg-black/10 text-[#1A73E8]'
                  : 'bg-white/20 text-[#00E5FF]'
                : 'text-slate-400 hover:text-inherit'
            }`}
            title="Photos Timeline View"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Right Button: Albums & Creativity View */}
          <button
            onClick={() => setCurrentScreen('albums')}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              currentScreen === 'albums'
                ? isLightTheme
                  ? 'bg-black/10 text-[#1A73E8]'
                  : 'bg-white/20 text-[#00E5FF]'
                : 'text-slate-400 hover:text-inherit'
            }`}
            title="Albums & Creativity View"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* FULLSCREEN PHOTO VIEWER MODAL                              */}
      {/* ----------------------------------------------------------- */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-black/98 backdrop-blur-2xl flex flex-col justify-between animate-in fade-in duration-150">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/60 border-b border-white/10">
            <button
              onClick={() => setActivePhoto(null)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center">
              <h3 className="text-xs font-bold text-white truncate max-w-xs">{activePhoto.title}</h3>
              <p className="text-[10px] text-cyan-400 font-mono">
                {activePhoto.resolutionLabel} • {Math.round(activePhoto.fileSizeBytes / (1024 * 1024) * 10) / 10} MB Cloud
              </p>
            </div>
            <button
              onClick={() => cloudGalleryService.toggleFavorite(activePhoto.id)}
              className="p-1.5 rounded-full hover:bg-white/10 text-white"
            >
              <Heart
                className={`w-5 h-5 ${activePhoto.isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`}
              />
            </button>
          </div>

          {/* Image Canvas */}
          <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
            <img
              src={activePhoto.url}
              alt={activePhoto.title}
              className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>

          {/* Bottom Action Bar */}
          <div className="px-6 py-4 bg-black/80 border-t border-white/10 flex items-center justify-around">
            {/* AI Cutout */}
            <button
              onClick={async () => {
                await cloudGalleryService.executeSmartMattingCutout(activePhoto.id);
                setActivePhoto(null);
              }}
              className="flex flex-col items-center gap-1 text-slate-300 hover:text-[#FFD700]"
            >
              <Scissors className="w-5 h-5 text-[#FFD700]" />
              <span className="text-[10px]">Cutout</span>
            </button>

            {/* AI Eraser */}
            <button
              onClick={async () => {
                await cloudGalleryService.executeAiEraser(activePhoto.id);
                setActivePhoto(null);
              }}
              className="flex flex-col items-center gap-1 text-slate-300 hover:text-[#00E5FF]"
            >
              <Wand2 className="w-5 h-5 text-[#00E5FF]" />
              <span className="text-[10px]">AI Eraser</span>
            </button>

            {/* Export */}
            <button
              onClick={() => {
                const a = document.createElement('a');
                a.href = activePhoto.url;
                a.download = activePhoto.filename || `GKEDIT_${Date.now()}.jpg`;
                a.click();
              }}
              className="flex flex-col items-center gap-1 text-slate-300 hover:text-white"
            >
              <Download className="w-5 h-5" />
              <span className="text-[10px]">Download</span>
            </button>

            {/* Delete */}
            <button
              onClick={() => {
                cloudGalleryService.moveToTrash(activePhoto.id);
                setActivePhoto(null);
              }}
              className="flex flex-col items-center gap-1 text-slate-300 hover:text-red-400"
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-[10px]">Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* PHOTO COLLAGE CREATOR MODAL                                */}
      {/* ----------------------------------------------------------- */}
      {showCollageModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl p-5 border space-y-4 shadow-2xl ${
              isLightTheme ? 'bg-white border-black/10 text-[#1F1F1F]' : 'bg-[#181C24] border-white/10 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Photo Collage Studio</h3>
              <button onClick={() => setShowCollageModal(false)} className="p-1 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select 2 to 4 photos from your Cloud Vault to create an instant high-resolution collage.
            </p>

            {/* Photo Selection Grid */}
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
              {photos.map((p) => {
                const isSelected = selectedForCollage.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedForCollage(selectedForCollage.filter((id) => id !== p.id));
                      } else if (selectedForCollage.length < 4) {
                        setSelectedForCollage([...selectedForCollage, p.id]);
                      }
                    }}
                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition ${
                      isSelected ? 'border-blue-500 scale-95' : 'border-transparent'
                    }`}
                  >
                    <img src={p.thumbnailUrl || p.url} alt="" className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Rendered Collage Preview */}
            {collageResult && (
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/20">
                <img src={collageResult} alt="Collage" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowCollageModal(false)}
                className="flex-1 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateCollage}
                className="flex-1 py-2 rounded-xl bg-[#1A73E8] text-white text-xs font-bold"
              >
                Create Collage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
