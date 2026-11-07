import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import confetti from 'canvas-confetti';
import {
  Dna,
  Atom,
  ShieldAlert,
  Zap,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Sliders,
  Send,
  CheckCircle2,
  AlertTriangle,
  Play,
  Flame,
  Award,
  Layers,
  Info,
} from 'lucide-react';
import { bioSimulationService } from '../services/bioSimulationService.ts';
import { Bio3dSceneConfig, BioModelType, BioGameState } from '../types/bioscience.ts';

interface BioLab3dGameProps {
  onNavigateToChatWithPrompt?: (prompt: string) => void;
}

interface FloatingPopup {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

export function BioLab3dGame({ onNavigateToChatWithPrompt }: BioLab3dGameProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // Simulation & Game State
  const [config, setConfig] = useState<Bio3dSceneConfig>(bioSimulationService.getConfig());
  const [gameState, setGameState] = useState<BioGameState>(bioSimulationService.getGameState());
  const [remainingMutations, setRemainingMutations] = useState<number>(0);
  const [totalMutationsInScene, setTotalMutationsInScene] = useState<number>(0);
  const [floatingPopups, setFloatingPopups] = useState<FloatingPopup[]>([]);
  const [aiPromptInput, setAiPromptInput] = useState<string>('');
  const [showControlsDrawer, setShowControlsDrawer] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const structureGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const interactiveNodesRef = useRef<THREE.Mesh[]>([]);
  const pulseRingsRef = useRef<THREE.Mesh[]>([]);

  // Subscribe to central simulation updates
  useEffect(() => {
    const unsubConfig = bioSimulationService.subscribeConfig((newCfg) => {
      setConfig(newCfg);
    });
    const unsubGame = bioSimulationService.subscribeGameState((newGame) => {
      setGameState(newGame);
    });
    return () => {
      unsubConfig();
      unsubGame();
    };
  }, []);

  // -------------------------------------------------------------
  // PROCEDURAL 3D BIOLOGICAL MODEL BUILDERS
  // -------------------------------------------------------------

  const buildDnaHelix = useCallback(
    (group: THREE.Group, mutationLevel: number, primaryHex: string) => {
      const turns = 4;
      const pointsPerTurn = 24;
      const totalSteps = turns * pointsPerTurn;
      const radius = 2.4;
      const height = 14;
      const stepHeight = height / totalSteps;

      const baseColors = [
        0x06b6d4, // Adenine (Cyan)
        0x3b82f6, // Thymine (Blue)
        0xec4899, // Guanine (Pink)
        0xf59e0b, // Cytosine (Amber)
      ];

      const strand1Mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(primaryHex),
        emissive: new THREE.Color(primaryHex).multiplyScalar(0.4),
        roughness: 0.25,
        metalness: 0.6,
      });

      const strand2Mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#38bdf8'),
        emissive: new THREE.Color('#0284c7').multiplyScalar(0.4),
        roughness: 0.25,
        metalness: 0.6,
      });

      const beadGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const rungGeo = new THREE.CylinderGeometry(0.08, 0.08, 1, 12);
      const mutatedGeo = new THREE.SphereGeometry(0.38, 20, 20);

      // Mutated indices calculation based on mutation level
      const targetMutations = Math.max(1, Math.round(totalSteps * 0.15 * Math.max(0.2, mutationLevel)));
      const mutatedIndices = new Set<number>();
      for (let i = 0; i < targetMutations; i++) {
        const step = Math.floor(Math.random() * (totalSteps - 4)) + 2;
        mutatedIndices.add(step);
      }

      let mutatedCount = 0;

      for (let i = 0; i < totalSteps; i++) {
        const angle = (i / pointsPerTurn) * Math.PI * 2;
        const y = -height / 2 + i * stepHeight;

        const x1 = Math.cos(angle) * radius;
        const z1 = Math.sin(angle) * radius;

        const x2 = Math.cos(angle + Math.PI) * radius;
        const z2 = Math.sin(angle + Math.PI) * radius;

        const isMutated = mutatedIndices.has(i);

        if (isMutated) {
          mutatedCount++;
          // Red glowing mutated node
          const mutMat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: 0xdc2626,
            emissiveIntensity: 2.2,
            roughness: 0.2,
            metalness: 0.8,
          });
          const mutNode = new THREE.Mesh(mutatedGeo, mutMat);
          mutNode.position.set(x1, y, z1);
          mutNode.userData = {
            isMutated: true,
            id: `dna_mut_${i}`,
            originalScale: 1,
            healthyColor: primaryHex,
          };
          group.add(mutNode);
          interactiveNodesRef.current.push(mutNode);
        } else {
          // Healthy strand 1 bead
          const bead1 = new THREE.Mesh(beadGeo, strand1Mat);
          bead1.position.set(x1, y, z1);
          group.add(bead1);
        }

        // Healthy strand 2 bead
        const bead2 = new THREE.Mesh(beadGeo, strand2Mat);
        bead2.position.set(x2, y, z2);
        group.add(bead2);

        // Base-pair bridge rung every 2 steps
        if (i % 2 === 0) {
          const rungColor = isMutated ? 0xff0044 : baseColors[i % baseColors.length];
          const rungMat = new THREE.MeshStandardMaterial({
            color: rungColor,
            emissive: rungColor,
            emissiveIntensity: isMutated ? 1.5 : 0.25,
            roughness: 0.3,
          });

          const rung = new THREE.Mesh(rungGeo, rungMat);
          const p1 = new THREE.Vector3(x1, y, z1);
          const p2 = new THREE.Vector3(x2, y, z2);
          const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
          rung.position.copy(mid);

          rung.scale.set(1, p1.distanceTo(p2), 1);
          rung.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3().subVectors(p2, p1).normalize()
          );

          if (isMutated) {
            rung.userData = { isMutatedBridge: true };
          }
          group.add(rung);
        }
      }

      return mutatedCount;
    },
    []
  );

  const buildCellNucleus = useCallback(
    (group: THREE.Group, mutationLevel: number, primaryHex: string) => {
      // 1. Semi-transparent glowing nuclear envelope
      const envGeo = new THREE.SphereGeometry(3.6, 32, 32);
      const envMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(primaryHex),
        transparent: true,
        opacity: 0.35,
        roughness: 0.2,
        transmission: 0.8,
        thickness: 0.5,
        wireframe: false,
      });
      const envelope = new THREE.Mesh(envGeo, envMat);
      group.add(envelope);

      // Wireframe overlay for cyber sci-fi feel
      const wireMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(primaryHex),
        wireframe: true,
        transparent: true,
        opacity: 0.25,
      });
      const wireMesh = new THREE.Mesh(envGeo, wireMat);
      group.add(wireMesh);

      // 2. Inner dense nucleolus core
      const coreGeo = new THREE.SphereGeometry(1.4, 24, 24);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        emissive: 0x7c3aed,
        emissiveIntensity: 1.2,
        roughness: 0.3,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      // 3. Chromatin loops & nuclear pore complexes
      const poreGeo = new THREE.TorusGeometry(0.2, 0.05, 8, 16);
      const poreMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        roughness: 0.4,
      });

      for (let i = 0; i < 28; i++) {
        const phi = Math.acos(-1 + (2 * i) / 28);
        const theta = Math.sqrt(28 * Math.PI) * phi;
        const x = 3.6 * Math.cos(theta) * Math.sin(phi);
        const y = 3.6 * Math.sin(theta) * Math.sin(phi);
        const z = 3.6 * Math.cos(phi);

        const pore = new THREE.Mesh(poreGeo, poreMat);
        pore.position.set(x, y, z);
        pore.lookAt(0, 0, 0);
        group.add(pore);
      }

      // 4. Mutated Chromatin Aggregates
      const targetMutations = Math.max(2, Math.round(8 * Math.max(0.3, mutationLevel)));
      const mutGeo = new THREE.SphereGeometry(0.42, 16, 16);

      for (let i = 0; i < targetMutations; i++) {
        const angle = (i / targetMutations) * Math.PI * 2;
        const rad = 2.2 + (i % 2) * 0.7;
        const mx = Math.cos(angle) * rad;
        const my = (Math.sin(i * 3) * 1.5);
        const mz = Math.sin(angle) * rad;

        const mutMat = new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xdc2626,
          emissiveIntensity: 2.4,
          roughness: 0.2,
          metalness: 0.8,
        });

        const mutNode = new THREE.Mesh(mutGeo, mutMat);
        mutNode.position.set(mx, my, mz);
        mutNode.userData = {
          isMutated: true,
          id: `nucleus_mut_${i}`,
          originalScale: 1,
          healthyColor: primaryHex,
        };
        group.add(mutNode);
        interactiveNodesRef.current.push(mutNode);
      }

      return targetMutations;
    },
    []
  );

  const buildVirusCapsid = useCallback(
    (group: THREE.Group, mutationLevel: number, primaryHex: string) => {
      // 1. Icosahedral Capsid Shell
      const icosaGeo = new THREE.IcosahedronGeometry(3.0, 1);
      const icosaMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(primaryHex),
        emissive: new THREE.Color(primaryHex).multiplyScalar(0.3),
        roughness: 0.35,
        metalness: 0.7,
        flatShading: true,
      });
      const capsid = new THREE.Mesh(icosaGeo, icosaMat);
      group.add(capsid);

      // Wireframe cage
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.4,
      });
      const wire = new THREE.Mesh(icosaGeo, wireMat);
      group.add(wire);

      // 2. Glycoprotein Spike Trimers on Vertices
      const posAttr = icosaGeo.attributes.position;
      const vertexMap = new Map<string, THREE.Vector3>();

      for (let i = 0; i < posAttr.count; i++) {
        const v = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        const key = `${v.x.toFixed(2)}_${v.y.toFixed(2)}_${v.z.toFixed(2)}`;
        if (!vertexMap.has(key)) {
          vertexMap.set(key, v);
        }
      }

      const vertices = Array.from(vertexMap.values());
      const spikeStemGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.2, 8);
      const spikeHeadGeo = new THREE.ConeGeometry(0.32, 0.6, 6);

      const targetMutations = Math.max(2, Math.round(vertices.length * 0.35 * Math.max(0.3, mutationLevel)));
      const mutatedIndices = new Set<number>();
      while (mutatedIndices.size < targetMutations) {
        mutatedIndices.add(Math.floor(Math.random() * vertices.length));
      }

      let mutatedCount = 0;

      vertices.forEach((v, idx) => {
        const isMutated = mutatedIndices.has(idx);
        const spikeGroup = new THREE.Group();

        const dir = v.clone().normalize();
        const spikeHeadColor = isMutated ? 0xff1e56 : 0x10b981;

        const stemMat = new THREE.MeshStandardMaterial({
          color: isMutated ? 0xef4444 : 0x0284c7,
          roughness: 0.4,
        });

        const headMat = new THREE.MeshStandardMaterial({
          color: spikeHeadColor,
          emissive: spikeHeadColor,
          emissiveIntensity: isMutated ? 2.5 : 0.6,
          roughness: 0.2,
        });

        const stem = new THREE.Mesh(spikeStemGeo, stemMat);
        stem.position.y = 0.6;
        spikeGroup.add(stem);

        const head = new THREE.Mesh(spikeHeadGeo, headMat);
        head.position.y = 1.3;
        spikeGroup.add(head);

        // Position on capsid surface pointing radially outwards
        spikeGroup.position.copy(v);
        spikeGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

        if (isMutated) {
          mutatedCount++;
          head.userData = {
            isMutated: true,
            id: `spike_mut_${idx}`,
            originalScale: 1,
            healthyColor: '#10b981',
          };
          interactiveNodesRef.current.push(head);
        }

        group.add(spikeGroup);
      });

      return mutatedCount;
    },
    []
  );

  const buildProteinFold = useCallback(
    (group: THREE.Group, mutationLevel: number, primaryHex: string) => {
      // Generate 3D continuous alpha-helix & beta-strand polypeptide chain
      const curvePoints: THREE.Vector3[] = [];
      const numPoints = 80;

      for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * Math.PI * 6;
        // Supercoiled protein fold path
        const x = Math.sin(t) * 3 + Math.sin(t * 2) * 1.2;
        const y = (i / numPoints) * 10 - 5;
        const z = Math.cos(t) * 3 + Math.cos(t * 3) * 0.8;
        curvePoints.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(curve, 100, 0.22, 12, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(primaryHex),
        emissive: new THREE.Color(primaryHex).multiplyScalar(0.3),
        roughness: 0.3,
        metalness: 0.5,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      group.add(tube);

      // Add residue side-chain spheres along the fold
      const residueGeo = new THREE.SphereGeometry(0.32, 16, 16);
      const targetMutations = Math.max(2, Math.round(20 * 0.4 * Math.max(0.3, mutationLevel)));
      const mutatedSteps = new Set<number>();
      while (mutatedSteps.size < targetMutations) {
        mutatedSteps.add(Math.floor(Math.random() * 20));
      }

      let mutatedCount = 0;

      for (let i = 0; i < 20; i++) {
        const t = (i + 0.5) / 20;
        const pt = curve.getPointAt(t);
        const isMutated = mutatedSteps.has(i);

        if (isMutated) {
          mutatedCount++;
          const mutMat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: 0xdc2626,
            emissiveIntensity: 2.2,
            roughness: 0.2,
            metalness: 0.8,
          });
          const resMesh = new THREE.Mesh(residueGeo, mutMat);
          resMesh.position.copy(pt);
          resMesh.userData = {
            isMutated: true,
            id: `protein_mut_${i}`,
            originalScale: 1,
            healthyColor: primaryHex,
          };
          group.add(resMesh);
          interactiveNodesRef.current.push(resMesh);
        } else {
          const resMat = new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x0284c7,
            emissiveIntensity: 0.4,
            roughness: 0.4,
          });
          const resMesh = new THREE.Mesh(residueGeo, resMat);
          resMesh.position.copy(pt);
          group.add(resMesh);
        }
      }

      return mutatedCount;
    },
    []
  );

  // -------------------------------------------------------------
  // REBUILD THREE.JS SCENE ON CONFIG CHANGE
  // -------------------------------------------------------------
  const rebuildScene = useCallback(() => {
    if (!structureGroupRef.current) return;

    // Clear old children and interactive refs
    while (structureGroupRef.current.children.length > 0) {
      const child = structureGroupRef.current.children[0] as any;
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m: any) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      structureGroupRef.current.remove(child);
    }

    interactiveNodesRef.current = [];

    let count = 0;
    const group = structureGroupRef.current;

    switch (config.modelType) {
      case 'CELL_NUCLEUS':
        count = buildCellNucleus(group, config.mutationLevel, config.primaryColor);
        break;
      case 'VIRUS_CAPSID':
        count = buildVirusCapsid(group, config.mutationLevel, config.primaryColor);
        break;
      case 'PROTEIN_FOLD':
        count = buildProteinFold(group, config.mutationLevel, config.primaryColor);
        break;
      case 'DNA_HELIX':
      default:
        count = buildDnaHelix(group, config.mutationLevel, config.primaryColor);
        break;
    }

    setRemainingMutations(count);
    setTotalMutationsInScene(count);
    bioSimulationService.resetMissions(count);
  }, [config, buildDnaHelix, buildCellNucleus, buildVirusCapsid, buildProteinFold]);

  // Initial Three.js setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x020617, 0.025);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 3, 16);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 35;
    controls.minDistance = 4;
    controlsRef.current = controls;

    // 5. Lighting
    const ambLight = new THREE.AmbientLight(0x1e293b, 1.5);
    scene.add(ambLight);

    const cyanPoint = new THREE.PointLight(0x06b6d4, 3, 40);
    cyanPoint.position.set(10, 10, 10);
    scene.add(cyanPoint);

    const magentaPoint = new THREE.PointLight(0xec4899, 2.5, 40);
    magentaPoint.position.set(-10, -10, -10);
    scene.add(magentaPoint);

    const topDir = new THREE.DirectionalLight(0xffffff, 1.2);
    topDir.position.set(0, 15, 5);
    scene.add(topDir);

    // 6. Deep Bio-Fluid Floating Particle Field
    const particleCount = 700;
    const partGeo = new THREE.BufferGeometry();
    const partPositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      partPositions[i] = (Math.random() - 0.5) * 50;
      partPositions[i + 1] = (Math.random() - 0.5) * 50;
      partPositions[i + 2] = (Math.random() - 0.5) * 50;
    }

    partGeo.setAttribute('position', new THREE.BufferAttribute(partPositions, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.18,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    // 7. Biological Structure Group
    const structureGroup = new THREE.Group();
    scene.add(structureGroup);
    structureGroupRef.current = structureGroup;

    // Initial build
    rebuildScene();

    // 8. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Rotate model smoothly based on config speed
      if (structureGroupRef.current) {
        const speed = config.rotationSpeed || 1.0;
        structureGroupRef.current.rotation.y += 0.25 * speed * delta;
        structureGroupRef.current.rotation.x = Math.sin(elapsedTime * 0.3) * 0.12;
      }

      // Slowly drift background particles
      particles.rotation.y += 0.02 * delta;

      // Pulse Mutated Nodes
      interactiveNodesRef.current.forEach((node) => {
        if (node.userData.isMutated) {
          const pulse = 1 + Math.sin(elapsedTime * 6 + node.position.y) * 0.22;
          node.scale.set(pulse, pulse, pulse);
        }
      });

      // Animate CRISPR shockwave rings
      for (let i = pulseRingsRef.current.length - 1; i >= 0; i--) {
        const ring = pulseRingsRef.current[i];
        ring.scale.multiplyScalar(1.08);
        (ring.material as THREE.Material).opacity -= 0.04;
        if ((ring.material as THREE.Material).opacity <= 0.02) {
          scene.remove(ring);
          ring.geometry.dispose();
          (ring.material as THREE.Material).dispose();
          pulseRingsRef.current.splice(i, 1);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handler
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
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // Re-build model when config modelType or mutationLevel or primaryColor changes
  useEffect(() => {
    rebuildScene();
  }, [config.modelType, config.mutationLevel, config.primaryColor, rebuildScene]);

  // -------------------------------------------------------------
  // RAYCASTING & CRISPR REPAIR INTERACTION
  // -------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = mountRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
    const y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(interactiveNodesRef.current, false);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object as THREE.Mesh;
      if (hitObj.userData.isMutated) {
        // Execute CRISPR repair!
        hitObj.userData.isMutated = false;

        // Change color to healthy green/cyan
        const healthyColor = new THREE.Color(0x10b981);
        (hitObj.material as THREE.MeshStandardMaterial).color.copy(healthyColor);
        (hitObj.material as THREE.MeshStandardMaterial).emissive.copy(healthyColor);
        (hitObj.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0;
        hitObj.scale.set(1, 1, 1);

        // Spawn CRISPR laser expansion shockwave ring
        const ringGeo = new THREE.RingGeometry(0.3, 0.45, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x10b981,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(intersects[0].point);
        ringMesh.lookAt(cameraRef.current.position);
        sceneRef.current.add(ringMesh);
        pulseRingsRef.current.push(ringMesh);

        // Update score & counts
        const newRemaining = remainingMutations - 1;
        setRemainingMutations(Math.max(0, newRemaining));
        bioSimulationService.recordRepair(newRemaining);

        // Spawn floating XP text popup
        const newPopup: FloatingPopup = {
          id: Date.now() + Math.random(),
          text: `+100 CRISPR REPAIR!`,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          color: '#10b981',
        };
        setFloatingPopups((prev) => [...prev, newPopup]);
        setTimeout(() => {
          setFloatingPopups((prev) => prev.filter((p) => p.id !== newPopup.id));
        }, 1200);

        // If completed all mutations
        if (newRemaining <= 0) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#06b6d4', '#10b981', '#38bdf8', '#a855f7'],
          });
        }
      }
    }
  };

  const handleManualRepairAll = () => {
    interactiveNodesRef.current.forEach((node) => {
      if (node.userData.isMutated) {
        node.userData.isMutated = false;
        const healthyColor = new THREE.Color(0x10b981);
        (node.material as THREE.MeshStandardMaterial).color.copy(healthyColor);
        (node.material as THREE.MeshStandardMaterial).emissive.copy(healthyColor);
        (node.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0;
        node.scale.set(1, 1, 1);
      }
    });
    setRemainingMutations(0);
    bioSimulationService.recordRepair(0);
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
    });
  };

  const handleResetChallenge = () => {
    rebuildScene();
  };

  const handleSendPromptToAi = (promptToSend: string) => {
    if (onNavigateToChatWithPrompt) {
      onNavigateToChatWithPrompt(promptToSend);
    }
  };

  // Integrity Percentage
  const integrity =
    totalMutationsInScene > 0
      ? Math.round(((totalMutationsInScene - remainingMutations) / totalMutationsInScene) * 100)
      : 100;

  return (
    <div className="relative w-full h-[calc(100dvh-120px)] sm:h-[calc(100dvh-100px)] overflow-hidden rounded-3xl border border-cyan-500/30 bg-[#020617] shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        className="w-full h-full cursor-grab active:cursor-grabbing relative"
      />

      {/* Floating XP Score Popups */}
      {floatingPopups.map((popup) => (
        <div
          key={popup.id}
          className="absolute pointer-events-none font-mono font-black text-sm animate-bounce"
          style={{
            left: `${popup.x}px`,
            top: `${popup.y - 20}px`,
            color: popup.color,
            textShadow: '0 0 12px rgba(16, 185, 129, 0.8)',
          }}
        >
          {popup.text}
        </div>
      ))}

      {/* Top Floating Sci-Fi HUD Status Bar */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Model Type & Live Challenge Mission Card */}
        <div className="pointer-events-auto max-w-md bg-[#040e24]/90 border border-cyan-500/40 rounded-2xl p-3 backdrop-blur-md shadow-xl text-white">
          <div className="flex items-center justify-between gap-2 border-b border-cyan-500/20 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                <Dna className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs tracking-wider text-cyan-300 uppercase">
                {config.modelType.replace('_', ' ')} · 3D BIO-LAB
              </span>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                remainingMutations === 0
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-red-500/20 border-red-400 text-red-300 animate-pulse'
              }`}
            >
              {remainingMutations === 0 ? '✓ STABILIZED' : `⚠️ ${remainingMutations} MUTATIONS`}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-snug line-clamp-2">
            {gameState.activeChallenge || config.gameChallenge}
          </p>

          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Click red nodes to CRISPR repair</span>
            <span className="text-cyan-400 font-bold">Orbit & Zoom Active</span>
          </div>
        </div>

        {/* Right: Live Score & Biological Integrity HUD */}
        <div className="pointer-events-auto flex items-center gap-2 bg-[#040e24]/90 border border-cyan-500/40 rounded-2xl p-2.5 backdrop-blur-md shadow-xl text-white">
          <div className="text-right px-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">SCORE (XP)</div>
            <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-400 font-mono">
              {gameState.score.toLocaleString()}
            </div>
          </div>

          <div className="h-8 w-px bg-cyan-500/30" />

          <div className="px-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">INTEGRITY</div>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${integrity}%` }}
                />
              </div>
              <span className="font-mono text-xs font-bold text-emerald-300">{integrity}%</span>
            </div>
          </div>

          {gameState.combo > 1 && (
            <div className="px-2 py-1 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-300 text-[11px] font-black flex items-center gap-1 animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{gameState.combo}x COMBO!</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Control Bar */}
      <div className="absolute bottom-3 left-3 right-3 pointer-events-none flex flex-col gap-2">
        {/* Expandable Model & Parameter Controls */}
        {showControlsDrawer && (
          <div className="pointer-events-auto bg-[#040e24]/95 border border-cyan-500/30 rounded-2xl p-3 backdrop-blur-md shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-white">
            {/* Model Switcher */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-semibold mr-1">Structure:</span>
              {(['DNA_HELIX', 'CELL_NUCLEUS', 'VIRUS_CAPSID', 'PROTEIN_FOLD'] as BioModelType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    bioSimulationService.updateConfig({
                      modelType: type,
                      gameChallenge:
                        type === 'DNA_HELIX'
                          ? 'DNA Double Helix: Identify and repair base-pair lesion mutations!'
                          : type === 'CELL_NUCLEUS'
                          ? 'Cell Nucleus: Clear mutated chromatin aggregates causing transcription arrest!'
                          : type === 'VIRUS_CAPSID'
                          ? 'Retrovirus Capsid: Neutralize rogue spike glycoprotein trimers with targeted enzymes!'
                          : 'Protein Fold: Correct aberrant hydrophobic misfolding in the beta-sheet loop!',
                    });
                  }}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    config.modelType === type
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'border border-cyan-500/20 bg-slate-900/60 text-slate-300 hover:border-cyan-400 hover:text-white'
                  }`}
                >
                  {type === 'DNA_HELIX' && <Dna className="w-3.5 h-3.5" />}
                  {type === 'CELL_NUCLEUS' && <Atom className="w-3.5 h-3.5" />}
                  {type === 'VIRUS_CAPSID' && <ShieldAlert className="w-3.5 h-3.5" />}
                  {type === 'PROTEIN_FOLD' && <Layers className="w-3.5 h-3.5" />}
                  <span>{type.replace('_', ' ')}</span>
                </button>
              ))}
            </div>

            {/* Sliders & Tools */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Mutation slider */}
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400">Mutations:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={config.mutationLevel}
                  onChange={(e) => {
                    bioSimulationService.updateConfig({
                      mutationLevel: parseFloat(e.target.value),
                    });
                  }}
                  className="w-16 accent-red-400 cursor-pointer"
                />
                <span className="font-mono text-[10px] text-red-300">
                  {Math.round(config.mutationLevel * 100)}%
                </span>
              </div>

              {/* Rotation speed slider */}
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400">Spin:</span>
                <input
                  type="range"
                  min="0.2"
                  max="4.0"
                  step="0.2"
                  value={config.rotationSpeed}
                  onChange={(e) => {
                    bioSimulationService.updateConfig({
                      rotationSpeed: parseFloat(e.target.value),
                    });
                  }}
                  className="w-16 accent-cyan-400 cursor-pointer"
                />
                <span className="font-mono text-[10px] text-cyan-300">{config.rotationSpeed}x</span>
              </div>

              {/* Action buttons */}
              <button
                type="button"
                onClick={handleManualRepairAll}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30 transition flex items-center gap-1 font-semibold text-xs"
                title="Auto-repair all mutations"
              >
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Auto-CRISPR</span>
              </button>

              <button
                type="button"
                onClick={handleResetChallenge}
                className="p-1.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition"
                title="Respawn mutations"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Bioscience AI Prompts Bar */}
        <div className="pointer-events-auto flex items-center justify-between gap-2 p-2 rounded-2xl bg-[#040e24]/90 border border-cyan-500/30 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 text-xs">
            <span className="text-cyan-400 font-bold text-[11px] whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Ask AI Specialist:
            </span>
            <button
              onClick={() =>
                handleSendPromptToAi(
                  'Explain CRISPR-Cas9 base editing on this DNA double helix, identify the mutated codons, and set a new 3D puzzle challenge!'
                )
              }
              className="px-2.5 py-1 rounded-xl bg-blue-950/60 hover:bg-blue-900 border border-cyan-500/30 text-cyan-200 hover:text-white whitespace-nowrap transition text-[11px]"
            >
              🧬 CRISPR DNA Challenge
            </button>
            <button
              onClick={() =>
                handleSendPromptToAi(
                  'Simulate a Retrovirus Capsid mutation scenario with spike glycoproteins and formulate an interactive game challenge.'
                )
              }
              className="px-2.5 py-1 rounded-xl bg-blue-950/60 hover:bg-blue-900 border border-cyan-500/30 text-cyan-200 hover:text-white whitespace-nowrap transition text-[11px]"
            >
              🦠 Retrovirus Capsid
            </button>
            <button
              onClick={() =>
                handleSendPromptToAi(
                  'Analyze abnormal protein folding (alpha-helix vs beta-sheet misfolding) and generate a diagnostic repair simulation.'
                )
              }
              className="px-2.5 py-1 rounded-xl bg-blue-950/60 hover:bg-blue-900 border border-cyan-500/30 text-cyan-200 hover:text-white whitespace-nowrap transition text-[11px]"
            >
              🧪 Protein Folding
            </button>
          </div>

          <button
            onClick={() => setShowControlsDrawer((prev) => !prev)}
            className="p-1.5 rounded-xl border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition shrink-0"
            title="Toggle Control Drawer"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
