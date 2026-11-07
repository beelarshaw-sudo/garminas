"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * GarMinas Cinematic Hero — "Two Souls, One Journey"
 *
 * A vanilla Three.js scene (no React Three Fiber) for minimal memory footprint.
 *
 * Scene composition:
 *   - Architectural corridor of ivory/sandstone arches receding into fog
 *   - Fluted columns lining the corridor
 *   - Volumetric sunlight beams from above
 *   - Atmospheric fog for depth
 *   - Two abstract human figures constructed entirely from luminous particles
 *   - A 4-phase cinematic animation sequence (~22s) that loops seamlessly:
 *       Phase 1: Two distant figures at opposite ends
 *       Phase 2: Figures drift toward center, leaving golden trails
 *       Phase 3: Trails intertwine, champagne glow spreads
 *       Phase 4: Figures stand together, circular light composition, camera pulls back
 *
 * Performance:
 *   - Adaptive particle counts (desktop vs mobile)
 *   - DPR clamped to [1, 1.75]
 *   - No shadow maps (expensive)
 *   - Reuses geometry/material instances
 *   - Proper disposal on unmount (no WebGL memory leaks)
 *   - Reduced-motion: renders a static frame
 *   - WebGL unavailable: parent shows CSS fallback
 */

interface FigureConfig {
  particleCount: number;
  startX: number;
  endX: number;
  color: THREE.Color;
}

