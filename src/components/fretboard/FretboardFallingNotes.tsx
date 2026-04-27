"use client";

import type { ChordEvent } from "@/lib/chords";

// ── Layout constants (must match Fretboard.tsx) ───────────────────────────────
const LANE_WIDTH = 50;
const MARGIN = 20;

export const FALL_HEIGHT = 240;
const LOOKAHEAD_MS = 2000;
const MIN_NOTE_H = 6;
const NOTE_W = 36; // block width, centred in the 50-unit lane

function svgWidth(stringCount: number) {
  return stringCount * LANE_WIDTH + 2 * MARGIN;
}

function stringX(i: number) {
  return MARGIN + (i + 0.5) * LANE_WIDTH;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type StringDef = { name: string; openPitch: number };

type NoteBlock = {
  key: string;
  x: number;
  clippedY: number;
  clippedH: number;
  isActive: boolean;
};

type Props = {
  strings: readonly StringDef[];
  chordEvents: ChordEvent[];
  currentMs: number;
  transpose: number;
  getFretPosition: (pitch: number) => { string: number; fret: number } | null;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function FretboardFallingNotes({
  strings,
  chordEvents,
  currentMs,
  transpose,
  getFretPosition,
}: Props) {
  const width = svgWidth(strings.length);
  const visibleEnd = currentMs + LOOKAHEAD_MS;

  // Build flat list of visible note blocks
  const blocks: NoteBlock[] = [];

  for (const chord of chordEvents) {
    if (chord.startMs >= visibleEnd || chord.endMs <= currentMs) continue;

    for (let ni = 0; ni < chord.notes.length; ni++) {
      const note = chord.notes[ni];
      if (note.startMs >= visibleEnd || note.endMs <= currentMs) continue;

      const pitch = note.pitch + transpose;
      const pos = getFretPosition(pitch);
      if (!pos) continue;

      const cx = stringX(pos.string);
      const x = cx - NOTE_W / 2;

      // y=0 is top (future), y=FALL_HEIGHT is the "now" line
      // Use chord.startMs so all notes in a chord align at the same vertical position
      const yBottom = FALL_HEIGHT * (1 - (chord.startMs - currentMs) / LOOKAHEAD_MS);
      const yTop = FALL_HEIGHT * (1 - (note.endMs - currentMs) / LOOKAHEAD_MS);

      const rawH = Math.max(MIN_NOTE_H, yBottom - yTop);
      const adjustedTop = yBottom - rawH;

      const clippedY = Math.max(0, adjustedTop);
      const clippedBottom = Math.min(FALL_HEIGHT, yBottom);
      const clippedH = clippedBottom - clippedY;
      if (clippedH <= 0) continue;

      const isActive = currentMs >= chord.startMs && currentMs < note.endMs;

      blocks.push({
        key: `${pitch}-${note.startMs}-${ni}`,
        x,
        clippedY,
        clippedH,
        isActive,
      });
    }
  }

  return (
    <svg
      width={width}
      height={FALL_HEIGHT}
      viewBox={`0 0 ${width} ${FALL_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      {/* Dark background */}
      <rect width={width} height={FALL_HEIGHT} fill="#09090b" />

      {/* Lane dividers */}
      {Array.from({ length: strings.length + 1 }, (_, i) => (
        <line
          key={i}
          x1={MARGIN + i * LANE_WIDTH}
          y1={0}
          x2={MARGIN + i * LANE_WIDTH}
          y2={FALL_HEIGHT}
          stroke="#27272a"
          strokeWidth={0.5}
        />
      ))}

      {/* String name labels */}
      {strings.map((s, i) => (
        <text
          key={s.name}
          x={stringX(i)}
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
      {blocks.map(({ key, x, clippedY, clippedH, isActive }) => (
        <rect
          key={key}
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
      ))}

      {/* "Now" line */}
      <line
        x1={0}
        y1={FALL_HEIGHT - 1}
        x2={width}
        y2={FALL_HEIGHT - 1}
        stroke="#6366f1"
        strokeWidth={2}
        opacity={0.7}
      />
    </svg>
  );
}
