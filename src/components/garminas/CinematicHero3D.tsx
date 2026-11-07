"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

/**
 * GarMinas cinematic hero — CSS + SVG based 3D animation.
 *
 * A luxury jewellery-commercial aesthetic using only CSS/SVG (no WebGL):
 *   1. Two golden wedding rings (CSS 3D transforms + conic gradients)
 *      that drift together and gently rotate, with diamond accents.
 *   2. A heart-shaped formation (SVG particles) that breathes.
 *   3. Champagne bubbles rising upward (CSS animations).
 *   4. Floating rose petals (CSS animations).
 *   5. Sparkle star field (CSS animations).
 *   6. Soft golden glow auras behind the rings.
 *
 * Performance: negligible memory (no WebGL, no large library).
 * Honors prefers-reduced-motion.
 */

const BUBBLES = Array.from({ length: 28 }).map((_, i) => ({
  left: `${(i * 3.7 + Math.random() * 4) % 100}%`,
  size: `${4 + Math.random() * 10}px`,
  delay: `${Math.random() * 14}s`,
  duration: `${12 + Math.random() * 12}s`,
  drift: `${(Math.random() - 0.5) * 50}px`,
}));

const PETALS = Array.from({ length: 14 }).map((_, i) => ({
  left: `${(i * 7.2 + Math.random() * 6) % 100}%`,
  delay: `${Math.random() * 18}s`,
  duration: `${16 + Math.random() * 10}s`,
  rotation: `${Math.random() * 360}deg`,
  scale: `${0.6 + Math.random() * 0.5}`,
}));

const SPARKLES = Array.from({ length: 40 }).map(() => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: `${2 + Math.random() * 4}px`,
  delay: `${Math.random() * 5}s`,
  duration: `${2.5 + Math.random() * 3.5}s`,
}));

