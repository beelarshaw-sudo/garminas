"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Music, Music2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * RomanticAudio — procedurally-generated ambient pad music using the Web Audio API.
 *
 * No external audio files, no copyright concerns, no licensing fees.
 * Generates a soft, evolving chord pad with:
 *   - A slow C-major-7 / A-minor-7 drone (very consonant, romantic)
 *   - Gentle low-pass filter sweep for warmth
 *   - Subtle detune for shimmer
 *   - Slow volume LFO for breathing effect
 *   - Occasional bell-like high notes for sparkle
 *
 * Audio is OFF by default (browsers block autoplay-with-sound).
 * User clicks the music button to enable.
 */

const CHORDS: number[][] = [
  // Cmaj7: C3, E3, G3, B3
  [130.81, 164.81, 196.0, 246.94],
  // Am7: A2, C3, E3, G3
  [110.0, 130.81, 164.81, 196.0],
  // Fmaj7: F2, A2, C3, E3
  [87.31, 110.0, 130.81, 164.81],
  // G6: G2, B2, D3, E3
  [98.0, 123.47, 146.83, 164.81],
];

const SPARKLE_NOTES = [523.25, 659.25, 783.99, 987.77, 1174.66]; // C5, E5, G5, B5, D6

export function RomanticAudio() {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const padNodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);
  const lfoRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);
  const chordIndexRef = useRef(0);
  const chordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sparkleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);

  const stopAll = useCallback(() => {
    if (chordTimerRef.current) {
      clearInterval(chordTimerRef.current);
      chordTimerRef.current = null;
    }
    if (sparkleTimerRef.current) {
      clearInterval(sparkleTimerRef.current);
      sparkleTimerRef.current = null;
    }
    padNodesRef.current.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(0);
        gain.gain.linearRampToValueAtTime(0, ctxRef.current!.currentTime + 0.8);
        osc.stop(ctxRef.current!.currentTime + 1.0);
      } catch {}
    });
    padNodesRef.current = [];
    if (lfoRef.current) {
      try {
        lfoRef.current.osc.stop();
      } catch {}
      lfoRef.current = null;
    }
  }, []);

  const startPad = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const master = masterGainRef.current!;
    const now = ctx.currentTime;

    // Soft low-pass filter for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    filter.Q.value = 0.7;
    filter.connect(master);
    filterRef.current = filter;

    // Slow filter sweep LFO (every ~12s, sweep 600 → 1600 Hz)
    const filterLfo = ctx.createOscillator();
    filterLfo.frequency.value = 0.08;
    const filterLfoGain = ctx.createGain();
    filterLfoGain.gain.value = 500;
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(filter.frequency);
    filterLfo.start();

    // Master volume LFO (breathing)
    const breathLfo = ctx.createOscillator();
    breathLfo.frequency.value = 0.12; // ~8s breath cycle
    const breathGain = ctx.createGain();
    breathGain.gain.value = 0.08;
    breathLfo.connect(breathGain);
    breathGain.connect(master.gain);
    breathLfo.start();
    lfoRef.current = { osc: breathLfo, gain: breathGain };

    // Build the first chord
    const buildChord = (freqs: number[], fade: number) => {
      const t = ctx.currentTime;
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = i === 0 ? "sine" : "triangle";
        osc.frequency.value = freq;
        // Subtle detune for shimmer
        osc.detune.value = (Math.random() - 0.5) * 8;

        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(0.06 / freqs.length + 0.015, t + fade);
        osc.connect(gain);
        gain.connect(filter);
        osc.start();
        padNodesRef.current.push({ osc, gain });
      });
    };

    // Fade out current chord, then build the next one
    const cycleChord = () => {
      const nextIdx = (chordIndexRef.current + 1) % CHORDS.length;
      chordIndexRef.current = nextIdx;
      // Fade out existing pad notes
      const t = ctx.currentTime;
      padNodesRef.current.forEach(({ osc, gain }) => {
        try {
          gain.gain.cancelScheduledValues(t);
          gain.gain.setValueAtTime(gain.gain.value, t);
          gain.gain.linearRampToValueAtTime(0, t + 2.5);
          osc.stop(t + 2.8);
        } catch {}
      });
      // Clear stopped nodes after a delay
      setTimeout(() => {
        padNodesRef.current = padNodesRef.current.filter(({ osc }) => {
          try {
            return osc.context.state === "running";
          } catch {
            return false;
          }
        });
      }, 3000);
      // Build new chord with a slow fade-in
      buildChord(CHORDS[nextIdx], 3.0);
    };

    // Build the first chord
    buildChord(CHORDS[0], 4.0);
    // Cycle every 14 seconds (slow, romantic harmonic movement)
    chordTimerRef.current = setInterval(cycleChord, 14000);

    // Occasional bell-like sparkle notes
    const playSparkle = () => {
      if (!ctxRef.current || !filterRef.current) return;
      const note = SPARKLE_NOTES[Math.floor(Math.random() * SPARKLE_NOTES.length)];
      const t = ctxRef.current.currentTime;
      const osc = ctxRef.current.createOscillator();
      osc.type = "sine";
      osc.frequency.value = note;
      const gain = ctxRef.current.createGain();
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.05, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
      osc.connect(gain);
      gain.connect(filterRef.current);
      osc.start();
      osc.stop(t + 2.6);
    };
    // Random sparkles every 6–12 seconds
    sparkleTimerRef.current = setInterval(() => {
      if (Math.random() < 0.4) playSparkle();
    }, 6000);
  }, []);

  const enable = useCallback(async () => {
    try {
      if (!ctxRef.current) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        ctxRef.current = new AC();
        const master = ctxRef.current.createGain();
        master.gain.value = 0;
        master.connect(ctxRef.current.destination);
        masterGainRef.current = master;
      }
      if (ctxRef.current.state === "suspended") {
        await ctxRef.current.resume();
      }
      // Fade in master
      const now = ctxRef.current.currentTime;
      masterGainRef.current!.gain.cancelScheduledValues(now);
      masterGainRef.current!.gain.setValueAtTime(0.0001, now);
      masterGainRef.current!.gain.linearRampToValueAtTime(0.7, now + 2.5);
      startPad();
      setEnabled(true);
      setReady(true);
    } catch (e) {
      console.warn("Audio failed to start", e);
    }
  }, [startPad]);

  const disable = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !masterGainRef.current) {
      setEnabled(false);
      return;
    }
    const now = ctx.currentTime;
    masterGainRef.current.gain.cancelScheduledValues(now);
    masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
    masterGainRef.current.gain.linearRampToValueAtTime(0, now + 0.8);
    setTimeout(() => {
      stopAll();
    }, 900);
    setEnabled(false);
  }, [stopAll]);

  useEffect(() => {
    return () => {
      stopAll();
      if (ctxRef.current) {
        try {
          ctxRef.current.close();
        } catch {}
        ctxRef.current = null;
      }
    };
  }, [stopAll]);

  return (
    <motion.button
      onClick={enabled ? disable : enable}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="group relative flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium backdrop-blur transition-colors"
      style={{
        background: enabled ? "rgba(214, 183, 122, 0.9)" : "rgba(17, 24, 39, 0.55)",
        color: enabled ? "#111827" : "#FAF7F0",
        borderColor: enabled ? "#D6B77A" : "rgba(214, 183, 122, 0.3)",
      }}
      aria-label={enabled ? "Turn off ambient music" : "Turn on ambient music"}
      title={enabled ? "Turn off ambient music" : "Turn on romantic ambient music"}
    >
      <AnimatePresence mode="wait" initial={false}>
        {enabled ? (
          <motion.span
            key="on"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            className="flex items-center gap-2"
          >
            <Music2 className="h-3.5 w-3.5" />
            <span>Ambient on</span>
            {/* Animated equalizer bars */}
            <span className="flex items-end gap-0.5 h-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-0.5 rounded-full"
                  style={{ background: "#111827" }}
                  animate={{ height: ["30%", "100%", "30%"] }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </span>
          </motion.span>
        ) : (
          <motion.span
            key="off"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <VolumeX className="h-3.5 w-3.5" />
            <span>Play ambient music</span>
            <Music className="h-3 w-3 opacity-60" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
