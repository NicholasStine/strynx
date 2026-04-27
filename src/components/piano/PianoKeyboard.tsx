"use client";

// Standard 88-key piano: MIDI notes 21 (A0) to 108 (C8)
const MIDI_MIN = 21;
const MIDI_MAX = 108;

// Note names (chromatic), index 0 = C
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Which semitones (0-indexed from C) are black keys
const BLACK_KEY_SEMITONES = new Set([1, 3, 6, 8, 10]);

// White key width in SVG units; black key is 60% width
const WHITE_W = 24;
const WHITE_H = 140;
const BLACK_W = 14;
const BLACK_H = 90;

function isBlackKey(midi: number): boolean {
  return BLACK_KEY_SEMITONES.has(midi % 12);
}

// Compute how many white keys are before a given MIDI note (relative to MIDI_MIN)
function whiteKeysBefore(midi: number): number {
  let count = 0;
  for (let m = MIDI_MIN; m < midi; m++) {
    if (!isBlackKey(m)) count++;
  }
  return count;
}

// Get x position of a key's left edge (for white keys) or center-ish (for black keys)
function keyX(midi: number): number {
  if (!isBlackKey(midi)) {
    return whiteKeysBefore(midi) * WHITE_W;
  }
  // Black key sits between white keys; find the preceding white key
  const prevWhite = whiteKeysBefore(midi);
  return prevWhite * WHITE_W - BLACK_W / 2;
}

// Total white key count
function totalWhiteKeys(): number {
  let count = 0;
  for (let m = MIDI_MIN; m <= MIDI_MAX; m++) {
    if (!isBlackKey(m)) count++;
  }
  return count;
}

const TOTAL_WHITE = totalWhiteKeys();
const SVG_WIDTH = TOTAL_WHITE * WHITE_W;
const SVG_HEIGHT = WHITE_H + 2; // small padding at bottom

function noteName(midi: number): string {
  const semitone = midi % 12;
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[semitone];
  // Show octave number only on C notes for clarity
  if (semitone === 0) return `C${octave}`;
  return name;
}

type KeyInfo = {
  midi: number;
  x: number;
  isBlack: boolean;
  label: string;
};

function buildKeys(): { whites: KeyInfo[]; blacks: KeyInfo[] } {
  const whites: KeyInfo[] = [];
  const blacks: KeyInfo[] = [];
  for (let m = MIDI_MIN; m <= MIDI_MAX; m++) {
    const info: KeyInfo = {
      midi: m,
      x: keyX(m),
      isBlack: isBlackKey(m),
      label: noteName(m),
    };
    if (info.isBlack) blacks.push(info);
    else whites.push(info);
  }
  return { whites, blacks };
}

const { whites, blacks } = buildKeys();

type GhostNote = { pitch: number; opacity: number };

type Props = {
  activeNotes: number[];
  ghostNotes?: GhostNote[];
};

export default function PianoKeyboard({ activeNotes, ghostNotes = [] }: Props) {
  const activeSet = new Set(activeNotes);
  const ghostMap = new Map<number, number>();
  for (const g of ghostNotes) {
    const existing = ghostMap.get(g.pitch);
    if (existing === undefined || g.opacity > existing) ghostMap.set(g.pitch, g.opacity);
  }

  return (
    <svg
      width={SVG_WIDTH}
      height={SVG_HEIGHT}
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Piano keyboard"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="piano-active-grad" x1="0%" y1="0%" x2="0%" y2="100%">
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

        {/* White keys — render first so black keys appear on top */}
        {whites.map((key) => {
          const active = activeSet.has(key.midi);
          const ghostOpacity = !active ? ghostMap.get(key.midi) : undefined;
          return (
            <g key={key.midi}>
              <rect
                x={key.x + 0.5}
                y={0.5}
                width={WHITE_W - 1}
                height={WHITE_H - 1}
                rx={3}
                fill={active ? "url(#piano-active-grad)" : ghostOpacity !== undefined ? "#6366f1" : "#ffffff"}
                stroke={active ? "#7c3aed" : ghostOpacity !== undefined ? "#4338ca" : "#a1a1aa"}
                strokeWidth={1}
                opacity={ghostOpacity !== undefined ? ghostOpacity : 1}
              />
              {/* Label */}
              {active && (
                <text
                  x={key.x + WHITE_W / 2}
                  y={WHITE_H - 10}
                  textAnchor="middle"
                  fontSize={9}
                  fontFamily="system-ui, sans-serif"
                  fontWeight="600"
                  fill="#ffffff"
                  pointerEvents="none"
                >
                  {key.label}
                </text>
              )}
              {/* Always show C note labels on white C keys even when not active */}
              {!active && ghostOpacity === undefined && key.midi % 12 === 0 && (
                <text
                  x={key.x + WHITE_W / 2}
                  y={WHITE_H - 10}
                  textAnchor="middle"
                  fontSize={8}
                  fontFamily="system-ui, sans-serif"
                  fill="#a1a1aa"
                  pointerEvents="none"
                >
                  {key.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Black keys — rendered on top */}
        {blacks.map((key) => {
          const active = activeSet.has(key.midi);
          const ghostOpacity = !active ? ghostMap.get(key.midi) : undefined;
          return (
            <g key={key.midi}>
              <rect
                x={key.x + 0.5}
                y={0.5}
                width={BLACK_W - 1}
                height={BLACK_H - 1}
                rx={2}
                fill={active ? "url(#piano-active-grad)" : ghostOpacity !== undefined ? "#6366f1" : "#18181b"}
                stroke={active ? "#7c3aed" : ghostOpacity !== undefined ? "#4338ca" : "#3f3f46"}
                strokeWidth={1}
                opacity={ghostOpacity !== undefined ? ghostOpacity : 1}
              />
              {active && (
                <text
                  x={key.x + BLACK_W / 2}
                  y={BLACK_H - 8}
                  textAnchor="middle"
                  fontSize={7.5}
                  fontFamily="system-ui, sans-serif"
                  fontWeight="600"
                  fill="#ffffff"
                  pointerEvents="none"
                >
                  {key.label}
                </text>
              )}
            </g>
          );
        })}
    </svg>
  );
}
