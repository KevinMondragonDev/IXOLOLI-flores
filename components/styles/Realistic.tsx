"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Sparkles, Cloud, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, DepthOfField } from "@react-three/postprocessing";
import * as THREE from "three";
import type { Flower } from "@/lib/flowers";

type Species = Flower["species"];
import { useCursor } from "../Cursor";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Thursday — Realistic 3D garden. Each flower is built procedurally with
// curved petals (Shape + extrusion), tube stems and a curved leaf, materials
// use sheen + clearcoat + slight transmission for that "lit-from-within" look.
export function Realistic({ flowers, reduceMotion }: Props) {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.6, 5.2], fov: 42 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        <color attach="background" args={["#f6d9b8"]} />
        <fog attach="fog" args={["#e9b88a", 6, 16]} />
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[3, 6, 2]}
          intensity={1.8}
          color="#ffd9a8"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
        />
        <hemisphereLight args={["#ffd5a0", "#5a3a1a", 0.45]} />

        <Ground />
        <ContactShadows position={[0, -0.49, 0]} opacity={0.55} scale={20} blur={2.4} far={4} />

        <Garden flowers={flowers} reduceMotion={reduceMotion} />
        <Sparkles count={60} scale={[12, 4, 8]} size={2.5} speed={0.25} color="#fff2c8" position={[0, 1, 0]} />
        <Cloud position={[-3, 3, -4]} opacity={0.4} segments={20} bounds={[3, 1, 1]} />
        <Cloud position={[3, 3.4, -5]} opacity={0.35} segments={20} bounds={[3, 1, 1]} />

        <EffectComposer>
          <Bloom intensity={0.55} luminanceThreshold={0.45} luminanceSmoothing={0.4} mipmapBlur />
          <DepthOfField focusDistance={0.013} focalLength={0.05} bokehScale={3.5} />
          <Vignette eskil={false} offset={0.18} darkness={0.6} />
        </EffectComposer>

        <CameraDance reduceMotion={reduceMotion} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI * 0.32}
          maxPolarAngle={Math.PI * 0.52}
          rotateSpeed={0.25}
        />
      </Canvas>
    </div>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[60, 60, 1, 1]} />
      <meshStandardMaterial color="#7a5d3c" roughness={1} />
    </mesh>
  );
}

function Garden({ flowers, reduceMotion }: { flowers: Flower[]; reduceMotion: boolean }) {
  const placed = useMemo(() => {
    return flowers.map((f) => {
      const x = (f.x - 0.5) * 9;
      const z = (f.y - 0.5) * 6 - 0.2;
      const y = -0.5;
      return { f, position: [x, y, z] as [number, number, number] };
    });
  }, [flowers]);

  return (
    <group>
      {placed.map(({ f, position }) => (
        <Float
          key={f.id}
          speed={reduceMotion ? 0 : 1 + (f.id % 5) * 0.1}
          rotationIntensity={reduceMotion ? 0 : 0.12}
          floatIntensity={reduceMotion ? 0 : 0.18}
        >
          <RealisticFlower
            position={position}
            scale={0.55 + f.scale * 0.45}
            hue={f.hue}
            species={f.species}
            seed={f.id}
          />
        </Float>
      ))}
    </group>
  );
}

