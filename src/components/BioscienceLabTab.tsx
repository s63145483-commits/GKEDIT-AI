import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  Dna,
  Atom,
  Microscope,
  Layers,
  Thermometer,
  Droplets,
  Scissors,
  Eye,
  Sliders,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  Maximize2,
  Check,
  Search,
  BookOpen,
  X,
  Compass,
  Globe,
  Snowflake,
  Sun,
  Waves,
  Flame,
  Shield,
  Zap,
  Gauge,
  Activity,
  ArrowRight,
  Volume2,
} from 'lucide-react';
import { bioSimulationService } from '../services/bioSimulationService.ts';
import { LiquidGlassNav } from './LiquidGlassNav.tsx';
import {
  BioscienceObservationState,
  ScientificSpecimenType,
  OrganelleAnnotation,
  EcologicalBiome,
  BiomeEnvironmentData,
} from '../types/bioscience.ts';

// -------------------------------------------------------------
// COMPREHENSIVE SCIENTIFIC ANATOMICAL & BIOCHEMICAL DATABASE
// -------------------------------------------------------------
const ORGANELLE_DATABASE: Record<string, OrganelleAnnotation> = {
  // DNA Helix Parts
  BASE_PAIR_AT: {
    id: 'BASE_PAIR_AT',
    name: 'Adenine = Thymine Base Pair',
    latinName: 'Adeninum - Thymina',
    category: 'Nucleic Acid Base Pair',
    function: 'Watson-Crick complementary base pairing joined by 2 hydrogen bonds (N1-H...N3 and N6-H...O4).',
    biochemicalDetails: 'Purine (Adenine) bonded to Pyrimidine (Thymine). Melting temperature (Tm) is lower than G-C pairs due to 2 hydrogen bonds vs 3, making A-T rich regions standard for replication origins and TATA promoters.',
    dimensions: 'Distance: 1.08 nm across C1\'-C1\' carbons',
  },
  BASE_PAIR_GC: {
    id: 'BASE_PAIR_GC',
    name: 'Guanine ≡ Cytosine Base Pair',
    latinName: 'Guaninum - Cytosina',
    category: 'Nucleic Acid Base Pair',
    function: 'Watson-Crick complementary base pairing joined by 3 hydrogen bonds (O6...H-N4, N1-H...N3, and N2-H...O2).',
    biochemicalDetails: 'High thermodynamic stability; imparts increased melting temperature (Tm) and thermal resistance to genomic DNA. Target for CpG methylation in epigenetic gene silencing.',
    dimensions: 'Distance: 1.08 nm across C1\'-C1\' carbons',
  },
  PHOSPHATE_BACKBONE: {
    id: 'PHOSPHATE_BACKBONE',
    name: 'Sugar-Phosphate Backbone',
    latinName: 'Phosphodiester Deoxyribosum',
    category: 'Structural Polynucleotide Chain',
    function: 'Forms the structural scaffold of the double helix via repeating 3\'-5\' phosphodiester linkages.',
    biochemicalDetails: 'Negatively charged due to ionized phosphate groups at physiological pH (7.4), conferring hydrophilicity to the exterior and binding basic histones (lysine/arginine rich).',
    dimensions: 'Helical diameter: 2.0 nm; Pitch: 3.4 nm (10.5 bp/turn)',
  },

  // Eukaryotic Cell Organelles
  NUCLEUS: {
    id: 'NUCLEUS',
    name: 'Cell Nucleus & Nucleolus',
    latinName: 'Nucleus Cellularis',
    category: 'Genomic Organelle',
    function: 'Houses genomic chromatin DNA, directs gene transcription, and synthesizes ribosomal RNA (rRNA) inside the dense nucleolus.',
    biochemicalDetails: 'Enclosed by a dual-lipid bilayer nuclear envelope separated by a 20-40 nm perinuclear space. Contains nuclear pore complexes (NPCs) that regulate nucleocytoplasmic transport using Ran-GTP gradients.',
    dimensions: 'Diameter: ~5 to 10 µm (occupies ~10% of cell volume)',
  },
  MITOCHONDRIA: {
    id: 'MITOCHONDRIA',
    name: 'Mitochondrion (ATP Powerhouse)',
    latinName: 'Mitochondrium',
    category: 'Bioenergetic Organelle',
    function: 'Generates cellular ATP via oxidative phosphorylation, the citric acid cycle (Krebs cycle), and beta-oxidation of fatty acids.',
    biochemicalDetails: 'Contains distinct outer and inner membranes; the inner membrane folds into deep cristae housing electron transport chain complexes (I-IV) and ATP synthase (Complex V). Has maternal circular mtDNA.',
    dimensions: 'Length: 1 to 4 µm; Width: 0.5 µm',
  },
  ENDOPLASMIC_RETICULUM: {
    id: 'ENDOPLASMIC_RETICULUM',
    name: 'Endoplasmic Reticulum (Rough & Smooth)',
    latinName: 'Reticulum Endoplasmicum',
    category: 'Biosynthetic Membrane Network',
    function: 'Rough ER (membrane-bound ribosomes) synthesizes secretory and membrane proteins; Smooth ER synthesizes phospholipids, steroids, and stores Ca2+ ions.',
    biochemicalDetails: 'Continuous with the outer nuclear membrane. Rough ER facilitates cotranslational protein translocation and initial N-linked glycosylation in the lumen.',
    dimensions: 'Forms ~50% of total cell membrane surface area',
  },
  GOLGI_APPARATUS: {
    id: 'GOLGI_APPARATUS',
    name: 'Golgi Apparatus (Packaging Center)',
    latinName: 'Complexus Golgiensis',
    category: 'Secretory Sorting Organelle',
    function: 'Modifies, sorts, and packages nascent proteins and lipids arriving from the ER into secretory vesicles for lysosomal, membrane, or extracellular targeting.',
    biochemicalDetails: 'Composed of polarized flattened cisternae stacks: cis-Golgi network (entry from ER), medial cisternae (glycosylation enzymes), and trans-Golgi network (sorting clathrin-coated vesicles).',
    dimensions: 'Stack diameter: ~1 µm; contains 4 to 8 cisternae',
  },
  PLASMA_MEMBRANE: {
    id: 'PLASMA_MEMBRANE',
    name: 'Plasma Membrane (Lipid Bilayer)',
    latinName: 'Membrana Cellularis',
    category: 'Selective Cellular Boundary',
    function: 'Selectively permeable barrier regulating ionic gradients, signal transduction, and nutrient uptake via transport channels and pumps.',
    biochemicalDetails: 'Amphipathic phospholipid bilayer with hydrophobic acyl core and hydrophilic polar heads, embedded with integral proteins, cholesterol (modulating fluidity), and glycocalyx.',
    dimensions: 'Thickness: 7.5 to 10.0 nm',
  },

  // Viral Structures
  SPIKE_GLYCOPROTEIN: {
    id: 'SPIKE_GLYCOPROTEIN',
    name: 'Spike Glycoprotein Trimer',
    latinName: 'Glycoproteina Spicularis',
    category: 'Viral Surface Fusion Complex',
    function: 'Binds host cell surface receptors and mediates viral-host membrane fusion for entry into the cytoplasm.',
    biochemicalDetails: 'Class I viral fusion protein homotrimer; cleaved into receptor-binding S1 subunit and fusion-mediating S2 subunit containing hydrophobic fusion peptides and heptad repeats.',
    dimensions: 'Height: 12 to 20 nm protruding from envelope',
  },
  VIRAL_CAPSID: {
    id: 'VIRAL_CAPSID',
    name: 'Icosahedral Viral Capsid Shell',
    latinName: 'Capsis Viralis',
    category: 'Protective Protein Cage',
    function: 'Rigid symmetrical protein shell that encloses, protects, and delivers viral genetic material (RNA or DNA) into the host cytoplasm.',
    biochemicalDetails: 'Built from repeating capsomers arranged with icosahedral (T=3 or T=4) geometric symmetry, exhibiting maximum internal volume with minimal genetic coding requirement.',
    dimensions: 'Diameter: 80 to 120 nm',
  },
  VIRAL_GENOME: {
    id: 'VIRAL_GENOME',
    name: 'Encapsidated Viral RNA / DNA Core',
    latinName: 'Genoma Virale',
    category: 'Viral Genetic Material',
    function: 'Contains the complete viral genomic sequence encoding non-structural replication enzymes and structural coat proteins.',
    biochemicalDetails: 'Complexed with viral nucleocapsid (N) proteins to form a flexible helical ribonucleoprotein (RNP) complex protected against host nucleases.',
    dimensions: 'Genome size: ~30 kb positive-sense single-stranded RNA',
  },

  // Protein Folding
  ALPHA_HELIX: {
    id: 'ALPHA_HELIX',
    name: 'Alpha-Helix Secondary Motif',
    latinName: 'Helix Alpha',
    category: 'Secondary Structure Motif',
    function: 'Rigid right-handed coiled rod providing mechanical strength, ligand binding, and transmembrane domain anchoring.',
    biochemicalDetails: 'Main-chain C=O of residue i forms a hydrogen bond with the N-H of residue i+4. 3.6 amino acid residues per turn with a 0.54 nm pitch. Backbone torsion angles: phi ~ -57°, psi ~ -47°.',
    dimensions: '3.6 residues/turn; 0.15 nm translation per residue',
  },
  BETA_SHEET: {
    id: 'BETA_SHEET',
    name: 'Beta-Pleated Sheet Motif',
    latinName: 'Lamina Beta',
    category: 'Secondary Structure Motif',
    function: 'Planar pleated protein sheet providing structural rigidity, core stability, and protein-protein interaction interfaces.',
    biochemicalDetails: 'Formed by laterally connected beta-strands joined by inter-strand hydrogen bonds. Can arrange in parallel or antiparallel topology. Antiparallel sheets have linear, more stable H-bonds.',
    dimensions: 'Pleat distance: 0.70 nm per 2 amino acid repeats',
  },
  ACTIVE_CATALYTIC_SITE: {
    id: 'ACTIVE_CATALYTIC_SITE',
    name: 'Catalytic Cleft / Active Site',
    latinName: 'Centrum Catalyticum',
    category: 'Tertiary Functional Domain',
    function: 'Specific 3D binding pocket that binds substrate molecules with induced-fit precision to lower reaction activation energy.',
    biochemicalDetails: 'Composed of conserved amino acid residues forming a precise electrostatic and hydrophobic microenvironment (e.g., Ser-His-Asp catalytic triad).',
    dimensions: 'Cavity volume: ~300 to 800 Å³',
  },

  // Ecological Biome Molecular Adaptations
  ANTIFREEZE_GLYCOPROTEIN: {
    id: 'ANTIFREEZE_GLYCOPROTEIN',
    name: 'Antifreeze Glycoprotein (AFGP) & Trehalose Cryo-Sheath',
    latinName: 'Glycoproteina Antigelida',
    category: 'Psychrophilic Cryo-Adaptation',
    function: 'Adsorbs directly to emerging ice crystal prism faces, lowering the freezing point below the melting point (thermal hysteresis) to arrest crystal growth.',
    biochemicalDetails: 'Composed of repeating Ala-Ala-Thr tripeptide units with beta-D-galactosyl-(1->3)-alpha-D-N-acetylgalactosamine disaccharides. Vitrified trehalose protects backbone hydration shells.',
    dimensions: 'Hysteresis gap: 1.5°C to 2.2°C non-colligative depression',
  },
  THERMOPHILIC_GC_CLAMP: {
    id: 'THERMOPHILIC_GC_CLAMP',
    name: 'Reverse Gyrase Supercoil & GC-Clamp Network',
    latinName: 'Gyrus Positivus Thermophilus',
    category: 'Hyperthermophilic DNA Stabilization',
    function: 'Introduces ATP-dependent positive topological supercoiling into closed circular DNA to prevent double-helix thermal denaturing at temperatures up to 105°C.',
    biochemicalDetails: 'High genomic GC-content (G≡C triple hydrogen bonding with 3 H-bonds) paired with polyamines (thermine, caldopentamine) shield the phosphate backbone from thermal scission.',
    dimensions: 'Melting temperature (Tm) elevation: +18°C above standard B-DNA',
  },
  PIEZOLYTE_TMAO_CAGE: {
    id: 'PIEZOLYTE_TMAO_CAGE',
    name: 'Piezolyte TMAO Barophilic Hydration Cage',
    latinName: 'Osmolytus Piezophilus Hadalis',
    category: 'Abyssal Piezophilic Adaptation',
    function: 'Counteracts 1,000 atmospheres of crushing hydrostatic pressure by thermodynamically organizing water molecules into rigid protective clathrate shells.',
    biochemicalDetails: 'Trimethylamine N-oxide (TMAO) is an uncharged zwitterionic osmolyte whose strong dipole orders water structure, preventing water penetration into internal hydrophobic protein cores and stabilizing major grooves.',
    dimensions: 'Effective barotolerance: withstands >100 MPa (10,000 meters depth)',
  },
  HEAT_SHOCK_CHAPERONE: {
    id: 'HEAT_SHOCK_CHAPERONE',
    name: 'Photolyase & Heat Shock Chaperone (Hsp70/90) Shield',
    latinName: 'Chaperonum Thermicum & Photolyasis',
    category: 'Tropical Phototrophic Adaptation',
    function: 'Flavin-dependent Photolyase repairs solar UV pyrimidine dimers via light-driven electron transfer, while Hsp70 chaperones prevent thermal protein misfolding.',
    biochemicalDetails: 'Uses FADH- and methenyltetrahydrofolate (MTHF) cofactors to harvest blue/UVA photons (350-450 nm) and inject an electron into cyclobutane dimers to restore native thymines.',
    dimensions: 'Photoreactivation turnover: ~1.2 x 10³ repair events/second',
  },
  TETRAETHER_LIPID_MONOLAYER: {
    id: 'TETRAETHER_LIPID_MONOLAYER',
    name: 'GDGT Archaea Tetraether Covalent Monolayer',
    latinName: 'Membrana Tetraetheris GDGT',
    category: 'Volcanic Acidophile Adaptation',
    function: 'Spans the entire cell membrane with covalent C40 biphytanyl chains linked via ether bonds, preventing the bilayer from peeling apart in boiling acid.',
    biochemicalDetails: 'Glycerol dibiphytanyl glycerol tetraether (GDGT) features cyclopentane rings that adjust in response to temperature. Ether bonds lack ester carbonyls, resisting acid-catalyzed hydrolysis at pH < 3.',
    dimensions: 'Membrane thickness: 3.5 to 4.0 nm single covalent layer',
  },
};

