import type { MidiEvent } from "./midi";

/**
 * Crops events to the window [cropStart, cropEnd) ms.
 * Notes that overlap a boundary are clamped (shortened) rather than discarded.
 * All timestamps are shifted so cropStart becomes 0.
 */
export function cropEvents(
  events: MidiEvent[],
  cropStart: number,
  cropEnd: number
): MidiEvent[] {
  return events
    .filter((e) => e.startMs < cropEnd && e.endMs > cropStart)
    .map((e) => ({
      ...e,
      startMs: Math.max(e.startMs, cropStart) - cropStart,
      endMs: Math.min(e.endMs, cropEnd) - cropStart,
    }))
    .sort((a, b) => a.startMs - b.startMs);
}
