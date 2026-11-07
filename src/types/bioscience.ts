export type BioModelType = 'DNA_HELIX' | 'CELL_NUCLEUS' | 'VIRUS_CAPSID' | 'PROTEIN_FOLD';

export interface Bio3dSceneConfig {
  modelType: BioModelType;
  mutationLevel: number; // 0.0 to 1.0
  primaryColor: string; // Hex color string e.g. '#06b6d4'
  rotationSpeed: number; // 0.5 to 5.0
  gameChallenge: string; // Mini-game challenge / puzzle mission description
}

export interface BioGameState {
  score: number;
  combo: number;
  repairedCount: number;
  totalMutations: number;
  isMissionAccomplished: boolean;
  activeChallenge: string;
}

// -------------------------------------------------------------
// PURE SCIENTIFIC OBSERVATION & STUDY LEARNING TYPES (NOT A GAME)
// -------------------------------------------------------------
export type ScientificSpecimenType = 'DNA_HELIX' | 'EUKARYOTIC_CELL' | 'VIRUS_STRUCTURE' | 'PROTEIN_FOLDING';

export type EcologicalBiome =
  | 'STANDARD_LAB'
  | 'TUNDRA'
  | 'TROPICAL'
  | 'DEEP_SEA'
  | 'HYDROTHERMAL_VENT';

export interface BiomeEnvironmentData {
  id: EcologicalBiome;
  name: string;
  tagline: string;
  temperature: number; // °C
  ph: number;
  pressureAtm: number; // in atmospheres (1 atm standard, ~1000 atm deep sea)
  salinityPsu: number; // Practical Salinity Units (e.g. 0 fresh, 35 ocean, 70 brine)
  ambientHex: string;
  fogHex: number;
  primaryLightHex: number;
  secondaryLightHex: number;
  particleType: 'none' | 'ice_crystals' | 'spores_pollen' | 'marine_snow' | 'mineral_smoke';
  adaptationSummary: string;
  specimenAdaptations: Record<ScientificSpecimenType, {
    title: string;
    biochemicalMechanism: string;
    visualEffect: string;
  }>;
  molecularMarkers: string[];
}

export interface BioscienceObservationState {
  specimen: ScientificSpecimenType;
  highlightOrganelle: string;
  biome: EcologicalBiome;
  phLevel: number; // 2.0 to 12.0 (physiological ~7.4)
  temperature: number; // 0 to 100 °C (physiological ~37°C)
  crossSectionSlice: number; // 0.0 to 1.0 (clipping plane for organelles)
  kineticSpeed: number; // 0.1 to 3.0
  activeProcess: 'NONE' | 'DNA_REPLICATION' | 'MRNA_TRANSCRIPTION' | 'MITOSIS_CYCLE';
  processStep: number;
  scientificNotes: string;
}

export interface OrganelleAnnotation {
  id: string;
  name: string;
  latinName?: string;
  category: string;
  function: string;
  biochemicalDetails: string;
  dimensions?: string;
}