// -------------------------------------------------------------
// ECOLOGICAL BIOMES DATABASE (ENVIRONMENT SIMULATION LAYER)
// -------------------------------------------------------------
export const ECOLOGICAL_BIOMES: Record<EcologicalBiome, BiomeEnvironmentData> = {
  STANDARD_LAB: {
    id: 'STANDARD_LAB',
    name: 'Standard Laboratory Culture',
    tagline: 'Mammalian physiological homeostasis (37°C · 1.0 atm · pH 7.4)',
    temperature: 37.0,
    ph: 7.4,
    pressureAtm: 1.0,
    salinityPsu: 9.0,
    ambientHex: '#081329',
    fogHex: 0x020617,
    primaryLightHex: 0x06b6d4,
    secondaryLightHex: 0xa855f7,
    particleType: 'none',
    adaptationSummary: 'Mesophilic baseline. Macromolecules maintain standard physiological Watson-Crick geometries, fluid mosaic lipid bilayers, and unconstrained native tertiary catalytic folds.',
    specimenAdaptations: {
      DNA_HELIX: {
        title: 'Canonical B-DNA Conformation',
        biochemicalMechanism: '10.5 base pairs per helical turn (3.4 nm pitch). Counter-ions (Na+, Mg2+) screen phosphate repulsion under standard osmotic equilibrium.',
        visualEffect: 'Cyan phosphodiester helical backbone with balanced Watson-Crick base-pair rungs.',
      },
      EUKARYOTIC_CELL: {
        title: 'Homeostatic Fluid Mosaic Bilayer',
        biochemicalMechanism: 'Standard cholesterol-to-phospholipid ratio maintaining optimal fluidity for vesicle trafficking and ATP synthase proton-motive force.',
        visualEffect: 'Deep blue semi-transparent plasma membrane with luminous organelles.',
      },
      VIRUS_STRUCTURE: {
        title: 'Metastable Infectious Capsid',
        biochemicalMechanism: 'Non-covalent hydrophobic and electrostatic capsomer bonds primed for receptor binding and endosomal acidification uncoating.',
        visualEffect: 'Geometric icosahedral capsid with extended radial spike glycoproteins.',
      },
      PROTEIN_FOLDING: {
        title: 'Native Catalytic Tertiary Fold',
        biochemicalMechanism: 'Thermodynamically favorable Gibbs free energy minimum (ΔG < 0) preserving active site catalytic triad geometry.',
        visualEffect: 'Alpha-helix cylinders, beta-sheet arrows, and radiant active catalytic cleft.',
      },
    },
    molecularMarkers: ['Physiological pH 7.4', '1.0 atm Pressure', 'Native Solvation Shell', 'Kinetic Flux 1.0x'],
  },
  TUNDRA: {
    id: 'TUNDRA',
    name: 'Arctic Tundra & Cryo-Permafrost',
    tagline: 'Sub-zero cryo-environment with ice crystallization & frost (-5°C)',
    temperature: -5.0,
    ph: 7.1,
    pressureAtm: 1.0,
    salinityPsu: 12.0,
    ambientHex: '#062038',
    fogHex: 0x031526,
    primaryLightHex: 0x38bdf8,
    secondaryLightHex: 0x93c5fd,
    particleType: 'ice_crystals',
    adaptationSummary: 'Psychrophilic cold adaptation. Organisms produce Antifreeze Glycoproteins (AFGPs) to arrest ice crystal spicule growth and accumulate trehalose vitrification sugars to prevent dehydration and shear damage.',
    specimenAdaptations: {
      DNA_HELIX: {
        title: 'Cryo-Protected Vitrified DNA Helix',
        biochemicalMechanism: 'Vitrified trehalose cryoprotectant matrix forms protective cage shells around the sugar-phosphate backbone, arresting cold denaturation and thermal compaction stress.',
        visualEffect: 'Frost riming around helical coils with glittering ice crystal armor shields.',
      },
      EUKARYOTIC_CELL: {
        title: 'Psychrophilic Kinked-PUFA Membrane',
        biochemicalMechanism: 'Fatty acid desaturase upregulation introduces multiple cis-double bonds (polyunsaturated fatty acids), preventing membrane gel-phase freeze and organelle collapse.',
        visualEffect: 'Crystalline outer frosted envelope studded with ice-blue cryoprotectant micro-vesicles.',
      },
      VIRUS_STRUCTURE: {
        title: 'Cryo-Preserved Rigid Capsid',
        biochemicalMechanism: 'Enhanced intermolecular hydrogen bonding and salt bridges lock viral capsomers into an ultra-stable dormant crystal state impervious to ice crystal punctures.',
        visualEffect: 'Glazed ice-faceted icosahedron with glowing sky-blue crystalline spike caps.',
      },
      PROTEIN_FOLDING: {
        title: 'Flexible Psychrophilic Cold-Enzyme',
        biochemicalMechanism: 'Reduced core hydrophobic packing and glycine-enriched hinge loops prevent low-temperature catalytic freezing, retaining turnover even near 0°C.',
        visualEffect: 'Cold-adapted flexible loops with luminous crystalline antifreeze binding pads.',
      },
    },
    molecularMarkers: ['Antifreeze Glycoproteins (AFGP)', 'PUFA Desaturases', 'Trehalose Vitrification', 'Ice-Binding Domains'],
  },
  TROPICAL: {
    id: 'TROPICAL',
    name: 'Tropical Rainforest & Solar Canopy',
    tagline: 'Intense solar UV radiation, high humidity & rapid enzyme kinetics (36°C)',
    temperature: 36.0,
    ph: 6.5,
    pressureAtm: 1.0,
    salinityPsu: 3.5,
    ambientHex: '#02241b',
    fogHex: 0x021711,
    primaryLightHex: 0x10b981,
    secondaryLightHex: 0xf59e0b,
    particleType: 'spores_pollen',
    adaptationSummary: 'Hyper-kinetic phototrophic ecosystem. High ambient photon flux drives elevated transcription rates (2.2x), requiring UV-photolyase repair enzymes and heat-shock protein chaperones to prevent thermal protein aggregation.',
    specimenAdaptations: {
      DNA_HELIX: {
        title: 'UV-Photolyase Repair & High-Turnover Helix',
        biochemicalMechanism: 'Flavin-dependent Photolyase enzymes actively scan grooves to instantaneously reverse solar UV-induced cyclobutane pyrimidine dimers (CPDs), enabling rapid replication.',
        visualEffect: 'Rapid helical rotation with golden phototrophic energy arcs and pulsing radiant base pair rungs.',
      },
      EUKARYOTIC_CELL: {
        title: 'Chloroplast Granum Stacking & Osmoregulation',
        biochemicalMechanism: 'Abundant thylakoid membrane stacks capture peak photosynthetic active radiation (PAR), balanced by high aquaporin channel density managing osmotic water exchange.',
        visualEffect: 'Vibrant emerald cytoplasm with active photosynthetic stroma currents and rapid mitochondrial ATP cycling.',
      },
      VIRUS_STRUCTURE: {
        title: 'Polysaccharide-Shielded Tropical Vector',
        biochemicalMechanism: 'Heavily glycosylated surface glycan shield protects vulnerable viral epitopes from ambient tropical humidity and environmental proteases.',
        visualEffect: 'Emerald green capsid with golden glycoprotein tips shedding microscopic viral envelope aerosols.',
      },
      PROTEIN_FOLDING: {
        title: 'Hsp70/90 Chaperone Shielded Complex',
        biochemicalMechanism: 'Molecular chaperonins wrap around transiently exposed hydrophobic motifs, preventing lethal thermal misfolding and amorphous aggregation during solar heat spikes.',
        visualEffect: 'Golden chaperone halos embracing the polypeptide ribbon with radiant high-turnover active catalytic pockets.',
      },
    },
    molecularMarkers: ['Photolyase UV Repair', 'Hsp70 Chaperones', 'Thylakoid Photosystems', 'Enzymatic Flux 2.2x'],
  },
  DEEP_SEA: {
    id: 'DEEP_SEA',
    name: 'Abyssal Deep Sea Trench (1,000 atm)',
    tagline: 'Pitch-black Hadal zone under crushing hydrostatic pressure (2°C · 100 MPa)',
    temperature: 2.0,
    ph: 7.8,
    pressureAtm: 1000.0,
    salinityPsu: 34.8,
    ambientHex: '#020b1c',
    fogHex: 0x010814,
    primaryLightHex: 0x0284c7,
    secondaryLightHex: 0x06b6d4,
    particleType: 'marine_snow',
    adaptationSummary: 'Piezophilic (barophilic) hadal adaptation. Under 1,000 atmospheres of compressive pressure (100 MPa), organisms accumulate piezolyte osmolytes (TMAO) that structure water shells to prevent pressure-induced macromolecular volume reduction collapse.',
    specimenAdaptations: {
      DNA_HELIX: {
        title: 'Barophilic TMAO Clathrate Hydration Cage',
        biochemicalMechanism: 'Piezolytes (Trimethylamine N-oxide) structurally cross-link hydration water around the helical grooves, preventing compressive disruption of Watson-Crick hydrogen bonds.',
        visualEffect: 'Deep oceanic indigo helix with bioluminescent cyan TMAO shielding nodes encasing the phosphodiester coils.',
      },
      EUKARYOTIC_CELL: {
        title: 'Barotolerant Docosahexaenoic Acid (DHA) Membrane',
        biochemicalMechanism: 'Membranes are packed with ultra-fluid polyunsaturated docosahexaenoic acid (DHA, 22:6) and phosphatidylglycerol to remain fluid under 1,000 bars of pressure.',
        visualEffect: 'Deep navy-blue contracted envelope with bioluminescent photophore organelles pulsing in abyssal darkness.',
      },
      VIRUS_STRUCTURE: {
        title: 'Interlocking Compressive Geodesic Capsid',
        biochemicalMechanism: 'Small internal cavity volumes and dense buried salt-bridge networks between capsomer interfaces prevent compressive disassociation.',
        visualEffect: 'Dark cobalt-blue geodesic capsid with bioluminescent cyan vertex emitters glowing through the marine snow.',
      },
      PROTEIN_FOLDING: {
        title: 'Void-Free Compact Piezophilic Fold',
        biochemicalMechanism: 'Elimination of internal solvent-accessible packing cavities prevents positive volumetric changes (ΔV) that would cause pressure denaturation.',
        visualEffect: 'Ultra-compact navy & cyan ribbon fold with glowing deep-sea catalytic bioluminescence.',
      },
    },
    molecularMarkers: ['Piezolyte TMAO Osmolyte', 'DHA Polyunsaturation', 'Hadal Marine Snow', '100 MPa Barotolerance'],
  },
  HYDROTHERMAL_VENT: {
    id: 'HYDROTHERMAL_VENT',
    name: 'Deep-Sea Hydrothermal Vent Chimney',
    tagline: 'Superheated mineral black smoker with hyperthermophilic archaea (88°C · pH 3.5)',
    temperature: 88.0,
    ph: 3.5,
    pressureAtm: 250.0,
    salinityPsu: 42.0,
    ambientHex: '#2b0704',
    fogHex: 0x1a0402,
    primaryLightHex: 0xef4444,
    secondaryLightHex: 0xf97316,
    particleType: 'mineral_smoke',
    adaptationSummary: 'Hyperthermophilic acidophilic Archaea ecosystem. Living in mineral plumes at 88°C, organisms employ reverse DNA gyrase positive supercoiling, high GC-clamp genomic architecture, and ether-linked tetraether monolayer membranes.',
    specimenAdaptations: {
      DNA_HELIX: {
        title: 'Positive Supercoiled High-GC Clamp Helix',
        biochemicalMechanism: 'Reverse DNA Gyrase introduces positive supercoiling to raise melting temperature (Tm > 105°C), reinforced with polyamines and genomic GC clamps.',
        visualEffect: 'Fiery magma-amber helix with glowing triple-bonded GC reinforcement rings resisting thermal denaturation.',
      },
      EUKARYOTIC_CELL: {
        title: 'Tetraether Lipid Monolayer Archaea Membrane',
        biochemicalMechanism: 'Glycerol dibiphytanyl glycerol tetraether (GDGT) spans the entire membrane as a covalent monolayer, making delamination physically impossible even in boiling acid.',
        visualEffect: 'Obsidian & molten volcanic shell with glowing hydrothermal sulfur transport pores.',
      },
      VIRUS_STRUCTURE: {
        title: 'Disulfide-Crosslinked Hyper-Stable Capsid',
        biochemicalMechanism: 'Extensive intermolecular covalent disulfide crosslinks and metal ion coordination centers hold capsomers together in boiling acidic brine.',
        visualEffect: 'Volcanic char-black capsid with fiery red molten spikes and thermal sulfur mineral crust.',
      },
      PROTEIN_FOLDING: {
        title: 'Hyper-Thermostable Ionic Salt Bridge Network',
        biochemicalMechanism: 'High abundance of charged residues (Glu, Arg, Lys) forming extensive surface ionic networks that resist thermal kinetic unfolding.',
        visualEffect: 'Molten ember ribbon fold with glowing crimson ionic bridges shielding the catalytic site.',
      },
    },
    molecularMarkers: ['Reverse DNA Gyrase', 'GDGT Tetraether Monolayer', 'GC-Rich Clamp Networks', 'Polyamines & Sulfides'],
  },
};

