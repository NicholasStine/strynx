import type { MidiEvent } from "./midi";

/**
 * Snaps each event's startMs toward the nearest point on a BPM-based rhythmic grid.
 *
 * @param events      - source events (not mutated)
 * @param bpm         - beats per minute (the active tempo)
 * @param subdivision - grid resolution: 4 = quarter, 8 = eighth, 16 = sixteenth note
 * @param strength    - 0.0 (no movement) → 1.0 (full snap to grid)
 */
export function quantizeEvents(
  events: MidiEvent[],
  bpm: number,
  subdivision: 4 | 8 | 16,
  strength: number
): MidiEvent[] {
  if (bpm <= 0 || strength <= 0) return [...events];

  // Grid interval in ms: one quarter note scaled by subdivision
  const gridMs = (60000 / bpm) * (4 / subdivision);

  return events.map((e) => {
    const target = Math.round(e.startMs / gridMs) * gridMs;
    const snapped = e.startMs + (target - e.startMs) * strength;
    return { ...e, startMs: Math.max(0, snapped) };
  });
}
