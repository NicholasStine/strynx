# Strynx

A browser-based MIDI practice visualization tool built with Next.js. Load any `.mid` file and watch notes play out on an animated piano keyboard (cello fingerboard coming soon). MIDI is the source of truth — each instrument view is a pure renderer of note events over time.

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 |
| MIDI parsing | `@tonejs/midi` |
| Audio synthesis | Tone.js 15 (Sampler + Transport) |

## Architecture

The app is split into four decoupled layers:

```
MIDI file
   │
   ▼
┌──────────────────────────────────────┐
│  1. MIDI Parsing Layer               │
│  src/lib/midi.ts                     │
│  Normalizes all events to:           │
│  { pitch, startMs, endMs, velocity,  │
│    channel, track }                  │
└──────────────────┬───────────────────┘
                   │  MidiEvent[]
          ┌────────┴────────┐
          ▼                 ▼
┌──────────────────┐  ┌─────────────────────┐
│  2. Playback     │  │  2a. Audio Engine    │
│  Engine (RAF)    │  │  src/lib/            │
│  src/lib/        │  │  audio-engine.ts     │
│  playback-       │  │  Tone.js sampler,    │
│  engine.ts       │  │  mirrors play/pause/ │
│  Source of truth │  │  seek/tempo/         │
│  for currentMs   │  │  transpose           │
└────────┬─────────┘  └─────────────────────┘
         │  currentMs (per RAF tick)
         ▼
┌──────────────────────────────────────┐
│  3. Instrument Renderer              │
│  src/components/piano/PianoView.tsx  │
│  Subscribes to currentMs, derives    │
│  active notes, re-renders on tick    │
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  4. UI / Control State               │
│  src/store/playback.ts  (Zustand)    │
│  Owns: events, playback state,       │
│  tempo, transpose, loop, instrument  │
└──────────────────────────────────────┘
```

**Key design rules:**
- All renderers consume only `MidiEvent[]` — never raw MIDI bytes.
- `PlaybackEngine` (RAF) is the sole source of truth for `currentMs` and visual updates.
- `AudioEngine` (Tone.js Transport) runs in parallel, synced only at play/pause/seek boundaries. Drift < 5 ms is acceptable.
- `AudioEngine` never reads or writes Zustand state.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Commands

```bash
npm run dev       # Next.js dev server with hot reload
npm run build     # Production build
npm run start     # Serve production build
npm run lint      # ESLint
npm run test      # Run test suite (Jest / Vitest)
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx            # Root page — assembles the three UI panels
│   └── layout.tsx          # HTML shell, font loading
├── components/
│   ├── MidiImport.tsx      # Drag-and-drop / file picker for .mid files
│   ├── PlaybackControls.tsx# Play/pause, scrubber, BPM, transpose, loop
│   └── piano/
│       ├── PianoKeyboard.tsx  # SVG 88-key keyboard, highlights active notes
│       └── PianoView.tsx      # Wires timing engine → PianoKeyboard
├── lib/
│   ├── midi.ts             # parseMidi() → MidiEvent[]
│   ├── playback-engine.ts  # RAF-based timing, tempo, loop
│   └── audio-engine.ts     # Tone.js sampler, mirrors PlaybackEngine API
└── store/
    └── playback.ts         # Zustand store — single source of UI state
```

## Feature Status

| Feature | Status |
|---|---|
| MIDI upload & parsing | Done |
| Piano keyboard renderer (SVG, 88 keys) | Done |
| Note labels on active keys | Done |
| Playback engine (RAF, tempo, loop) | Done |
| Audio engine (Tone.js sampler, Salamander piano) | Done |
| Mute toggle (audio on/off independent of visual) | Done |
| Falling-note animation on piano | Planned |
| Cello fingerboard renderer | Planned |
| Cello play-along animation | Planned |

## Instrument Renderer Contract

To add a new instrument, implement a single component that:
1. Reads `currentMs`, `events`, and `transpose` from `usePlaybackStore`
2. Derives which notes are active at `currentMs` (and optionally approaching, for lookahead)
3. Renders them however makes sense for that instrument

No changes to the parsing, playback, or audio layers are required.

## Notes

- **Browser autoplay policy:** `AudioEngine` initializes the Tone.js sampler on the first user gesture (play button click) to comply with browser autoplay restrictions.
- **Soundfont:** Salamander Grand Piano samples loaded from jsDelivr. Sparse octave anchors (A1–A7); Tone.js interpolates intermediate pitches.
- **SVG vs Canvas:** The piano renderer uses SVG. If many simultaneous animated notes cause paint lag, the renderer can be switched to Canvas without touching any other layer.
