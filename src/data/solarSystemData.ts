/**
 * Offline NASA Planetary Factsheet & Solar System Database
 * 100% self-contained. Zero external network requests or live API dependencies.
 * Grounded in verified NASA Jet Propulsion Laboratory (JPL) Planetary Fact Sheets.
 */

export interface NasaMission {
  name: string;
  year: string;
  agency: string;
  type:
    | 'Orbiter'
    | 'Flyby'
    | 'Lander'
    | 'Rover'
    | 'Sample Return'
    | 'Crewed'
    | 'Orbiter / Probe'
    | 'Orbiter / Lander';
  significance: string;
}

export interface CelestialBody {
  id: string;
  name: string;
  tagline: string;
  classification: 'Star' | 'Terrestrial Planet' | 'Gas Giant' | 'Ice Giant' | 'Dwarf Planet';
  orderFromSun: number; // 0 for Sun
  diameterKm: number;
  massKg: string;
  distanceFromSunKm: number; // in km
  distanceFromSunAu: number; // Astronomical Units
  orbitalPeriodDays: number; // in Earth days
  orbitalPeriodDisplay: string;
  rotationPeriodHours: number; // in hours (negative for retrograde)
  rotationPeriodDisplay: string;
  gravityRelativeG: number; // Earth = 1.0g
  meanSurfaceTempC: number;
  minTempC?: number;
  maxTempC?: number;
  moonsCount: number;
  atmosphere: string[];
  ringSystem: boolean;
  visual: {
    color: string;
    accentColor: string;
    glowColor: string;
    gradient: string[];
    radiusCanvas: number; // visual relative size on canvas
    orbitRadiusCanvas: number; // relative orbit radius on canvas
    orbitSpeedFactor: number; // relative angular speed
    hasRings?: boolean;
    ringInnerRadius?: number;
    ringOuterRadius?: number;
    ringColor?: string;
  };
  facts: string[];
  missions: NasaMission[];
}