// -------------------------------------------------------------
// BIOLOGICAL PROCESS STAGES DATABASE
// -------------------------------------------------------------
const PROCESS_STAGES = {
  DNA_REPLICATION: [
    {
      title: 'Stage 1: Origin Recognition & Helicase Unwinding',
      desc: 'DNA Helicase breaks the hydrogen bonds between complementary base pairs, creating a Y-shaped replication fork with two single-stranded templates.',
    },
    {
      title: 'Stage 2: RNA Primer Annealing & Clamp Loading',
      desc: 'DNA Primase synthesizes short complementary RNA primers. The sliding clamp (PCNA) docks DNA Polymerase onto the primed template.',
    },
    {
      title: 'Stage 3: Leading & Lagging Strand Elongation',
      desc: 'DNA Polymerase delta/epsilon synthesizes DNA continuously in 5\'->3\' direction on the leading strand, while the lagging strand is generated as Okazaki fragments.',
    },
    {
      title: 'Stage 4: Primer Excision, Proofreading & Ligation',
      desc: 'RNA primers are removed by RNase H/FEN1, replaced with dNTPs, proofread by 3\'->5\' exonuclease activity, and sealed by DNA Ligase into two identical daughter helices.',
    },
  ],
  MRNA_TRANSCRIPTION: [
    {
      title: 'Stage 1: Promoter Binding & Transcription Bubble',
      desc: 'Transcription factors and RNA Polymerase II recognize the upstream TATA box promoter, melting ~14 base pairs of DNA to open the transcription bubble.',
    },
    {
      title: 'Stage 2: 5\'->3\' Elongation of pre-mRNA',
      desc: 'RNA Polymerase II moves along the template strand (3\'->5\'), adding complementary ribonucleotides (A, U, G, C) to the growing pre-mRNA transcript.',
    },
    {
      title: 'Stage 3: Co-Transcriptional 5\' Capping & Splicing',
      desc: 'The 7-methylguanosine cap is added to the 5\' end. The spliceosome recognizes splice sites and excises non-coding introns, ligating coding exons.',
    },
    {
      title: 'Stage 4: 3\' Polyadenylation & Nuclear Export',
      desc: 'Cleavage signal activates poly(A) polymerase to add a 200-residue poly-A tail. The mature mRNA is exported via nuclear pore complexes to ribosomes.',
    },
  ],
  MITOSIS_CYCLE: [
    {
      title: 'Stage 1: Prophase (Chromatin Condensation)',
      desc: 'Nuclear chromatin condenses into visible paired sister chromatids linked at centromeres. Centrosomes migrate to opposite cellular poles.',
    },
    {
      title: 'Stage 2: Metaphase (Equatorial Alignment)',
      desc: 'Nuclear envelope breaks down. Mitotic spindle microtubules attach to kinetochores and align chromosomes along the equatorial metaphase plate.',
    },
    {
      title: 'Stage 3: Anaphase (Chromatid Separation)',
      desc: 'Cohesin rings are cleaved by separase. Kinetochore microtubules shorten, pulling identical sister chromatids toward opposite spindle poles.',
    },
    {
      title: 'Stage 4: Telophase & Cytokinesis',
      desc: 'Two new nuclear envelopes assemble around decondensing chromatin. An actin-myosin contractile ring pinches the cytoplasm, yielding 2 identical diploid daughter cells.',
    },
  ],
};

