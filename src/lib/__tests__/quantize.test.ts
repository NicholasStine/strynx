import { describe, it, expect } from "vitest";
import { quantizeEvents } from "../quantize";

// At 120 BPM: quarter = 500 ms, eighth = 250 ms, sixteenth = 125 ms
const BPM = 120;

const makeEvent = (startMs: number, endMs = 500) => ({
  pitch: 60,
  startMs,
  endMs,
  velocity: 80,
  channel: 0,
  track: 0,
});

describe("quantizeEvents", () => {
  it("snaps to nearest eighth-note grid at full strength", () => {
    // gridMs = 250. Note at 130 ms → nearest grid: 250 ms
    const result = quantizeEvents([makeEvent(130)], BPM, 8, 1.0);
    expect(result[0].startMs).toBeCloseTo(250);
  });

  it("snaps to 0 when closer to the left grid boundary", () => {
    // gridMs = 250. Note at 100 ms → nearest grid: 0 ms (100 < 125 midpoint)
    const result = quantizeEvents([makeEvent(100)], BPM, 8, 1.0);
    expect(result[0].startMs).toBeCloseTo(0);
  });

  it("interpolates at partial strength", () => {
    // Note at 130 ms, target 250 ms, strength 0.5 → 130 + (250-130)*0.5 = 190
    const result = quantizeEvents([makeEvent(130)], BPM, 8, 0.5);
    expect(result[0].startMs).toBeCloseTo(190);
  });

  it("does not move notes when strength is 0", () => {
    const result = quantizeEvents([makeEvent(130)], BPM, 8, 0);
    expect(result[0].startMs).toBe(130);
  });

  it("snaps to quarter-note grid", () => {
    // gridMs = 500. Note at 260 ms → nearest grid: 500 ms
    const result = quantizeEvents([makeEvent(260)], BPM, 4, 1.0);
    expect(result[0].startMs).toBeCloseTo(500);
  });

  it("snaps to sixteenth-note grid", () => {
    // gridMs = 125. Note at 70 ms → nearest grid: 125 ms (70 > 62.5 midpoint)
    const result = quantizeEvents([makeEvent(70)], BPM, 16, 1.0);
    expect(result[0].startMs).toBeCloseTo(125);
  });

  it("does not mutate the original events", () => {
    const events = [makeEvent(130)];
    quantizeEvents(events, BPM, 8, 1.0);
    expect(events[0].startMs).toBe(130);
  });

  it("preserves all fields other than startMs", () => {
    const e = { pitch: 64, startMs: 130, endMs: 300, velocity: 100, channel: 1, track: 2 };
    const result = quantizeEvents([e], BPM, 8, 1.0);
    expect(result[0].pitch).toBe(64);
    expect(result[0].endMs).toBe(300);
    expect(result[0].velocity).toBe(100);
    expect(result[0].channel).toBe(1);
    expect(result[0].track).toBe(2);
  });

  it("handles an empty array", () => {
    expect(quantizeEvents([], BPM, 8, 1.0)).toEqual([]);
  });

  it("returns a copy when bpm <= 0", () => {
    const events = [makeEvent(130)];
    const result = quantizeEvents(events, 0, 8, 1.0);
    expect(result[0].startMs).toBe(130);
    expect(result).not.toBe(events);
  });

  it("clamps snapped startMs to >= 0", () => {
    // Note at 10 ms with large grid and full strength could theoretically snap to 0
    const result = quantizeEvents([makeEvent(10)], BPM, 8, 1.0);
    expect(result[0].startMs).toBeGreaterThanOrEqual(0);
  });

  it("notes already on the grid stay in place", () => {
    const result = quantizeEvents([makeEvent(250), makeEvent(500)], BPM, 8, 1.0);
    expect(result[0].startMs).toBeCloseTo(250);
    expect(result[1].startMs).toBeCloseTo(500);
  });
});
