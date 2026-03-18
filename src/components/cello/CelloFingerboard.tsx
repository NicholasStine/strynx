"use client";

import {
  CELLO_STRINGS,
  CELLO_SVG_WIDTH,
  CELLO_STRING_X,
  pitchToFingering,
  noteNameShort,
} from "@/lib/cello";

const NUT_Y = 28;         // y of the nut / open-string position
const POSITION_H = 16;    // pixels per semitone step down the string
const MAX_POSITIONS = 28; // how many positions to draw below the nut (covers up to ~B5 on A string)
const BOARD_HEIGHT = NUT_Y + (MAX_POSITIONS + 1) * POSITION_H + 16;

const posY = (pos: number) => NUT_Y + pos * POSITION_H;

type Props = {
  activeNotes: number[]; // transposed MIDI pitches currently sounding
};

export default function CelloFingerboard({ activeNotes }: Props) {
  // Build a set of active fingerings; keep only in-range notes
  const activeFingerings = activeNotes
    .map((pitch) => ({ pitch, fingering: pitchToFingering(pitch) }))
    .filter((x) => x.fingering !== null) as Array<{
      pitch: number;
      fingering: NonNullable<ReturnType<typeof pitchToFingering>>;
    }>;

  return (
    <svg
      width={CELLO_SVG_WIDTH}
      height={BOARD_HEIGHT}
      viewBox={`0 0 ${CELLO_SVG_WIDTH} ${BOARD_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
      aria-label="Cello fingerboard"
    >
      {/* Background */}
      <rect width={CELLO_SVG_WIDTH} height={BOARD_HEIGHT} fill="#1c1917" />

      {/* String name labels */}
      {CELLO_STRINGS.map((s, i) => (
        <text
          key={s.name}
          x={CELLO_STRING_X[i]}
          y={NUT_Y - 10}
          textAnchor="middle"
          fontSize={11}
          fontFamily="system-ui, sans-serif"
          fontWeight="600"
          fill="#a8a29e"
        >
          {s.name}
        </text>
      ))}

      {/* Nut (thick horizontal bar at NUT_Y) */}
      <rect
        x={22}
        y={NUT_Y - 3}
        width={CELLO_SVG_WIDTH - 44}
        height={5}
        rx={1}
        fill="#a8a29e"
      />

      {/* Fret guide lines */}
      {Array.from({ length: MAX_POSITIONS }, (_, i) => {
        const pos = i + 1; // skip 0 (that's the nut)
        const y = posY(pos);
        const isOctave = pos === 12;
        return (
          <line
            key={pos}
            x1={22}
            y1={y}
            x2={CELLO_SVG_WIDTH - 22}
            y2={y}
            stroke={isOctave ? "#78716c" : "#3c3836"}
            strokeWidth={isOctave ? 1.5 : 0.5}
            strokeDasharray={isOctave ? undefined : "3 3"}
          />
        );
      })}

      {/* Strings — thicker for lower-pitched strings */}
      {CELLO_STRINGS.map((s, i) => (
        <line
          key={s.name}
          x1={CELLO_STRING_X[i]}
          y1={NUT_Y + 2}
          x2={CELLO_STRING_X[i]}
          y2={BOARD_HEIGHT - 8}
          stroke="#78716c"
          strokeWidth={[2.5, 2, 1.5, 1][i]}
        />
      ))}

      {/* Active note markers */}
      {activeFingerings.map(({ pitch, fingering }) => {
        const cx = CELLO_STRING_X[fingering.stringIndex];
        const cy = posY(fingering.position);
        const label = noteNameShort(pitch);
        const isOpen = fingering.position === 0;

        return (
          <g key={`${pitch}-${fingering.stringIndex}-${fingering.position}`}>
            <circle
              cx={cx}
              cy={cy}
              r={12}
              fill={isOpen ? "transparent" : "#6366f1"}
              stroke="#6366f1"
              strokeWidth={isOpen ? 2.5 : 0}
            />
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fontSize={9}
              fontFamily="system-ui, sans-serif"
              fontWeight="700"
              fill={isOpen ? "#6366f1" : "#ffffff"}
              pointerEvents="none"
            >
              {isOpen ? "O" : label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
