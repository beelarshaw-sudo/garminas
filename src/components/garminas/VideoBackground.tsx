"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const VIDEO_SOURCES = [
  "/videos/wedding-hands-ceremony.mp4",
  "/videos/couple-sunset-watch.mp4",
  "/videos/newlyweds-garden.mp4",
  "/videos/lovers-dancing-sunset.mp4",
  "/videos/just-married.mp4",
  "/videos/diamond-ring.mp4",
];

const ROTATION_SECONDS = 18;

/**
 * Cinematic rotating wedding video background.
 * Loops one video at a time, fades between them, with graceful fallback
 * to the parent's 3D scene if no video can be loaded.
 *
 * `muted` is REQUIRED for browser autoplay policies.
 * `playsInline` is required for iOS.
 */
export function VideoBackground({ className }: { className?: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Rotate videos
  useEffect(() => {
    if (hasError) return;
    const timer = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % VIDEO_SOURCES.length);
    }, ROTATION_SECONDS * 1000);
    return () => clearInterval(timer);
  }, [hasError]);

  // Try to play the current video
  useEffect(() => {
    if (hasError) return;
    const v = videoRef.current;
    if (!v) return;
    v.load();
    const tryPlay = async () => {
      try {
        await v.play();
      } catch {
        // If autoplay blocked, we don't fall back to error — just keep trying.
        // The user gesture of scrolling/clicking anywhere will eventually allow play.
      }
    };
    tryPlay();
  }, [currentIndex, hasError]);

  if (hasError) {
    return null; // parent falls back to the 3D scene
  }

  return (
    <div className={className} aria-hidden>
      <AnimatePresence mode="sync">
        <motion.video
          key={currentIndex}
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={() => {
            // Only set error if ALL sources have failed (i.e. first load fails)
            if (currentIndex === 0) setHasError(true);
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "saturate(0.85) brightness(0.7)" }}
        >
          <source src={VIDEO_SOURCES[currentIndex]} type="video/mp4" />
        </motion.video>
      </AnimatePresence>
      {/* Cinematic gradient overlays for legibility + brand cohesion */}
      {/* Ivory top fade so headline area stays soft and luxurious */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: "55%",
          background:
            "linear-gradient(180deg, rgba(250,247,240,0.95) 0%, rgba(250,247,240,0.65) 35%, rgba(250,247,240,0.15) 80%, transparent 100%)",
        }}
      />
      {/* Bottom fade into the ivory background section */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: "45%",
          background:
            "linear-gradient(0deg, rgba(250,247,240,0.95) 0%, rgba(250,247,240,0.55) 40%, rgba(250,247,240,0.1) 90%, transparent 100%)",
        }}
      />
      {/* Subtle gold tint overlay for brand cohesion */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(214,183,122,0.10) 0%, transparent 40%, rgba(200,143,145,0.08) 100%)",
          mixBlendMode: "overlay",
        }}
      />
      {/* Center vignette to deepen the cinematic feel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(17,24,39,0.25) 100%)",
        }}
      />
    </div>
  );
}
