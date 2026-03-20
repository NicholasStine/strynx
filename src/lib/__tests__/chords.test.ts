import { describe, it, expect } from "vitest";
import { detectChords } from "../chords";

const makeEvent = (startMs: number, endMs = 500, pitch = 60) => ({
  pitch,
  startMs,
  endMs,
  velocity: 80,
  channel: 0,
  track: 0,
});

describe("detectChords", () => {
  it("groups simultaneous notes into one chord", () => {
    const events = [makeEvent(0, 500, 60), makeEvent(5, 500, 64), makeEvent(8, 500, 67)];
    const result = detectChords(events, 20);
    expect(result).toHaveLength(1);
    expect(result[0].notes).toHaveLength(3);
    expect(result[0].startMs).toBe(0);
  });

  it("sets chord endMs to the max note endMs", () => {
    const events = [makeEvent(0, 300, 60), makeEvent(5, 700, 64)];
    const result = detectChords(events, 20);
    expect(result[0].endMs).toBe(700);
  });

  it("separates notes with onsets beyond the window", () => {
    const events = [makeEvent(0, 500, 60), makeEvent(100, 600, 64)];
    const result = detectChords(events, 20);
    expect(result).toHaveLength(2);
    expect(result[0].notes[0].pitch).toBe(60);
    expect(result[1].notes[0].pitch).toBe(64);
  });

  it("handles a single note", () => {
    const result = detectChords([makeEvent(0)]);
    expect(result).toHaveLength(1);
    expect(result[0].notes).toHaveLength(1);
  });

  it("handles an empty array", () => {
    expect(detectChords([])).toEqual([]);
  });

  it("uses the first note startMs as chord startMs", () => {
    const events = [makeEvent(10, 500, 60), makeEvent(15, 500, 64)];
    const result = detectChords(events, 20);
    expect(result[0].startMs).toBe(10);
  });

  it("sorts unsorted input correctly", () => {
    const events = [makeEvent(100, 500, 64), makeEvent(0, 500, 60)];
    const result = detectChords(events, 20);
    // Notes are far apart — two chords
    expect(result).toHaveLength(2);
    expect(result[0].startMs).toBe(0);
    expect(result[1].startMs).toBe(100);
  });

  it("respects window boundary exactly", () => {
    const events = [makeEvent(0, 500, 60), makeEvent(20, 500, 64)];
    // window = 20: startMs difference = 20 which is <= 20, so grouped
    const grouped = detectChords(events, 20);
    expect(grouped).toHaveLength(1);

    // window = 19: startMs difference = 20 which is > 19, so separated
    const separated = detectChords(events, 19);
    expect(separated).toHaveLength(2);
  });
});
