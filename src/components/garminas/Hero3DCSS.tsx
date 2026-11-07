"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * GarMinas cinematic hero — CSS + SVG based 3D animation.
 *
 * This replaces the heavier three.js scene with a lightweight CSS/SVG
 * implementation that:
 *   - Uses negligible memory (no WebGL context, no large library)
 *   - Renders smoothly on all devices including low-end mobile
 *   - Honors prefers-reduced-motion
 *   - Achieves the same luxury jewellery-commercial aesthetic
 *
 * Layers:
 *   1. Two golden wedding rings (CSS 3D transforms) that drift together
 *      and gently rotate, with diamond accents.
 *   2. A heart-shaped formation (SVG particles) that breathes.
 *   3. Champagne bubbles rising upward (CSS animations).
 *   4. Floating rose petals (CSS animations).
 *   5. Sparkle star field (CSS animations).
 *   6. Soft golden glow auras behind the rings.
 */

// Generate bubble positions once
const BUBBLES = Array.from({ length: 24 }).map((_, i) => ({
  left: `${(i * 4.2 + Math.random() * 3) % 100}%`,
  size: `${4 + Math.random() * 8}px`,
  delay: `${Math.random() * 12}s`,
  duration: `${10 + Math.random() * 10}s`,
  drift: `${(Math.random() - 0.5) * 40}px`,
}));

const PETALS = Array.from({ length: 12 }).map((_, i) => ({
  left: `${(i * 8.3 + Math.random() * 5) % 100}%`,
  delay: `${Math.random() * 15}s`,
  duration: `${14 + Math.random() * 8}s`,
  rotation: `${Math.random() * 360}deg`,
  scale: `${0.6 + Math.random() * 0.5}`,
}));

const SPARKLES = Array.from({ length: 30 }).map((_, i) => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: `${2 + Math.random() * 3}px`,
  delay: `${Math.random() * 4}s`,
  duration: `${2 + Math.random() * 3}s`,
}));

