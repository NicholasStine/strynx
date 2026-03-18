# Strynx

## Developer Notes
I practice a few different instruments, for a few different reasons. As a kid we had a cheap yamaha keyboard (you know, the one with the "HUH!" sound effect?) and my dad's old acoustic guitar. I used to noodle a lot on both, and I took guitar lessons, but like a lot of kids, when it came time to read sheet music, I gave up!

Now, in the last year, I've picked up a bass, a cheap yamaha keyboard of my own, I still have my guitar, and I rent a cello from the local music store. At that same music store, I tried piano lessons, but again I let go of learning to read music in favor of learning to play by ear. Honestly, my favorite thing to do is play along with the theme songs of shows (shoutout to Scavengers Reign).

Switching between instruments serves two big purposes:

1. it serves to force me into thinking in terms of steps and shapes.
2. it serves my ego lol

Recently I had the idea to utilize claude to build a clone of the usual piano visualizer that accepts MIDI import.

This idea was inspired by my use of Songsterr to transcribe youtube videos into guitar / bass tabs. It's great for guitar and bass, but tabs don't really work for piano or cello. I could use garageband to convert the MIDI into sheet music, but I am a coder.. so why do myself what code can do for me?

Everything beyond this point is AI generated.

## Let Claude Cook

A browser-based MIDI practice visualization tool built with Next.js. Load any `.mid` file and watch notes play out on an animated piano keyboard or cello fingerboard. MIDI is the source of truth — each instrument view is a pure renderer of note events over time.

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 |
| MIDI parsing | `@tonejs/midi` |
| Audio synthesis | Tone.js 15 (Sampler + Transport) |
| Cello fingering | `src/lib/cello.ts` (pitch → string/position table) |

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
│  src/components/cello/CelloView.tsx  │
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
│   ├── piano/
│   │   ├── PianoKeyboard.tsx  # SVG 88-key keyboard, highlights active notes
│   │   ├── FallingNotes.tsx   # Falling-note waterfall, aligned to keyboard
│   │   └── PianoView.tsx      # Wires timing engine → FallingNotes + PianoKeyboard
│   └── cello/
│       ├── CelloFingerboard.tsx  # SVG fingerboard with string lanes + finger labels
│       ├── CelloFallingNotes.tsx # Falling-note animation for cello view
│       └── CelloView.tsx         # Wires timing engine → cello renderers
├── lib/
│   ├── midi.ts             # parseMidi() → MidiEvent[]
│   ├── playback-engine.ts  # RAF-based timing, tempo, loop
│   ├── audio-engine.ts     # Tone.js sampler, mirrors PlaybackEngine API
│   └── cello.ts            # Pitch → string/fret position fingering table
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
| Falling-note animation on piano | Done |
| Cello fingerboard renderer | Done |
| Cello play-along animation | Done |

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
