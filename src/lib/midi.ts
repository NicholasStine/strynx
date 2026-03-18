import { Midi } from "@tonejs/midi";

export type MidiEvent = {
  pitch: number;
  startMs: number;
  endMs: number;
  velocity: number;
  channel: number;
  track: number;
};

export function parseMidi(buffer: ArrayBuffer): MidiEvent[] {
  const midi = new Midi(buffer);
  const events: MidiEvent[] = [];

  midi.tracks.forEach((track, trackIndex) => {
    track.notes.forEach((note) => {
      events.push({
        pitch: note.midi,
        startMs: note.time * 1000,
        endMs: (note.time + note.duration) * 1000,
        velocity: Math.round(note.velocity * 127),
        channel: track.channel ?? 0,
        track: trackIndex,
      });
    });
  });

  // Sort by start time
  events.sort((a, b) => a.startMs - b.startMs);

  return events;
}