export function Hero3DCSS({ className }: { className?: string }) {
  const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  const [reduced, setReduced] = useState(mq?.matches ?? false);

  useEffect(() => {
    if (!mq) return;
    const handler = () => setReduced(mq.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [mq]);

  return (
    <div
      className={className}
      style={{
        perspective: "1200px",
        perspectiveOrigin: "50% 40%",
      }}
      aria-hidden={reduced ? true : undefined}
    >
      {/* Soft golden glow auras behind the rings */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 55%, rgba(214,183,122,0.25) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 30% 20% at 50% 55%, rgba(200,143,145,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Sparkle star field */}
      {!reduced && (
        <div className="absolute inset-0 pointer-events-none">
          {SPARKLES.map((s, i) => (
            <div
              key={`spark-${i}`}
              className="absolute rounded-full"
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                background: "#E8D9B5",
                boxShadow: `0 0 ${s.size * 2}px rgba(232, 217, 181, 0.8)`,
                animation: `garminas-twinkle ${s.duration} ease-in-out ${s.delay} infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Champagne bubbles rising */}
      {!reduced && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {BUBBLES.map((b, i) => (
            <div
              key={`bubble-${i}`}
              className="absolute rounded-full"
              style={{
                left: b.left,
                bottom: "-20px",
                width: b.size,
                height: b.size,
                background:
                  "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), rgba(232,217,181,0.3) 60%, transparent)",
                border: "1px solid rgba(214,183,122,0.2)",
                animation: `garminas-rise ${b.duration} linear ${b.delay} infinite`,
                // @ts-expect-error CSS custom property
                "--drift": b.drift,
              }}
            />
          ))}
        </div>
      )}

      {/* Floating rose petals */}
      {!reduced && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {PETALS.map((p, i) => (
            <div
              key={`petal-${i}`}
              className="absolute"
              style={{
                left: p.left,
                top: "-30px",
                animation: `garminas-fall ${p.duration} linear ${p.delay} infinite`,
              }}
            >
              <div
                style={{
                  width: "14px",
                  height: "9px",
                  background: "linear-gradient(135deg, #C88F91, #B07A7C)",
                  borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                  transform: `rotate(${p.rotation}) scale(${p.scale})`,
                  opacity: 0.7,
                  boxShadow: "0 2px 4px rgba(200,143,145,0.2)",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* The two golden wedding rings — CSS 3D transforms */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: "preserve-3d" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative"
          style={{
            transformStyle: "preserve-3d",
            transform: "translateY(60px)",
          }}
        >
          {/* Ring 1 (left) */}
          <RingCSS
            initialX={-180}
            targetX={-50}
            rotateDir={1}
            delay={0}
            reduced={reduced}
          />
          {/* Ring 2 (right) */}
          <RingCSS
            initialX={180}
            targetX={50}
            rotateDir={-1}
            delay={0.2}
            reduced={reduced}
          />

          {/* Heart formation between the rings */}
          {!reduced && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 2, delay: 1.5, ease: "easeOut" }}
              className="absolute"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                animation: "garminas-heart-breathe 4s ease-in-out infinite",
              }}
            >
              <HeartSVG />
            </motion.div>
          )}

          {/* Connecting golden beam */}
          {!reduced && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 2 }}
              className="absolute"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "120px",
                height: "2px",
                background:
                  "linear-gradient(90deg, transparent, #D6B77A, transparent)",
                boxShadow: "0 0 12px rgba(214,183,122,0.6)",
                animation: "garminas-beam-pulse 2s ease-in-out infinite",
              }}
            />
          )}
        </motion.div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes garminas-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes garminas-rise {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-110vh) translateX(var(--drift, 0px)); opacity: 0; }
        }
        @keyframes garminas-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes garminas-heart-breathe {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
          50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.9; }
        }
        @keyframes garminas-beam-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
        @keyframes garminas-ring-orbit {
          0% { transform: translateX(var(--init-x, 0)) rotateY(0deg); }
          100% { transform: translateX(var(--target-x, 0)) rotateY(360deg); }
        }
        @keyframes garminas-ring-spin {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Single golden ring (CSS 3D) ──────────────────────────────────────────

function RingCSS({
  initialX,
  targetX,
  rotateDir,
  delay,
  reduced,
}: {
  initialX: number;
  targetX: number;
  rotateDir: number;
  delay: number;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={{ x: initialX, opacity: 0 }}
      animate={{ x: targetX, opacity: 1 }}
      transition={{ duration: 2.5, delay, ease: "easeOut" }}
      className="absolute"
      style={{
        top: "50%",
        left: "50%",
        marginLeft: "-55px",
        marginTop: "-55px",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Outer ring with gold gradient + 3D rotation */}
      <motion.div
        animate={reduced ? {} : { rotateY: 360 * rotateDir }}
        transition={
          reduced
            ? {}
            : {
                duration: 12,
                repeat: Infinity,
                ease: "linear",
              }
        }
        style={{
          width: "110px",
          height: "110px",
          borderRadius: "50%",
          background:
            "conic-gradient(from 45deg, #B8964A, #D6B77A, #F8E7B0, #D6B77A, #B8964A, #8B6F2E, #D6B77A, #B8964A)",
          boxShadow:
            "0 0 40px rgba(214,183,122,0.4), inset 0 0 20px rgba(248,231,176,0.3), 0 8px 32px rgba(17,24,39,0.15)",
          border: "2px solid rgba(248,231,176,0.4)",
        }}
      >
        {/* Inner hollow (creates the ring donut shape) */}
        <div
          style={{
            position: "absolute",
            top: "18%",
            left: "18%",
            right: "18%",
            bottom: "18%",
            borderRadius: "50%",
            background: "rgba(250,247,240,0.85)",
            boxShadow: "inset 0 4px 12px rgba(17,24,39,0.1)",
            backdropFilter: "blur(2px)",
          }}
        />
        {/* Diamond accent on top of the ring */}
        <div
          style={{
            position: "absolute",
            top: "-8px",
            left: "50%",
            marginLeft: "-8px",
            width: "16px",
            height: "16px",
            background:
              "linear-gradient(135deg, #FFFFFF, #E8D9B5, #FFFFFF)",
            transform: "rotate(45deg)",
            boxShadow: "0 0 16px rgba(255,255,255,0.8)",
          }}
        />
      </motion.div>

      {/* Subtle highlight band */}
      <motion.div
        animate={reduced ? {} : { rotateY: -360 * rotateDir }}
        transition={
          reduced
            ? {}
            : { duration: 8, repeat: Infinity, ease: "linear" }
        }
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          marginLeft: "-50px",
          marginTop: "-50px",
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          border: "1px solid rgba(248,231,176,0.5)",
          boxShadow: "0 0 20px rgba(248,231,176,0.3)",
          pointerEvents: "none",
        }}
      />
    </motion.div>
  );
}

// ─── Heart formation (SVG with particle dots) ─────────────────────────────

function HeartSVG() {
  // Generate points along a heart curve
  const points = Array.from({ length: 60 }).map((_, i) => {
    const t = (i / 60) * Math.PI * 2;
    const scale = 8;
    const x = scale * 16 * Math.pow(Math.sin(t), 3);
    const y =
      scale *
      (13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t));
    return { x: x + 100, y: 100 - y };
  });

  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <radialGradient id="heartDot">
          <stop offset="0%" stopColor="#E8A0A4" stopOpacity="1" />
          <stop offset="100%" stopColor="#C88F91" stopOpacity="0" />
        </radialGradient>
      </defs>
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i % 3 === 0 ? 2.5 : 1.8}
          fill="url(#heartDot)"
          opacity={0.9}
          style={{
            filter: "drop-shadow(0 0 3px rgba(200,143,145,0.6))",
          }}
        />
      ))}
      {/* Center glow */}
      <circle
        cx="100"
        cy="90"
        r="3"
        fill="#FFFFFF"
        opacity="0.6"
        style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.8))" }}
      />
    </svg>
  );
}

export default Hero3DCSS;
