"use client";

import { useMemo, useState, useCallback } from "react";
import { usePlaybackStore } from "@/store/playback";
import Fretboard from "@/components/fretboard/Fretboard";
import FretboardFallingNotes from "@/components/fretboard/FretboardFallingNotes";
import GhostFretboardWaterfall from "@/components/fretboard/GhostFretboardWaterfall";
import { BASS_STRINGS, getFretPosition } from "@/lib/bass";

type ViewMode = "waterfall" | "ghost";

const GHOST_COUNT = 4;
const GHOST_OPACITIES = [0.68, 0.48, 0.30, 0.16] as const;

export default function BassView() {
  const { chordEvents, currentMs, transpose } = usePlaybackStore();
  const [viewMode, setViewMode] = useState<ViewMode>("waterfall");
  const [fretRange, setFretRange] = useState<[number, number]>([0, 24]);

  const setMinFret = (v: number) => {
    const clamped = Math.max(0, Math.min(v, fretRange[1]));
    setFretRange([clamped, fretRange[1]]);
  };
  const setMaxFret = (v: number) => {
    const clamped = Math.min(24, Math.max(v, fretRange[0]));
    setFretRange([fretRange[0], clamped]);
  };

  const boundGetFretPosition = useCallback(
    (pitch: number) => getFretPosition(pitch, BASS_STRINGS, fretRange),
    [fretRange]
  );

  const activePositions = useMemo(() => {
    const positions: Array<{ string: number; fret: number; pitch: number }> = [];
    for (const chord of chordEvents) {
      if (currentMs >= chord.startMs && currentMs < chord.endMs) {
        for (const note of chord.notes) {
          const pitch = note.pitch + transpose;
          const pos = boundGetFretPosition(pitch);
          if (pos) positions.push({ ...pos, pitch });
        }
      }
    }
    return positions;
  }, [chordEvents, currentMs, transpose, boundGetFretPosition]);

  const ghostPositions = useMemo(() => {
    const upcoming = chordEvents
      .filter((c) => c.startMs > currentMs)
      .sort((a, b) => a.startMs - b.startMs)
      .slice(0, GHOST_COUNT);
    return upcoming.flatMap((chord, i) =>
      chord.notes.flatMap((note) => {
        const pitch = note.pitch + transpose;
        const pos = boundGetFretPosition(pitch);
        return pos ? [{ ...pos, pitch, opacity: GHOST_OPACITIES[i] }] : [];
      })
    );
  }, [chordEvents, currentMs, transpose, boundGetFretPosition]);

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
          Bass View
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-medium">Frets</span>
            <input
              type="number"
              min={0}
              max={fretRange[1]}
              value={fretRange[0]}
              onChange={(e) => setMinFret(parseInt(e.target.value) || 0)}
              className="w-10 rounded border border-zinc-300 bg-white px-1 py-0.5 text-center text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
            />
            <span>–</span>
            <input
              type="number"
              min={fretRange[0]}
              max={24}
              value={fretRange[1]}
              onChange={(e) => setMaxFret(parseInt(e.target.value) || 0)}
              className="w-10 rounded border border-zinc-300 bg-white px-1 py-0.5 text-center text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
            />
          </div>

          <div className="flex rounded-md border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
            {(["waterfall", "ghost"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  viewMode === mode
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {mode === "ghost" ? "Ghost" : "Waterfall"}
              </button>
            ))}
          </div>

          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            {activePositions.length} active {activePositions.length === 1 ? "note" : "notes"}
          </span>
        </div>
      </div>

      <div className="flex justify-center overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
        {viewMode === "waterfall" ? (
          <div>
            <FretboardFallingNotes
              strings={BASS_STRINGS}
              chordEvents={chordEvents}
              currentMs={currentMs}
              transpose={transpose}
              getFretPosition={boundGetFretPosition}
            />
            <div style={{ height: 3 }} />
            <Fretboard
              strings={BASS_STRINGS}
              activePositions={activePositions}
              ghostPositions={ghostPositions}
              fretRange={fretRange}
              onFretRangeChange={setFretRange}
            />
          </div>
        ) : (
          <GhostFretboardWaterfall
            strings={BASS_STRINGS}
            chordEvents={chordEvents}
            currentMs={currentMs}
            transpose={transpose}
            getFretPosition={boundGetFretPosition}
          />
        )}
      </div>
    </div>
  );
}
