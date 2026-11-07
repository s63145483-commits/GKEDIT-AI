// ========================================================================
// THEME ACCENT CUSTOMIZATION SERVICE
// Manages system accent color presets (Cyan, Emerald, Violet, Orange, Rose, Blue)
// Syncs CSS variables, [data-accent] DOM attributes, and persistent localStorage
// ========================================================================

export type AccentThemeId = 'cyan' | 'emerald' | 'violet' | 'orange' | 'rose' | 'blue';

export interface AccentPreset {
  id: AccentThemeId;
  name: string;
  subtitle: string;
  badge: string;
  primaryHex: string;
  lightHex: string;
  darkHex: string;
  rgb: string;
  lightRgb: string;
  glowRgba: string;
  borderRgba: string;
  bgSubtleRgba: string;
  gradient: string;
  gradientHover: string;
  previewClass: string;
  textColor: string;
  activeBorderColor: string;
  activeBgColor: string;
  description: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: 'cyan',
    name: 'Cyber Cyan',
    subtitle: 'Classic Neo-Tokyo Glow',
    badge: 'Default',
    primaryHex: '#06b6d4',
    lightHex: '#22d3ee',
    darkHex: '#0891b2',
    rgb: '6, 182, 212',
    lightRgb: '34, 211, 238',
    glowRgba: 'rgba(6, 182, 212, 0.4)',
    borderRgba: 'rgba(6, 182, 212, 0.35)',
    bgSubtleRgba: 'rgba(6, 182, 212, 0.15)',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
    gradientHover: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)',
    previewClass: 'from-cyan-400 to-blue-600',
    textColor: 'text-cyan-300',
    activeBorderColor: 'border-cyan-400',
    activeBgColor: 'bg-cyan-500/20',
    description: 'Crisp hyper-tech cybernetic radiance, tuned for high-contrast dark mode interfaces.',
  },
  {
    id: 'emerald',
    name: 'Bio Emerald',
    subtitle: 'Luminescent Matrix Flora',
    badge: 'Popular',
    primaryHex: '#10b981',
    lightHex: '#34d399',
    darkHex: '#059669',
    rgb: '16, 185, 129',
    lightRgb: '52, 211, 153',
    glowRgba: 'rgba(16, 185, 129, 0.4)',
    borderRgba: 'rgba(16, 185, 129, 0.35)',
    bgSubtleRgba: 'rgba(16, 185, 129, 0.15)',
    gradient: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
    gradientHover: 'linear-gradient(135deg, #34d399 0%, #14b8a6 100%)',
    previewClass: 'from-emerald-400 to-teal-600',
    textColor: 'text-emerald-300',
    activeBorderColor: 'border-emerald-400',
    activeBgColor: 'bg-emerald-500/20',
    description: 'Deep biological matrix glow inspired by genetic sequencing and organic micro-circuitry.',
  },
  {
    id: 'violet',
    name: 'Electric Violet',
    subtitle: 'Cosmic Nebula & Deep Space',
    badge: 'Cyberpunk',
    primaryHex: '#8b5cf6',
    lightHex: '#a78bfa',
    darkHex: '#7c3aed',
    rgb: '139, 92, 246',
    lightRgb: '167, 139, 250',
    glowRgba: 'rgba(139, 92, 246, 0.4)',
    borderRgba: 'rgba(139, 92, 246, 0.35)',
    bgSubtleRgba: 'rgba(139, 92, 246, 0.15)',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    gradientHover: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)',
    previewClass: 'from-violet-400 to-indigo-600',
    textColor: 'text-violet-300',
    activeBorderColor: 'border-violet-400',
    activeBgColor: 'bg-violet-500/20',
    description: 'Deep cosmic amethyst energy with ultraviolet highlights and ethereal reflections.',
  },
  {
    id: 'orange',
    name: 'Solar Orange',
    subtitle: 'High-Energy Plasma & Sunburst',
    badge: 'Warm Glow',
    primaryHex: '#f97316',
    lightHex: '#fb923c',
    darkHex: '#ea580c',
    rgb: '249, 115, 22',
    lightRgb: '251, 146, 60',
    glowRgba: 'rgba(249, 115, 22, 0.4)',
    borderRgba: 'rgba(249, 115, 22, 0.35)',
    bgSubtleRgba: 'rgba(249, 115, 22, 0.15)',
    gradient: 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)',
    gradientHover: 'linear-gradient(135deg, #fb923c 0%, #f43f5e 100%)',
    previewClass: 'from-orange-400 to-rose-600',
    textColor: 'text-orange-300',
    activeBorderColor: 'border-orange-400',
    activeBgColor: 'bg-orange-500/20',
    description: 'Vibrant solar thermal pulse delivering high-visibility amber warmth across the UI.',
  },
  {
    id: 'rose',
    name: 'Cyber Rose',
    subtitle: 'Vivid Ruby Neon Flux',
    badge: 'Vivid',
    primaryHex: '#f43f5e',
    lightHex: '#fb7185',
    darkHex: '#e11d48',
    rgb: '244, 63, 94',
    lightRgb: '251, 113, 133',
    glowRgba: 'rgba(244, 63, 94, 0.4)',
    borderRgba: 'rgba(244, 63, 94, 0.35)',
    bgSubtleRgba: 'rgba(244, 63, 94, 0.15)',
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #c026d3 100%)',
    gradientHover: 'linear-gradient(135deg, #fb7185 0%, #e879f9 100%)',
    previewClass: 'from-rose-400 to-fuchsia-600',
    textColor: 'text-rose-300',
    activeBorderColor: 'border-rose-400',
    activeBgColor: 'bg-rose-500/20',
    description: 'Futuristic magenta-ruby glow evoking high-fashion cyberpunk and neon streetscapes.',
  },
  {
    id: 'blue',
    name: 'Cobalt Blue',
    subtitle: 'Deep Oceanic Cerulean',
    badge: 'Oceanic',
    primaryHex: '#3b82f6',
    lightHex: '#60a5fa',
    darkHex: '#2563eb',
    rgb: '59, 130, 246',
    lightRgb: '96, 165, 250',
    glowRgba: 'rgba(59, 130, 246, 0.4)',
    borderRgba: 'rgba(59, 130, 246, 0.35)',
    bgSubtleRgba: 'rgba(59, 130, 246, 0.15)',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    gradientHover: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
    previewClass: 'from-blue-400 to-indigo-700',
    textColor: 'text-blue-300',
    activeBorderColor: 'border-blue-400',
    activeBgColor: 'bg-blue-500/20',
    description: 'Authoritative deep cobalt blue reminiscent of liquid glass lenses and high-altitude aeronautics.',
  },
];

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'gkedit_accent_theme';
const THEME_MODE_KEY = 'gkedit_theme_mode';

