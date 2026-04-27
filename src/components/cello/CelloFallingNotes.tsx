"use client";

import type { MidiEvent } from "@/lib/midi";
import {
  CELLO_STRINGS,
  CELLO_SVG_WIDTH,
  CELLO_LANE_WIDTH,
  CELLO_STRING_X,
  pitchToFingering,
} from "@/lib/cello";

export const FALL_HEIGHT = 240;

const LOOKAHEAD_MS = 2000;
const MIN_NOTE_H = 6;
const NOTE_W = 40; // note block width, centred in the 60-unit lane

type Props = {
  events: MidiEvent[];
  currentMs: number;
  transpose: number;
  positionRange?: [number, number];
};

export default function CelloFallingNotes({ events, currentMs, transpose, positionRange = [1, 1] }: Props) {
  const visibleEnd = currentMs + LOOKAHEAD_MS;

  return (
    <svg
      width={CELLO_SVG_WIDTH}
      height={FALL_HEIGHT}
      viewBox={`0 0 ${CELLO_SVG_WIDTH} ${FALL_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      {/* Dark background */}
      <rect width={CELLO_SVG_WIDTH} height={FALL_HEIGHT} fill="#09090b" />

      {/* Lane dividers */}
      {Array.from({ length: CELLO_STRINGS.length + 1 }, (_, i) => (
        <line
          key={i}
          x1={20 + i * CELLO_LANE_WIDTH}
          y1={0}
          x2={20 + i * CELLO_LANE_WIDTH}
          y2={FALL_HEIGHT}
          stroke="#27272a"
          strokeWidth={0.5}
        />
      ))}

      {/* String name labels in falling area */}
      {CELLO_STRINGS.map((s, i) => (
        <text
          key={s.name}
          x={CELLO_STRING_X[i]}
          y={16}
          textAnchor="middle"
          fontSize={10}
          fontFamily="system-ui, sans-serif"
          fill="#52525b"
        >
          {s.name}
        </text>
      ))}

      {/* Falling note blocks */}
      {events
        .filter((e) => e.startMs < visibleEnd && e.endMs > currentMs)
        .map((event, i) => {
          const pitch = event.pitch + transpose;
          const fingering = pitchToFingering(pitch, positionRange);
          if (!fingering) return null;

          const cx = CELLO_STRING_X[fingering.stringIndex];
          const x = cx - NOTE_W / 2;

          // Bottom edge = note start (when it hits the "now" line)
          // Top edge    = note end (how long you hold)
          // y = 0 at top (future), y = FALL_HEIGHT at bottom (now)
          const yBottom =
            FALL_HEIGHT * (1 - (event.startMs - currentMs) / LOOKAHEAD_MS);
          const yTop =
            FALL_HEIGHT * (1 - (event.endMs - currentMs) / LOOKAHEAD_MS);

          const rawH = Math.max(MIN_NOTE_H, yBottom - yTop);
          const adjustedTop = yBottom - rawH;

          const clippedY = Math.max(0, adjustedTop);
          const clippedBottom = Math.min(FALL_HEIGHT, yBottom);
          const clippedH = clippedBottom - clippedY;
          if (clippedH <= 0) return null;

          const isActive = currentMs >= event.startMs && currentMs < event.endMs;

          return (
            <rect
              key={`${event.pitch}-${event.startMs}-${i}`}
              x={x}
              y={clippedY}
              width={NOTE_W}
              height={clippedH}
              rx={4}
              fill="#6366f1"
              opacity={isActive ? 1 : 0.88}
              stroke={isActive ? "#a5b4fc" : "#818cf8"}
              strokeWidth={0.5}
            />
          );
        })}

      {/* "Now" line — where notes hit the fingerboard */}
      <line
        x1={0}
        y1={FALL_HEIGHT - 1}
        x2={CELLO_SVG_WIDTH}
        y2={FALL_HEIGHT - 1}
        stroke="#6366f1"
        strokeWidth={2}
        opacity={0.7}
      />
    </svg>
  );
}
