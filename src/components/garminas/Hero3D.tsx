"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  Sparkles,
  Float,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef, Suspense, useState, useEffect } from "react";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";

/**
 * GarMinas cinematic 3D hero — luxury jewellery-commercial aesthetic.
 *
 * Layers (all rendered with bloom post-processing for the gold glow):
 *   1. Two golden wedding rings that drift toward each other and interlock
 *      with a gentle pulse + a connecting light beam.
 *   2. A heart-shaped particle formation that breathes softly.
 *   3. A stream of champagne bubbles rising upward.
 *   4. Sparkle star field drifting around the rings.
 *   5. Floating rose petals.
 *   6. Slow cinematic camera drift.
 *
 * Performance:
 *   - Honors prefers-reduced-motion (renders statically, drops particles)
 *   - Detects low-power devices (touch + small viewport) and reduces counts
 *   - DPR clamped to [1, 1.5] for mobile, [1, 2] for desktop
 *   - Geometry is instanced where possible
 */

// ─── Golden wedding rings ────────────────────────────────────────────────

function GoldRing({
  position,
  rotationSpeed,
  floatIntensity,
  reduced,
  connectTarget,
}: {
  position: [number, number, number];
  rotationSpeed: number;
  floatIntensity: number;
  reduced: boolean;
  connectTarget: number; // x position the ring drifts toward
}) {
  const ref = useRef<THREE.Group>(null);
  const initialX = position[0];

  useFrame((state) => {
    if (!ref.current) return;
    if (!reduced) {
      // Rotate
      ref.current.rotation.y += rotationSpeed;
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.04;

      // Drift toward center over first 6 seconds, then gently oscillate
      const t = Math.min(1, state.clock.elapsedTime / 6);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const baseX = initialX + (connectTarget - initialX) * eased;
      ref.current.position.x =
        baseX + Math.sin(state.clock.elapsedTime * 0.5 + initialX) * 0.04;
      ref.current.position.y =
        position[1] +
        Math.sin(state.clock.elapsedTime * 0.4 + initialX) * 0.1 * floatIntensity;
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* Main ring */}
      <mesh castShadow receiveShadow>
        <torusGeometry args={[1, 0.13, 32, 128]} />
        <meshStandardMaterial
          color="#D6B77A"
          metalness={1}
          roughness={0.15}
          emissive="#7a5a1f"
          emissiveIntensity={0.25}
        />
      </mesh>
      {/* Inner highlight band for extra shine */}
      <mesh>
        <torusGeometry args={[1, 0.045, 24, 128]} />
        <meshStandardMaterial
          color="#F8E7B0"
          metalness={1}
          roughness={0.08}
          emissive="#d4a83a"
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Diamond accent on the ring */}
      <mesh position={[0, 1.13, 0]} rotation={[Math.PI / 4, 0, Math.PI / 4]}>
        <octahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial
          color="#FFFFFF"
          metalness={0.3}
          roughness={0.05}
          emissive="#FFFFFF"
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
}

// ─── Heart formation made of particles ────────────────────────────────────

function HeartFormation({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = reduced ? 0 : 220;

  const positions = useMemo(() => {
    if (count === 0) return new Float32Array(0);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Parametric heart curve (scaled to be visually prominent)
      const t = (i / count) * Math.PI * 2;
      const scale = 0.12;
      const x = scale * 16 * Math.pow(Math.sin(t), 3);
      const y =
        scale *
        (13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t));
      // Distribute across the heart surface (add some depth + edge jitter)
      const depth = (Math.random() - 0.5) * 0.4;
      arr[i * 3] = x + (Math.random() - 0.5) * 0.08;
      arr[i * 3 + 1] = y + (Math.random() - 0.5) * 0.08;
      arr[i * 3 + 2] = depth;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current || reduced) return;
    // Gentle breathing pulse
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
    ref.current.scale.set(pulse, pulse, pulse);
    // Slow rotation
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
  });

  if (count === 0) return null;
  return (
    <points ref={ref} position={[0, -1.8, -0.8]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        color="#C88F91"
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Champagne bubble stream ──────────────────────────────────────────────

function ChampagneBubbles({ reduced, mobile }: { reduced: boolean; mobile: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = reduced ? 0 : mobile ? 60 : 140;

  const initial = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10 - 2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, [count]);

  const speeds = useMemo(() => {
    const arr = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      arr[i] = 0.008 + Math.random() * 0.02;
    }
    return arr;
  }, [count]);

  useFrame(() => {
    if (!ref.current || reduced) return;
    const positions = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += speeds[i];
      positions[i * 3] += Math.sin(i + positions[i * 3 + 1]) * 0.002;
      if (positions[i * 3 + 1] > 5) {
        positions[i * 3 + 1] = -5;
        positions[i * 3] = (Math.random() - 0.5) * 14;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  if (count === 0) return null;
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[initial, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={mobile ? 0.06 : 0.08}
        color="#E8D9B5"
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Floating rose petals ─────────────────────────────────────────────────

function Petals({ reduced, mobile }: { reduced: boolean; mobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const count = reduced ? 0 : mobile ? 8 : 16;
  const petals = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        position: [
          (Math.random() - 0.5) * 12,
          Math.random() * 8 - 4,
          (Math.random() - 0.5) * 5,
        ] as [number, number, number],
        rotation: [
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI,
        ] as [number, number, number],
        speed: 0.25 + Math.random() * 0.5,
        size: 0.16 + Math.random() * 0.1,
        sway: Math.random() * Math.PI * 2,
      })),
    [count]
  );

  useFrame((state) => {
    if (!groupRef.current || reduced) return;
    groupRef.current.children.forEach((child, i) => {
      const p = petals[i];
      if (!p) return;
      child.position.y -= p.speed * 0.008;
      child.position.x += Math.sin(state.clock.elapsedTime * 0.5 + p.sway) * 0.0015;
      child.rotation.z += 0.004;
      child.rotation.x += 0.002;
      if (child.position.y < -5) {
        child.position.y = 5;
        child.position.x = (Math.random() - 0.5) * 12;
      }
    });
  });

  if (count === 0) return null;
  return (
    <group ref={groupRef}>
      {petals.map((p, i) => (
        <mesh key={i} position={p.position} rotation={p.rotation}>
          <planeGeometry args={[p.size, p.size * 0.65]} />
          <meshStandardMaterial
            color="#C88F91"
            transparent
            opacity={0.65}
            roughness={0.6}
            side={THREE.DoubleSide}
            emissive="#C88F91"
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Connecting light beam between the rings ──────────────────────────────

function ConnectingBeam({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current || reduced) return;
    // Pulse the beam intensity
    const pulse = 0.4 + Math.sin(state.clock.elapsedTime * 1.5) * 0.3;
    (ref.current.material as THREE.MeshBasicMaterial).opacity = pulse;
  });
  return (
    <mesh ref={ref} position={[0, -1.8, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.025, 0.025, 1.8, 8]} />
      <meshBasicMaterial
        color="#D6B77A"
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Slow cinematic camera drift ──────────────────────────────────────────

function CameraDrift({ reduced }: { reduced: boolean }) {
  const { camera } = useThree();
  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime;
    const x = Math.sin(t * 0.1) * 0.6;
    const y = 0.3 + Math.sin(t * 0.15) * 0.3;
    camera.position.set(x, y, camera.position.z);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

// ─── Scene ────────────────────────────────────────────────────────────────

function Scene({ reduced, mobile }: { reduced: boolean; mobile: boolean }) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.4}
        color="#FFF4D6"
        castShadow
      />
      <pointLight position={[-5, 2, -3]} intensity={0.8} color="#D6B77A" />
      <spotLight
        position={[0, 6, 4]}
        angle={0.7}
        penumbra={0.9}
        intensity={1.6}
        color="#FAF7F0"
      />
      <pointLight position={[0, -2, 3]} intensity={0.4} color="#C88F91" />

      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
        <group position={[0, -1.8, 0]}>
          <GoldRing
            position={[-2.0, 0, 0]}
            rotationSpeed={0.005}
            floatIntensity={0.6}
            reduced={reduced}
            connectTarget={-0.5}
          />
          <GoldRing
            position={[2.0, 0, 0]}
            rotationSpeed={-0.005}
            floatIntensity={0.6}
            reduced={reduced}
            connectTarget={0.5}
          />
        </group>
      </Float>

      <ConnectingBeam reduced={reduced} />
      <HeartFormation reduced={reduced} />
      <ChampagneBubbles reduced={reduced} mobile={mobile} />
      <Petals reduced={reduced} mobile={mobile} />

      {/* drei Sparkles for an extra constellation of twinkling gold */}
      {!reduced && (
        <Sparkles
          count={mobile ? 30 : 60}
          scale={[12, 8, 6]}
          position={[0, 0, 0]}
          size={mobile ? 2 : 3}
          speed={0.3}
          opacity={0.7}
          color="#E8D9B5"
        />
      )}

      <ContactShadows
        position={[0, -3.2, 0]}
        opacity={0.35}
        scale={10}
        blur={3}
        color="#1a1a2e"
      />
      <Environment preset="sunset" />

      <CameraDrift reduced={reduced} />
    </>
  );
}

// ─── Device detection hook ────────────────────────────────────────────────

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const touch = window.matchMedia("(pointer: coarse)").matches;
      setMobile(w < 768 || touch);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

// ─── Exported component ───────────────────────────────────────────────────

export default function Hero3D({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  return (
    <div className={className} aria-hidden={reduced ? true : undefined}>
      <Canvas
        shadows
        dpr={mobile ? [1, 1.5] : [1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: mobile ? "default" : "high-performance",
        }}
        camera={{ position: [0, 0.3, 7], fov: 50 }}
      >
        <Suspense fallback={null}>
          <Scene reduced={!!reduced} mobile={mobile} />
          {/* Post-processing: bloom for the gold glow + vignette for cinematic feel.
              Skipped on mobile + reduced-motion for performance. */}
          {!reduced && !mobile && (
            <EffectComposer>
              <Bloom
                intensity={0.7}
                luminanceThreshold={0.35}
                luminanceSmoothing={0.6}
                mipmapBlur
              />
              <Vignette eskil={false} offset={0.2} darkness={0.5} />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
