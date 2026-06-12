"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Sparkles, Cloud, ContactShadows, Environment, useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, DepthOfField, SSAO } from "@react-three/postprocessing";
import * as THREE from "three";
import type { Flower } from "@/lib/flowers";

type Species = Flower["species"];
import { useCursor } from "../Cursor";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Thursday — Realistic 3D garden. Enhanced PBR materials with advanced lighting,
// subsurface scattering simulation, and refined procedural geometries to approach
// the visual quality of high-quality GLTF models.
export function Realistic({ flowers, reduceMotion }: Props) {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.8, 5.5], fov: 40 }}
        gl={{ 
          antialias: true, 
          alpha: false, 
          toneMapping: THREE.ACESFilmicToneMapping, 
          toneMappingExposure: 1.2,
          outputColorSpace: THREE.SRGBColorSpace
        }}
      >
        <color attach="background" args={["#f5e6d4"]} />
        <fog attach="fog" args={["#e8d4c0", 5, 18]} />
        
        {/* Enhanced lighting setup */}
        <ambientLight intensity={0.4} color="#fff8f0" />
        <directionalLight
          position={[4, 8, 3]}
          intensity={2.2}
          color="#ffe8c8"
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-bias={-0.0001}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <directionalLight
          position={[-3, 4, -2]}
          intensity={0.6}
          color="#d8e8ff"
        />
        <hemisphereLight args={["#ffe4c4", "#4a3020", 0.5]} />
        
        {/* Environment for realistic reflections */}
        <Environment preset="sunset" background={false} />

        <Ground />
        <ContactShadows position={[0, -0.49, 0]} opacity={0.6} scale={24} blur={2.8} far={5} color="#3a2818" />

        <Garden flowers={flowers} reduceMotion={reduceMotion} />
        <Sparkles count={80} scale={[14, 5, 10]} size={2} speed={0.3} color="#fff8e8" position={[0, 1.2, 0]} opacity={0.7} />
        <Cloud position={[-4, 3.5, -5]} opacity={0.35} segments={24} bounds={[4, 1.2, 1]} color="#fff8f0" />
        <Cloud position={[4, 4, -6]} opacity={0.3} segments={24} bounds={[4, 1.2, 1]} color="#fff8f0" />

        <EffectComposer>
          <Bloom intensity={0.4} luminanceThreshold={0.5} luminanceSmoothing={0.3} mipmapBlur />
          <DepthOfField focusDistance={0.012} focalLength={0.05} bokehScale={4} />
          <SSAO samples={32} radius={0.3} intensity={0.8} bias={0.001} worldDistanceThreshold={1.0} worldDistanceFalloff={0.5} worldProximityThreshold={0.2} worldProximityFalloff={0.3} />
          <Vignette eskil={false} offset={0.15} darkness={0.55} />
        </EffectComposer>

        <CameraDance reduceMotion={reduceMotion} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI * 0.3}
          maxPolarAngle={Math.PI * 0.55}
          rotateSpeed={0.2}
        />
      </Canvas>
    </div>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[80, 80, 64, 64]} />
      <meshStandardMaterial 
        color="#8a6d4c" 
        roughness={0.95}
        metalness={0}
      />
    </mesh>
  );
}

function Garden({ flowers, reduceMotion }: { flowers: Flower[]; reduceMotion: boolean }) {
  const placed = useMemo(() => {
    return flowers.map((f) => {
      const x = (f.x - 0.5) * 10;
      const z = (f.y - 0.5) * 7 - 0.3;
      const y = -0.5;
      return { f, position: [x, y, z] as [number, number, number] };
    });
  }, [flowers]);

  return (
    <group>
      {placed.map(({ f, position }) => (
        <Float
          key={f.id}
          speed={reduceMotion ? 0 : 0.8 + (f.id % 7) * 0.12}
          rotationIntensity={reduceMotion ? 0 : 0.1}
          floatIntensity={reduceMotion ? 0 : 0.15}
        >
          <RealisticFlower
            position={position}
            scale={0.5 + f.scale * 0.5}
            hue={f.hue}
            species={f.species}
            seed={f.id}
          />
        </Float>
      ))}
    </group>
  );
}