export function CinematicHero3D({ className }: { className?: string }) {
  const mq =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
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
        perspectiveOrigin: "50% 45%",
      }}
      aria-hidden={reduced ? true : undefined}
    >
      {/* ─── Background gradient ─────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(214,183,122,0.15) 0%, transparent 60%), radial-gradient(ellipse at 50% 60%, rgba(200,143,145,0.08) 0%, transparent 50%)",
        }}
      />

      {/* ─── Soft golden glow auras behind the rings ─────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 35% at 50% 55%, rgba(214,183,122,0.3) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 25% 18% at 50% 55%, rgba(200,143,145,0.15) 0%, transparent 70%)",
        }}
      />

      {/* ─── Sparkle star field ──────────────────────────────────────────── */}
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
                boxShadow: `0 0 ${parseFloat(s.size) * 2.5}px rgba(232, 217, 181, 0.9)`,
                animation: `garminas-twinkle ${s.duration} ease-in-out ${s.delay} infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* ─── Champagne bubbles rising ────────────────────────────────────── */}
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
                  "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7), rgba(232,217,181,0.35) 60%, transparent)",
                border: "1px solid rgba(214,183,122,0.25)",
                animation: `garminas-rise ${b.duration} linear ${b.delay} infinite`,
                // @ts-expect-error CSS custom property
                "--drift": b.drift,
              }}
            />
          ))}
        </div>
      )}

      {/* ─── Floating rose petals ────────────────────────────────────────── */}
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
                  width: "16px",
                  height: "10px",
                  background: "linear-gradient(135deg, #C88F91, #A07072)",
                  borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                  transform: `rotate(${p.rotation}) scale(${p.scale})`,
                  opacity: 0.6,
                  boxShadow: "0 2px 6px rgba(200,143,145,0.25)",
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* ─── The two golden wedding rings — CSS 3D transforms ─────────────── */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: "preserve-3d" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative"
          style={{
            transformStyle: "preserve-3d",
            transform: "translateY(40px)",
          }}
        >
          {/* Ring 1 (left) */}
          <RingCSS
            initialX={-200}
            targetX={-55}
            rotateDir={1}
            delay={0}
            reduced={reduced}
          />
          {/* Ring 2 (right) */}
          <RingCSS
            initialX={200}
            targetX={55}
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
                width: "130px",
                height: "2px",
                background:
                  "linear-gradient(90deg, transparent, #D6B77A 30%, #E8D9B5 50%, #D6B77A 70%, transparent)",
                boxShadow: "0 0 16px rgba(214,183,122,0.7)",
                animation: "garminas-beam-pulse 2.5s ease-in-out infinite",
              }}
            />
          )}
        </motion.div>
      </div>

      {/* ─── Keyframes ───────────────────────────────────────────────────── */}
      <style>{`
        @keyframes garminas-twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.7); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes garminas-rise {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-110vh) translateX(var(--drift, 0px)); opacity: 0; }
        }
        @keyframes garminas-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.7; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes garminas-heart-breathe {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.65; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.9; }
        }
        @keyframes garminas-beam-pulse {
          0%, 100% { opacity: 0.3; box-shadow: 0 0 8px rgba(214,183,122,0.4); }
          50% { opacity: 0.8; box-shadow: 0 0 20px rgba(214,183,122,0.8); }
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
        marginLeft: "-60px",
        marginTop: "-60px",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Outer ring with gold conic gradient + 3D rotation */}
      <motion.div
        animate={reduced ? {} : { rotateY: 360 * rotateDir }}
        transition={
          reduced
            ? {}
            : { duration: 14, repeat: Infinity, ease: "linear" }
        }
        style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background:
            "conic-gradient(from 45deg, #B8964A, #D6B77A, #F8E7B0, #FFFFFF, #F8E7B0, #D6B77A, #B8964A, #8B6F2E, #D6B77A, #B8964A)",
          boxShadow:
            "0 0 50px rgba(214,183,122,0.5), 0 0 100px rgba(214,183,122,0.2), inset 0 0 25px rgba(248,231,176,0.4), 0 10px 40px rgba(17,24,39,0.2)",
          border: "2px solid rgba(248,231,176,0.5)",
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
            background: "rgba(250,247,240,0.9)",
            boxShadow: "inset 0 6px 16px rgba(17,24,39,0.12)",
            backdropFilter: "blur(3px)",
          }}
        />
        {/* Diamond accent on top of the ring */}
        <div
          style={{
            position: "absolute",
            top: "-9px",
            left: "50%",
            marginLeft: "-9px",
            width: "18px",
            height: "18px",
            background:
              "linear-gradient(135deg, #FFFFFF, #E8D9B5 40%, #FFFFFF 60%, #C8D8E8)",
            transform: "rotate(45deg)",
            boxShadow:
              "0 0 20px rgba(255,255,255,0.9), 0 0 40px rgba(232,217,181,0.5)",
          }}
        />
      </motion.div>

      {/* Subtle rotating highlight band */}
      <motion.div
        animate={reduced ? {} : { rotateY: -360 * rotateDir }}
        transition={
          reduced ? {} : { duration: 10, repeat: Infinity, ease: "linear" }
        }
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          marginLeft: "-55px",
          marginTop: "-55px",
          width: "110px",
          height: "110px",
          borderRadius: "50%",
          border: "1px solid rgba(248,231,176,0.6)",
          boxShadow: "0 0 25px rgba(248,231,176,0.4)",
          pointerEvents: "none",
        }}
      />
    </motion.div>
  );
}

// ─── Heart formation (SVG with particle dots) ─────────────────────────────

function HeartSVG() {
  const points = useMemo(
    () =>
      Array.from({ length: 80 }).map((_, i) => {
        const t = (i / 80) * Math.PI * 2;
        const scale = 9;
        const x = scale * 16 * Math.pow(Math.sin(t), 3);
        const y =
          scale *
          (13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t));
        return { x: x + 100, y: 100 - y };
      }),
    []
  );

  return (
    <svg width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <radialGradient id="heartDot">
          <stop offset="0%" stopColor="#F0A0A4" stopOpacity="1" />
          <stop offset="60%" stopColor="#C88F91" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#C88F91" stopOpacity="0" />
        </radialGradient>
        <filter id="heartGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i % 4 === 0 ? 3 : 2}
          fill="url(#heartDot)"
          opacity={0.9}
          filter="url(#heartGlow)"
        />
      ))}
      {/* Center glow */}
      <circle
        cx="100"
        cy="88"
        r="4"
        fill="#FFFFFF"
        opacity="0.7"
        filter="url(#heartGlow)"
      />
    </svg>
  );
}

export default CinematicHero3D;