export const SOLAR_SYSTEM_DATA: CelestialBody[] = [
  {
    id: 'sun',
    name: 'The Sun (Sol)',
    tagline: 'Heart of the Solar System · G-Type Main-Sequence Star',
    classification: 'Star',
    orderFromSun: 0,
    diameterKm: 1392700,
    massKg: '1.989 × 10³⁰ kg (99.86% of Solar System mass)',
    distanceFromSunKm: 0,
    distanceFromSunAu: 0,
    orbitalPeriodDays: 0,
    orbitalPeriodDisplay: 'Orbits Galactic Center (~230M years)',
    rotationPeriodHours: 609.6,
    rotationPeriodDisplay: '25.4 days at Equator (~35 days at poles)',
    gravityRelativeG: 27.9,
    meanSurfaceTempC: 5500,
    minTempC: 5500,
    maxTempC: 15000000, // Core temp
    moonsCount: 0,
    atmosphere: ['Hydrogen (73.4%)', 'Helium (25.0%)', 'Oxygen (0.8%)', 'Carbon (0.3%)'],
    ringSystem: false,
    visual: {
      color: '#fbbf24',
      accentColor: '#f59e0b',
      glowColor: 'rgba(251, 191, 36, 0.6)',
      gradient: ['#ffffff', '#fde047', '#f59e0b', '#dc2626'],
      radiusCanvas: 24,
      orbitRadiusCanvas: 0,
      orbitSpeedFactor: 0,
    },
    facts: [
      'The Sun contains 99.86% of all mass in the Solar System. Roughly 1.3 million Earths could fit inside it.',
      'Light from the Sun takes approximately 8 minutes and 20 seconds to reach Earth, traveling at 299,792 km/s.',
    ],
    missions: [
      {
        name: 'Parker Solar Probe',
        year: '2018–Present',
        agency: 'NASA',
        type: 'Orbiter',
        significance: 'First human-made spacecraft to "touch the Sun", diving through the solar corona at speeds exceeding 690,000 km/h.',
      },
      {
        name: 'SOHO (Solar & Heliospheric Observatory)',
        year: '1995–Present',
        agency: 'NASA / ESA',
        type: 'Orbiter',
        significance: 'Continuous solar storm, coronal mass ejection (CME) and sunspot monitoring; discovered over 4,000 comets.',
      },
      {
        name: 'Solar Dynamics Observatory (SDO)',
        year: '2010–Present',
        agency: 'NASA',
        type: 'Orbiter',
        significance: 'Provides ultra-high definition images of the solar atmosphere and magnetic dynamo mechanisms.',
      },
    ],
  },
  {
    id: 'mercury',
    name: 'Mercury',
    tagline: 'Swift Iron Messenger · Extreme Thermal Swings',
    classification: 'Terrestrial Planet',
    orderFromSun: 1,
    diameterKm: 4879,
    massKg: '3.301 × 10²³ kg',
    distanceFromSunKm: 57910000,
    distanceFromSunAu: 0.387,
    orbitalPeriodDays: 88,
    orbitalPeriodDisplay: '88 Earth Days',
    rotationPeriodHours: 1407.6,
    rotationPeriodDisplay: '58.6 Earth Days (3:2 spin-orbit resonance)',
    gravityRelativeG: 0.38,
    meanSurfaceTempC: 167,
    minTempC: -180,
    maxTempC: 430,
    moonsCount: 0,
    atmosphere: ['Trace Oxygen (42%)', 'Sodium (29%)', 'Hydrogen (22%)', 'Helium (6%)'],
    ringSystem: false,
    visual: {
      color: '#94a3b8',
      accentColor: '#cbd5e1',
      glowColor: 'rgba(148, 163, 184, 0.4)',
      gradient: ['#e2e8f0', '#94a3b8', '#475569'],
      radiusCanvas: 4,
      orbitRadiusCanvas: 42,
      orbitSpeedFactor: 4.15,
    },
    facts: [
      'Mercury has the most extreme temperature swings in the solar system, from scorching 430°C in direct sunlight to freezing -180°C in the shade.',
      'Mercury has a massive metallic iron core that makes up roughly 85% of the entire radius of the planet.',
    ],
    missions: [
      {
        name: 'MESSENGER',
        year: '2004–2015',
        agency: 'NASA',
        type: 'Orbiter',
        significance: 'First spacecraft to orbit Mercury; discovered abundant volatile elements and water ice in permanently shadowed polar craters.',
      },
      {
        name: 'Mariner 10',
        year: '1973–1975',
        agency: 'NASA',
        type: 'Flyby',
        significance: 'First spacecraft to visit Mercury and first to utilize gravitational sling-shot trajectory assistance.',
      },
      {
        name: 'BepiColombo',
        year: '2018–Present',
        agency: 'ESA / JAXA',
        type: 'Orbiter',
        significance: 'Dual-orbiter mission conducting multiple Mercury flybys preparing for comprehensive orbital insertion in 2026.',
      },
    ],
  },
  {
    id: 'venus',
    name: 'Venus',
    tagline: 'The Runaway Greenhouse · Earth\'s Toxic Twin',
    classification: 'Terrestrial Planet',
    orderFromSun: 2,
    diameterKm: 12104,
    massKg: '4.867 × 10²⁴ kg',
    distanceFromSunKm: 108200000,
    distanceFromSunAu: 0.723,
    orbitalPeriodDays: 224.7,
    orbitalPeriodDisplay: '224.7 Earth Days',
    rotationPeriodHours: -5832.5, // retrograde
    rotationPeriodDisplay: '243 Earth Days (Retrograde spin: Sun rises in West)',
    gravityRelativeG: 0.90,
    meanSurfaceTempC: 464,
    minTempC: 438,
    maxTempC: 482,
    moonsCount: 0,
    atmosphere: ['Carbon Dioxide (96.5%)', 'Nitrogen (3.5%)', 'Sulfuric Acid Clouds'],
    ringSystem: false,
    visual: {
      color: '#fb923c',
      accentColor: '#f97316',
      glowColor: 'rgba(251, 146, 60, 0.45)',
      gradient: ['#fed7aa', '#fb923c', '#c2410c'],
      radiusCanvas: 7.5,
      orbitRadiusCanvas: 64,
      orbitSpeedFactor: 1.62,
    },
    facts: [
      'Venus is hotter than Mercury despite being twice as far from the Sun, due to a crushing runaway greenhouse effect with surface pressures equal to 900 meters underwater on Earth.',
      'A single day on Venus (243 Earth days) is longer than its entire year (225 Earth days), and it spins backwards compared to most planets.',
    ],
    missions: [
      {
        name: 'Magellan',
        year: '1989–1994',
        agency: 'NASA',
        type: 'Orbiter',
        significance: 'Mapped 98% of Venus’s surface with synthetic aperture radar, revealing volcanic plains, impact craters, and lava flows.',
      },
      {
        name: 'Pioneer Venus Multiprobe',
        year: '1978',
        agency: 'NASA',
        type: 'Lander',
        significance: 'Dropped four atmospheric probes directly through the dense sulfuric acid clouds to sample structure down to the surface.',
      },
      {
        name: 'VERITAS & DAVINCI',
        year: 'Upcoming (2029+)',
        agency: 'NASA Discovery Program',
        type: 'Orbiter / Probe',
        significance: 'Next-generation missions to investigate whether Venus ever hosted oceans and early habitable climates.',
      },
    ],
  },
  {
    id: 'earth',
    name: 'Earth (Terra)',
    tagline: 'The Blue Marble · Oasis of Life & Liquid Water',
    classification: 'Terrestrial Planet',
    orderFromSun: 3,
    diameterKm: 12742,
    massKg: '5.972 × 10²⁴ kg',
    distanceFromSunKm: 149600000,
    distanceFromSunAu: 1.000,
    orbitalPeriodDays: 365.25,
    orbitalPeriodDisplay: '365.25 Days (1 Earth Year)',
    rotationPeriodHours: 23.93,
    rotationPeriodDisplay: '23 Hours, 56 Minutes, 4 Seconds',
    gravityRelativeG: 1.00,
    meanSurfaceTempC: 15,
    minTempC: -89.2,
    maxTempC: 56.7,
    moonsCount: 1, // Luna
    atmosphere: ['Nitrogen (78.1%)', 'Oxygen (20.9%)', 'Argon (0.9%)', 'Carbon Dioxide (0.04%)'],
    ringSystem: false,
    visual: {
      color: '#38bdf8',
      accentColor: '#22c55e',
      glowColor: 'rgba(56, 189, 248, 0.5)',
      gradient: ['#bae6fd', '#38bdf8', '#0284c7', '#15803d'],
      radiusCanvas: 8,
      orbitRadiusCanvas: 88,
      orbitSpeedFactor: 1.00,
    },
    facts: [
      'Earth is the only known celestial body in the universe confirmed to harbor life and stable bodies of liquid surface water.',
      'Our powerful geomagnetic field is generated by a churning molten iron outer core, deflecting dangerous solar wind and cosmic radiation.',
    ],
    missions: [
      {
        name: 'Apollo Program',
        year: '1961–1972',
        agency: 'NASA',
        type: 'Crewed',
        significance: 'Landed 12 astronauts on Earth’s Moon (Apollo 11–17) and returned 382 kg of lunar rocks, revolutionizing planetary science.',
      },
      {
        name: 'Terra & Aqua (Earth Observing System)',
        year: '1999–Present',
        agency: 'NASA',
        type: 'Orbiter',
        significance: 'Monitors Earth’s atmosphere, land vegetation, ocean temperature, cloud dynamics, and global climate trends.',
      },
      {
        name: 'Landsat Program',
        year: '1972–Present',
        agency: 'NASA / USGS',
        type: 'Orbiter',
        significance: 'Over 50 uninterrupted years of continuous Earth land observation and environmental surface change tracking.',
      },
    ],
  },
  {
    id: 'mars',
    name: 'Mars',
    tagline: 'The Red Planet · Ancient River Valleys & Volcanoes',
    classification: 'Terrestrial Planet',
    orderFromSun: 4,
    diameterKm: 6779,
    massKg: '6.417 × 10²³ kg',
    distanceFromSunKm: 227900000,
    distanceFromSunAu: 1.524,
    orbitalPeriodDays: 687,
    orbitalPeriodDisplay: '687 Earth Days (1.88 Earth Years)',
    rotationPeriodHours: 24.62,
    rotationPeriodDisplay: '24 Hours, 37 Minutes (1 Martian Sol)',
    gravityRelativeG: 0.38,
    meanSurfaceTempC: -63,
    minTempC: -140,
    maxTempC: 20,
    moonsCount: 2, // Phobos & Deimos
    atmosphere: ['Carbon Dioxide (95.3%)', 'Nitrogen (2.6%)', 'Argon (1.9%)', 'Oxygen (0.13%)'],
    ringSystem: false,
    visual: {
      color: '#ef4444',
      accentColor: '#f97316',
      glowColor: 'rgba(239, 68, 68, 0.45)',
      gradient: ['#fca5a5', '#ef4444', '#b91c1c'],
      radiusCanvas: 5.5,
      orbitRadiusCanvas: 114,
      orbitSpeedFactor: 0.53,
    },
    facts: [
      'Mars hosts Olympus Mons, the largest volcano in the entire solar system—standing 21.9 km tall, nearly 2.5 times higher than Mount Everest.',
      'Its red rusty color comes from oxidized iron (rust) pervasive across the regolith and dust storms that can envelop the entire globe.',
    ],
    missions: [
      {
        name: 'Perseverance Rover & Ingenuity Helicopter',
        year: '2020–Present',
        agency: 'NASA',
        type: 'Rover',
        significance: 'Exploring Jezero Crater ancient river delta for biosignatures; caching rock cores; demonstrated first powered flight on another world.',
      },
      {
        name: 'Curiosity Rover (MSL)',
        year: '2011–Present',
        agency: 'NASA',
        type: 'Rover',
        significance: 'Discovered ancient persistent freshwater lakebeds with sulfur, nitrogen, oxygen, phosphorus, and organic carbon compounds.',
      },
      {
        name: 'Viking 1 & 2',
        year: '1975–1982',
        agency: 'NASA',
        type: 'Lander',
        significance: 'First successful long-duration soft landings on Mars; provided first high-resolution color surface panoramas.',
      },
    ],
  },
  {
    id: 'jupiter',
    name: 'Jupiter (Jove)',
    tagline: 'King of the Planets · Gas Giant with 95 Moons',
    classification: 'Gas Giant',
    orderFromSun: 5,
    diameterKm: 139820,
    massKg: '1.898 × 10²⁷ kg (318 Earth masses)',
    distanceFromSunKm: 778500000,
    distanceFromSunAu: 5.204,
    orbitalPeriodDays: 4333,
    orbitalPeriodDisplay: '11.86 Earth Years',
    rotationPeriodHours: 9.93,
    rotationPeriodDisplay: '9 Hours, 56 Minutes (Fastest spin in Solar System)',
    gravityRelativeG: 2.53,
    meanSurfaceTempC: -110,
    minTempC: -145,
    maxTempC: -110,
    moonsCount: 95, // Io, Europa, Ganymede, Callisto, etc.
    atmosphere: ['Hydrogen (89.8%)', 'Helium (10.2%)', 'Methane', 'Ammonia Ice Crystals'],
    ringSystem: true, // faint ring system
    visual: {
      color: '#eab308',
      accentColor: '#ca8a04',
      glowColor: 'rgba(234, 179, 8, 0.45)',
      gradient: ['#fef08a', '#eab308', '#a16207', '#78350f'],
      radiusCanvas: 16,
      orbitRadiusCanvas: 154,
      orbitSpeedFactor: 0.084,
    },
    facts: [
      'The Great Red Spot is a counter-clockwise anticyclonic storm larger than the entire planet Earth that has raged continuously for at least 350 years.',
      'Jupiter’s moon Ganymede is the largest moon in the Solar System—larger than the planet Mercury and dwarf planet Pluto.',
    ],
    missions: [
      {
        name: 'Juno',
        year: '2011–Present',
        agency: 'NASA',
        type: 'Orbiter',
        significance: 'Polar orbiter probing deep atmospheric water abundance, colossal magnetosphere, and diffuse heavy-element core.',
      },
      {
        name: 'Galileo',
        year: '1989–2003',
        agency: 'NASA',
        type: 'Orbiter',
        significance: 'First orbiter of Jupiter; detected evidence of a subsurface liquid saltwater ocean beneath Europa’s icy crust.',
      },
      {
        name: 'Europa Clipper',
        year: '2024–Present',
        agency: 'NASA Flagship',
        type: 'Flyby',
        significance: 'Carrying ice-penetrating radar to confirm habitability conditions of Europa’s vast ocean.',
      },
    ],
  },
  {
    id: 'saturn',
    name: 'Saturn (Cronus)',
    tagline: 'The Jewel of the Solar System · Majestic Ring System',
    classification: 'Gas Giant',
    orderFromSun: 6,
    diameterKm: 116460,
    massKg: '5.683 × 10²⁶ kg (95 Earth masses)',
    distanceFromSunKm: 1434000000,
    distanceFromSunAu: 9.537,
    orbitalPeriodDays: 10759,
    orbitalPeriodDisplay: '29.45 Earth Years',
    rotationPeriodHours: 10.7,
    rotationPeriodDisplay: '10 Hours, 42 Minutes',
    gravityRelativeG: 1.06,
    meanSurfaceTempC: -140,
    minTempC: -178,
    maxTempC: -130,
    moonsCount: 146, // Titan, Enceladus, Mimas, etc.
    atmosphere: ['Hydrogen (96.3%)', 'Helium (3.25%)', 'Methane', 'Ammonia'],
    ringSystem: true,
    visual: {
      color: '#fde047',
      accentColor: '#fef08a',
      glowColor: 'rgba(253, 224, 71, 0.4)',
      gradient: ['#fef9c3', '#fde047', '#ca8a04', '#854d0e'],
      radiusCanvas: 13,
      orbitRadiusCanvas: 196,
      orbitSpeedFactor: 0.034,
      hasRings: true,
      ringInnerRadius: 18,
      ringOuterRadius: 28,
      ringColor: 'rgba(253, 224, 71, 0.45)',
    },
    facts: [
      'Saturn is the only planet in the Solar System less dense than liquid water (density 0.687 g/cm³)—if you had a bathtub big enough, Saturn would float!',
      'Its spectacular rings span up to 282,000 km across, yet are paper-thin, averaging only about 10 meters thick, composed of 99% pure water ice particles.',
    ],
    missions: [
      {
        name: 'Cassini-Huygens',
        year: '1997–2017',
        agency: 'NASA / ESA / ASI',
        type: 'Orbiter / Lander',
        significance: '13-year tour of Saturn; landed Huygens probe on methane-lake moon Titan; discovered active liquid water geysers erupting from Enceladus.',
      },
      {
        name: 'Voyager 1 & 2',
        year: '1980–1981',
        agency: 'NASA',
        type: 'Flyby',
        significance: 'Provided first detailed pictures of Saturn\'s ring subdivisions, braided F-ring structure, and spoke phenomena.',
      },
      {
        name: 'Dragonfly',
        year: 'Upcoming (2028 Launch)',
        agency: 'NASA New Frontiers',
        type: 'Lander',
        significance: 'Nuclear-powered octocopter rotorcraft that will fly across dozens of sites on Titan to study prebiotic chemistry.',
      },
    ],
  },
  {
    id: 'uranus',
    name: 'Uranus (Caelus)',
    tagline: 'The Tilted Ice Giant · Retrograde Sideways Rotation',
    classification: 'Ice Giant',
    orderFromSun: 7,
    diameterKm: 50724,
    massKg: '8.681 × 10²⁵ kg (14.5 Earth masses)',
    distanceFromSunKm: 2871000000,
    distanceFromSunAu: 19.191,
    orbitalPeriodDays: 30687,
    orbitalPeriodDisplay: '84.02 Earth Years',
    rotationPeriodHours: -17.24, // retrograde
    rotationPeriodDisplay: '17 Hours, 14 Minutes (Sideways axial tilt: 97.77°)',
    gravityRelativeG: 0.89,
    meanSurfaceTempC: -195,
    minTempC: -224,
    maxTempC: -195,
    moonsCount: 28, // Titania, Oberon, Miranda, etc.
    atmosphere: ['Hydrogen (82.5%)', 'Helium (15.2%)', 'Methane (2.3% gives cyan hue)'],
    ringSystem: true,
    visual: {
      color: '#67e8f9',
      accentColor: '#22d3ee',
      glowColor: 'rgba(103, 232, 249, 0.45)',
      gradient: ['#cffafe', '#67e8f9', '#0891b2'],
      radiusCanvas: 10,
      orbitRadiusCanvas: 236,
      orbitSpeedFactor: 0.012,
      hasRings: true,
      ringInnerRadius: 13,
      ringOuterRadius: 17,
      ringColor: 'rgba(103, 232, 249, 0.3)',
    },
    facts: [
      'Uranus rotates almost completely on its side with an axial tilt of 97.8 degrees, likely the result of a cataclysmic collision with an Earth-sized protoplanet billions of years ago.',
      'Uranus holds the record for the coldest recorded atmospheric temperature of any major planet: -224.2°C.',
    ],
    missions: [
      {
        name: 'Voyager 2',
        year: '1986',
        agency: 'NASA',
        type: 'Flyby',
        significance: 'Only spacecraft to visit Uranus up close; discovered 10 new moons, 2 new rings, and mapped its uniquely offset magnetic field.',
      },
      {
        name: 'Uranus Orbiter and Probe (UOP)',
        year: 'Recommended NASA Decadal',
        agency: 'NASA',
        type: 'Orbiter',
        significance: 'Top priority NASA flagship mission slated for the 2030s to comprehensively inspect the ice giant and its icy moons.',
      },
    ],
  },
  {
    id: 'neptune',
    name: 'Neptune (Poseidon)',
    tagline: 'The Windy Deep Blue · Supersonic Cloud Storms',
    classification: 'Ice Giant',
    orderFromSun: 8,
    diameterKm: 49244,
    massKg: '1.024 × 10²⁶ kg (17.1 Earth masses)',
    distanceFromSunKm: 4495000000,
    distanceFromSunAu: 30.07,
    orbitalPeriodDays: 60190,
    orbitalPeriodDisplay: '164.79 Earth Years',
    rotationPeriodHours: 16.11,
    rotationPeriodDisplay: '16 Hours, 6 Minutes',
    gravityRelativeG: 1.14,
    meanSurfaceTempC: -200,
    minTempC: -218,
    maxTempC: -198,
    moonsCount: 16, // Triton, Proteus, Nereid, etc.
    atmosphere: ['Hydrogen (80.0%)', 'Helium (19.0%)', 'Methane (1.5% gives vivid cobalt blue)'],
    ringSystem: true,
    visual: {
      color: '#3b82f6',
      accentColor: '#1d4ed8',
      glowColor: 'rgba(59, 130, 246, 0.5)',
      gradient: ['#93c5fd', '#3b82f6', '#1e40af'],
      radiusCanvas: 9.5,
      orbitRadiusCanvas: 274,
      orbitSpeedFactor: 0.006,
    },
    facts: [
      'Neptune features the fastest winds recorded anywhere in the solar system, with high-altitude methane cirrus clouds whipping at supersonic speeds exceeding 2,100 km/h (1,300 mph).',
      'Neptune was the first planet discovered purely through mathematical predictions rather than empirical observation after astronomers noticed unexplained perturbations in Uranus’s orbit.',
    ],
    missions: [
      {
        name: 'Voyager 2',
        year: '1989',
        agency: 'NASA',
        type: 'Flyby',
        significance: 'Flew just 4,950 km above Neptune’s north pole; discovered the Great Dark Spot and geysers of liquid nitrogen spewing on retrograde moon Triton.',
      },
      {
        name: 'Hubble Space Telescope',
        year: '1990–Present',
        agency: 'NASA / ESA',
        type: 'Orbiter',
        significance: 'Monitors long-term dynamic weather systems, periodic dark spots, and high-altitude methane cloud evolution.',
      },
    ],
  },
  {
    id: 'pluto',
    name: 'Pluto (134340 Pluto)',
    tagline: 'Heart of the Kuiper Belt · Nitrogen Glaciers & Dunes',
    classification: 'Dwarf Planet',
    orderFromSun: 9,
    diameterKm: 2376,
    massKg: '1.303 × 10²² kg (0.2% of Earth)',
    distanceFromSunKm: 5906000000,
    distanceFromSunAu: 39.48,
    orbitalPeriodDays: 90560,
    orbitalPeriodDisplay: '247.9 Earth Years (Inclined 17.2°)',
    rotationPeriodHours: -153.3, // retrograde
    rotationPeriodDisplay: '6.39 Earth Days (Tidally locked with Charon)',
    gravityRelativeG: 0.063, // 6.3% of Earth
    meanSurfaceTempC: -229,
    minTempC: -240,
    maxTempC: -218,
    moonsCount: 5, // Charon, Styx, Nix, Kerberos, Hydra
    atmosphere: ['Nitrogen (99%)', 'Methane', 'Carbon Monoxide (expands at perihelion)'],
    ringSystem: false,
    visual: {
      color: '#e2e8f0',
      accentColor: '#cbd5e1',
      glowColor: 'rgba(226, 232, 240, 0.35)',
      gradient: ['#f8fafc', '#e2e8f0', '#94a3b8'],
      radiusCanvas: 3.5,
      orbitRadiusCanvas: 310,
      orbitSpeedFactor: 0.004,
    },
    facts: [
      'Pluto features a colossal heart-shaped glacier named Tombaugh Regio, whose left lobe (Sputnik Planitia) is an ocean-sized basin of actively convecting solid nitrogen ice.',
      'Pluto and its largest moon, Charon, form a "double dwarf planet system" orbiting a shared center of gravity (barycenter) that lies in the open space between them.',
    ],
    missions: [
      {
        name: 'New Horizons',
        year: '2006–Present',
        agency: 'NASA',
        type: 'Flyby',
        significance: 'Historic July 14, 2015 flyby past Pluto and Charon; transformed our understanding of Kuiper Belt worlds before journeying beyond to Arrokoth.',
      },
    ],
  },
];