export function CinematicHero3D({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ─── Environment checks ─────────────────────────────────────────────
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // WebGL availability check
    let webglOk = false;
    try {
      const testCanvas = document.createElement("canvas");
      webglOk = !!(
        testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl")
      );
    } catch {
      webglOk = false;
    }
    if (!webglOk) return; // parent CSS fallback remains visible

    const isMobile = window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

    // Particle counts adapt to device capability
    const PARTICLES_PER_FIGURE = isMobile ? 400 : isTablet ? 700 : 1200;
    const ARCH_COUNT = isMobile ? 4 : 6;
    const COLUMN_PAIRS = isMobile ? 3 : 5;

    // ─── Scene setup ────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xe9dfd0, 0.035);
    scene.background = null; // transparent canvas

    const camera = new THREE.PerspectiveCamera(
      55,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.0, 7);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isMobile,
      alpha: true,
      powerPreference: isMobile ? "default" : "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.3 : 1.75));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";

    // ─── Lighting ───────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xfaf7f0, 0.35);
    scene.add(ambient);

    // Key volumetric sunlight from above
    const sunLight = new THREE.DirectionalLight(0xfff4d6, 1.2);
    sunLight.position.set(3, 12, 4);
    scene.add(sunLight);

    // Warm fill from the side
    const fillLight = new THREE.PointLight(0xd6b77a, 0.6, 20);
    fillLight.position.set(-5, 3, 5);
    scene.add(fillLight);

    // Champagne rim light
    const rimLight = new THREE.PointLight(0xc88f91, 0.4, 15);
    rimLight.position.set(0, 2, -3);
    scene.add(rimLight);

    // ─── Architectural environment ──────────────────────────────────────
    const archGroup = new THREE.Group();
    scene.add(archGroup);

    // Ivory/sandstone material
    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0xe9dfd0,
      roughness: 0.85,
      metalness: 0.05,
      emissive: 0xd6b77a,
      emissiveIntensity: 0.04,
    });

    const columnMaterial = new THREE.MeshStandardMaterial({
      color: 0xf3eee2,
      roughness: 0.7,
      metalness: 0.1,
      emissive: 0xd6b77a,
      emissiveIntensity: 0.06,
    });

    // Geometric floor pattern
    const floorGeo = new THREE.PlaneGeometry(40, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe9dfd0,
      roughness: 0.9,
      metalness: 0.0,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.5;
    floor.position.z = -15;
    scene.add(floor);

    // Series of arches receding into the distance
    const archGeometries: THREE.Mesh[] = [];
    for (let i = 0; i < ARCH_COUNT; i++) {
      const z = -i * 3.5 - 1;
      const scale = 1 + i * 0.05;

      // Arch frame (torus half)
      const archGeo = new THREE.TorusGeometry(2.8, 0.18, 12, 32, Math.PI);
      const arch = new THREE.Mesh(archGeo, stoneMaterial);
      arch.position.set(0, 1.2, z);
      arch.scale.setScalar(scale);
      archGroup.add(arch);
      archGeometries.push(arch);

      // Arch side pillars
      const pillarGeo = new THREE.BoxGeometry(0.35, 3.8, 0.35);
      const leftPillar = new THREE.Mesh(pillarGeo, stoneMaterial);
      leftPillar.position.set(-2.8 * scale, -0.7, z);
      leftPillar.scale.x = scale;
      leftPillar.scale.y = scale;
      archGroup.add(leftPillar);

      const rightPillar = leftPillar.clone();
      rightPillar.position.x = 2.8 * scale;
      archGroup.add(rightPillar);
    }

    // Fluted columns lining the corridor
    const columnGeo = new THREE.CylinderGeometry(0.18, 0.22, 6, 16);
    for (let i = 0; i < COLUMN_PAIRS; i++) {
      const z = -i * 3 - 0.5;
      const leftCol = new THREE.Mesh(columnGeo, columnMaterial);
      leftCol.position.set(-5, 0.5, z);
      archGroup.add(leftCol);
      const rightCol = leftCol.clone();
      rightCol.position.x = 5;
      archGroup.add(rightCol);
    }

    // Geometric ceiling pattern (subtle, above)
    const ceilGeo = new THREE.PlaneGeometry(40, 60);
    const ceilMat = new THREE.MeshStandardMaterial({
      color: 0xfaf7f0,
      roughness: 1.0,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
    const ceiling = new THREE.Mesh(ceilGeo, ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 4;
    ceiling.position.z = -15;
    scene.add(ceiling);

    // ─── Volumetric light beams ─────────────────────────────────────────
    const beamGroup = new THREE.Group();
    scene.add(beamGroup);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0xfff4d6,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    for (let i = 0; i < 3; i++) {
      const beamGeo = new THREE.ConeGeometry(2.5, 8, 8, 1, true);
      const beam = new THREE.Mesh(beamGeo, beamMaterial);
      beam.position.set(
        (i - 1) * 3,
        2,
        -2 - i * 1.5
      );
      beam.rotation.z = (i - 1) * 0.15;
      beamGroup.add(beam);
    }

    // ─── Human figure particle system ───────────────────────────────────
    /**
     * Each figure is built from particles distributed along a human silhouette:
     *   - Head (sphere)
     *   - Shoulders + torso (ellipsoid)
     *   - Arms (curved)
     *   - Legs (two columns)
     * The particles use additive blending for a luminous, ghostly appearance.
     */

    function buildHumanSilhouette(count: number): Float32Array {
      const positions = new Float32Array(count * 3);
      // Scale factor — figures are ~3.5 units tall for prominence
      const S = 1.4;
      for (let i = 0; i < count; i++) {
        const partType = Math.random();
        let x = 0,
          y = 0,
          z = 0;

        if (partType < 0.15) {
          // Head — sphere
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);
          const r = (0.28 + Math.random() * 0.05) * S;
          x = r * Math.sin(phi) * Math.cos(theta);
          y = 1.5 * S + r * Math.cos(phi);
          z = r * Math.sin(phi) * Math.sin(theta);
        } else if (partType < 0.5) {
          // Torso — ellipsoid
          const theta = Math.random() * Math.PI * 2;
          const r1 = (0.45 + Math.random() * 0.1) * S;
          const r2 = (0.7 + Math.random() * 0.15) * S;
          x = r1 * Math.cos(theta) + (Math.random() - 0.5) * 0.1;
          y = 0.2 * S + r2 * (Math.random() - 0.5);
          z = r1 * Math.sin(theta) * 0.4 + (Math.random() - 0.5) * 0.1;
        } else if (partType < 0.75) {
          // Arms — curved lines on each side
          const side = Math.random() < 0.5 ? -1 : 1;
          const t = Math.random();
          const armY = (0.5 - t * 1.2) * S;
          const armX = side * (0.5 + Math.sin(t * Math.PI) * 0.3) * S;
          x = armX + (Math.random() - 0.5) * 0.08;
          y = armY + (Math.random() - 0.5) * 0.08;
          z = (Math.random() - 0.5) * 0.08;
        } else {
          // Legs — two columns
          const side = Math.random() < 0.5 ? -0.18 : 0.18;
          const t = Math.random();
          y = (-0.7 - t * 1.5) * S;
          x = side * S + (Math.random() - 0.5) * 0.1;
          z = (Math.random() - 0.5) * 0.08;
        }
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
      }
      return positions;
    }

    // Build figure 1 (left, warm gold) — bright and prominent
    const fig1Config: FigureConfig = {
      particleCount: PARTICLES_PER_FIGURE,
      startX: -3.5,
      endX: -0.7,
      color: new THREE.Color(0xf8e7b0), // bright champagne gold
    };
    const fig2Config: FigureConfig = {
      particleCount: PARTICLES_PER_FIGURE,
      startX: 3.5,
      endX: 0.7,
      color: new THREE.Color(0xf0d9a0), // warm ivory gold
    };

    function createParticleFigure(config: FigureConfig): {
      points: THREE.Points;
      basePositions: Float32Array;
      originalPositions: Float32Array;
    } {
      const positions = buildHumanSilhouette(config.particleCount);
      const originalPositions = new Float32Array(positions);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      // Custom shader material for soft, glowing particles — bright and visible
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: config.color },
          uOpacity: { value: 0.0 },
          uSize: { value: isMobile ? 6.0 : 9.0 },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uSize;
          varying float vAlpha;
          void main() {
            vec3 pos = position;
            // Subtle organic shimmer
            float shimmer = sin(uTime * 1.5 + pos.x * 10.0 + pos.y * 8.0) * 0.02;
            pos.x += shimmer;
            pos.y += sin(uTime * 1.2 + pos.x * 5.0) * 0.015;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = uSize * (100.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
            vAlpha = 0.8 + 0.2 * sin(uTime * 2.0 + pos.y * 12.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float softness = smoothstep(0.5, 0.0, d);
            // Bright white-hot core for maximum visibility
            float core = smoothstep(0.25, 0.0, d);
            vec3 finalColor = mix(uColor, vec3(1.0, 0.98, 0.85), core * 0.6);
            gl_FragColor = vec4(finalColor, (softness + core * 0.5) * vAlpha * uOpacity);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geo, mat);
      points.position.x = config.startX;
      return { points, basePositions: positions, originalPositions };
    }

    const figure1 = createParticleFigure(fig1Config);
    const figure2 = createParticleFigure(fig2Config);
    scene.add(figure1.points);
    scene.add(figure2.points);

    // ─── Golden trail particles ──────────────────────────────────────────
    // Trail particles are emitted behind each figure as they move
    const TRAIL_COUNT = isMobile ? 100 : 250;
    const trailPositions = new Float32Array(TRAIL_COUNT * 3);
    const trailAges = new Float32Array(TRAIL_COUNT);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));

    const trailMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0xd6b77a) },
        uOpacity: { value: 0.0 },
      },
      vertexShader: `
        varying float vAlpha;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 4.0 * (50.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          vAlpha = 1.0;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float softness = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(uColor, softness * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const trailPoints = new THREE.Points(trailGeo, trailMat);
    scene.add(trailPoints);
    let trailIndex = 0;

    // ─── Mouse interaction ───────────────────────────────────────────────
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    function onMouseMove(e: MouseEvent) {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    window.addEventListener("mousemove", onMouseMove);

    // ─── Resize handler ──────────────────────────────────────────────────
    function onResize() {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }
    window.addEventListener("resize", onResize);

    // ─── Animation sequence ──────────────────────────────────────────────
    /**
     * 4-phase cinematic loop (~22 seconds total):
     *   Phase 1 (0-5s):   Two distant figures shimmer at opposite ends
     *   Phase 2 (5-11s):  Figures drift toward center, emitting golden trails
     *   Phase 3 (11-16s): Trails intertwine, champagne glow spreads
     *   Phase 4 (16-22s): Figures stand together, camera pulls back, loop
     */
    const CYCLE_DURATION = 22;
    const clock = new THREE.Clock();
    let animationId: number;

    function animate() {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const cycleTime = reducedMotion ? 0 : elapsed % CYCLE_DURATION;
      const phase = cycleTime / CYCLE_DURATION; // 0..1

      // Smooth mouse interpolation
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      // ── Figure positions (4-phase movement) ───────────────────────────
      let fig1X: number, fig2X: number, figOpacity: number, trailOpacity: number;

      if (reducedMotion) {
        // Static final composition
        fig1X = fig1Config.endX;
        fig2X = fig2Config.endX;
        figOpacity = 1.0;
        trailOpacity = 0.3;
      } else if (phase < 0.23) {
        // Phase 1: Distant, shimmering — visible from the start
        const t = phase / 0.23;
        fig1X = fig1Config.startX;
        fig2X = fig2Config.startX;
        figOpacity = 0.6 + t * 0.3;
        trailOpacity = 0;
      } else if (phase < 0.5) {
        // Phase 2: Drifting together, trails appear
        const t = (phase - 0.23) / 0.27;
        const eased = t * t * (3 - 2 * t); // smoothstep
        fig1X = fig1Config.startX + (fig1Config.endX - fig1Config.startX) * eased;
        fig2X = fig2Config.startX + (fig2Config.endX - fig2Config.startX) * eased;
        figOpacity = 0.7 + t * 0.2;
        trailOpacity = t * 0.5;
      } else if (phase < 0.73) {
        // Phase 3: Meeting, trails intertwine, glow spreads
        const t = (phase - 0.5) / 0.23;
        fig1X = fig1Config.endX;
        fig2X = fig2Config.endX;
        figOpacity = 0.9 + Math.sin(t * Math.PI) * 0.1;
        trailOpacity = 0.5 + Math.sin(t * Math.PI) * 0.3;
        // Glow spread via fog density reduction
        scene.fog = new THREE.FogExp2(0xe9dfd0, 0.035 - t * 0.012);
      } else {
        // Phase 4: Together, camera pulls back
        const t = (phase - 0.73) / 0.27;
        fig1X = fig1Config.endX;
        fig2X = fig2Config.endX;
        figOpacity = 0.9 - t * 0.3;
        trailOpacity = 0.4 - t * 0.3;
        // Restore fog for loop
        scene.fog = new THREE.FogExp2(0xe9dfd0, 0.035);
      }

      figure1.points.position.x = fig1X;
      figure2.points.position.x = fig2X;

      // Update shader uniforms
      const mat1 = figure1.points.material as THREE.ShaderMaterial;
      const mat2 = figure2.points.material as THREE.ShaderMaterial;
      mat1.uniforms.uTime.value = elapsed;
      mat2.uniforms.uTime.value = elapsed;
      mat1.uniforms.uOpacity.value = figOpacity;
      mat2.uniforms.uOpacity.value = figOpacity;
      trailMat.uniforms.uOpacity.value = trailOpacity;

      // ── Emit trail particles behind moving figures ────────────────────
      if (!reducedMotion && trailOpacity > 0.05) {
        // Emit from figure 1
        const emitCount = 2;
        for (let i = 0; i < emitCount; i++) {
          trailPositions[trailIndex * 3] =
            fig1X + (Math.random() - 0.5) * 0.3;
          trailPositions[trailIndex * 3 + 1] =
            (Math.random() - 0.5) * 2;
          trailPositions[trailIndex * 3 + 2] =
            (Math.random() - 0.5) * 0.3;
          trailAges[trailIndex] = 0;
          trailIndex = (trailIndex + 1) % TRAIL_COUNT;
        }
        for (let i = 0; i < emitCount; i++) {
          trailPositions[trailIndex * 3] =
            fig2X + (Math.random() - 0.5) * 0.3;
          trailPositions[trailIndex * 3 + 1] =
            (Math.random() - 0.5) * 2;
          trailPositions[trailIndex * 3 + 2] =
            (Math.random() - 0.5) * 0.3;
          trailAges[trailIndex] = 0;
          trailIndex = (trailIndex + 1) % TRAIL_COUNT;
        }
        // Age and drift existing trail particles
        for (let i = 0; i < TRAIL_COUNT; i++) {
          trailAges[i] += 0.016;
          if (trailAges[i] > 3) {
            trailPositions[i * 3 + 1] = -10; // hide
          } else {
            trailPositions[i * 3 + 1] += 0.005;
          }
        }
        trailGeo.attributes.position.needsUpdate = true;
      }

      // ── Camera movement ────────────────────────────────────────────────
      // Cinematic slow drift + mouse parallax
      if (!reducedMotion) {
        const baseX = Math.sin(elapsed * 0.08) * 0.5;
        const baseY = 1.0 + Math.sin(elapsed * 0.06) * 0.15;
        camera.position.x = baseX + mouse.x * 0.5;
        camera.position.y = baseY + mouse.y * 0.25;
        // Pull back in phase 4
        const pullback =
          phase > 0.73 ? 1 + ((phase - 0.73) / 0.27) * 1.2 : 1;
        camera.position.z = 7 * pullback;
      }
      camera.lookAt(0, 0.2, 0);

      // ── Subtle architecture light shift ────────────────────────────────
      fillLight.intensity = 0.6 + Math.sin(elapsed * 0.5) * 0.15;
      rimLight.intensity = 0.4 + Math.cos(elapsed * 0.4) * 0.1;

      // ── Beam opacity shimmer ───────────────────────────────────────────
      beamGroup.children.forEach((beam, i) => {
        const mat = (beam as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = 0.05 + Math.sin(elapsed * 0.3 + i) * 0.03;
      });

      renderer.render(scene, camera);
    }

    animate();

    // ─── Cleanup ────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      // Dispose all geometries and materials
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
        if (obj instanceof THREE.Points) {
          obj.geometry?.dispose();
          (obj.material as THREE.Material)?.dispose();
        }
      });
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={className}
      aria-hidden="true"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

export default CinematicHero3D;