// Build a cupped petal geometry: a curved sheet with a teardrop outline.
function buildPetalGeometry(width: number, height: number, curl: number) {
  const shape = new THREE.Shape();
  // outline: teardrop using bezier
  shape.moveTo(0, 0);
  shape.bezierCurveTo(width * 0.6, height * 0.05, width * 0.55, height * 0.55, width * 0.18, height * 0.95);
  shape.bezierCurveTo(width * 0.08, height * 1.0, -width * 0.08, height * 1.0, -width * 0.18, height * 0.95);
  shape.bezierCurveTo(-width * 0.55, height * 0.55, -width * 0.6, height * 0.05, 0, 0);
  const geom = new THREE.ShapeGeometry(shape, 28);
  // Cup the petal by displacing vertices outward as y grows
  const pos = geom.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // displace z so the petal bows outward (positive z) at the tip
    const t = Math.min(1, y / height);
    const z = Math.sin(t * Math.PI) * curl * (1 - Math.abs(x) / width);
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

// Leaf shape extruded
function buildLeafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.4, 0.05, 0.45, 0.35, 0.18, 0.7);
  s.bezierCurveTo(0.08, 0.78, -0.08, 0.78, -0.18, 0.7);
  s.bezierCurveTo(-0.45, 0.35, -0.4, 0.05, 0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.005, bevelEnabled: false, curveSegments: 24 });
  g.computeVertexNormals();
  return g;
}
let LEAF_GEOM: THREE.ExtrudeGeometry | null = null;
function getLeafGeom() {
  if (!LEAF_GEOM) LEAF_GEOM = buildLeafGeometry();
  return LEAF_GEOM;
}

// Tube stem from a slightly wavy curve
function buildStemGeometry(height: number, sway: number) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(sway * 0.3, height * 0.3, sway * 0.2),
    new THREE.Vector3(-sway * 0.2, height * 0.6, -sway * 0.3),
    new THREE.Vector3(0, height, 0),
  ]);
  return new THREE.TubeGeometry(curve, 32, 0.025, 8, false);
}

// Per-species visual parameters
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
};