class ThemeService {
  private currentAccent: AccentThemeId = 'cyan';
  private currentMode: ThemeMode = 'dark';
  private listeners: Set<(preset: AccentPreset) => void> = new Set();
  private modeListeners: Set<(mode: ThemeMode) => void> = new Set();

  constructor() {
    this.initTheme();
  }

  public initTheme(): void {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as AccentThemeId | null;
      if (saved && ACCENT_PRESETS.some((p) => p.id === saved)) {
        this.currentAccent = saved;
      } else {
        this.currentAccent = 'cyan';
      }
    } catch {
      this.currentAccent = 'cyan';
    }

    try {
      const savedMode = localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null;
      if (savedMode === 'light' || savedMode === 'dark') {
        this.currentMode = savedMode;
      } else {
        this.currentMode = 'dark';
      }
    } catch {
      this.currentMode = 'dark';
    }

    this.applyToDOM(this.currentAccent);
    this.applyModeToDOM(this.currentMode);
  }

  public getPresets(): AccentPreset[] {
    return ACCENT_PRESETS;
  }

  public getCurrentAccent(): AccentThemeId {
    return this.currentAccent;
  }

  public getCurrentPreset(): AccentPreset {
    return ACCENT_PRESETS.find((p) => p.id === this.currentAccent) || ACCENT_PRESETS[0];
  }

  public getPreset(id: AccentThemeId): AccentPreset {
    return ACCENT_PRESETS.find((p) => p.id === id) || ACCENT_PRESETS[0];
  }

  public getThemeMode(): ThemeMode {
    return this.currentMode;
  }

  public setThemeMode(mode: ThemeMode): ThemeMode {
    this.currentMode = mode;
    try {
      localStorage.setItem(THEME_MODE_KEY, mode);
    } catch (e) {
      console.warn('Could not save theme mode to localStorage:', e);
    }
    this.applyModeToDOM(mode);
    this.notifyModeListeners(mode);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('gkedit:theme_mode_change', {
          detail: { mode },
        })
      );
    }
    return mode;
  }

  public toggleThemeMode(): ThemeMode {
    const next = this.currentMode === 'dark' ? 'light' : 'dark';
    return this.setThemeMode(next);
  }

  public setAccent(id: AccentThemeId): AccentPreset {
    const preset = this.getPreset(id);
    this.currentAccent = preset.id;
    try {
      localStorage.setItem(STORAGE_KEY, preset.id);
    } catch (e) {
      console.warn('Could not save theme accent to localStorage:', e);
    }
    this.applyToDOM(preset.id);
    this.notifyListeners(preset);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('gkedit:theme_change', {
          detail: { accentId: preset.id, preset },
        })
      );
    }

    return preset;
  }

  public resetToDefault(): AccentPreset {
    this.setThemeMode('dark');
    return this.setAccent('cyan');
  }

  public subscribe(listener: (preset: AccentPreset) => void): () => void {
    this.listeners.add(listener);
    listener(this.getCurrentPreset());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeMode(listener: (mode: ThemeMode) => void): () => void {
    this.modeListeners.add(listener);
    listener(this.currentMode);
    return () => {
      this.modeListeners.delete(listener);
    };
  }

  private notifyListeners(preset: AccentPreset): void {
    this.listeners.forEach((listener) => {
      try {
        listener(preset);
      } catch (err) {
        console.error('Error in theme listener:', err);
      }
    });
  }

  private notifyModeListeners(mode: ThemeMode): void {
    this.modeListeners.forEach((listener) => {
      try {
        listener(mode);
      } catch (err) {
        console.error('Error in theme mode listener:', err);
      }
    });
  }

  private applyModeToDOM(mode: ThemeMode): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
    if (mode === 'light') {
      root.classList.add('light');
      root.classList.add('light-mode');
      root.classList.remove('dark');
      root.classList.remove('dark-mode');
      document.body.style.backgroundColor = '#edf4f9';
      document.body.style.color = '#0a192f';
    } else {
      root.classList.add('dark');
      root.classList.add('dark-mode');
      root.classList.remove('light');
      root.classList.remove('light-mode');
      document.body.style.backgroundColor = '#030712';
      document.body.style.color = '#f0f6fc';
    }
  }

  private applyToDOM(accentId: AccentThemeId): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-accent', accentId);

    const preset = this.getPreset(accentId);
    root.style.setProperty('--accent-color', preset.primaryHex);
    root.style.setProperty('--accent-color-light', preset.lightHex);
    root.style.setProperty('--accent-color-dark', preset.darkHex);
    root.style.setProperty('--accent-color-rgb', preset.rgb);
    root.style.setProperty('--accent-color-light-rgb', preset.lightRgb);
    root.style.setProperty('--accent-glow', preset.glowRgba);
    root.style.setProperty('--accent-border', preset.borderRgba);
    root.style.setProperty('--accent-bg-subtle', preset.bgSubtleRgba);
    root.style.setProperty('--accent-gradient', preset.gradient);
    root.style.setProperty('--accent-gradient-hover', preset.gradientHover);
  }
}

export const themeService = new ThemeService();