// Enhanced petal geometry with more natural curvature
function buildPetalGeometry(width: number, height: number, curl: number) {
  const shape = new THREE.Shape();
  // More organic teardrop outline
  shape.moveTo(0, 0);
  shape.bezierCurveTo(width * 0.55, height * 0.08, width * 0.5, height * 0.5, width * 0.2, height * 0.92);
  shape.bezierCurveTo(width * 0.05, height * 1.0, -width * 0.05, height * 1.0, -width * 0.2, height * 0.92);
  shape.bezierCurveTo(-width * 0.5, height * 0.5, -width * 0.55, height * 0.08, 0, 0);
  const geom = new THREE.ShapeGeometry(shape, 32);
  
  // Enhanced cupping with subtle wave
  const pos = geom.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const t = Math.min(1, y / height);
    // More complex curvature for natural petal shape
    const z = Math.sin(t * Math.PI * 0.8) * curl * (1 - Math.abs(x) / width) * (1 + t * 0.3);
    pos.setZ(i, z);
  }
  geom.computeVertexNormals();
  return geom;
}

const PETAL_GEOM_CACHE = new Map<string, THREE.BufferGeometry>();
function getPetalGeom(width: number, height: number, curl: number) {
  const key = `${width.toFixed(2)}|${height.toFixed(2)}|${curl.toFixed(2)}`;
  let g = PETAL_GEOM_CACHE.get(key);
  if (!g) {
    g = buildPetalGeometry(width, height, curl);
    PETAL_GEOM_CACHE.set(key, g);
  }
  return g;
}

// Enhanced leaf with vein-like detail
function buildLeafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.35, 0.08, 0.4, 0.38, 0.15, 0.72);
  s.bezierCurveTo(0.05, 0.8, -0.05, 0.8, -0.15, 0.72);
  s.bezierCurveTo(-0.4, 0.38, -0.35, 0.08, 0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false, curveSegments: 32 });
  g.computeVertexNormals();
  return g;
}
let LEAF_GEOM: THREE.ExtrudeGeometry | null = null;
function getLeafGeom() {
  if (!LEAF_GEOM) LEAF_GEOM = buildLeafGeometry();
  return LEAF_GEOM;
}

// More natural stem curve
function buildStemGeometry(height: number, sway: number) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(sway * 0.25, height * 0.25, sway * 0.15),
    new THREE.Vector3(-sway * 0.15, height * 0.55, -sway * 0.2),
    new THREE.Vector3(sway * 0.05, height * 0.8, sway * 0.1),
    new THREE.Vector3(0, height, 0),
  ]);
  return new THREE.TubeGeometry(curve, 48, 0.022, 12, false);
}

// Enhanced species-specific parameters
type SpeciesStyle = {
  petalCount: number;
  petalRings: { count: number; tilt: number; scale: number; yLift: number }[];
  petalSize: { w: number; h: number; curl: number };
  hueShift: number;
  saturation: number;
  lightness: number;
  centerSize: number;
  centerColor: string;
  hasCenter: boolean;
  subsurface: number;
};

