"use client";

import type { MidiEvent } from "@/lib/midi";

// Must match PianoKeyboard constants exactly
const MIDI_MIN = 21;
const MIDI_MAX = 108;
const WHITE_W = 24;
const BLACK_W = 14;
const BLACK_KEY_SEMITONES = new Set([1, 3, 6, 8, 10]);

function isBlackKey(midi: number) {
  return BLACK_KEY_SEMITONES.has(midi % 12);
}

function whiteKeysBefore(midi: number) {
  let count = 0;
  for (let m = MIDI_MIN; m < midi; m++) {
    if (!isBlackKey(m)) count++;
  }
  return count;
}

function keyX(midi: number) {
  if (!isBlackKey(midi)) {
    return whiteKeysBefore(midi) * WHITE_W;
  }
  return whiteKeysBefore(midi) * WHITE_W - BLACK_W / 2;
}

function totalWhiteKeys() {
  let count = 0;
  for (let m = MIDI_MIN; m <= MIDI_MAX; m++) {
    if (!isBlackKey(m)) count++;
  }
  return count;
}

const TOTAL_WHITE = totalWhiteKeys();
export const SVG_WIDTH = TOTAL_WHITE * WHITE_W;
export const FALL_HEIGHT = 240;

// How many milliseconds of lookahead to show
const LOOKAHEAD_MS = 2000;
// Minimum visual height so very short notes are still clickable/visible
const MIN_NOTE_H = 6;

type Props = {
  events: MidiEvent[];
  currentMs: number;
  transpose: number;
};

export default function FallingNotes({ events, currentMs, transpose }: Props) {
  // Only process notes in the visible window
  const visibleStart = currentMs;
  const visibleEnd = currentMs + LOOKAHEAD_MS;

  return (
    <svg
      width={SVG_WIDTH}
      height={FALL_HEIGHT}
      viewBox={`0 0 ${SVG_WIDTH} ${FALL_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      {/* Dark background */}
      <rect width={SVG_WIDTH} height={FALL_HEIGHT} fill="#09090b" />

      {/* Subtle vertical lane dividers for each white key column */}
      {Array.from({ length: TOTAL_WHITE + 1 }, (_, i) => (
        <line
          key={i}
          x1={i * WHITE_W}
          y1={0}
          x2={i * WHITE_W}
          y2={FALL_HEIGHT}
          stroke="#27272a"
          strokeWidth={0.5}
        />
      ))}

      {/* Falling note blocks — black keys rendered last so they appear on top */}
      {[false, true].map((renderBlack) =>
        events
          .filter((e) => e.startMs < visibleEnd && e.endMs > visibleStart)
          .map((event, i) => {
            const pitch = Math.max(
              MIDI_MIN,
              Math.min(MIDI_MAX, event.pitch + transpose),
            );
            const black = isBlackKey(pitch);
            if (black !== renderBlack) return null;

            const x = keyX(pitch);
            const w = black ? BLACK_W - 1 : WHITE_W - 2;

            // Bottom of block = moment the note starts (hits the keyboard)
            // Top of block    = moment the note ends
            // y = 0 at top (future), y = FALL_HEIGHT at bottom (now line)
            const yBottom =
              FALL_HEIGHT * (1 - (event.startMs - currentMs) / LOOKAHEAD_MS);
            const yTop =
              FALL_HEIGHT * (1 - (event.endMs - currentMs) / LOOKAHEAD_MS);

            // Enforce minimum visual height, anchored to bottom edge
            const rawH = Math.max(MIN_NOTE_H, yBottom - yTop);
            const adjustedTop = yBottom - rawH;

            // Clip to canvas
            const clippedY = Math.max(0, adjustedTop);
            const clippedBottom = Math.min(FALL_HEIGHT, yBottom);
            const clippedH = clippedBottom - clippedY;
            if (clippedH <= 0) return null;

            const isActive =
              currentMs >= event.startMs && currentMs < event.endMs;

            return (
              <rect
                key={`${event.pitch}-${event.startMs}-${i}`}
                x={x + (black ? 0.5 : 1)}
                y={clippedY}
                width={w}
                height={clippedH}
                rx={3}
                fill={black ? "#4338ca" : "#6366f1"}
                opacity={isActive ? 1 : 0.88}
                stroke={isActive ? "#a5b4fc" : "#818cf8"}
                strokeWidth={0.5}
              />
            );
          }),
      )}

      {/* "Now" line — where notes hit the keyboard */}
      <line
        x1={0}
        y1={FALL_HEIGHT - 1}
        x2={SVG_WIDTH}
        y2={FALL_HEIGHT - 1}
        stroke="#6366f1"
        strokeWidth={2}
        opacity={0.7}
      />
    </svg>
  );
}
