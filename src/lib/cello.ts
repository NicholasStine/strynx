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

export const CELLO_MAX_POSITION = 7;

/**
 * Semitone span reachable on a single string for a given hand position.
 * Position 1: [0, 7] (open through 4th finger, ~a fifth).
 * Each subsequent position shifts the window up by 2 semitones.
 */
export function positionSemitoneRange(position: number): [number, number] {
  const start = Math.max(0, (position - 1) * 2);
  return [start, start + 7];
}

/**
 * Maps a MIDI pitch to cello string and finger position within the given
 * position range. Iterates positions from lowest to highest (strongly
 * prefers first position), and within each position prefers the highest-
 * tuned string (A > D > G > C). Returns null if unreachable in range.
 */
export function pitchToFingering(
  pitch: number,
  positionRange: [number, number] = [1, 1],
): CelloFingering | null {
  const [minPos, maxPos] = positionRange;
  for (let pos = minPos; pos <= maxPos; pos++) {
    const [semMin, semMax] = positionSemitoneRange(pos);
    for (let s = 3; s >= 0; s--) {
      const semitonesAboveOpen = pitch - CELLO_STRINGS[s].openPitch;
      if (semitonesAboveOpen >= semMin && semitonesAboveOpen <= semMax) {
        return { stringIndex: s, position: semitonesAboveOpen };
      }
    }
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
