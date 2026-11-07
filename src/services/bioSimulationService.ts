import {
  Bio3dSceneConfig,
  BioGameState,
  BioscienceObservationState,
  ScientificSpecimenType,
} from '../types/bioscience.ts';

const DEFAULT_CONFIG: Bio3dSceneConfig = {
  modelType: 'DNA_HELIX',
  mutationLevel: 0.35,
  primaryColor: '#06b6d4',
  rotationSpeed: 1.5,
  gameChallenge: 'CRISPR-Cas9 Genetic Repair: 4 Mutated nucleotide bases detected in the DNA double helix. Click glowing red nodes to apply precision base editing before transcription!',
};

const DEFAULT_OBSERVATION: BioscienceObservationState = {
  specimen: 'DNA_HELIX',
  highlightOrganelle: 'BASE_PAIR_AT',
  biome: 'STANDARD_LAB',
  phLevel: 7.4,
  temperature: 37.0,
  crossSectionSlice: 0.0,
  kineticSpeed: 1.0,
  activeProcess: 'NONE',
  processStep: 0,
  scientificNotes: 'B-form Double Helix: 10.5 base pairs per helical turn (3.4 nm pitch). Antiparallel 5\' to 3\' sugar-phosphate backbone with Watson-Crick hydrogen bonding (A=T with 2 bonds, G≡C with 3 bonds). Major and minor grooves provide binding sites for regulatory transcription factors.',
};

type ConfigListener = (config: Bio3dSceneConfig) => void;
type GameStateListener = (state: BioGameState) => void;
type ObservationListener = (state: BioscienceObservationState) => void;

class BioSimulationService {
  // Independent 3D Game State
  private currentConfig: Bio3dSceneConfig = { ...DEFAULT_CONFIG };
  private configListeners: Set<ConfigListener> = new Set();
  private gameStateListeners: Set<GameStateListener> = new Set();
  private audioCtx: AudioContext | null = null;

  private gameState: BioGameState = {
    score: 0,
    combo: 0,
    repairedCount: 0,
    totalMutations: 4,
    isMissionAccomplished: false,
    activeChallenge: DEFAULT_CONFIG.gameChallenge,
  };

  // Pure Scientific Observable Learning State (NOT A GAME)
  private observationState: BioscienceObservationState = { ...DEFAULT_OBSERVATION };
  private observationListeners: Set<ObservationListener> = new Set();

  constructor() {
    try {
      const savedScore = localStorage.getItem('gkedit_biolab_score');
      if (savedScore) {
        this.gameState.score = parseInt(savedScore, 10) || 0;
      }
    } catch {}
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // --- Observation Methods (Scientific Study Only - NOT a Game) ---
  public getObservationState(): BioscienceObservationState {
    return { ...this.observationState };
  }

  public updateObservation(update: Partial<BioscienceObservationState>) {
    this.observationState = {
      ...this.observationState,
      ...update,
    };
    this.notifyObservation();
  }

  public subscribeObservation(listener: ObservationListener): () => void {
    this.observationListeners.add(listener);
    listener({ ...this.observationState });
    return () => this.observationListeners.delete(listener);
  }

  private notifyObservation() {
    this.observationListeners.forEach((l) => l({ ...this.observationState }));
  }

  // --- 3D Game Methods (Independent Gaming Module) ---
  public getConfig(): Bio3dSceneConfig {
    return { ...this.currentConfig };
  }

  public getGameState(): BioGameState {
    return { ...this.gameState };
  }

  public updateConfig(newConfig: Partial<Bio3dSceneConfig>) {
    this.currentConfig = {
      ...this.currentConfig,
      ...newConfig,
    };

    if (newConfig.gameChallenge) {
      this.gameState.activeChallenge = newConfig.gameChallenge;
      this.gameState.isMissionAccomplished = false;
      this.gameState.combo = 0;
    }

    this.notifyConfig();
    this.notifyGameState();
  }

  public recordRepair(remainingMutations: number) {
    this.gameState.score += 100 + this.gameState.combo * 25;
    this.gameState.combo += 1;
    this.gameState.repairedCount += 1;

    try {
      localStorage.setItem('gkedit_biolab_score', this.gameState.score.toString());
    } catch {}

    this.playCrisprRepairSound();

    if (remainingMutations === 0) {
      this.gameState.isMissionAccomplished = true;
      this.gameState.score += 500;
      this.playMissionCompleteSound();
    }

    this.notifyGameState();
  }

  public resetMissions(totalMutations: number) {
    this.gameState.totalMutations = totalMutations;
    this.gameState.repairedCount = 0;
    this.gameState.combo = 0;
    this.gameState.isMissionAccomplished = false;
    this.notifyGameState();
  }

  public subscribeConfig(listener: ConfigListener): () => void {
    this.configListeners.add(listener);
    listener({ ...this.currentConfig });
    return () => this.configListeners.delete(listener);
  }

  public subscribeGameState(listener: GameStateListener): () => void {
    this.gameStateListeners.add(listener);
    listener({ ...this.gameState });
    return () => this.gameStateListeners.delete(listener);
  }

  private notifyConfig() {
    this.configListeners.forEach((l) => l({ ...this.currentConfig }));
  }

  private notifyGameState() {
    this.gameStateListeners.forEach((l) => l({ ...this.gameState }));
  }

  // Synthesized Web Audio Effects
  public playCrisprRepairSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  public playInspectChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  public playMissionCompleteSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5];
      const start = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const t = start + idx * 0.08;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.35);
      });
    } catch {}
  }
}

export const bioSimulationService = new BioSimulationService();
