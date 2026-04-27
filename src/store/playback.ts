import { create } from "zustand";
import { MidiEvent } from "@/lib/midi";
import { PlaybackEngine } from "@/lib/playback-engine";
import { AudioEngine } from "@/lib/audio-engine";
import { cropEvents } from "@/lib/crop";
import { detectBpm } from "@/lib/bpm";
import { quantizeEvents } from "@/lib/quantize";
import { detectChords, ChordEvent } from "@/lib/chords";

type Instrument = "piano" | "cello" | "guitar" | "bass";

type PlaybackState = {
  // Raw events — never mutated after load
  events: MidiEvent[];
  // Events after crop is applied (= events when no crop)
  croppedEvents: MidiEvent[];
  // Events after quantization
  quantizedEvents: MidiEvent[];
  // Chord groups for guitar / bass
  chordEvents: ChordEvent[];

  instrument: Instrument;
  fileName: string | null;
  currentMs: number;
  isPlaying: boolean;
  duration: number;    // playback duration derived from croppedEvents
  tempo: number;       // speed multiplier: 1.0 = normal
  transpose: number;   // semitone offset
  loopStart: number;
  loopEnd: number;
  loopEnabled: boolean;
  audioEnabled: boolean;

  // Crop (positions are in raw-event ms space)
  cropStart: number;
  cropEnd: number;

  // BPM
  detectedBpm: number;
  bpmAdjustment: number; // 0.9–1.1 multiplier applied by the user

  // Quantize
  quantizeEnabled: boolean;
  quantizeSubdivision: 4 | 8 | 16; // quarter / eighth / sixteenth
  quantizeStrength: number;         // 0.0 (none) → 1.0 (full)

  setEvents: (events: MidiEvent[], fileName: string) => void;
  setInstrument: (instrument: Instrument) => void;
  play: () => void;
  pause: () => void;
  seek: (ms: number) => void;
  setTempo: (tempo: number) => void;
  setTranspose: (semitones: number) => void;
  setLoop: (start: number, end: number) => void;
  toggleLoop: () => void;
  toggleAudio: () => void;

  // Crop actions
  setCropRange: (start: number, end: number) => void;
  applyCrop: () => void;
  resetCrop: () => void;

  // BPM actions
  setBpmAdjustment: (factor: number) => void;

  // Quantize actions
  toggleQuantize: () => void;
  setQuantizeSubdivision: (n: 4 | 8 | 16) => void;
  setQuantizeStrength: (s: number) => void;
};

