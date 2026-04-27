import type { MidiEvent } from "./midi";

export type ChordEvent = {
  /** Quantized onset shared by all notes in the chord */
  startMs: number;
  /** Max endMs across member notes */
  endMs: number;
  /** All simultaneous notes */
  notes: MidiEvent[];
};

/**
 * Groups MIDI events whose startMs values fall within windowMs of each other
 * into ChordEvents. Assumes events have already been quantized.
 *
 * @param events  - MidiEvent array (should be quantized first)
 * @param windowMs - max onset difference to group as a chord (default 20 ms)
 */
export function detectChords(events: MidiEvent[], windowMs = 50): ChordEvent[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort((a, b) => a.startMs - b.startMs);
  const chords: ChordEvent[] = [];
  let i = 0;

  while (i < sorted.length) {
    const anchor = sorted[i].startMs;
    const group: MidiEvent[] = [];
    let j = i;

    while (j < sorted.length && sorted[j].startMs - anchor <= windowMs) {
      group.push(sorted[j]);
      j++;
    }

    chords.push({
      startMs: anchor,
      endMs: Math.max(...group.map((e) => e.endMs)),
      notes: group,
    });

    i = j;
  }

  return chords;
}
