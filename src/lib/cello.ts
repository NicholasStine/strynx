import type { MidiEvent } from "./midi";

export const CELLO_STRINGS = [
  { name: "C", openPitch: 36 }, // C2
  { name: "G", openPitch: 43 }, // G2
  { name: "D", openPitch: 50 }, // D3
  { name: "A", openPitch: 57 }, // A3
] as const;

const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
];

export type CelloFingering = {
  stringIndex: number; // 0=C, 1=G, 2=D, 3=A
  position: number;    // semitones above open string (0 = open)
};

/**
 * Maps a MIDI pitch to the most natural cello string and finger position.
 * Prefers the highest string where the note falls within first position
 * (≤ 12 semitones above open). Extends onto the A string beyond that.
 * Returns null for pitches below C2 (MIDI 36).
 */
export function pitchToFingering(pitch: number): CelloFingering | null {
  // Try from highest string (A=3) to lowest (C=0)
  for (let s = 3; s >= 0; s--) {
    const pos = pitch - CELLO_STRINGS[s].openPitch;
    if (pos >= 0 && pos <= 12) {
      return { stringIndex: s, position: pos };
    }
  }
  // Extend onto A string for higher positions (thumb position territory)
  const aPos = pitch - CELLO_STRINGS[3].openPitch;
  if (aPos > 12 && aPos <= 36) {
    return { stringIndex: 3, position: aPos };
  }
  return null;
}

export function noteNameShort(pitch: number): string {
  return NOTE_NAMES[pitch % 12];
}

// ── Shared SVG layout constants (used by both CelloFingerboard and CelloFallingNotes) ──

/** Number of pixels between string centre lines */
export const CELLO_LANE_WIDTH = 60;

/** Total SVG width (4 lanes + 20px margin each side) */
export const CELLO_SVG_WIDTH = CELLO_LANE_WIDTH * CELLO_STRINGS.length + 40; // 280

/** Centre x-coordinate for each string lane (C, G, D, A) */
export const CELLO_STRING_X = [50, 110, 170, 230] as const;
