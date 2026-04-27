"use client";

import { useRef } from "react";
import {
  CELLO_STRINGS,
  CELLO_SVG_WIDTH,
  CELLO_STRING_X,
  CELLO_MAX_POSITION,
  pitchToFingering,
  noteNameShort,
  positionSemitoneRange,
} from "@/lib/cello";

const NUT_Y = 28;
const POSITION_H = 16;
const HANDLE_H = 6;
const HANDLE_HIT = 16;

const posY = (pos: number) => NUT_Y + pos * POSITION_H;

export type GhostNote = { pitch: number; opacity: number };

type Props = {
  activeNotes: number[];
  ghostNotes?: GhostNote[];
  positionRange?: [number, number];
  onPositionRangeChange?: (range: [number, number]) => void;
};

export default function CelloFingerboard({
  activeNotes,
  ghostNotes = [],
  positionRange = [1, 1],
  onPositionRangeChange,
}: Props) {
  const maxSemitones = positionSemitoneRange(positionRange[1])[1];
  const MAX_POSITIONS = Math.max(14, maxSemitones + 3);
  const BOARD_HEIGHT = NUT_Y + (MAX_POSITIONS + 1) * POSITION_H + 16;

  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<"min" | "max" | null>(null);

  const innerX = 22;
  const innerW = CELLO_SVG_WIDTH - 44;
  const midX = CELLO_SVG_WIDTH / 2;
  const regionTop = posY(positionRange[0]);
  const regionBot = posY(positionRange[1]);

  function getSvgY(clientY: number): number {
    const rect = svgRef.current!.getBoundingClientRect();
    return clientY - rect.top;
  }

  function yToPosition(y: number): number {
    return Math.max(1, Math.min(CELLO_MAX_POSITION, Math.round((y - NUT_Y) / POSITION_H)));
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!dragging.current || !onPositionRangeChange) return;
    const pos = yToPosition(getSvgY(e.clientY));
    if (dragging.current === "min") {
      onPositionRangeChange([Math.min(pos, positionRange[1]), positionRange[1]]);
    } else {
      onPositionRangeChange([positionRange[0], Math.max(pos, positionRange[0])]);
    }
  }

  function clearDrag() { dragging.current = null; }

  const activeFingerings = activeNotes
    .map((pitch) => ({ pitch, fingering: pitchToFingering(pitch, positionRange) }))
    .filter((x) => x.fingering !== null) as Array<{
      pitch: number;
      fingering: NonNullable<ReturnType<typeof pitchToFingering>>;
    }>;

  const ghostBySlot = new Map<string, { pitch: number; opacity: number; stringIndex: number; position: number }>();
  for (const ghost of ghostNotes) {
    const fingering = pitchToFingering(ghost.pitch, positionRange);
    if (!fingering) continue;
    const key = `${fingering.stringIndex}-${fingering.position}`;
    const existing = ghostBySlot.get(key);
    if (!existing || ghost.opacity > existing.opacity) {
      ghostBySlot.set(key, { ...ghost, stringIndex: fingering.stringIndex, position: fingering.position });
    }
  }
  const ghostFingerings = [...ghostBySlot.values()];

  return (
    <svg
      ref={svgRef}
      width={CELLO_SVG_WIDTH}
      height={BOARD_HEIGHT}
      viewBox={`0 0 ${CELLO_SVG_WIDTH} ${BOARD_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", userSelect: "none" }}
      aria-label="Cello fingerboard"
      onMouseMove={handleMouseMove}
      onMouseUp={clearDrag}
      onMouseLeave={clearDrag}
    >
      <defs>
        <linearGradient id="cello-active-grad" x1="0%" y1="0%" x2="0%" y2="100%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#000000" />
          <stop offset="1%"   stopColor="#ddb6ff" />
          <stop offset="3%"   stopColor="#000000" />
          <stop offset="4%"   stopColor="#a21caf" />
          <stop offset="17%"  stopColor="#3d0040" />
          <stop offset="19%"  stopColor="#000000" />
          <stop offset="20%"  stopColor="#5b21b6" />
          <stop offset="33%"  stopColor="#1e0a3c" />
          <stop offset="35%"  stopColor="#000000" />
          <stop offset="36%"  stopColor="#0f766e" />
          <stop offset="49%"  stopColor="#042f2e" />
          <stop offset="51%"  stopColor="#000000" />
          <stop offset="52%"  stopColor="#065f46" />
          <stop offset="68%"  stopColor="#022c22" />
          <stop offset="70%"  stopColor="#000000" />
          <stop offset="71%"  stopColor="#052e16" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width={CELLO_SVG_WIDTH} height={BOARD_HEIGHT} fill="#1c1917" />

      {/* Selected position region highlight */}
      {onPositionRangeChange && (
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

      {/* Nut */}
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
        const pos = i + 1;
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

      {/* Ghost note markers */}
      {ghostFingerings.map(({ pitch, opacity, stringIndex, position }) => {
        const cx = CELLO_STRING_X[stringIndex];
        const cy = posY(position);
        const isOpen = position === 0;
        return (
          <circle
            key={`ghost-${stringIndex}-${position}`}
            cx={cx}
            cy={cy}
            r={isOpen ? 10 : 11}
            fill={isOpen ? "transparent" : "#6366f1"}
            stroke="#6366f1"
            strokeWidth={isOpen ? 2 : 0}
            opacity={opacity}
          />
        );
      })}

      {/* Active note markers */}
      {activeFingerings
        .filter((item, idx, arr) =>
          arr.findIndex(
            (o) => o.fingering.stringIndex === item.fingering.stringIndex && o.fingering.position === item.fingering.position
          ) === idx
        )
        .map(({ pitch, fingering }) => {
        const cx = CELLO_STRING_X[fingering.stringIndex];
        const cy = posY(fingering.position);
        const label = noteNameShort(pitch);
        const isOpen = fingering.position === 0;

        return (
          <g key={`active-${fingering.stringIndex}-${fingering.position}`}>
            <circle
              cx={cx}
              cy={cy}
              r={12}
              fill={isOpen ? "transparent" : "url(#cello-active-grad)"}
              stroke={isOpen ? "#d946ef" : "none"}
              strokeWidth={isOpen ? 2.5 : 0}
            />
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fontSize={9}
              fontFamily="system-ui, sans-serif"
              fontWeight="700"
              fill={isOpen ? "#d946ef" : "#ffffff"}
              pointerEvents="none"
            >
              {isOpen ? "O" : label}
            </text>
          </g>
        );
      })}

      {/* Range drag handles — rendered on top of everything */}
      {onPositionRangeChange && (
        <>
          {/* Top (min position) handle */}
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
            <circle key={`top-${dx}`} cx={midX + dx} cy={regionTop} r={1.5} fill="#c7d2fe" pointerEvents="none" />
          ))}

          {/* Bottom (max position) handle */}
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
            <circle key={`bot-${dx}`} cx={midX + dx} cy={regionBot} r={1.5} fill="#c7d2fe" pointerEvents="none" />
          ))}
        </>
      )}
    </svg>
  );
}
