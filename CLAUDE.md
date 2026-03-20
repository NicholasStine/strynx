# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Strynx

A Next.js MIDI practice visualization tool. MIDI is the source of truth; each instrument view is a renderer of note events over time.

## Development Commands

Once scaffolded, these are the expected commands:

```bash
npm run dev       # start Next.js dev server
npm run build     # production build
npm run lint      # ESLint
npm run test      # run tests (Jest or Vitest)
npm run test -- --testPathPattern=<file>  # run a single test file
```

## Architecture

The app is split into four layers that should remain decoupled:

### 1. MIDI Parsing Layer
Parses uploaded `.mid` files using `@tonejs/midi` and normalizes all events into a flat internal format:
```ts
{ pitch: number, startMs: number, endMs: number, velocity: number, channel: number, track: number }
```
All downstream layers consume only this normalized format — never raw MIDI bytes.

### 2. Playback / Timing Engine
Uses `requestAnimationFrame` as a high-resolution visual clock. At each tick it computes:
- which notes are currently active
- which notes are approaching (for falling-note lookahead)
- current song position in milliseconds

Exposes playback controls: play, pause, seek, tempo multiplier, transpose offset, loop start/end.

This layer is **visual-only**. Audio synthesis runs in a parallel sub-layer (see below) that receives the same commands but never modifies visual state.

#### 2a. Audio Engine (sub-layer of Playback)

Audio synthesis is handled by a separate `AudioEngine` class in `src/lib/audio-engine.ts`. It is additive — the existing RAF timing pipeline is unchanged.

**Library:** `tone` (Tone.js v14+)

```bash
npm install tone
```

**Design:**

- `AudioEngine` accepts `MidiEvent[]`, `tempo`, and `transpose` as inputs
- Owns a `Tone.Sampler` loaded with piano soundfont samples
- Uses `Tone.Transport` internally to schedule note-on / note-off events via `Tone.Part`
- Mirrors the `PlaybackEngine` interface: `play(fromMs)`, `pause()`, `seek(ms)`, `setTempo(multiplier)`, `setTranspose(semitones)`
- On `seek`, `setTempo`, or `setTranspose`: cancels all pending events and reschedules from the new state
- Does **not** own or mutate Zustand state — it is driven by the same store actions as `PlaybackEngine`

**Soundfont:** Salamander Grand Piano samples via jsDelivr. Load a sparse set of octave anchors (A1–A7) and let Tone.js interpolate. Initialize the sampler on first user gesture to satisfy browser autoplay policy.

**Timing contract:**
- `PlaybackEngine` (RAF) remains the source of truth for `currentMs` and all visual updates
- `AudioEngine` (`Tone.Transport`) runs in parallel, synchronized only at play/pause/seek boundaries
- Small drift (< 5 ms) between the two clocks is acceptable

**Tempo & transpose:**
- All events are scheduled in millisecond offsets from transport position zero
- Tempo multiplier scales scheduled offsets: `scheduledMs = eventMs / tempoMultiplier`
- Transpose is applied as a pitch shift at scheduling time; any change triggers a full reschedule

**Store integration:**
- No new Zustand slices required
- `AudioEngine` is instantiated as a module-level singleton alongside `PlaybackEngine`
- Add an `audioEnabled: boolean` toggle (default `true`) so users can mute synthesis without stopping visual playback

### 3. Instrument Renderer Layer
Subscribes to the timing engine's current-time output and re-renders on each animation frame. Renderers built:

- **Piano** — 2D keyboard (SVG or Canvas), highlights active keys, draws falling notes above, shows note name labels on keys ✓
- **Cello** — stylized fingerboard with string lanes; maps pitch → finger position using a default fingering table; labels drawn at finger positions ✓
- **Guitar** — see Phase 2 below
- **Bass** — see Phase 2 below

Renderers are isolated: adding a new instrument means implementing one renderer component against the shared note-event stream.

Use **SVG** for static/interactive diagrams; switch to **Canvas** if many simultaneous animated notes cause SVG to lag.

### 4. UI / Control State
Managed with **Zustand**. Stores:
- loaded MIDI file and parsed events
- playback state (playing, paused, currentMs, tempo, transpose, loopStart, loopEnd)
- active instrument selection

## UI Layout

Three top-level areas:
- **MIDI import panel** — file upload/drag-drop
- **Playback controls** — play/pause, scrubber, BPM, transpose, loop markers
- **Instrument viewport** — animated piano, cello fingerboard, guitar fretboard, or bass fretboard

## MVP Build Order

1. MIDI upload + parsing → normalized event list ✓
2. Piano renderer with static note labels ✓
3. Playback engine (tempo, transpose, loop) ✓
4. Audio engine (Tone.js sampler, note scheduling, mute toggle) ✓
5. Falling-note animation on piano ✓
6. Cello fingerboard renderer with mapped positions and labels ✓
7. Cello play-along animation ✓

