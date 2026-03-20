import { describe, it, expect } from "vitest";
import { quantizeEvents } from "../quantize";

const makeEvent = (startMs: number, endMs = 500) => ({
  pitch: 60,
  startMs,
  endMs,
  velocity: 80,
  channel: 0,
  track: 0,
});

describe("quantizeEvents", () => {
  it("snaps startMs to the nearest grid multiple", () => {
    const events = [makeEvent(13), makeEvent(27)];
    const result = quantizeEvents(events, 10);
    expect(result[0].startMs).toBe(10);
    expect(result[1].startMs).toBe(30);
  });

  it("rounds up when closer to the next grid multiple", () => {
    const result = quantizeEvents([makeEvent(16)], 10);
    expect(result[0].startMs).toBe(20);
  });

  it("does not mutate the original events", () => {
    const events = [makeEvent(13)];
    quantizeEvents(events, 10);
    expect(events[0].startMs).toBe(13);
  });

  it("preserves all fields other than startMs", () => {
    const events = [{ pitch: 64, startMs: 13, endMs: 300, velocity: 100, channel: 1, track: 2 }];
    const result = quantizeEvents(events, 10);
    const e = result[0];
    expect(e.pitch).toBe(64);
    expect(e.endMs).toBe(300);
    expect(e.velocity).toBe(100);
    expect(e.channel).toBe(1);
    expect(e.track).toBe(2);
  });

  it("handles an empty array", () => {
    expect(quantizeEvents([], 10)).toEqual([]);
  });

  it("returns a copy when gridMs <= 0", () => {
    const events = [makeEvent(13)];
    const result = quantizeEvents(events, 0);
    expect(result[0].startMs).toBe(13);
    expect(result).not.toBe(events);
  });

  it("snaps notes already on the grid to the same value", () => {
    const events = [makeEvent(20), makeEvent(40)];
    const result = quantizeEvents(events, 10);
    expect(result[0].startMs).toBe(20);
    expect(result[1].startMs).toBe(40);
  });
});