function speciesStyle(species: Species): SpeciesStyle {
  switch (species) {
    case "rose":
      return {
        petalCount: 16,
        petalRings: [
          { count: 7, tilt: -1.35, scale: 1, yLift: 0 },
          { count: 6, tilt: -1.1, scale: 0.8, yLift: 0.025 },
          { count: 3, tilt: -0.85, scale: 0.55, yLift: 0.05 },
        ],
        petalSize: { w: 0.2, h: 0.35, curl: 0.14 },
        hueShift: 0,
        saturation: 75,
        lightness: 50,
        centerSize: 0.045,
        centerColor: "#4a0d1f",
        hasCenter: false,
        subsurface: 0.8,
      };
    case "tulip":
      return {
        petalCount: 6,
        petalRings: [{ count: 6, tilt: -1.25, scale: 1, yLift: 0 }],
        petalSize: { w: 0.2, h: 0.5, curl: 0.18 },
        hueShift: 0,
        saturation: 78,
        lightness: 58,
        centerSize: 0.055,
        centerColor: "#2a1a0a",
        hasCenter: true,
        subsurface: 0.6,
      };
    case "lily":
      return {
        petalCount: 6,
        petalRings: [{ count: 6, tilt: -1.05, scale: 1.15, yLift: 0 }],
        petalSize: { w: 0.18, h: 0.55, curl: 0.2 },
        hueShift: 0,
        saturation: 68,
        lightness: 70,
        centerSize: 0.045,
        centerColor: "#a07030",
        hasCenter: true,
        subsurface: 0.7,
      };
    case "poppy":
      return {
        petalCount: 4,
        petalRings: [{ count: 4, tilt: -1.15, scale: 1.2, yLift: 0 }],
        petalSize: { w: 0.3, h: 0.42, curl: 0.16 },
        hueShift: 0,
        saturation: 82,
        lightness: 52,
        centerSize: 0.09,
        centerColor: "#120e08",
        hasCenter: true,
        subsurface: 0.9,
      };
    case "daisy":
      return {
        petalCount: 16,
        petalRings: [{ count: 16, tilt: -0.95, scale: 1, yLift: 0 }],
        petalSize: { w: 0.09, h: 0.42, curl: 0.08 },
        hueShift: 0,
        saturation: 15,
        lightness: 92,
        centerSize: 0.11,
        centerColor: "#d49820",
        hasCenter: true,
        subsurface: 0.4,
      };
    case "lavender":
      return {
        petalCount: 0,
        petalRings: [],
        petalSize: { w: 0.07, h: 0.12, curl: 0.05 },
        hueShift: 0,
        saturation: 52,
        lightness: 56,
        centerSize: 0,
        centerColor: "#4a2a6a",
        hasCenter: false,
        subsurface: 0.5,
      };
    case "sunflower":
    default:
      return {
        petalCount: 20,
        petalRings: [
          { count: 16, tilt: -1.05, scale: 1, yLift: 0 },
          { count: 12, tilt: -0.9, scale: 0.75, yLift: 0.018 },
        ],
        petalSize: { w: 0.12, h: 0.45, curl: 0.12 },
        hueShift: 0,
        saturation: 88,
        lightness: 56,
        centerSize: 0.13,
        centerColor: "#2a1808",
        hasCenter: true,
        subsurface: 0.5,
      };
  }
}

