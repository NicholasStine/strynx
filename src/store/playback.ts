import { create } from "zustand";
import { MidiEvent } from "@/lib/midi";
import { PlaybackEngine } from "@/lib/playback-engine";
import { AudioEngine } from "@/lib/audio-engine";

type Instrument = "piano" | "cello";

type PlaybackState = {
  events: MidiEvent[];
  instrument: Instrument;
  fileName: string | null;
  currentMs: number;
  isPlaying: boolean;
  duration: number;
  tempo: number;      // speed multiplier: 1.0 = normal, 0.5 = half speed
  transpose: number;  // semitone offset: -12 to +12
  loopStart: number;
  loopEnd: number;
  loopEnabled: boolean;
  audioEnabled: boolean;

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
};

export const usePlaybackStore = create<PlaybackState>((set, get) => {
  // Engines live in closure — not part of reactive state
  let engine: PlaybackEngine | null = null;
  let audioEngine: AudioEngine | null = null;

  if (typeof window !== "undefined") {
    engine = new PlaybackEngine((currentMs) => {
      set({ currentMs, isPlaying: engine!.isPlaying });
    });
    audioEngine = new AudioEngine();
  }

  return {
    events: [],
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

    setEvents: (events, fileName) => {
      engine?.pause();
      audioEngine?.load(events);
      const duration =
        events.length > 0 ? Math.max(...events.map((e) => e.endMs)) : 0;
      engine?.setDuration(duration);
      engine?.seek(0);
      set({
        events,
        fileName,
        duration,
        currentMs: 0,
        isPlaying: false,
        loopStart: 0,
        loopEnd: duration,
        loopEnabled: false,
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
      const next = !audioEnabled;
      audioEngine?.setEnabled(next);
      set({ audioEnabled: next });
    },
  };
});