export const usePlaybackStore = create<PlaybackState>((set, get) => {
  let engine: PlaybackEngine | null = null;
  let audioEngine: AudioEngine | null = null;

  if (typeof window !== "undefined") {
    engine = new PlaybackEngine((currentMs) => {
      set({ currentMs, isPlaying: engine!.isPlaying });
    });
    audioEngine = new AudioEngine();
  }

  /**
   * Runs the quantize → chord-detect pipeline and updates the audio engine.
   * Returns the derived fields to merge into state.
   */
  function downstream(
    croppedEvents: MidiEvent[],
    detectedBpm: number,
    bpmAdjustment: number,
    quantizeEnabled: boolean,
    quantizeSubdivision: 4 | 8 | 16,
    quantizeStrength: number
  ) {
    const activeBpm = detectedBpm * bpmAdjustment;
    const quantized =
      quantizeEnabled && quantizeStrength > 0
        ? quantizeEvents(croppedEvents, activeBpm, quantizeSubdivision, quantizeStrength)
        : [...croppedEvents];
    const chords = detectChords(quantized);
    const duration =
      croppedEvents.length > 0
        ? Math.max(...croppedEvents.map((e) => e.endMs))
        : 0;
    engine?.setDuration(duration);
    audioEngine?.load(quantized);
    return { quantizedEvents: quantized, chordEvents: chords, duration };
  }

  return {
    events: [],
    croppedEvents: [],
    quantizedEvents: [],
    chordEvents: [],
    instrument: "piano",
    fileName: null,
    currentMs: 0,
    isPlaying: false,
    duration: 0,
    tempo: 1,
    transpose: 0,
    loopStart: 0,
    loopEnd: 0,
    loopEnabled: false,
    audioEnabled: true,

    cropStart: 0,
    cropEnd: 0,

    detectedBpm: 120,
    bpmAdjustment: 1.0,

    quantizeEnabled: true,
    quantizeSubdivision: 8,
    quantizeStrength: 0.8,

    setEvents: (events, fileName) => {
      engine?.pause();
      engine?.seek(0);

      const rawDuration =
        events.length > 0 ? Math.max(...events.map((e) => e.endMs)) : 0;
      const bpm = detectBpm(events);
      const { quantizeEnabled, quantizeSubdivision, quantizeStrength } = get();
      const ds = downstream(events, bpm, 1.0, quantizeEnabled, quantizeSubdivision, quantizeStrength);

      set({
        events,
        croppedEvents: events,
        fileName,
        currentMs: 0,
        isPlaying: false,
        cropStart: 0,
        cropEnd: rawDuration,
        detectedBpm: bpm,
        bpmAdjustment: 1.0,
        loopStart: 0,
        loopEnd: ds.duration,
        loopEnabled: false,
        ...ds,
      });
    },

    setInstrument: (instrument) => set({ instrument }),

    play: () => {
      const { currentMs } = get();
      engine?.play();
      audioEngine?.play(currentMs);
      set({ isPlaying: true });
    },

    pause: () => {
      engine?.pause();
      audioEngine?.pause();
      set({ isPlaying: false });
    },

    seek: (ms) => {
      const { isPlaying } = get();
      engine?.seek(ms);
      audioEngine?.seek(ms, isPlaying);
    },

    setTempo: (tempo) => {
      const { currentMs, isPlaying } = get();
      engine?.setTempo(tempo);
      audioEngine?.setTempo(tempo, currentMs, isPlaying);
      set({ tempo });
    },

    setTranspose: (semitones) => {
      const { currentMs, isPlaying } = get();
      audioEngine?.setTranspose(semitones, currentMs, isPlaying);
      set({ transpose: semitones });
    },

    setLoop: (start, end) => {
      const { loopEnabled } = get();
      engine?.setLoop(loopEnabled, start, end);
      set({ loopStart: start, loopEnd: end });
    },

    toggleLoop: () => {
      const { loopEnabled, loopStart, loopEnd, duration } = get();
      const next = !loopEnabled;
      engine?.setLoop(next, loopStart, loopEnd || duration);
      set({ loopEnabled: next });
    },

    toggleAudio: () => {
      const { audioEnabled } = get();
      audioEngine?.setEnabled(!audioEnabled);
      set({ audioEnabled: !audioEnabled });
    },

    // ── Crop ─────────────────────────────────────────────────────────────────

    setCropRange: (start, end) => set({ cropStart: start, cropEnd: end }),

    applyCrop: () => {
      const {
        events,
        cropStart,
        cropEnd,
        quantizeEnabled,
        quantizeSubdivision,
        quantizeStrength,
      } = get();
      engine?.pause();
      engine?.seek(0);

      const cropped = cropEvents(events, cropStart, cropEnd);
      const bpm = detectBpm(cropped);
      const ds = downstream(cropped, bpm, 1.0, quantizeEnabled, quantizeSubdivision, quantizeStrength);

      set({
        croppedEvents: cropped,
        currentMs: 0,
        isPlaying: false,
        detectedBpm: bpm,
        bpmAdjustment: 1.0,
        loopStart: 0,
        loopEnd: ds.duration,
        loopEnabled: false,
        ...ds,
      });
    },

    resetCrop: () => {
      const { events, quantizeEnabled, quantizeSubdivision, quantizeStrength } = get();
      engine?.pause();
      engine?.seek(0);

      const rawDuration =
        events.length > 0 ? Math.max(...events.map((e) => e.endMs)) : 0;
      const bpm = detectBpm(events);
      const ds = downstream(events, bpm, 1.0, quantizeEnabled, quantizeSubdivision, quantizeStrength);

      set({
        croppedEvents: events,
        cropStart: 0,
        cropEnd: rawDuration,
        currentMs: 0,
        isPlaying: false,
        detectedBpm: bpm,
        bpmAdjustment: 1.0,
        loopStart: 0,
        loopEnd: ds.duration,
        loopEnabled: false,
        ...ds,
      });
    },

    // ── BPM ──────────────────────────────────────────────────────────────────

    setBpmAdjustment: (factor) => {
      const {
        croppedEvents,
        detectedBpm,
        quantizeEnabled,
        quantizeSubdivision,
        quantizeStrength,
      } = get();
      const ds = downstream(croppedEvents, detectedBpm, factor, quantizeEnabled, quantizeSubdivision, quantizeStrength);
      set({ bpmAdjustment: factor, ...ds });
    },

    // ── Quantize ─────────────────────────────────────────────────────────────

    toggleQuantize: () => {
      const {
        croppedEvents,
        detectedBpm,
        bpmAdjustment,
        quantizeEnabled,
        quantizeSubdivision,
        quantizeStrength,
      } = get();
      const next = !quantizeEnabled;
      const ds = downstream(croppedEvents, detectedBpm, bpmAdjustment, next, quantizeSubdivision, quantizeStrength);
      set({ quantizeEnabled: next, ...ds });
    },

    setQuantizeSubdivision: (n) => {
      const {
        croppedEvents,
        detectedBpm,
        bpmAdjustment,
        quantizeEnabled,
        quantizeStrength,
      } = get();
      const ds = downstream(croppedEvents, detectedBpm, bpmAdjustment, quantizeEnabled, n, quantizeStrength);
      set({ quantizeSubdivision: n, ...ds });
    },

    setQuantizeStrength: (s) => {
      const {
        croppedEvents,
        detectedBpm,
        bpmAdjustment,
        quantizeEnabled,
        quantizeSubdivision,
      } = get();
      const ds = downstream(croppedEvents, detectedBpm, bpmAdjustment, quantizeEnabled, quantizeSubdivision, s);
      set({ quantizeStrength: s, ...ds });
    },
  };
});
