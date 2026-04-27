"use client";

import { useRef } from "react";

// ── Layout constants ──────────────────────────────────────────────────────────
const LANE_WIDTH = 50;
const MARGIN = 20;
const NUT_Y = 28;
const FRET_H = 16;
const MAX_FRETS = 24;

const FRET_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21];
const DOUBLE_FRET_MARKERS = new Set([12]);
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const HANDLE_H = 6;
const HANDLE_HIT = 16;

export const BOARD_HEIGHT = NUT_Y + (MAX_FRETS + 1) * FRET_H + 16;

export function fretboardSvgWidth(stringCount: number) {
  return stringCount * LANE_WIDTH + 2 * MARGIN;
}

function stringX(i: number) { return MARGIN + (i + 0.5) * LANE_WIDTH; }
function fretDotY(fret: number) { return fret === 0 ? NUT_Y : NUT_Y + (fret - 0.5) * FRET_H; }
function fretWireY(fret: number) { return NUT_Y + fret * FRET_H; }
function noteNameShort(pitch: number) { return NOTE_NAMES[pitch % 12]; }

// ── Types ─────────────────────────────────────────────────────────────────────

type StringDef = { name: string; openPitch: number };

type Props = {
  strings: readonly StringDef[];
  activePositions: Array<{ string: number; fret: number; pitch: number }>;
  ghostPositions?: Array<{ string: number; fret: number; pitch: number; opacity: number }>;
  fretRange?: [number, number];
  onFretRangeChange?: (range: [number, number]) => void;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Fretboard({ strings, activePositions, ghostPositions = [], fretRange, onFretRangeChange }: Props) {
  const width = fretboardSvgWidth(strings.length);
  const midX = width / 2;
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<"min" | "max" | null>(null);

  const stringThicknesses = strings.map((_, i) => {
    const ratio = 1 - i / Math.max(strings.length - 1, 1);
    return 0.7 + ratio * 1.8;
  });

  const innerX = MARGIN + 2;
  const innerW = width - MARGIN * 2 - 4;
  const regionTop = fretRange ? fretWireY(fretRange[0]) : 0;
  const regionBot = fretRange ? fretWireY(fretRange[1]) : 0;

  function getSvgY(clientY: number): number {
    const rect = svgRef.current!.getBoundingClientRect();
    return clientY - rect.top;
  }

  function yToFret(y: number): number {
    return Math.max(0, Math.min(MAX_FRETS, Math.round((y - NUT_Y) / FRET_H)));
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!dragging.current || !fretRange || !onFretRangeChange) return;
    const fret = yToFret(getSvgY(e.clientY));
    if (dragging.current === "min") {
      onFretRangeChange([Math.min(fret, fretRange[1]), fretRange[1]]);
    } else {
      onFretRangeChange([fretRange[0], Math.max(fret, fretRange[0])]);
    }
  }

  function clearDrag() { dragging.current = null; }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={BOARD_HEIGHT}
      viewBox={`0 0 ${width} ${BOARD_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", userSelect: "none" }}
      aria-label="Fretboard"
      onMouseMove={handleMouseMove}
      onMouseUp={clearDrag}
      onMouseLeave={clearDrag}
    >
      {/* Background */}
      <rect width={width} height={BOARD_HEIGHT} fill="#1c1917" />

      {/* Selected fret region highlight */}
      {fretRange && (
        <rect
          x={innerX}
          y={regionTop}
          width={innerW}
          height={Math.max(0, regionBot - regionTop)}
          fill="#6366f1"
          opacity={0.13}
          pointerEvents="none"
        />
      )}

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
      <rect x={innerX} y={NUT_Y - 3} width={innerW} height={5} rx={1} fill="#a8a29e" />

      {/* Fret wires */}
      {Array.from({ length: MAX_FRETS }, (_, i) => {
        const fret = i + 1;
        const y = fretWireY(fret);
        const isOctave = fret === 12 || fret === 24;
        return (
          <line
            key={fret}
            x1={innerX}
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

      {/* Ghost note markers */}
      {(() => {
        const bySlot = new Map<string, { string: number; fret: number; pitch: number; opacity: number }>();
        for (const g of ghostPositions) {
          const key = `${g.string}-${g.fret}`;
          const existing = bySlot.get(key);
          if (!existing || g.opacity > existing.opacity) bySlot.set(key, g);
        }
        return [...bySlot.values()].map(({ string: str, fret, opacity }) => {
          const cx = stringX(str);
          const cy = fretDotY(fret);
          const isOpen = fret === 0;
          return (
            <circle
              key={`ghost-${str}-${fret}`}
              cx={cx}
              cy={cy}
              r={isOpen ? 10 : 10}
              fill={isOpen ? "transparent" : "#6366f1"}
              stroke="#6366f1"
              strokeWidth={isOpen ? 2 : 0}
              opacity={opacity}
            />
          );
        });
      })()}

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
              fill={isOpen ? "transparent" : "#10b981"}
              stroke="#10b981"
              strokeWidth={isOpen ? 2.5 : 0}
            />
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fontSize={9}
              fontFamily="system-ui, sans-serif"
              fontWeight="700"
              fill={isOpen ? "#10b981" : "#ffffff"}
              pointerEvents="none"
            >
              {isOpen ? "O" : label}
            </text>
          </g>
        );
      })}

      {/* Range drag handles — rendered on top of everything */}
      {fretRange && onFretRangeChange && (
        <>
          {/* Top (min fret) handle */}
          <rect
            x={innerX}
            y={regionTop - HANDLE_HIT / 2}
            width={innerW}
            height={HANDLE_HIT}
            fill="transparent"
            style={{ cursor: "ns-resize" }}
            onMouseDown={(e) => { e.preventDefault(); dragging.current = "min"; }}
          />
          <rect
            x={innerX}
            y={regionTop - HANDLE_H / 2}
            width={innerW}
            height={HANDLE_H}
            rx={2}
            fill="#818cf8"
            opacity={0.9}
            pointerEvents="none"
          />
          {[-7, 0, 7].map((dx) => (
            <circle key={dx} cx={midX + dx} cy={regionTop} r={1.5} fill="#c7d2fe" pointerEvents="none" />
          ))}

          {/* Bottom (max fret) handle */}
          <rect
            x={innerX}
            y={regionBot - HANDLE_HIT / 2}
            width={innerW}
            height={HANDLE_HIT}
            fill="transparent"
            style={{ cursor: "ns-resize" }}
            onMouseDown={(e) => { e.preventDefault(); dragging.current = "max"; }}
          />
          <rect
            x={innerX}
            y={regionBot - HANDLE_H / 2}
            width={innerW}
            height={HANDLE_H}
            rx={2}
            fill="#818cf8"
            opacity={0.9}
            pointerEvents="none"
          />
          {[-7, 0, 7].map((dx) => (
            <circle key={dx} cx={midX + dx} cy={regionBot} r={1.5} fill="#c7d2fe" pointerEvents="none" />
          ))}
        </>
      )}
    </svg>
  );
}