interface BioscienceLabTabProps {
  onAskAiTopic?: (topic: string) => void;
}

export function BioscienceLabTab({ onAskAiTopic }: BioscienceLabTabProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Observable Scientific Learning State (Pure Observation - NOT a Game)
  const [obsState, setObsState] = useState<BioscienceObservationState>(
    bioSimulationService.getObservationState()
  );

  // Inspection modal / active inspected structure
  const [selectedOrganelle, setSelectedOrganelle] = useState<OrganelleAnnotation | null>(
    ORGANELLE_DATABASE['BASE_PAIR_AT']
  );

  // Ecological Adaptation Readout Panel state
  const [showBiomePanel, setShowBiomePanel] = useState<boolean>(true);

  // Process playback state
  const [isPlayingProcess, setIsPlayingProcess] = useState<boolean>(false);
  const processTimerRef = useRef<any>(null);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const specimenGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const inspectableMeshesRef = useRef<THREE.Mesh[]>([]);
  
  // Lighting & Particle Simulation refs
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const primaryPointRef = useRef<THREE.PointLight | null>(null);
  const secondaryPointRef = useRef<THREE.PointLight | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const particlePositionsRef = useRef<Float32Array | null>(null);

  // Subscribe to central observation updates (including AI function call updates)
  useEffect(() => {
    const unsub = bioSimulationService.subscribeObservation((newObs) => {
      setObsState(newObs);
      if (newObs.highlightOrganelle && ORGANELLE_DATABASE[newObs.highlightOrganelle]) {
        setSelectedOrganelle(ORGANELLE_DATABASE[newObs.highlightOrganelle]);
      }
    });
    return () => unsub();
  }, []);

  const activeBiome = obsState.biome || 'STANDARD_LAB';
  const currentBiomeData = ECOLOGICAL_BIOMES[activeBiome];

  // -------------------------------------------------------------
  // THREE.JS SPECIMEN BUILDERS (WITH ECOLOGICAL ADAPTATION LAYERS)
  // -------------------------------------------------------------

  const buildDnaSpecimen = useCallback((group: THREE.Group, ph: number, temp: number, biome: EcologicalBiome) => {
    const turns = 3.5;
    const pointsPerTurn = 22;
    const totalSteps = Math.round(turns * pointsPerTurn);
    const radius = 2.4;
    const height = 13;
    const stepHeight = height / totalSteps;

    // Thermal agitation factor & pH denaturation factor
    const isThermalDenatured = temp > 65;
    const isPhDenatured = ph < 5.0 || ph > 9.5;
    const instability = (isThermalDenatured || isPhDenatured) && biome !== 'HYDROTHERMAL_VENT';

    // Biome-adapted color palette
    let backboneColor = instability ? 0xf59e0b : 0x06b6d4;
    let backboneEmissive = instability ? 0xb45309 : 0x0891b2;

    if (biome === 'TUNDRA') {
      backboneColor = 0x7dd3fc;
      backboneEmissive = 0x0284c7;
    } else if (biome === 'HYDROTHERMAL_VENT') {
      backboneColor = 0xf97316;
      backboneEmissive = 0xef4444;
    } else if (biome === 'DEEP_SEA') {
      backboneColor = 0x0369a1;
      backboneEmissive = 0x075985;
    } else if (biome === 'TROPICAL') {
      backboneColor = 0x10b981;
      backboneEmissive = 0x047857;
    }

    const backboneMat = new THREE.MeshStandardMaterial({
      color: backboneColor,
      emissive: backboneEmissive,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.5,
    });

    const atMat = new THREE.MeshStandardMaterial({
      color: biome === 'HYDROTHERMAL_VENT' ? 0xfca5a5 : 0x38bdf8,
      emissive: biome === 'HYDROTHERMAL_VENT' ? 0xb91c1c : 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    });

    const gcMat = new THREE.MeshStandardMaterial({
      color: biome === 'HYDROTHERMAL_VENT' ? 0xfde047 : 0x10b981,
      emissive: biome === 'HYDROTHERMAL_VENT' ? 0xd97706 : 0x059669,
      emissiveIntensity: 0.5,
      roughness: 0.3,
    });

    const beadGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const rungGeo = new THREE.CylinderGeometry(0.09, 0.09, 1, 12);

    for (let i = 0; i < totalSteps; i++) {
      const angle = (i / pointsPerTurn) * Math.PI * 2;
      const y = -height / 2 + i * stepHeight;

      // Strand 1
      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;
      const bead1 = new THREE.Mesh(beadGeo, backboneMat);
      bead1.position.set(x1, y, z1);
      bead1.userData = { organelleId: 'PHOSPHATE_BACKBONE' };
      group.add(bead1);
      inspectableMeshesRef.current.push(bead1);

      // Strand 2
      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;
      const bead2 = new THREE.Mesh(beadGeo, backboneMat);
      bead2.position.set(x2, y, z2);
      bead2.userData = { organelleId: 'PHOSPHATE_BACKBONE' };
      group.add(bead2);
      inspectableMeshesRef.current.push(bead2);

      // Base pairs (Alternate between A-T and G-C)
      if (i % 2 === 0) {
        const isAT = (i / 2) % 2 === 0;
        const rungMesh = new THREE.Mesh(rungGeo, isAT ? atMat : gcMat);
        const p1 = new THREE.Vector3(x1, y, z1);
        const p2 = new THREE.Vector3(x2, y, z2);
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

        rungMesh.position.copy(mid);
        rungMesh.scale.set(1, p1.distanceTo(p2), 1);
        rungMesh.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3().subVectors(p2, p1).normalize()
        );

        rungMesh.userData = { organelleId: isAT ? 'BASE_PAIR_AT' : 'BASE_PAIR_GC' };
        group.add(rungMesh);
        inspectableMeshesRef.current.push(rungMesh);
      }
    }

    // --- ECOLOGICAL MOLECULAR ADAPTATIONS IN 3D SPACE ---
    if (biome === 'TUNDRA') {
      // Antifreeze Glycoprotein (AFGP) & Trehalose Cryo-Crystals along backbone
      const crystalGeo = new THREE.TetrahedronGeometry(0.32);
      const crystalMat = new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.6,
        roughness: 0.1,
        transmission: 0.8,
        transparent: true,
        opacity: 0.85,
      });

      for (let i = 0; i < totalSteps; i += 3) {
        const angle = (i / pointsPerTurn) * Math.PI * 2;
        const y = -height / 2 + i * stepHeight;
        const x = Math.cos(angle) * (radius + 0.45);
        const z = Math.sin(angle) * (radius + 0.45);

        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.position.set(x, y, z);
        crystal.rotation.set(i * 0.4, i * 0.7, 0);
        crystal.userData = { organelleId: 'ANTIFREEZE_GLYCOPROTEIN' };
        group.add(crystal);
        inspectableMeshesRef.current.push(crystal);
      }
    } else if (biome === 'HYDROTHERMAL_VENT') {
      // Reverse DNA Gyrase Positive Supercoil GC-Clamp Reinforcement Rings
      const clampGeo = new THREE.TorusGeometry(0.38, 0.08, 8, 16);
      const clampMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xef4444,
        emissiveIntensity: 0.85,
        roughness: 0.25,
      });

      for (let i = 2; i < totalSteps; i += 4) {
        const angle = (i / pointsPerTurn) * Math.PI * 2;
        const y = -height / 2 + i * stepHeight;
        const clamp = new THREE.Mesh(clampGeo, clampMat);
        clamp.position.set(0, y, 0);
        clamp.rotation.x = Math.PI / 2;
        clamp.rotation.z = angle;
        clamp.userData = { organelleId: 'THERMOPHILIC_GC_CLAMP' };
        group.add(clamp);
        inspectableMeshesRef.current.push(clamp);
      }
    } else if (biome === 'DEEP_SEA') {
      // Piezolyte TMAO Barophilic Hydration Shell Spheres
      const tmaoGeo = new THREE.SphereGeometry(0.24, 12, 12);
      const tmaoMat = new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.8,
        roughness: 0.15,
        transparent: true,
        opacity: 0.75,
      });

      for (let i = 1; i < totalSteps; i += 3) {
        const angle = (i / pointsPerTurn) * Math.PI * 2;
        const y = -height / 2 + i * stepHeight;
        const x = Math.cos(angle + 0.5) * (radius * 0.65);
        const z = Math.sin(angle + 0.5) * (radius * 0.65);

        const tmao = new THREE.Mesh(tmaoGeo, tmaoMat);
        tmao.position.set(x, y, z);
        tmao.userData = { organelleId: 'PIEZOLYTE_TMAO_CAGE' };
        group.add(tmao);
        inspectableMeshesRef.current.push(tmao);
      }
    } else if (biome === 'TROPICAL') {
      // Photolyase Solar UV-Repair Enzyme Complex
      const photolyaseGeo = new THREE.SphereGeometry(0.34, 16, 16);
      const photolyaseMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.8,
        roughness: 0.25,
      });

      [Math.floor(totalSteps * 0.3), Math.floor(totalSteps * 0.7)].forEach((idx) => {
        const angle = (idx / pointsPerTurn) * Math.PI * 2;
        const y = -height / 2 + idx * stepHeight;
        const x = Math.cos(angle) * (radius * 0.85);
        const z = Math.sin(angle) * (radius * 0.85);

        const node = new THREE.Mesh(photolyaseGeo, photolyaseMat);
        node.position.set(x, y, z);
        node.userData = { organelleId: 'HEAT_SHOCK_CHAPERONE' };
        group.add(node);
        inspectableMeshesRef.current.push(node);
      });
    }
  }, []);

  const buildCellSpecimen = useCallback((group: THREE.Group, slice: number, biome: EcologicalBiome) => {
    const cellRadius = 4.8;
    const membraneGeo = new THREE.SphereGeometry(cellRadius, 40, 40, 0, Math.PI * 2 * (1 - slice * 0.45));

    let memColor = 0x0284c7;
    if (biome === 'TUNDRA') memColor = 0x7dd3fc;
    else if (biome === 'HYDROTHERMAL_VENT') memColor = 0x7c2d12;
    else if (biome === 'DEEP_SEA') memColor = 0x0c4a6e;
    else if (biome === 'TROPICAL') memColor = 0x059669;

    const membraneMat = new THREE.MeshPhysicalMaterial({
      color: memColor,
      transparent: true,
      opacity: 0.32,
      roughness: 0.2,
      transmission: 0.82,
      thickness: 0.9,
      side: THREE.DoubleSide,
    });
    const membrane = new THREE.Mesh(membraneGeo, membraneMat);
    membrane.userData = { organelleId: 'PLASMA_MEMBRANE' };
    group.add(membrane);
    inspectableMeshesRef.current.push(membrane);

    // 2. Central Nucleus & Nucleolus
    const nucGeo = new THREE.SphereGeometry(1.8, 32, 32);
    const nucMat = new THREE.MeshStandardMaterial({
      color: biome === 'HYDROTHERMAL_VENT' ? 0xf97316 : 0x8b5cf6,
      emissive: biome === 'HYDROTHERMAL_VENT' ? 0xd97706 : 0x6d28d9,
      emissiveIntensity: 0.8,
      roughness: 0.4,
    });
    const nucleus = new THREE.Mesh(nucGeo, nucMat);
    nucleus.position.set(0, 0, 0);
    nucleus.userData = { organelleId: 'NUCLEUS' };
    group.add(nucleus);
    inspectableMeshesRef.current.push(nucleus);

    // 3. Mitochondria
    const mitoGeo = new THREE.CapsuleGeometry(0.35, 1.1, 8, 16);
    const mitoMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });

    const mitoPositions = [
      { pos: [2.5, 1.2, 0.8], rot: [0.4, 0.8, 0.2] },
      { pos: [-2.4, -1.0, 1.4], rot: [-0.6, 0.4, 0.9] },
      { pos: [0.8, -2.6, -1.0], rot: [0.8, -0.4, 0.5] },
    ];

    mitoPositions.forEach((m) => {
      const mito = new THREE.Mesh(mitoGeo, mitoMat);
      mito.position.set(m.pos[0], m.pos[1], m.pos[2]);
      mito.rotation.set(m.rot[0], m.rot[1], m.rot[2]);
      mito.userData = { organelleId: 'MITOCHONDRIA' };
      group.add(mito);
      inspectableMeshesRef.current.push(mito);
    });

    // 4. Endoplasmic Reticulum
    const erGeo = new THREE.TorusGeometry(2.5, 0.22, 12, 32);
    const erMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.5,
      roughness: 0.4,
    });
    const er = new THREE.Mesh(erGeo, erMat);
    er.rotation.x = Math.PI / 3;
    er.userData = { organelleId: 'ENDOPLASMIC_RETICULUM' };
    group.add(er);
    inspectableMeshesRef.current.push(er);

    // 5. Golgi Apparatus
    const golgiGeo = new THREE.TorusGeometry(1.6, 0.18, 8, 24, Math.PI);
    const golgiMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.5,
      roughness: 0.3,
    });
    const golgi = new THREE.Mesh(golgiGeo, golgiMat);
    golgi.position.set(-1.8, 2.0, -0.5);
    golgi.rotation.z = Math.PI / 4;
    golgi.userData = { organelleId: 'GOLGI_APPARATUS' };
    group.add(golgi);
    inspectableMeshesRef.current.push(golgi);

    // --- BIOME SPECIFIC CELL ADAPTATIONS ---
    if (biome === 'HYDROTHERMAL_VENT') {
      // GDGT Tetraether Covalent Lipid Monolayer Struts bridging the cell envelope
      const strutGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
      const strutMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xb45309,
        emissiveIntensity: 0.9,
      });
      for (let i = 0; i < 8; i++) {
        const phi = (i / 8) * Math.PI * 2;
        const strut = new THREE.Mesh(strutGeo, strutMat);
        strut.position.set(Math.cos(phi) * 4.2, Math.sin(phi) * 4.2, 0.5);
        strut.userData = { organelleId: 'TETRAETHER_LIPID_MONOLAYER' };
        group.add(strut);
        inspectableMeshesRef.current.push(strut);
      }
    } else if (biome === 'TUNDRA') {
      // Psychrophilic Cryoprotectant Trehalose Vesicles on outer perimeter
      const cryoGeo = new THREE.DodecahedronGeometry(0.35);
      const cryoMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.7,
      });
      for (let i = 0; i < 7; i++) {
        const phi = (i / 7) * Math.PI * 2;
        const cryo = new THREE.Mesh(cryoGeo, cryoMat);
        cryo.position.set(Math.cos(phi) * 4.4, Math.sin(phi) * 4.4, -0.6);
        cryo.userData = { organelleId: 'ANTIFREEZE_GLYCOPROTEIN' };
        group.add(cryo);
        inspectableMeshesRef.current.push(cryo);
      }
    } else if (biome === 'DEEP_SEA') {
      // Deep-Sea Abyssal Bioluminescent Photophore Organelles
      const photoGeo = new THREE.SphereGeometry(0.32, 16, 16);
      const photoMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x00f2fe,
        emissiveIntensity: 1.2,
      });
      for (let i = 0; i < 6; i++) {
        const theta = (i / 6) * Math.PI * 2;
        const photo = new THREE.Mesh(photoGeo, photoMat);
        photo.position.set(Math.cos(theta) * 4.3, 0.6, Math.sin(theta) * 4.3);
        photo.userData = { organelleId: 'PIEZOLYTE_TMAO_CAGE' };
        group.add(photo);
        inspectableMeshesRef.current.push(photo);
      }
    }
  }, []);

  const buildVirusSpecimen = useCallback((group: THREE.Group, slice: number, biome: EcologicalBiome) => {
    // 1. Capsid Shell
    const capsidGeo = new THREE.IcosahedronGeometry(3.2, 1);
    let capColor = 0x3b82f6;
    let capEmissive = 0x1d4ed8;

    if (biome === 'TUNDRA') {
      capColor = 0x93c5fd;
      capEmissive = 0x3b82f6;
    } else if (biome === 'HYDROTHERMAL_VENT') {
      capColor = 0x7c2d12;
      capEmissive = 0xb91c1c;
    } else if (biome === 'DEEP_SEA') {
      capColor = 0x0f172a;
      capEmissive = 0x0369a1;
    } else if (biome === 'TROPICAL') {
      capColor = 0x047857;
      capEmissive = 0x065f46;
    }

    const capsidMat = new THREE.MeshStandardMaterial({
      color: capColor,
      emissive: capEmissive,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.5,
      wireframe: false,
    });
    const capsid = new THREE.Mesh(capsidGeo, capsidMat);
    capsid.userData = { organelleId: 'VIRAL_CAPSID' };
    group.add(capsid);
    inspectableMeshesRef.current.push(capsid);

    // Capsid wireframe
    const wire = new THREE.Mesh(
      capsidGeo,
      new THREE.MeshBasicMaterial({ color: 0x60a5fa, wireframe: true, transparent: true, opacity: 0.4 })
    );
    group.add(wire);

    // 2. Viral RNA/DNA core
    const rnaGeo = new THREE.TorusKnotGeometry(1.2, 0.2, 64, 16);
    const rnaMat = new THREE.MeshStandardMaterial({
      color: biome === 'HYDROTHERMAL_VENT' ? 0xf97316 : 0xec4899,
      emissive: biome === 'HYDROTHERMAL_VENT' ? 0xef4444 : 0xdb2777,
      emissiveIntensity: 0.9,
      roughness: 0.3,
    });
    const rna = new THREE.Mesh(rnaGeo, rnaMat);
    rna.userData = { organelleId: 'VIRAL_GENOME' };
    group.add(rna);
    inspectableMeshesRef.current.push(rna);

    // 3. Radial Spike Glycoprotein Trimers
    const posAttr = capsidGeo.attributes.position;
    const vertexMap = new Map<string, THREE.Vector3>();

    for (let i = 0; i < posAttr.count; i++) {
      const v = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
      const key = `${v.x.toFixed(2)}_${v.y.toFixed(2)}_${v.z.toFixed(2)}`;
      if (!vertexMap.has(key)) vertexMap.set(key, v);
    }

    const spikeStemGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.1, 8);
    const spikeHeadGeo = new THREE.ConeGeometry(0.35, 0.6, 6);
    const spikeMat = new THREE.MeshStandardMaterial({
      color: biome === 'TUNDRA' ? 0xbae6fd : biome === 'HYDROTHERMAL_VENT' ? 0xf97316 : 0x10b981,
      emissive: biome === 'TUNDRA' ? 0x38bdf8 : biome === 'HYDROTHERMAL_VENT' ? 0xd97706 : 0x059669,
      emissiveIntensity: 0.6,
      roughness: 0.25,
    });

    Array.from(vertexMap.values()).forEach((v) => {
      const spikeGroup = new THREE.Group();
      const stem = new THREE.Mesh(spikeStemGeo, spikeMat);
      stem.position.y = 0.55;
      spikeGroup.add(stem);

      const head = new THREE.Mesh(spikeHeadGeo, spikeMat);
      head.position.y = 1.25;
      head.userData = { organelleId: 'SPIKE_GLYCOPROTEIN' };
      spikeGroup.add(head);
      inspectableMeshesRef.current.push(head);

      spikeGroup.position.copy(v);
      spikeGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());
      group.add(spikeGroup);
    });
  }, []);

  const buildProteinSpecimen = useCallback((group: THREE.Group, ph: number, temp: number, biome: EcologicalBiome) => {
    const points: THREE.Vector3[] = [];
    const count = 90;
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 6;
      const x = Math.sin(t) * 3.2 + Math.sin(t * 2) * 1.0;
      const y = (i / count) * 10 - 5;
      const z = Math.cos(t) * 3.2 + Math.cos(t * 3) * 0.7;
      points.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, 100, 0.24, 12, false);

    const isDenatured = (temp > 65 || ph < 5 || ph > 9.5) && biome !== 'HYDROTHERMAL_VENT';
    let ribbonColor = isDenatured ? 0xf59e0b : 0x06b6d4;
    let ribbonEmissive = isDenatured ? 0xd97706 : 0x0891b2;

    if (biome === 'TUNDRA') {
      ribbonColor = 0x7dd3fc;
      ribbonEmissive = 0x0284c7;
    } else if (biome === 'HYDROTHERMAL_VENT') {
      ribbonColor = 0xf97316;
      ribbonEmissive = 0xef4444;
    } else if (biome === 'DEEP_SEA') {
      ribbonColor = 0x0284c7;
      ribbonEmissive = 0x0369a1;
    } else if (biome === 'TROPICAL') {
      ribbonColor = 0x10b981;
      ribbonEmissive = 0x047857;
    }

    const ribbonMat = new THREE.MeshStandardMaterial({
      color: ribbonColor,
      emissive: ribbonEmissive,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.4,
    });

    const ribbon = new THREE.Mesh(tubeGeo, ribbonMat);
    ribbon.userData = { organelleId: 'ALPHA_HELIX' };
    group.add(ribbon);
    inspectableMeshesRef.current.push(ribbon);

    // Beta-sheet flat directional markers
    const sheetGeo = new THREE.BoxGeometry(0.8, 0.12, 1.5);
    const sheetMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      emissive: 0x6d28d9,
      emissiveIntensity: 0.5,
    });

    [0.25, 0.55, 0.85].forEach((t) => {
      const pt = curve.getPointAt(t);
      const sheet = new THREE.Mesh(sheetGeo, sheetMat);
      sheet.position.copy(pt);
      sheet.userData = { organelleId: 'BETA_SHEET' };
      group.add(sheet);
      inspectableMeshesRef.current.push(sheet);
    });

    // Catalytic Cleft Active Site Sphere
    const cleftGeo = new THREE.SphereGeometry(0.75, 24, 24);
    const cleftMat = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      emissive: 0xdb2777,
      emissiveIntensity: 0.85,
      roughness: 0.2,
    });
    const cleft = new THREE.Mesh(cleftGeo, cleftMat);
    cleft.position.set(0, 0.5, 1.2);
    cleft.userData = { organelleId: 'ACTIVE_CATALYTIC_SITE' };
    group.add(cleft);
    inspectableMeshesRef.current.push(cleft);

    // --- PROTEIN BIOME ADAPTATION STRUCTURES ---
    if (biome === 'HYDROTHERMAL_VENT') {
      // Hyper-thermostable ionic salt bridge cylinders
      const bridgeGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8);
      const bridgeMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xd97706,
        emissiveIntensity: 0.9,
      });
      const bridge1 = new THREE.Mesh(bridgeGeo, bridgeMat);
      bridge1.position.set(0.6, 1.8, 0.2);
      bridge1.rotation.z = Math.PI / 4;
      bridge1.userData = { organelleId: 'THERMOPHILIC_GC_CLAMP' };
      group.add(bridge1);
      inspectableMeshesRef.current.push(bridge1);
    } else if (biome === 'TROPICAL') {
      // Heat-shock chaperone (Hsp70) protective shield ring
      const chapGeo = new THREE.TorusGeometry(1.2, 0.14, 12, 24);
      const chapMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 0.8,
      });
      const chap = new THREE.Mesh(chapGeo, chapMat);
      chap.position.set(0, 0.5, 1.2);
      chap.userData = { organelleId: 'HEAT_SHOCK_CHAPERONE' };
      group.add(chap);
      inspectableMeshesRef.current.push(chap);
    }
  }, []);

  // -------------------------------------------------------------
  // REBUILD SPECIMEN ON SETTINGS & BIOME CHANGE
  // -------------------------------------------------------------
  const rebuildSpecimen = useCallback(() => {
    if (!specimenGroupRef.current) return;

    while (specimenGroupRef.current.children.length > 0) {
      const child = specimenGroupRef.current.children[0] as any;
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
        else child.material.dispose();
      }
      specimenGroupRef.current.remove(child);
    }

    inspectableMeshesRef.current = [];
    const group = specimenGroupRef.current;
    const biome = obsState.biome || 'STANDARD_LAB';

    switch (obsState.specimen) {
      case 'EUKARYOTIC_CELL':
        buildCellSpecimen(group, obsState.crossSectionSlice, biome);
        break;
      case 'VIRUS_STRUCTURE':
        buildVirusSpecimen(group, obsState.crossSectionSlice, biome);
        break;
      case 'PROTEIN_FOLDING':
        buildProteinSpecimen(group, obsState.phLevel, obsState.temperature, biome);
        break;
      case 'DNA_HELIX':
      default:
        buildDnaSpecimen(group, obsState.phLevel, obsState.temperature, biome);
        break;
    }
  }, [obsState, buildDnaSpecimen, buildCellSpecimen, buildVirusSpecimen, buildProteinSpecimen]);

  // Initial Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x020617, 0.02);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 2, 16);
    cameraRef.current = camera;

    // 3. Renderer with local clipping enabled
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 35;
    controls.minDistance = 3;
    controlsRef.current = controls;

    // 5. Lighting
    const amb = new THREE.AmbientLight(0x081329, 2.0);
    scene.add(amb);
    ambientLightRef.current = amb;

    const cyanPoint = new THREE.PointLight(0x06b6d4, 3, 50);
    cyanPoint.position.set(12, 12, 12);
    scene.add(cyanPoint);
    primaryPointRef.current = cyanPoint;

    const purplePoint = new THREE.PointLight(0xa855f7, 2, 50);
    purplePoint.position.set(-12, -10, -10);
    scene.add(purplePoint);
    secondaryPointRef.current = purplePoint;

    const topSun = new THREE.DirectionalLight(0xffffff, 1.0);
    topSun.position.set(5, 15, 8);
    scene.add(topSun);

    // 6. Dynamic Microscopic Environment Particle System
    const pCount = 600;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 44;
      pPos[i + 1] = (Math.random() - 0.5) * 44;
      pPos[i + 2] = (Math.random() - 0.5) * 44;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    particlePositionsRef.current = pPos;

    const pMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.16,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 7. Specimen Group
    const specGroup = new THREE.Group();
    scene.add(specGroup);
    specimenGroupRef.current = specGroup;

    rebuildSpecimen();

    // 8. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      if (specimenGroupRef.current) {
        const speed = obsState.kineticSpeed || 1.0;
        specimenGroupRef.current.rotation.y += 0.18 * speed * delta;
        specimenGroupRef.current.rotation.x = Math.sin(elapsedTime * 0.25) * 0.08;
      }

      // Dynamic Particle Movement based on Biome
      if (particlesRef.current && particlePositionsRef.current) {
        const pos = particlePositionsRef.current;
        const currentBiome = obsState.biome || 'STANDARD_LAB';

        for (let i = 0; i < pCount * 3; i += 3) {
          if (currentBiome === 'TUNDRA') {
            // Ice crystals falling and drifting
            pos[i + 1] -= 0.05;
            pos[i] += Math.sin(elapsedTime + i) * 0.01;
            if (pos[i + 1] < -22) pos[i + 1] = 22;
          } else if (currentBiome === 'TROPICAL') {
            // Warm spores and pollen floating upwards
            pos[i + 1] += 0.04;
            pos[i] += Math.cos(elapsedTime * 0.5 + i) * 0.015;
            if (pos[i + 1] > 22) pos[i + 1] = -22;
          } else if (currentBiome === 'DEEP_SEA') {
            // Slow marine snow drifting down through abyssal darkness
            pos[i + 1] -= 0.02;
            pos[i + 2] += Math.sin(elapsedTime * 0.3 + i) * 0.008;
            if (pos[i + 1] < -22) pos[i + 1] = 22;
          } else if (currentBiome === 'HYDROTHERMAL_VENT') {
            // Rising mineral soot and volcanic sparks
            pos[i + 1] += 0.12;
            pos[i] += (Math.random() - 0.5) * 0.03;
            if (pos[i + 1] > 22) pos[i + 1] = -22;
          } else {
            // Standard Brownian motion
            pos[i + 1] += Math.sin(elapsedTime + i) * 0.005;
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (container && renderer.domElement) container.removeChild(renderer.domElement);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Update Three.js lighting & atmospheric environment when biome changes
  useEffect(() => {
    const biome = obsState.biome || 'STANDARD_LAB';
    const data = ECOLOGICAL_BIOMES[biome];

    if (sceneRef.current) {
      sceneRef.current.fog = new THREE.FogExp2(
        data.fogHex,
        biome === 'DEEP_SEA' ? 0.032 : biome === 'HYDROTHERMAL_VENT' ? 0.026 : 0.018
      );
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.color.set(data.ambientHex);
    }
    if (primaryPointRef.current) {
      primaryPointRef.current.color.setHex(data.primaryLightHex);
    }
    if (secondaryPointRef.current) {
      secondaryPointRef.current.color.setHex(data.secondaryLightHex);
    }

    if (particlesRef.current) {
      const pMat = particlesRef.current.material as THREE.PointsMaterial;
      if (biome === 'TUNDRA') {
        pMat.color.setHex(0xbae6fd);
        pMat.size = 0.22;
        pMat.opacity = 0.75;
      } else if (biome === 'TROPICAL') {
        pMat.color.setHex(0x34d399);
        pMat.size = 0.18;
        pMat.opacity = 0.65;
      } else if (biome === 'DEEP_SEA') {
        pMat.color.setHex(0x38bdf8);
        pMat.size = 0.28;
        pMat.opacity = 0.55;
      } else if (biome === 'HYDROTHERMAL_VENT') {
        pMat.color.setHex(0xf97316);
        pMat.size = 0.22;
        pMat.opacity = 0.85;
      } else {
        pMat.color.setHex(0x38bdf8);
        pMat.size = 0.15;
        pMat.opacity = 0.5;
      }
    }
  }, [obsState.biome]);

  // Rebuild specimen when specimen, pH, temperature, crossSection, or biome changes
  useEffect(() => {
    rebuildSpecimen();
  }, [obsState.specimen, obsState.phLevel, obsState.temperature, obsState.crossSectionSlice, obsState.biome, rebuildSpecimen]);

  // Raycast interaction on pointer click
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
    const y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(inspectableMeshesRef.current, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const organelleId = hit.userData.organelleId;
      if (organelleId && ORGANELLE_DATABASE[organelleId]) {
        setSelectedOrganelle(ORGANELLE_DATABASE[organelleId]);
        bioSimulationService.playInspectChime();
        bioSimulationService.updateObservation({ highlightOrganelle: organelleId });
      }
    }
  };

  // Step-by-step biological process controller
  const currentProcessList =
    obsState.activeProcess === 'DNA_REPLICATION'
      ? PROCESS_STAGES.DNA_REPLICATION
      : obsState.activeProcess === 'MRNA_TRANSCRIPTION'
      ? PROCESS_STAGES.MRNA_TRANSCRIPTION
      : obsState.activeProcess === 'MITOSIS_CYCLE'
      ? PROCESS_STAGES.MITOSIS_CYCLE
      : null;

  const handleNextStep = () => {
    if (!currentProcessList) return;
    const next = (obsState.processStep + 1) % currentProcessList.length;
    bioSimulationService.updateObservation({ processStep: next });
    bioSimulationService.playInspectChime();
  };

  const handlePrevStep = () => {
    if (!currentProcessList) return;
    const prev = (obsState.processStep - 1 + currentProcessList.length) % currentProcessList.length;
    bioSimulationService.updateObservation({ processStep: prev });
    bioSimulationService.playInspectChime();
  };

  const handleTogglePlayProcess = () => {
    setIsPlayingProcess((prev) => !prev);
  };

  // Switch Ecological Biome
  const handleSelectBiome = (biomeKey: EcologicalBiome) => {
    bioSimulationService.updateObservation({ biome: biomeKey });
    bioSimulationService.playInspectChime();
  };

  // Apply real-world biome ecological conditions
  const handleApplyBiomeConditions = () => {
    const target = currentBiomeData;
    let targetSpeed = 1.0;
    if (activeBiome === 'TUNDRA') targetSpeed = 0.4;
    else if (activeBiome === 'TROPICAL') targetSpeed = 2.2;
    else if (activeBiome === 'DEEP_SEA') targetSpeed = 0.6;
    else if (activeBiome === 'HYDROTHERMAL_VENT') targetSpeed = 1.8;

    bioSimulationService.updateObservation({
      temperature: target.temperature,
      phLevel: target.ph,
      kineticSpeed: targetSpeed,
    });
    bioSimulationService.playInspectChime();
  };

  useEffect(() => {
    if (isPlayingProcess && currentProcessList) {
      processTimerRef.current = setInterval(() => {
        setObsState((prev) => {
          const nextStep = (prev.processStep + 1) % currentProcessList.length;
          bioSimulationService.updateObservation({ processStep: nextStep });
          return { ...prev, processStep: nextStep };
        });
      }, 4000);
    } else {
      if (processTimerRef.current) clearInterval(processTimerRef.current);
    }
    return () => {
      if (processTimerRef.current) clearInterval(processTimerRef.current);
    };
  }, [isPlayingProcess, currentProcessList]);

  return (
    <div className="relative w-full h-[calc(100dvh-120px)] sm:h-[calc(100dvh-100px)] overflow-hidden rounded-3xl border border-cyan-500/30 bg-[#020617] shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col select-none">
      {/* 3D WebGL Inspection Canvas */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        className="w-full h-full cursor-grab active:cursor-grabbing relative"
      />

      {/* Top Floating Laboratory Navigation & Specimen / Environment Layer Bar */}
      <div className="absolute top-3 left-3 right-3 flex flex-col gap-2 pointer-events-none z-20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Specimen Switcher with Liquid Glass Droplet indicator */}
          <LiquidGlassNav
            activeId={obsState.specimen}
            className="pointer-events-auto flex items-center gap-1 p-1 rounded-full border border-cyan-500/35 shadow-xl text-xs text-white"
          >
            <div className="flex items-center gap-1.5 px-2 py-1 text-cyan-400 font-bold tracking-wider text-[11px] uppercase border-r border-cyan-500/25 mr-1 shrink-0">
              <Microscope className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Specimen:</span>
            </div>

            {(
              [
                { id: 'DNA_HELIX', label: 'DNA Double Helix', icon: Dna },
                { id: 'EUKARYOTIC_CELL', label: 'Eukaryotic Cell', icon: Atom },
                { id: 'VIRUS_STRUCTURE', label: 'Virus Structure', icon: Eye },
                { id: 'PROTEIN_FOLDING', label: 'Protein Folding', icon: Layers },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                data-nav-id={item.id}
                type="button"
                onClick={() => {
                  bioSimulationService.updateObservation({
                    specimen: item.id,
                    highlightOrganelle:
                      item.id === 'DNA_HELIX'
                        ? 'BASE_PAIR_AT'
                        : item.id === 'EUKARYOTIC_CELL'
                        ? 'NUCLEUS'
                        : item.id === 'VIRUS_STRUCTURE'
                        ? 'SPIKE_GLYCOPROTEIN'
                        : 'ALPHA_HELIX',
                  });
                  if (item.id === 'DNA_HELIX') setSelectedOrganelle(ORGANELLE_DATABASE['BASE_PAIR_AT']);
                  if (item.id === 'EUKARYOTIC_CELL') setSelectedOrganelle(ORGANELLE_DATABASE['NUCLEUS']);
                  if (item.id === 'VIRUS_STRUCTURE') setSelectedOrganelle(ORGANELLE_DATABASE['SPIKE_GLYCOPROTEIN']);
                  if (item.id === 'PROTEIN_FOLDING') setSelectedOrganelle(ORGANELLE_DATABASE['ALPHA_HELIX']);
                }}
                className={`liquid-nav-btn px-3 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 text-xs cursor-pointer ${
                  obsState.specimen === item.id
                    ? 'text-cyan-300 font-extrabold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <item.icon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            ))}
          </LiquidGlassNav>

          {/* Environmental Telemetry & Biome Panel Toggle */}
          <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-[#040e24]/90 border border-cyan-500/35 backdrop-blur-md shadow-xl text-xs text-white">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-950/70 border border-cyan-500/20 font-mono text-[11px]">
              <Droplets className="w-3 h-3 text-cyan-400" />
              <span>pH {obsState.phLevel.toFixed(1)}</span>
            </div>

            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-950/70 border border-cyan-500/20 font-mono text-[11px]">
              <Thermometer className="w-3 h-3 text-amber-400" />
              <span>{obsState.temperature.toFixed(0)}°C</span>
            </div>

            <button
              type="button"
              onClick={() => setShowBiomePanel((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                showBiomePanel
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-900 border border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Biome Adaptation</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                {currentBiomeData.name.split(' ')[0]}
              </span>
            </button>
          </div>
        </div>

        {/* Environment Simulation Layer Biome Switcher Bar with Liquid Glass */}
        <LiquidGlassNav
          activeId={activeBiome}
          className="pointer-events-auto flex items-center gap-1 p-1 rounded-full border border-emerald-500/30 shadow-xl text-xs text-white overflow-x-auto no-scrollbar scrollbar-none"
        >
          <div className="flex items-center gap-1 px-2 py-1 text-emerald-400 font-bold tracking-wider text-[11px] uppercase border-r border-emerald-500/25 shrink-0 mr-1">
            <Globe className="w-3.5 h-3.5" />
            <span>Ecological Biome:</span>
          </div>

          {(
            [
              { id: 'STANDARD_LAB', label: 'Standard Lab', icon: Microscope, color: 'text-cyan-300' },
              { id: 'TUNDRA', label: 'Arctic Tundra (-5°C)', icon: Snowflake, color: 'text-sky-300' },
              { id: 'TROPICAL', label: 'Tropical Canopy (36°C)', icon: Sun, color: 'text-emerald-300' },
              { id: 'DEEP_SEA', label: 'Deep Sea (1,000 atm)', icon: Waves, color: 'text-blue-300' },
              { id: 'HYDROTHERMAL_VENT', label: 'Hydrothermal Vent (88°C)', icon: Flame, color: 'text-amber-300' },
            ] as const
          ).map((b) => (
            <button
              key={b.id}
              data-nav-id={b.id}
              type="button"
              onClick={() => handleSelectBiome(b.id)}
              className={`liquid-nav-btn px-2.5 py-1 rounded-full font-bold transition flex items-center gap-1.5 text-xs whitespace-nowrap cursor-pointer ${
                activeBiome === b.id
                  ? 'text-emerald-300 font-extrabold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <b.icon className={`w-3.5 h-3.5 ${activeBiome === b.id ? 'text-emerald-300' : b.color}`} />
              <span>{b.label}</span>
            </button>
          ))}
        </LiquidGlassNav>
      </div>

      {/* Floating Ecological Biome Adaptation Readout Panel */}
      {showBiomePanel && (
        <div className="absolute top-28 right-3 max-w-sm w-full bg-[#030c22]/95 border border-emerald-500/40 rounded-3xl p-4 backdrop-blur-xl shadow-2xl text-white pointer-events-auto z-20 animate-in fade-in slide-in-from-right duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-emerald-500/25 pb-2.5 mb-2.5">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                <Globe className="w-3 h-3" /> Ecological Biome Simulation
              </span>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                {currentBiomeData.name}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{currentBiomeData.tagline}</p>
            </div>
            <button
              onClick={() => setShowBiomePanel(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Environmental Telemetry Grid */}
          <div className="grid grid-cols-4 gap-1.5 mb-3 text-center">
            <div className="p-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[9px] text-slate-400 block">Temperature</span>
              <span className="text-[11px] font-mono font-bold text-amber-300">{currentBiomeData.temperature}°C</span>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[9px] text-slate-400 block">pH Level</span>
              <span className="text-[11px] font-mono font-bold text-cyan-300">{currentBiomeData.ph.toFixed(1)}</span>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[9px] text-slate-400 block">Pressure</span>
              <span className="text-[11px] font-mono font-bold text-sky-300">{currentBiomeData.pressureAtm} atm</span>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[9px] text-slate-400 block">Salinity</span>
              <span className="text-[11px] font-mono font-bold text-emerald-300">{currentBiomeData.salinityPsu} PSU</span>
            </div>
          </div>

          {/* Current Specimen Adaptation In This Biome */}
          <div className="space-y-2 text-xs text-slate-200 leading-relaxed max-h-56 overflow-y-auto pr-1">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/25">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">
                {obsState.specimen.replace('_', ' ')} Adaptation:
              </span>
              <h4 className="font-bold text-xs text-white mb-1">
                {currentBiomeData.specimenAdaptations[obsState.specimen]?.title}
              </h4>
              <p className="text-[11px] text-slate-300 mb-1.5">
                {currentBiomeData.specimenAdaptations[obsState.specimen]?.biochemicalMechanism}
              </p>
              <div className="text-[10px] text-cyan-300 bg-cyan-950/40 p-1.5 rounded-lg border border-cyan-500/20 font-mono">
                <b>Visual Manifestation:</b> {currentBiomeData.specimenAdaptations[obsState.specimen]?.visualEffect}
              </div>
            </div>

            {/* Molecular Biomarkers */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Active Molecular Biomarkers:</span>
              <div className="flex flex-wrap gap-1">
                {currentBiomeData.molecularMarkers.map((marker, idx) => (
                  <span
                    key={idx}
                    className="text-[9.5px] px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono"
                  >
                    {marker}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 space-y-1.5">
            <button
              type="button"
              onClick={handleApplyBiomeConditions}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Apply Ecological Conditions ({currentBiomeData.temperature}°C · pH {currentBiomeData.ph})</span>
            </button>

            {onAskAiTopic && (
              <button
                type="button"
                onClick={() =>
                  onAskAiTopic(
                    `Explain how the ${obsState.specimen.replace('_', ' ')} visually and biochemically adapts to the ${currentBiomeData.name} (${currentBiomeData.tagline}). Focus on: ${currentBiomeData.specimenAdaptations[obsState.specimen]?.title}.`
                  )
                }
                className="w-full py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Ask AI Specialist about this Biome</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Scientific Inspection Card (When organelle clicked or loaded by AI) */}
      {selectedOrganelle && (
        <div className="absolute top-28 left-3 max-w-sm w-full bg-[#040e24]/95 border border-cyan-400/40 rounded-3xl p-4 backdrop-blur-xl shadow-2xl text-white pointer-events-auto z-20 animate-in fade-in slide-in-from-left duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-cyan-500/25 pb-2.5 mb-2.5">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                {selectedOrganelle.category}
              </span>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                {selectedOrganelle.name}
              </h3>
              {selectedOrganelle.latinName && (
                <span className="text-[10px] italic text-slate-400">{selectedOrganelle.latinName}</span>
              )}
            </div>
            <button
              onClick={() => setSelectedOrganelle(null)}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs text-slate-200 leading-relaxed max-h-56 overflow-y-auto pr-1">
            <div>
              <span className="font-semibold text-cyan-300 block text-[11px] mb-0.5">Biological Function:</span>
              <p className="text-[11px] text-slate-300">{selectedOrganelle.function}</p>
            </div>

            <div>
              <span className="font-semibold text-cyan-300 block text-[11px] mb-0.5">Biochemical Mechanism:</span>
              <p className="text-[11px] text-slate-300">{selectedOrganelle.biochemicalDetails}</p>
            </div>

            {selectedOrganelle.dimensions && (
              <div className="p-2 rounded-xl bg-[#020617] border border-cyan-500/20 text-[10px] font-mono text-cyan-200">
                {selectedOrganelle.dimensions}
              </div>
            )}
          </div>

          {onAskAiTopic && (
            <button
              type="button"
              onClick={() => onAskAiTopic(`Explain in deep scientific detail the biological function and molecular pathway of: ${selectedOrganelle.name}`)}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Ask AI Specialist about this</span>
            </button>
          )}
        </div>
      )}

      {/* Floating Bottom Observable Learning Console */}
      <div className="absolute bottom-3 left-3 right-3 pointer-events-none flex flex-col gap-2 z-10">
        {/* Process Step-by-Step Playback Bar (Mitosis, Replication, Transcription) */}
        {currentProcessList && (
          <div className="pointer-events-auto bg-[#040e24]/95 border border-cyan-500/35 rounded-2xl p-3 backdrop-blur-md shadow-2xl text-xs text-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded">
                  {obsState.activeProcess.replace('_', ' ')} · STEP {obsState.processStep + 1}/{currentProcessList.length}
                </span>
                <span className="font-bold text-xs text-white truncate">
                  {currentProcessList[obsState.processStep]?.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-1">
                {currentProcessList[obsState.processStep]?.desc}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handlePrevStep}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition cursor-pointer"
                title="Previous Stage"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={handleTogglePlayProcess}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold flex items-center gap-1 hover:bg-cyan-400 transition cursor-pointer"
              >
                {isPlayingProcess ? <Pause className="w-3.5 h-3.5 fill-slate-950" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
                <span>{isPlayingProcess ? 'Pause' : 'Play Process'}</span>
              </button>
              <button
                onClick={handleNextStep}
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-white transition cursor-pointer"
                title="Next Stage"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Observable Reaction Sliders & Process Selector Bar */}
        <div className="pointer-events-auto bg-[#040e24]/95 border border-cyan-500/30 rounded-2xl p-3 backdrop-blur-md shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-white">
          {/* Reaction Sliders (pH, Temperature, Slice, Speed) */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* pH Slider */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400">pH:</span>
              <input
                type="range"
                min="3.0"
                max="11.0"
                step="0.2"
                value={obsState.phLevel}
                onChange={(e) => bioSimulationService.updateObservation({ phLevel: parseFloat(e.target.value) })}
                className="w-16 accent-cyan-400 cursor-pointer"
              />
              <span className="font-mono text-[10px] text-cyan-300">{obsState.phLevel.toFixed(1)}</span>
            </div>

            {/* Temperature Slider */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400">Temp:</span>
              <input
                type="range"
                min="-10"
                max="100"
                step="2"
                value={obsState.temperature}
                onChange={(e) => bioSimulationService.updateObservation({ temperature: parseFloat(e.target.value) })}
                className="w-16 accent-amber-400 cursor-pointer"
              />
              <span className="font-mono text-[10px] text-amber-300">{obsState.temperature.toFixed(0)}°C</span>
            </div>

            {/* Cross-Section Slice Slider */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Scissors className="w-3 h-3 text-cyan-400" /> Slice:
              </span>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={obsState.crossSectionSlice}
                onChange={(e) => bioSimulationService.updateObservation({ crossSectionSlice: parseFloat(e.target.value) })}
                className="w-16 accent-emerald-400 cursor-pointer"
              />
              <span className="font-mono text-[10px] text-emerald-300">{Math.round(obsState.crossSectionSlice * 100)}%</span>
            </div>

            {/* Kinetic Rate Slider */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400">Speed:</span>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.2"
                value={obsState.kineticSpeed}
                onChange={(e) => bioSimulationService.updateObservation({ kineticSpeed: parseFloat(e.target.value) })}
                className="w-14 accent-blue-400 cursor-pointer"
              />
              <span className="font-mono text-[10px] text-blue-300">{obsState.kineticSpeed}x</span>
            </div>
          </div>

          {/* Biological Process Selectors */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-400 mr-1">Biological Process:</span>
            {[
              { id: 'NONE', label: 'Static View' },
              { id: 'DNA_REPLICATION', label: 'DNA Replication' },
              { id: 'MRNA_TRANSCRIPTION', label: 'Transcription' },
              { id: 'MITOSIS_CYCLE', label: 'Mitosis' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  bioSimulationService.updateObservation({
                    activeProcess: p.id as any,
                    processStep: 0,
                  });
                  setIsPlayingProcess(false);
                }}
                className={`px-2.5 py-1 rounded-xl font-semibold transition text-[11px] cursor-pointer ${
                  obsState.activeProcess === p.id
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
