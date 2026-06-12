"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Sparkles } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, DepthOfField } from "@react-three/postprocessing";
import * as THREE from "three";
import type { Flower } from "@/lib/flowers";
import { useCursor } from "../Cursor";

type Props = { flowers: Flower[]; ink: string; reduceMotion: boolean };

// Thursday — Realistic 3D garden with bloom + depth of field.
export function Realistic({ flowers, reduceMotion }: Props) {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.4, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#f3c98a"]} />
        <fog attach="fog" args={["#e7b894", 6, 14]} />
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[3, 5, 2]}
          intensity={1.6}
          color="#ffd9a8"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <hemisphereLight args={["#ffd5a0", "#5a3a1a", 0.5]} />

        <Ground />
        <Garden flowers={flowers} reduceMotion={reduceMotion} />
        <Sparkles count={80} scale={[10, 4, 8]} size={2} speed={0.3} color="#fff2c8" position={[0, 1, 0]} />

        <EffectComposer>
          <Bloom intensity={0.6} luminanceThreshold={0.4} luminanceSmoothing={0.4} mipmapBlur />
          <DepthOfField focusDistance={0.012} focalLength={0.04} bokehScale={3} />
          <Vignette eskil={false} offset={0.15} darkness={0.6} />
        </EffectComposer>

        <CameraDance reduceMotion={reduceMotion} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI * 0.35}
          maxPolarAngle={Math.PI * 0.5}
          rotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshStandardMaterial color="#6f5a3e" roughness={1} />
    </mesh>
  );
}

function Garden({ flowers, reduceMotion }: { flowers: Flower[]; reduceMotion: boolean }) {
  // Map 2D field positions to a 3D garden patch
  const placed = useMemo(() => {
    return flowers.map((f) => {
      const x = (f.x - 0.5) * 8;
      const z = (f.y - 0.5) * 5 - 0.5;
      const y = -0.5 + f.scale * 0.2;
      return { f, position: [x, y, z] as [number, number, number] };
    });
  }, [flowers]);

  return (
    <group>
      {placed.map(({ f, position }) => (
        <Float
          key={f.id}
          speed={reduceMotion ? 0 : 1.2 + (f.id % 5) * 0.1}
          rotationIntensity={reduceMotion ? 0 : 0.15}
          floatIntensity={reduceMotion ? 0 : 0.25}
        >
          <Sunflower3D position={position} scale={0.5 + f.scale * 0.35} hue={f.hue} seed={f.id} />
        </Float>
      ))}
    </group>
  );
}

function Sunflower3D({
  position,
  scale,
  hue,
  seed,
}: {
  position: [number, number, number];
  scale: number;
  hue: number;
  seed: number;
}) {
  const headRef = useRef<THREE.Group>(null);
  const cursor = useCursor();

  useFrame((state) => {
    if (!headRef.current) return;
    const t = state.clock.elapsedTime + seed * 0.13;
    headRef.current.rotation.x = -0.1 + Math.sin(t * 0.6) * 0.05 + cursor.y * 0.2;
    headRef.current.rotation.y = Math.sin(t * 0.4) * 0.1 + cursor.x * 0.4;
  });

  const petalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(`hsl(${hue}, 80%, 60%)`),
        roughness: 0.5,
        metalness: 0.05,
        side: THREE.DoubleSide,
      }),
    [hue]
  );

  const stemMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: new THREE.Color(`hsl(${(hue + 90) % 360}, 35%, 32%)`), roughness: 1 }),
    [hue]
  );

  const coreMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#3a230f", roughness: 0.9 }),
    []
  );

  const petals = useMemo(() => {
    const count = 14;
    const arr: { rot: number }[] = [];
    for (let i = 0; i < count; i++) arr.push({ rot: (i / count) * Math.PI * 2 });
    return arr;
  }, []);

  return (
    <group position={position} scale={scale}>
      {/* stem */}
      <mesh material={stemMat} position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.05, 1.2, 8]} />
      </mesh>
      {/* leaf */}
      <mesh material={stemMat} position={[0.18, 0.5, 0]} rotation={[0, 0, -0.6]} castShadow>
        <sphereGeometry args={[0.18, 16, 8]} />
      </mesh>
      {/* head */}
      <group ref={headRef} position={[0, 1.2, 0]}>
        {petals.map((p, i) => (
          <mesh
            key={i}
            material={petalMat}
            rotation={[Math.PI / 2 - 0.25, 0, p.rot]}
            position={[Math.cos(p.rot) * 0.28, 0, Math.sin(p.rot) * 0.28]}
            castShadow
          >
            <coneGeometry args={[0.1, 0.45, 12]} />
          </mesh>
        ))}
        <mesh material={coreMat} castShadow>
          <sphereGeometry args={[0.18, 24, 24]} />
        </mesh>
      </group>
    </group>
  );
}

function CameraDance({ reduceMotion }: { reduceMotion: boolean }) {
  const cursor = useCursor();
  useFrame((state) => {
    if (reduceMotion) return;
    const cam = state.camera;
    const targetX = cursor.x * 1.5;
    const targetY = 1.4 + cursor.y * -0.5;
    cam.position.x += (targetX - cam.position.x) * 0.04;
    cam.position.y += (targetY - cam.position.y) * 0.04;
    cam.lookAt(0, 0.6, 0);
  });
  return null;
}
