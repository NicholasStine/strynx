# Changelog

All notable changes to Strynx will be documented here.

## [Unreleased]

## [0.2.0] — 2026-03-17

### Added

- **Falling-note animation** (`src/components/piano/FallingNotes.tsx`) — waterfall of approaching notes rendered above the piano keyboard, horizontally aligned to each key. Lookahead window is 2 seconds; note opacity and position animate in sync with `currentMs`.
- **Cello fingerboard renderer** (`src/components/cello/CelloFingerboard.tsx`) — SVG fingerboard with four string lanes (C2–A5 range). Maps each active MIDI pitch to a string and finger position using a default fingering table in `src/lib/cello.ts`; labels drawn at finger positions.
- **Cello falling-note animation** (`src/components/cello/CelloFallingNotes.tsx`) — falling notes aligned to cello string lanes, mirroring the piano falling-note approach.
- **Cello view** (`src/components/cello/CelloView.tsx`) — wires the timing engine to the cello fingerboard and falling-note renderers.
- **Instrument switcher** (`src/app/page.tsx`) — pill toggle to switch between Piano and Cello views; selection stored in Zustand (`instrument` field).
- **Cello fingering library** (`src/lib/cello.ts`) — pitch-to-string/position lookup table covering the standard cello range.

### Changed

- `PianoKeyboard` wrapper `<div>` removed; the SVG now composes directly into a shared `overflow-x-auto` scroll container in `PianoView` so falling notes and keyboard scroll as one unit.
- `PianoView` now wraps `FallingNotes` + `PianoKeyboard` in a single bordered scroll container with a 3 px gap between them.

## [0.1.0] — 2026-03-17

### Added

- **MIDI parsing layer** (`src/lib/midi.ts`) — parses `.mid` / `.midi` files via `@tonejs/midi` and normalizes all note events into a flat `MidiEvent` format (`pitch`, `startMs`, `endMs`, `velocity`, `channel`, `track`). Events are sorted by start time.
- **MIDI import UI** (`src/components/MidiImport.tsx`) — drag-and-drop zone and file picker; validates file extension, shows parse errors, and displays note count on success.
- **Piano keyboard renderer** (`src/components/piano/PianoKeyboard.tsx`) — SVG 88-key keyboard (MIDI 21–108). Highlights active notes in indigo, renders note-name labels on active keys, shows octave markers (C1–C8) at all times.
- **Piano view** (`src/components/piano/PianoView.tsx`) — subscribes to playback state and drives `PianoKeyboard` with the set of currently active MIDI pitches.
- **Playback engine** (`src/lib/playback-engine.ts`) — `requestAnimationFrame`-based visual clock. Supports `play`, `pause`, `seek`, variable tempo multiplier, and configurable loop region. Remains the sole source of truth for `currentMs`.
- **Audio engine** (`src/lib/audio-engine.ts`) — Tone.js 15 sampler loaded with Salamander Grand Piano soundfont (sparse A1–A7 octave anchors via jsDelivr). Mirrors the playback engine API (`play`, `pause`, `seek`, `setTempo`, `setTranspose`). Runs in parallel with the RAF clock; synced only at play/pause/seek boundaries. Initialized on first user gesture to satisfy browser autoplay policy.
- **Zustand store** (`src/store/playback.ts`) — single store for all UI and playback state: loaded events, playback position, tempo, transpose (±12 semitones), loop markers, active instrument, and `audioEnabled` toggle.
- **Playback controls** (`src/components/PlaybackControls.tsx`) — play/pause button, timeline scrubber, BPM multiplier, semitone transpose, loop toggle, and audio mute toggle.
- **Root page** (`src/app/page.tsx`) — assembles the three UI panels: MIDI import, playback controls, and instrument viewport.
