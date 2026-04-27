export type FretPosition = {
  string: number; // 0 = low E (thickest), 3 = G (thinnest)
  fret: number;   // 0 = open string
};

/** Standard 4-string bass tuning (low to high): E1 A1 D2 G2 */
export const BASS_STRINGS = [
  { name: "E1", openPitch: 28 }, // Low E
  { name: "A1", openPitch: 33 },
  { name: "D2", openPitch: 38 },
  { name: "G2", openPitch: 43 }, // G string
] as const;

/**
 * Maps a MIDI pitch to the lowest-fret bass position.
 * Prefers open strings; among equal frets, prefers the thinnest
 * (highest-indexed) string.
 *
 * @param pitch  - MIDI note number
 * @param tuning - optional alternate tuning (defaults to standard)
 * @returns FretPosition or null if pitch is out of range
 */
export function getFretPosition(
  pitch: number,
  tuning: readonly { openPitch: number }[] = BASS_STRINGS,
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
