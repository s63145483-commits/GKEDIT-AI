export interface AppIconItem {
  id: string;
  label: string;
  name: string;
  desc: string;
  col: number; // 0..4
  row: number; // 0..3
  isPrimary: boolean;
  tags: string[];
}

export const APP_ICONS: AppIconItem[] = [
  // Primary 8 Icons
  {
    id: 'default',
    label: 'DEFAULT',
    name: 'GK Horizon Core',
    desc: 'Electric blue & orbital gold crest',
    col: 0,
    row: 0,
    isPrimary: true,
    tags: ['gold', 'electric blue', 'gk logo'],
  },
  {
    id: 'settings',
    label: 'SETTINGS',
    name: 'Chrono Gear Cog',
    desc: 'Dual titanium cybernetic cogwheel',
    col: 1,
    row: 0,
    isPrimary: true,
    tags: ['gear cog', 'settings', 'electric blue'],
  },
  {
    id: 'chats',
    label: 'CHATS',
    name: 'Lightning Matrix',
    desc: 'Dual gold & cobalt speech conduits',
    col: 2,
    row: 0,
    isPrimary: true,
    tags: ['lightning', 'chat bubbles', 'gold'],
  },
  {
    id: 'audio',
    label: 'AUDIO',
    name: 'Waveform K',
    desc: 'Cyber acoustic spectral frequency',
    col: 3,
    row: 0,
    isPrimary: true,
    tags: ['waveform', 'audio', 'gold'],
  },
  {
    id: 'image',
    label: 'IMAGE',
    name: 'Photonic Lens',
    desc: 'Neon cyan prism camera aperture',
    col: 4,
    row: 0,
    isPrimary: true,
    tags: ['camera', 'neon cyan', 'electric blue'],
  },
  {
    id: 'video',
    label: 'VIDEO',
    name: 'Cinema GK',
    desc: 'Futuristic dual-reel optical rig',
    col: 0,
    row: 1,
    isPrimary: true,
    tags: ['video', 'camera', 'gk logo'],
  },
  {
    id: 'edit',
    label: 'EDIT',
    name: 'Gold K Stylus',
    desc: 'Precision holographic vector needle',
    col: 1,
    row: 1,
    isPrimary: true,
    tags: ['pencil', 'stylus', 'gold'],
  },
  {
    id: 'code',
    label: 'CODE',
    name: 'Circuit Matrix',
    desc: 'Integrated PCB logic tags </>',
    col: 2,
    row: 1,
    isPrimary: true,
    tags: ['code tags', 'circuits', 'gold'],
  },

  // Extended Suite (Secondary 12 Icons)
  {
    id: 'trans',
    label: 'TRANS',
    name: 'Quantum Loop',
    desc: 'Dual looping quantum arrows',
    col: 3,
    row: 1,
    isPrimary: false,
    tags: ['transition', 'arrows', 'gk logo'],
  },
  {
    id: 'search',
    label: 'SEARCH',
    name: 'Radar Magnifier',
    desc: 'High-frequency sonar scanner',
    col: 4,
    row: 1,
    isPrimary: false,
    tags: ['search', 'radar', 'gold'],
  },
  {
    id: 'data',
    label: 'DATA',
    name: 'Holo Telemetry',
    desc: 'Neon analytical bar & trend chart',
    col: 0,
    row: 2,
    isPrimary: false,
    tags: ['analytics', 'chart', 'neon'],
  },
  {
    id: 'share',
    label: 'SHARE',
    name: 'Synaptic Lattice',
    desc: 'Decentralized P2P node cluster',
    col: 1,
    row: 2,
    isPrimary: false,
    tags: ['network', 'share', 'gold'],
  },
  {
    id: 'cloud',
    label: 'CLOUD',
    name: 'Aegis Cloud Vault',
    desc: 'Encrypted quantum cloud storage',
    col: 2,
    row: 2,
    isPrimary: false,
    tags: ['cloud', 'vault', 'security'],
  },
  {
    id: '3d_mod',
    label: '3D MOD',
    name: 'Wireframe Tesseract',
    desc: 'Volumetric 3D spatial viewport',
    col: 3,
    row: 2,
    isPrimary: false,
    tags: ['3d', 'cube', 'geometry'],
  },
  {
    id: 'effect',
    label: 'EFFECT',
    name: 'Starlight Wand',
    desc: 'Particle illumination emitter',
    col: 4,
    row: 2,
    isPrimary: false,
    tags: ['magic', 'wand', 'particles'],
  },
  {
    id: 'layers',
    label: 'LAYERS',
    name: 'Prism Glass Stack',
    desc: 'Multi-depth compositor sheets',
    col: 0,
    row: 3,
    isPrimary: false,
    tags: ['layers', 'glass', 'planes'],
  },
  {
    id: 'collab',
    label: 'COLLAB',
    name: 'Orbital Handshake',
    desc: 'Bipartite biometric consensus',
    col: 1,
    row: 3,
    isPrimary: false,
    tags: ['collab', 'handshake', 'gold'],
  },
  {
    id: 'speed',
    label: 'SPEED',
    name: 'Tachometer AI',
    desc: 'Hyper-speed neural accelerator',
    col: 2,
    row: 3,
    isPrimary: false,
    tags: ['speed', 'gauge', 'ai'],
  },
  {
    id: 'export',
    label: 'EXPORT',
    name: 'Quantum Pod',
    desc: 'Orbital asset transport vessel',
    col: 3,
    row: 3,
    isPrimary: false,
    tags: ['export', 'package', 'arrow'],
  },
  {
    id: 'security',
    label: 'SECURITY',
    name: 'Cyber Shield',
    desc: 'Reinforced titanium aegis gate',
    col: 4,
    row: 3,
    isPrimary: false,
    tags: ['shield', 'lock', 'gk logo'],
  },
];

export const PRIMARY_APP_ICONS = APP_ICONS.filter((i) => i.isPrimary);

const STORAGE_KEY = 'gkedit_app_icon_id';
const DEFAULT_ICON_ID = 'default';

class AppIconService {
  private currentIconId: string;
  private listeners: Set<(icon: AppIconItem) => void> = new Set();

  constructor() {
    this.currentIconId = this.loadFromStorage();
  }

  private loadFromStorage(): string {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && APP_ICONS.some((i) => i.id === stored)) {
        return stored;
      }
    } catch {
      // fallback
    }
    return DEFAULT_ICON_ID;
  }

  public getSelectedIcon(): AppIconItem {
    return APP_ICONS.find((i) => i.id === this.currentIconId) || APP_ICONS[0];
  }

  public getSelectedIconId(): string {
    return this.currentIconId;
  }

  public setIcon(id: string): void {
    if (!APP_ICONS.some((i) => i.id === id)) return;
    this.currentIconId = id;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // localStorage disabled or full
    }
    this.notify();
  }

  public resetToDefault(): void {
    this.setIcon(DEFAULT_ICON_ID);
  }

  public subscribe(cb: (icon: AppIconItem) => void): () => void {
    this.listeners.add(cb);
    cb(this.getSelectedIcon());
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify(): void {
    const icon = this.getSelectedIcon();
    this.listeners.forEach((cb) => {
      try {
        cb(icon);
      } catch (err) {
        console.error('Error in AppIconService listener', err);
      }
    });
    // Dispatch global event for non-react or outside components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gkedit:app_icon_change', { detail: { icon } }));
    }
  }
}

export const appIconService = new AppIconService();