function RealisticFlower({
  position,
  scale,
  hue,
  species,
  seed,
}: {
  position: [number, number, number];
  scale: number;
  hue: number;
  species: Species;
  seed: number;
}) {
  const headRef = useRef<THREE.Group>(null);
  const cursor = useCursor();
  const style = useMemo(() => speciesStyle(species), [species]);

  useFrame((state) => {
    if (!headRef.current) return;
    const t = state.clock.elapsedTime + seed * 0.15;
    headRef.current.rotation.x = -0.12 + Math.sin(t * 0.5) * 0.035 + cursor.y * 0.15;
    headRef.current.rotation.y = Math.sin(t * 0.35) * 0.07 + cursor.x * 0.3;
  });

  // Enhanced PBR material with subsurface scattering simulation
  const petalMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(`hsl(${(hue + style.hueShift) % 360}, ${style.saturation}%, ${style.lightness}%)`),
        roughness: 0.4,
        metalness: 0,
        sheen: 1,
        sheenRoughness: 0.65,
        sheenColor: new THREE.Color(`hsl(${(hue + 25) % 360}, 85%, 82%)`),
        clearcoat: 0.2,
        clearcoatRoughness: 0.55,
        transmission: style.subsurface * 0.25,
        thickness: 0.5,
        ior: 1.4,
        side: THREE.DoubleSide,
        envMapIntensity: 1.2,
      }),
    [hue, style]
  );

  const stemMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(`hsl(${(hue + 85) % 360}, 38%, 26%)`),
        roughness: 0.9,
        metalness: 0,
      }),
    [hue]
  );

  const leafMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(`hsl(${(hue + 95) % 360}, 48%, 30%)`),
        roughness: 0.65,
        metalness: 0,
        sheen: 0.7,
        sheenRoughness: 0.8,
        sheenColor: new THREE.Color("#98c878"),
        side: THREE.DoubleSide,
        transmission: 0.15,
        thickness: 0.3,
      }),
    [hue]
  );

  const centerMat = useMemo(
    () => new THREE.MeshStandardMaterial({ 
      color: style.centerColor, 
      roughness: 0.85,
      metalness: 0.1
    }),
    [style]
  );

  const stemGeom = useMemo(() => buildStemGeometry(1.35, (seed % 9) * 0.06 - 0.2), [seed]);
  const leafGeom = useMemo(() => getLeafGeom(), []);
  const petalGeom = useMemo(
    () => getPetalGeom(style.petalSize.w, style.petalSize.h, style.petalSize.curl),
    [style]
  );

  return (
    <group position={position} scale={scale}>
      {/* stem */}
      <mesh geometry={stemGeom} material={stemMat} castShadow position={[0, 0, 0]} />
      {/* leaf */}
      <mesh
        geometry={leafGeom}
        material={leafMat}
        castShadow
        position={[0.045, 0.58, 0.025]}
        rotation={[Math.PI / 2.5, 0, -0.55]}
        scale={0.72}
      />
      {/* head */}
      <group ref={headRef} position={[0, 1.38, 0]}>
        {species === "lavender" ? (
          <LavenderSpike hue={hue} />
        ) : (
          <>
            {style.petalRings.map((ring, ri) => (
              <group key={ri} position={[0, ring.yLift, 0]}>
                {Array.from({ length: ring.count }).map((_, i) => {
                  const ang = (i / ring.count) * Math.PI * 2 + ri * 0.18;
                  return (
                    <mesh
                      key={i}
                      geometry={petalGeom}
                      material={petalMat}
                      castShadow
                      rotation={[ring.tilt, ang, 0]}
                      scale={ring.scale}
                    />
                  );
                })}
              </group>
            ))}
            {style.hasCenter && (
              <mesh material={centerMat} castShadow position={[0, 0.025, 0]}>
                <sphereGeometry args={[style.centerSize, 36, 28]} />
              </mesh>
            )}
          </>
        )}
      </group>
    </group>
  );
}

function LavenderSpike({ hue }: { hue: number }) {
  const florets = useMemo(() => {
    const arr: { y: number; x: number; s: number }[] = [];
    for (let i = 0; i < 16; i++) {
      arr.push({
        y: i * 0.048,
        x: (i % 2 === 0 ? -1 : 1) * 0.028,
        s: 0.045 + (i % 3) * 0.009,
      });
    }
    return arr;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(`hsl(${hue}, 52%, 54%)`),
        roughness: 0.45,
        metalness: 0,
        sheen: 0.85,
        sheenRoughness: 0.7,
        sheenColor: new THREE.Color(`hsl(${hue}, 75%, 68%)`),
        transmission: 0.2,
        thickness: 0.35,
      }),
    [hue]
  );
  return (
    <group>
      {florets.map((f, i) => (
        <mesh key={i} material={mat} position={[f.x, f.y, 0]} castShadow>
          <sphereGeometry args={[f.s, 16, 12]} />
        </mesh>
      ))}
    </group>
  );
}

function CameraDance({ reduceMotion }: { reduceMotion: boolean }) {
  const cursor = useCursor();
  useFrame((state) => {
    if (reduceMotion) return;
    const cam = state.camera;
    const targetX = cursor.x * 1.4;
    const targetY = 1.8 + cursor.y * -0.45;
    cam.position.x += (targetX - cam.position.x) * 0.035;
    cam.position.y += (targetY - cam.position.y) * 0.035;
    cam.lookAt(0, 0.85, 0);
  });
  return null;
}
