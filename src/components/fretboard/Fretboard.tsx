"use client";

// ── Layout constants ──────────────────────────────────────────────────────────
const LANE_WIDTH = 50;   // pixels between string centre lines
const MARGIN = 20;       // left/right margin
const NUT_Y = 28;        // y of the nut
const FRET_H = 16;       // pixels per fret
const MAX_FRETS = 24;

const FRET_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21]; // standard inlay positions
const DOUBLE_FRET_MARKERS = new Set([12]);

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const BOARD_HEIGHT = NUT_Y + (MAX_FRETS + 1) * FRET_H + 16;

export function fretboardSvgWidth(stringCount: number) {
  return stringCount * LANE_WIDTH + 2 * MARGIN;
}

function stringX(i: number) {
  return MARGIN + (i + 0.5) * LANE_WIDTH;
}

/** y coordinate for an active-note dot: centre of fret space, nut for open */
function fretDotY(fret: number) {
  return fret === 0 ? NUT_Y : NUT_Y + (fret - 0.5) * FRET_H;
}

/** y coordinate for a fret wire line */
function fretWireY(fret: number) {
  return NUT_Y + fret * FRET_H;
}

function noteNameShort(pitch: number) {
  return NOTE_NAMES[pitch % 12];
}

// ── Types ─────────────────────────────────────────────────────────────────────

type StringDef = { name: string; openPitch: number };

type Props = {
  strings: readonly StringDef[];
  activePositions: Array<{ string: number; fret: number; pitch: number }>;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Fretboard({ strings, activePositions }: Props) {
  const width = fretboardSvgWidth(strings.length);
  const midX = width / 2;

  // String thicknesses taper from thickest (index 0) to thinnest (last index)
  const stringThicknesses = strings.map((_, i) => {
    const ratio = 1 - i / Math.max(strings.length - 1, 1);
    return 0.7 + ratio * 1.8; // 2.5 → 0.7
  });

  return (
    <svg
      width={width}
      height={BOARD_HEIGHT}
      viewBox={`0 0 ${width} ${BOARD_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
      aria-label="Fretboard"
    >
      {/* Background */}
      <rect width={width} height={BOARD_HEIGHT} fill="#1c1917" />

      {/* String name labels */}
      {strings.map((s, i) => (
        <text
          key={s.name}
          x={stringX(i)}
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

      {/* Nut */}
      <rect
        x={MARGIN + 2}
        y={NUT_Y - 3}
        width={width - MARGIN * 2 - 4}
        height={5}
        rx={1}
        fill="#a8a29e"
      />

      {/* Fret wires */}
      {Array.from({ length: MAX_FRETS }, (_, i) => {
        const fret = i + 1;
        const y = fretWireY(fret);
        const isOctave = fret === 12 || fret === 24;
        return (
          <line
            key={fret}
            x1={MARGIN + 2}
            y1={y}
            x2={width - MARGIN - 2}
            y2={y}
            stroke={isOctave ? "#78716c" : "#3c3836"}
            strokeWidth={isOctave ? 1.5 : 0.8}
          />
        );
      })}

      {/* Fret marker inlays */}
      {FRET_MARKERS.filter((f) => f <= MAX_FRETS).map((fret) => {
        const y = NUT_Y + (fret - 0.5) * FRET_H;
        const isDouble = DOUBLE_FRET_MARKERS.has(fret);
        return isDouble ? (
          <g key={fret}>
            <circle cx={midX - LANE_WIDTH * 0.7} cy={y} r={4} fill="#3c3836" />
            <circle cx={midX + LANE_WIDTH * 0.7} cy={y} r={4} fill="#3c3836" />
          </g>
        ) : (
          <circle key={fret} cx={midX} cy={y} r={4} fill="#3c3836" />
        );
      })}

      {/* Strings */}
      {strings.map((s, i) => (
        <line
          key={s.name}
          x1={stringX(i)}
          y1={NUT_Y + 2}
          x2={stringX(i)}
          y2={BOARD_HEIGHT - 8}
          stroke="#78716c"
          strokeWidth={stringThicknesses[i]}
        />
      ))}

      {/* Active note markers */}
      {activePositions.map(({ string: str, fret, pitch }) => {
        const cx = stringX(str);
        const cy = fretDotY(fret);
        const label = noteNameShort(pitch);
        const isOpen = fret === 0;

        return (
          <g key={`${str}-${fret}-${pitch}`}>
            <circle
              cx={cx}
              cy={cy}
              r={10}
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
