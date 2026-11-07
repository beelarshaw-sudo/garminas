"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows } from "@react-three/drei";
import { useMemo, useRef, Suspense } from "react";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";

/**
 * GarMinas cinematic 3D hero.
 * Two golden wedding rings that slowly rotate and gently come together,
 * surrounded by champagne-coloured particles and floating rose petals.
 *
 * Honors prefers-reduced-motion: when reduced, the scene is rendered
 * statically (no per-frame animation) and particles are dropped.
 */

function GoldRing({
  position,
  rotationSpeed,
  floatIntensity,
  reduced,
}: {
  position: [number, number, number];
  rotationSpeed: number;
  floatIntensity: number;
  reduced: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const targetX = position[0];

  useFrame((state) => {
    if (!ref.current) return;
    if (!reduced) {
      ref.current.rotation.y += rotationSpeed;
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
      // Drift toward the centre (x → ~0.7) — they come together over the first
      // 8 seconds, then gently oscillate.
      const t = Math.min(1, state.clock.elapsedTime / 8);
      const baseX = targetX * (1 - t * 0.6);
      ref.current.position.x =
        baseX + Math.sin(state.clock.elapsedTime * 0.5 + targetX) * 0.05;
      ref.current.position.y =
        position[1] +
        Math.sin(state.clock.elapsedTime * 0.4 + targetX) * 0.1 * floatIntensity;
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh castShadow receiveShadow>
        {/* TorusGeometry: radius=1, tube=0.12 */}
        <torusGeometry args={[1, 0.12, 24, 96]} />
        <meshStandardMaterial
          color="#D6B77A"
          metalness={1}
          roughness={0.18}
          emissive="#7a5a1f"
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* Subtle inner highlight band */}
      <mesh>
        <torusGeometry args={[1, 0.04, 16, 96]} />
        <meshStandardMaterial
          color="#F3E2B0"
          metalness={1}
          roughness={0.1}
          emissive="#caa64b"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

function Particles({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = reduced ? 0 : 220;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current || reduced) return;
    const positions = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += 0.005 + (i % 5) * 0.001;
      if (positions[i * 3 + 1] > 5) positions[i * 3 + 1] = -5;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  if (count === 0) return null;
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#E8D9B5"
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function Petals({ reduced }: { reduced: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const count = reduced ? 0 : 18;
  const petals = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        position: [
          (Math.random() - 0.5) * 14,
          Math.random() * 8 - 4,
          (Math.random() - 0.5) * 6,
        ] as [number, number, number],
        rotation: [
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI,
        ] as [number, number, number],
        speed: 0.3 + Math.random() * 0.6,
        size: 0.18 + Math.random() * 0.1,
      })),
    [count]
  );

  useFrame((state) => {
    if (!groupRef.current || reduced) return;
    groupRef.current.children.forEach((child, i) => {
      const p = petals[i];
      child.position.y -= p.speed * 0.01;
      child.position.x += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.002;
      child.rotation.z += 0.005;
      if (child.position.y < -5) child.position.y = 5;
    });
  });

  if (count === 0) return null;
  return (
    <group ref={groupRef}>
      {petals.map((p, i) => (
        <mesh key={i} position={p.position} rotation={p.rotation}>
          <planeGeometry args={[p.size, p.size * 0.6]} />
          <meshStandardMaterial
            color="#C88F91"
            transparent
            opacity={0.7}
            roughness={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ reduced }: { reduced: boolean }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        color="#FFF4D6"
        castShadow
      />
      <pointLight position={[-5, 2, -3]} intensity={0.6} color="#D6B77A" />
      <spotLight
        position={[0, 6, 4]}
        angle={0.6}
        penumbra={0.8}
        intensity={1.4}
        color="#FAF7F0"
      />

      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}>
        <group scale={0.85} position={[0, 0, 0]}>
          <GoldRing
            position={[-1.2, 0, 0]}
            rotationSpeed={0.004}
            floatIntensity={0.6}
            reduced={reduced}
          />
          <GoldRing
            position={[1.2, 0, 0]}
            rotationSpeed={-0.004}
            floatIntensity={0.6}
            reduced={reduced}
          />
        </group>
      </Float>

      <Particles reduced={reduced} />
      <Petals reduced={reduced} />

      <ContactShadows
        position={[0, -1.6, 0]}
        opacity={0.35}
        scale={10}
        blur={3}
        color="#1a1a2e"
      />
      <Environment preset="sunset" />
    </>
  );
}

export default function Hero3D({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <div className={className} aria-hidden={reduced ? true : undefined}>
      <Canvas
        shadows
        dpr={[1, 1.8]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 7], fov: 50 }}
      >
        <Suspense fallback={null}>
          <Scene reduced={!!reduced} />
        </Suspense>
      </Canvas>
    </div>
  );
}
