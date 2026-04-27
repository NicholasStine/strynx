"use client";

import type { ChordEvent } from "@/lib/chords";

// ── Layout constants ──────────────────────────────────────────────────────────
// Horizontal layout matches Fretboard.tsx so SVG widths are identical.
const LANE_W      = 50;   // px per string lane
const MARGIN      = 20;   // left margin  (fret-number labels live here)
const BADGE_W     = 36;   // right margin (time-offset badges live here)
const GHOST_H     = 88;   // height of each ghost layer
const GAP         = 8;    // gap between ghost layers
const HEADER_H    = 20;   // px above fret grid  (open-string indicators)
const FRETS_SHOWN = 5;    // fret slots visible in each ghost
const DOT_R_NOW   = 9;    // finger-dot radius for the "now" layer
const DOT_R_GHOST = 7;    // finger-dot radius for future layers

export const GHOST_COUNT = 5;  // total layers (incl. "now")

const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

// ── Types ─────────────────────────────────────────────────────────────────────
type StringDef = { name: string; openPitch: number };
type Position  = { string: number; fret: number; pitch: number };

export type Props = {
  strings:         readonly StringDef[];
  chordEvents:     ChordEvent[];
  currentMs:       number;
  transpose:       number;
  /** ms between successive ghost slices. Default = 600 */
  timeStepMs?:     number;
  getFretPosition: (pitch: number) => { string: number; fret: number } | null;
};

// ── Pure helpers ──────────────────────────────────────────────────────────────
function svgWidth(n: number) { return MARGIN + n * LANE_W + BADGE_W; }
function svgHeight()          { return GHOST_COUNT * GHOST_H + (GHOST_COUNT - 1) * GAP; }
function strX(si: number)     { return MARGIN + (si + 0.5) * LANE_W; }
function gridRight(n: number) { return MARGIN + n * LANE_W; }

function findChordAt(events: ChordEvent[], targetMs: number): ChordEvent | null {
  let nearest: ChordEvent | null = null;
  for (const c of events) {
    if (c.startMs <= targetMs && c.endMs > targetMs) return c;
    if (c.startMs > targetMs && (!nearest || c.startMs < nearest.startMs)) {
      nearest = c;
    }
  }
  return nearest;
}

function chordToPositions(
  chord: ChordEvent | null,
  transpose: number,
  getFret: (p: number) => { string: number; fret: number } | null,
): Position[] {
  if (!chord) return [];
  const out: Position[] = [];
  for (const note of chord.notes) {
    const pitch = note.pitch + transpose;
    const pos   = getFret(pitch);
    if (pos) out.push({ ...pos, pitch });
  }
  return out;
}

/**
 * The first fret wire shown at the top of the ghost.
 * Fretting positions occupy slots viewStart+1 … viewStart+FRETS_SHOWN.
 */
function calcViewStart(positions: Position[]): number {
  const fretted = positions.filter(p => p.fret > 0).map(p => p.fret);
  if (fretted.length === 0) return 0;
  return Math.max(0, Math.min(...fretted) - 1);
}