## Phase 2: Guitar & Bass

### Guitar Renderer

**Files:**
- `src/lib/guitar.ts` — pitch → string/fret position lookup table (standard tuning: E2 A2 D3 G3 B3 E4); covers frets 0–24
- `src/components/guitar/GuitarFretboard.tsx` — SVG fretboard, 6 string lanes, fret markers at standard positions (3, 5, 7, 9, 12, 15, 17, 19, 21); highlights active finger positions with dot + note label
- `src/components/guitar/GuitarFallingNotes.tsx` — falling notes aligned to string lanes
- `src/components/guitar/GuitarView.tsx` — wires timing engine → `GuitarFallingNotes` + `GuitarFretboard`

**Fingering rules:**
- Map each pitch to the lowest-fret position first (open strings preferred)
- Where multiple strings share the same pitch, prefer the thinnest string (highest-numbered in standard ordering)
- `guitar.ts` should export the same shape as `cello.ts`: `getFretPosition(pitch, tuning?) → { string: number, fret: number } | null`

**Tuning:** default standard tuning; the lookup table should accept an optional `tuning` array so alternate tunings (drop D, etc.) can be supported later without changing the renderer.

### Bass Renderer

**Files:**
- `src/lib/bass.ts` — pitch → string/fret lookup for 4-string bass (standard tuning: E1 A1 D2 G2); covers frets 0–24
- `src/components/bass/BassFretboard.tsx` — SVG fretboard, 4 string lanes, same fret marker positions as guitar
- `src/components/bass/BassFallingNotes.tsx` — falling notes aligned to bass string lanes
- `src/components/bass/BassView.tsx` — wires timing engine → `BassFallingNotes` + `BassFretboard`

**Fingering rules:** same lowest-fret-first / prefer-thinnest-string logic as guitar. Export `getFretPosition(pitch, tuning?)` from `bass.ts`.

### Shared Fretboard Considerations

Guitar and bass fretboards are structurally identical (string lanes + fret grid + markers); only string count and tuning differ. If the two renderers end up sharing more than ~30% of their SVG logic, extract a `Fretboard` base component parameterized by `stringCount` and `tuning` rather than duplicating. Do not extract prematurely — wait until both renderers exist.

### Store Changes

Add `"guitar"` and `"bass"` to the `instrument` union in `src/store/playback.ts`. No other store changes required.

### Quantization & Chord Detection

Before rendering fretboard positions, notes are grouped into chords and snapped to a rhythmic grid. This ensures simultaneous notes are displayed and played together as a unit.

**Files:**
- `src/lib/quantize.ts` — quantizes `MidiEvent[]` to the nearest rhythmic grid division
- `src/lib/chords.ts` — groups quantized events into chords; exports a `ChordEvent` type

**Quantization (`quantize.ts`):**
- Accept `MidiEvent[]` plus a `gridMs` parameter (e.g. 10 ms default, or derived from tempo + subdivision)
- Snap each event's `startMs` to the nearest multiple of `gridMs`
- Return a new `MidiEvent[]` — do not mutate the original
- Export `quantizeEvents(events: MidiEvent[], gridMs: number): MidiEvent[]`

**Chord detection (`chords.ts`):**
```ts
type ChordEvent = {
  startMs: number         // quantized onset shared by all notes in the chord
  endMs: number           // max endMs across member notes
  notes: MidiEvent[]      // all simultaneous notes
}
```
- Group events whose `startMs` values fall within a configurable `windowMs` (default 20 ms) after quantization
- Export `detectChords(events: MidiEvent[], windowMs?: number): ChordEvent[]`
- Renderers that care about chords (guitar, bass) consume `ChordEvent[]` instead of raw `MidiEvent[]`

**Integration:**
- `PlaybackEngine` pre-processes parsed events through `quantizeEvents` → `detectChords` and stores both `MidiEvent[]` (for piano/cello) and `ChordEvent[]` (for guitar/bass) in the Zustand store
- Add `chordEvents: ChordEvent[]` to the playback store alongside `midiEvents`
- Guitar/bass falling-notes and fretboard highlight components subscribe to `chordEvents`; each `ChordEvent` triggers simultaneous multi-dot rendering on all member pitches

### Build Order

1. `src/lib/quantize.ts` — grid-snap utility + tests
2. `src/lib/chords.ts` — chord grouping + `ChordEvent` type + tests
3. Store integration — add `chordEvents` slice, run quantize → detect on MIDI load
4. `src/lib/guitar.ts` — fingering table + `getFretPosition`
5. `GuitarFretboard` — static SVG with fret markers, no animation
6. `GuitarView` + instrument switcher update — verify static render
7. `GuitarFallingNotes` — animate chords above fretboard (consumes `ChordEvent[]`)
8. `src/lib/bass.ts` — fingering table + `getFretPosition`
9. `BassFretboard` + `BassFallingNotes` + `BassView`
10. Evaluate shared `Fretboard` extraction
