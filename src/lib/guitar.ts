export type FretPosition = {
  string: number; // 0 = low E (thickest), 5 = high E (thinnest)
  fret: number;   // 0 = open string
};

/** Standard guitar tuning (low to high): E2 A2 D3 G3 B3 E4 */
export const GUITAR_STRINGS = [
  { name: "E2", openPitch: 40 }, // Low E
  { name: "A2", openPitch: 45 },
  { name: "D3", openPitch: 50 },
  { name: "G3", openPitch: 55 },
  { name: "B3", openPitch: 59 },
  { name: "E4", openPitch: 64 }, // High E
] as const;

/**
 * Maps a MIDI pitch to the lowest-fret guitar position.
 * Prefers open strings; among equal frets, prefers the thinnest
 * (highest-indexed) string.
 *
 * @param pitch  - MIDI note number
 * @param tuning - optional alternate tuning (defaults to standard)
 * @returns FretPosition or null if pitch is out of range
 */
export function getFretPosition(
  pitch: number,
  tuning: readonly { openPitch: number }[] = GUITAR_STRINGS,
  fretRange: [number, number] = [0, 24]
): FretPosition | null {
  const [minFret, maxFret] = fretRange;
  let best: FretPosition | null = null;

  for (let s = 0; s < tuning.length; s++) {
    const fret = pitch - tuning[s].openPitch;
    if (fret < minFret || fret > maxFret) continue;
    if (
      best === null ||
      fret < best.fret ||
      (fret === best.fret && s > best.string)
    ) {
      best = { string: s, fret };
    }
  }

  return best;
}