function speciesStyle(species: Species): SpeciesStyle {
  switch (species) {
    case "rose":
      return {
        petalCount: 14,
        petalRings: [
          { count: 6, tilt: -1.3, scale: 1, yLift: 0 },
          { count: 5, tilt: -1.05, scale: 0.78, yLift: 0.03 },
          { count: 3, tilt: -0.8, scale: 0.55, yLift: 0.06 },
        ],
        petalSize: { w: 0.18, h: 0.32, curl: 0.12 },
        hueShift: 0,
        saturation: 78,
        lightness: 52,
        centerSize: 0.04,
        centerColor: "#5a1027",
        hasCenter: false,
      };
    case "tulip":
      return {
        petalCount: 6,
        petalRings: [{ count: 6, tilt: -1.2, scale: 1, yLift: 0 }],
        petalSize: { w: 0.18, h: 0.46, curl: 0.16 },
        hueShift: 0,
        saturation: 80,
        lightness: 60,
        centerSize: 0.05,
        centerColor: "#3a230f",
        hasCenter: true,
      };
    case "lily":
      return {
        petalCount: 6,
        petalRings: [{ count: 6, tilt: -1.0, scale: 1.1, yLift: 0 }],
        petalSize: { w: 0.16, h: 0.5, curl: 0.18 },
        hueShift: 0,
        saturation: 70,
        lightness: 72,
        centerSize: 0.04,
        centerColor: "#b5803a",
        hasCenter: true,
      };
    case "poppy":
      return {
        petalCount: 4,
        petalRings: [{ count: 4, tilt: -1.1, scale: 1.15, yLift: 0 }],
        petalSize: { w: 0.28, h: 0.4, curl: 0.14 },
        hueShift: 0,
        saturation: 85,
        lightness: 55,
        centerSize: 0.08,
        centerColor: "#1a1208",
        hasCenter: true,
      };
    case "daisy":
      return {
        petalCount: 14,
        petalRings: [{ count: 14, tilt: -0.9, scale: 1, yLift: 0 }],
        petalSize: { w: 0.08, h: 0.4, curl: 0.06 },
        hueShift: 0,
        saturation: 18,
        lightness: 94,
        centerSize: 0.1,
        centerColor: "#e2a829",
        hasCenter: true,
      };
    case "lavender":
      return {
        petalCount: 0, // spike of small florets handled separately
        petalRings: [],
        petalSize: { w: 0.06, h: 0.1, curl: 0.04 },
        hueShift: 0,
        saturation: 55,
        lightness: 58,
        centerSize: 0,
        centerColor: "#5a3a8a",
        hasCenter: false,
      };
    case "sunflower":
    default:
      return {
        petalCount: 18,
        petalRings: [
          { count: 14, tilt: -1.0, scale: 1, yLift: 0 },
          { count: 10, tilt: -0.85, scale: 0.72, yLift: 0.02 },
        ],
        petalSize: { w: 0.11, h: 0.42, curl: 0.1 },
        hueShift: 0,
        saturation: 90,
        lightness: 58,
        centerSize: 0.12,
        centerColor: "#3a1f08",
        hasCenter: true,
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
    const t = state.clock.elapsedTime + seed * 0.13;
    headRef.current.rotation.x = -0.15 + Math.sin(t * 0.6) * 0.04 + cursor.y * 0.18;
    headRef.current.rotation.y = Math.sin(t * 0.4) * 0.08 + cursor.x * 0.35;
  });

  const petalMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(`hsl(${(hue + style.hueShift) % 360}, ${style.saturation}%, ${style.lightness}%)`),
        roughness: 0.45,
        metalness: 0,
        sheen: 1,
        sheenRoughness: 0.7,
        sheenColor: new THREE.Color(`hsl(${(hue + 30) % 360}, 90%, 80%)`),
        clearcoat: 0.15,
        clearcoatRoughness: 0.6,
        transmission: 0.18,
        thickness: 0.4,
        ior: 1.35,
        side: THREE.DoubleSide,
      }),
    [hue, style]
  );

  const stemMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(`hsl(${(hue + 90) % 360}, 40%, 28%)`),
        roughness: 0.85,
      }),
    [hue]
  );

  const leafMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(`hsl(${(hue + 100) % 360}, 50%, 32%)`),
        roughness: 0.7,
        sheen: 0.6,
        sheenColor: new THREE.Color("#a8d68c"),
        side: THREE.DoubleSide,
      }),
    [hue]
  );

  const centerMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: style.centerColor, roughness: 0.9 }),
    [style]
  );

  const stemGeom = useMemo(() => buildStemGeometry(1.3, (seed % 7) * 0.05 - 0.15), [seed]);
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
        position={[0.04, 0.55, 0.02]}
        rotation={[Math.PI / 2.4, 0, -0.6]}
        scale={0.7}
      />
      {/* head */}
      <group ref={headRef} position={[0, 1.32, 0]}>
        {species === "lavender" ? (
          <LavenderSpike hue={hue} />
        ) : (
          <>
            {style.petalRings.map((ring, ri) => (
              <group key={ri} position={[0, ring.yLift, 0]}>
                {Array.from({ length: ring.count }).map((_, i) => {
                  const ang = (i / ring.count) * Math.PI * 2 + ri * 0.2;
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
              <mesh material={centerMat} castShadow position={[0, 0.02, 0]}>
                <sphereGeometry args={[style.centerSize, 32, 24]} />
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
    for (let i = 0; i < 14; i++) {
      arr.push({
        y: i * 0.05,
        x: (i % 2 === 0 ? -1 : 1) * 0.03,
        s: 0.04 + (i % 3) * 0.008,
      });
    }
    return arr;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(`hsl(${hue}, 55%, 55%)`),
        roughness: 0.5,
        sheen: 0.8,
        sheenColor: new THREE.Color(`hsl(${hue}, 80%, 70%)`),
      }),
    [hue]
  );
  return (
    <group>
      {florets.map((f, i) => (
        <mesh key={i} material={mat} position={[f.x, f.y, 0]} castShadow>
          <sphereGeometry args={[f.s, 12, 8]} />
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
    const targetX = cursor.x * 1.5;
    const targetY = 1.6 + cursor.y * -0.5;
    cam.position.x += (targetX - cam.position.x) * 0.04;
    cam.position.y += (targetY - cam.position.y) * 0.04;
    cam.lookAt(0, 0.8, 0);
  });
  return null;
}