/** Dot y-centre: fret f with viewport offset viewStart. */
function dotCY(fret: number, viewStart: number, slotH: number, groupY: number) {
  return groupY + HEADER_H + (fret - viewStart - 0.5) * slotH;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function GhostFretboardWaterfall({
  strings,
  chordEvents,
  currentMs,
  transpose,
  timeStepMs = 600,
  getFretPosition,
}: Props) {
  const n      = strings.length;
  const width  = svgWidth(n);
  const height = svgHeight();
  const slotH  = (GHOST_H - HEADER_H) / FRETS_SHOWN;
  const gRight = gridRight(n);

  /**
   * gi = 0 → top of SVG (furthest future)
   * gi = GHOST_COUNT - 1 → bottom (now)
   * stepsAhead: 0 = now, GHOST_COUNT-1 = furthest future
   */
  const layers = Array.from({ length: GHOST_COUNT }, (_, gi) => {
    const stepsAhead = GHOST_COUNT - 1 - gi;
    const targetMs   = currentMs + stepsAhead * timeStepMs;
    const opacity    = 1 - (stepsAhead / (GHOST_COUNT - 1)) * 0.85;
    const isNow      = stepsAhead === 0;
    const chord      = findChordAt(chordEvents, targetMs);
    const positions  = chordToPositions(chord, transpose, getFretPosition);
    const viewStart  = calcViewStart(positions);
    const groupY     = gi * (GHOST_H + GAP);

    return {
      gi, stepsAhead, opacity, isNow,
      viewStart, groupY,
      openPositions:    positions.filter(p => p.fret === 0),
      frettedPositions: positions.filter(
        p => p.fret > viewStart && p.fret <= viewStart + FRETS_SHOWN,
      ),
    };
  });

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
      aria-label="Ghost fretboard waterfall"
    >
      {layers.map(({
        gi, stepsAhead, opacity, isNow,
        viewStart, groupY,
        openPositions, frettedPositions,
      }) => {
        const dotR = isNow ? DOT_R_NOW : DOT_R_GHOST;

        // Group fretting positions by fret for barre detection
        const byFret = new Map<number, number[]>();
        for (const { string: si, fret } of frettedPositions) {
          if (!byFret.has(fret)) byFret.set(fret, []);
          byFret.get(fret)!.push(si);
        }
        const barreEntries = [...byFret.entries()].filter(([, sis]) => sis.length >= 2);

        return (
          <g key={gi} opacity={opacity}>
            {/* Ghost background panel */}
            <rect
              x={MARGIN}
              y={groupY + 1}
              width={n * LANE_W}
              height={GHOST_H - 2}
              rx={3}
              fill={isNow ? "#1c1917" : "#0d0d0b"}
              stroke={isNow ? "#6366f1" : "#282826"}
              strokeWidth={isNow ? 1.5 : 0.5}
            />

            {/* Time / "NOW" badge in the right margin */}
            <text
              x={gRight + BADGE_W - 2}
              y={groupY + GHOST_H / 2 + 4}
              textAnchor="end"
              fontSize={9}
              fontFamily="system-ui, sans-serif"
              fontWeight="700"
              fill={isNow ? "#6366f1" : "#3f3f46"}
            >
              {isNow ? "NOW" : `+${(stepsAhead * timeStepMs / 1000).toFixed(1)}s`}
            </text>

            {/* Fret-number label in left margin (when not at open position) */}
            {viewStart > 0 && (
              <text
                x={MARGIN - 3}
                y={groupY + HEADER_H + slotH * 0.5 + 4}
                textAnchor="end"
                fontSize={7}
                fontFamily="system-ui, sans-serif"
                fill={isNow ? "#78716c" : "#44403c"}
              >
                {viewStart + 1}fr
              </text>
            )}

            {/* Nut bar (at open position) or dashed boundary */}
            {viewStart === 0 ? (
              <rect
                x={MARGIN}
                y={groupY + HEADER_H - 3}
                width={n * LANE_W}
                height={3}
                rx={1}
                fill={isNow ? "#a8a29e" : "#3c3836"}
              />
            ) : (
              <line
                x1={MARGIN}
                y1={groupY + HEADER_H}
                x2={gRight}
                y2={groupY + HEADER_H}
                stroke="#3c3836"
                strokeWidth={0.8}
                strokeDasharray="4 3"
              />
            )}

            {/* Fret wires */}
            {Array.from({ length: FRETS_SHOWN }, (_, k) => {
              const absF = viewStart + k + 1;
              const y    = groupY + HEADER_H + (k + 1) * slotH;
              return (
                <line
                  key={k}
                  x1={MARGIN}
                  y1={y}
                  x2={gRight}
                  y2={y}
                  stroke={absF % 12 === 0 ? "#4a4845" : "#232320"}
                  strokeWidth={absF % 12 === 0 ? 1 : 0.5}
                />
              );
            })}

            {/* String lines */}
            {strings.map((_, si) => (
              <line
                key={si}
                x1={strX(si)}
                y1={groupY + HEADER_H}
                x2={strX(si)}
                y2={groupY + GHOST_H - 2}
                stroke={isNow ? "#3c3836" : "#242420"}
                strokeWidth={0.6}
              />
            ))}

            {/* Open-string indicators (○ in the header strip) */}
            {openPositions.map(({ string: si }) => (
              <circle
                key={`open-${si}`}
                cx={strX(si)}
                cy={groupY + HEADER_H / 2}
                r={isNow ? 5 : 4}
                fill="transparent"
                stroke={isNow ? "#6366f1" : "#4338ca"}
                strokeWidth={isNow ? 1.5 : 1}
              />
            ))}

            {/* Barre bars: thick line connecting strings sharing the same fret */}
            {barreEntries.map(([fret, sis]) => {
              const sorted = [...sis].sort((a, b) => a - b);
              const cy = dotCY(fret, viewStart, slotH, groupY);
              return (
                <line
                  key={`barre-${fret}`}
                  x1={strX(sorted[0])}
                  y1={cy}
                  x2={strX(sorted[sorted.length - 1])}
                  y2={cy}
                  stroke={isNow ? "#818cf8" : "#4338ca"}
                  strokeWidth={dotR * 1.8}
                  strokeLinecap="round"
                  opacity={0.55}
                />
              );
            })}

            {/* Finger-position dots (rendered on top of barre bars) */}
            {frettedPositions.map(({ string: si, fret, pitch }) => {
              const cx = strX(si);
              const cy = dotCY(fret, viewStart, slotH, groupY);
              return (
                <g key={`dot-${si}-${fret}-${pitch}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={dotR}
                    fill={isNow ? "#6366f1" : "#4338ca"}
                    stroke={isNow ? "#a5b4fc" : "none"}
                    strokeWidth={1}
                  />
                  {isNow && (
                    <text
                      x={cx}
                      y={cy + 3.5}
                      textAnchor="middle"
                      fontSize={7}
                      fontFamily="system-ui, sans-serif"
                      fontWeight="700"
                      fill="#ffffff"
                      pointerEvents="none"
                    >
                      {NOTE_NAMES[pitch % 12]}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
