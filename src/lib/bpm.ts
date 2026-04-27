import type { MidiEvent } from "./midi";

/**
 * Detects a working BPM from MIDI note events using an IOI histogram.
 * Returns a value in the 60–180 BPM range.
 * Falls back to 120 if the input is too sparse to make a reliable estimate.
 */
export function detectBpm(events: MidiEvent[]): number {
  if (events.length < 4) return 120;

  // Unique onset times (rounded to ms), sorted
  const onsets = [...new Set(events.map((e) => Math.round(e.startMs)))]
    .sort((a, b) => a - b);

  if (onsets.length < 4) return 120;

  // Consecutive inter-onset intervals, filtered to 30–2000 ms
  const iois: number[] = [];
  for (let i = 1; i < onsets.length; i++) {
    const d = onsets[i] - onsets[i - 1];
    if (d >= 30 && d <= 2000) iois.push(d);
  }

  if (iois.length < 3) return 120;

  // Histogram with 5 ms bins
  const BIN = 5;
  const hist = new Array(Math.ceil(2001 / BIN)).fill(0);
  for (const d of iois) {
    const bin = Math.min(Math.floor(d / BIN), hist.length - 1);
    hist[bin]++;
  }

  // 3-tap smoothing
  const smooth = hist.map(
    (v, i) => ((hist[i - 1] ?? 0) + v + (hist[i + 1] ?? 0)) / 3
  );

  // Find the peak bin
  const peakIdx = smooth.reduce(
    (best, v, i) => (v > smooth[best] ? i : best),
    0
  );
  const periodMs = (peakIdx + 0.5) * BIN;

  // Fold into 60–180 BPM (the mode IOI might be a sub-beat or super-beat)
  let bpm = 60000 / periodMs;
  while (bpm < 60) bpm *= 2;
  while (bpm > 180) bpm /= 2;

  return Math.round(bpm);
}
