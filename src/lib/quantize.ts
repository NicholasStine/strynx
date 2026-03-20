import type { MidiEvent } from "./midi";

/**
 * Snaps each event's startMs to the nearest multiple of gridMs.
 * Returns a new array — the original events are not mutated.
 */
export function quantizeEvents(events: MidiEvent[], gridMs: number): MidiEvent[] {
  if (gridMs <= 0) return [...events];
  return events.map((e) => ({
    ...e,
    startMs: Math.round(e.startMs / gridMs) * gridMs,
  }));
}
