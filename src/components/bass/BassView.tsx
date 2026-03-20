"use client";

import { useMemo } from "react";
import { usePlaybackStore } from "@/store/playback";
import Fretboard from "@/components/fretboard/Fretboard";
import FretboardFallingNotes from "@/components/fretboard/FretboardFallingNotes";
import { BASS_STRINGS, getFretPosition } from "@/lib/bass";

export default function BassView() {
  const { chordEvents, currentMs, transpose } = usePlaybackStore();

  const activePositions = useMemo(() => {
    const positions: Array<{ string: number; fret: number; pitch: number }> = [];
    for (const chord of chordEvents) {
      if (currentMs >= chord.startMs && currentMs < chord.endMs) {
        for (const note of chord.notes) {
          const pitch = note.pitch + transpose;
          const pos = getFretPosition(pitch);
          if (pos) positions.push({ ...pos, pitch });
        }
      }
    }
    return positions;
  }, [chordEvents, currentMs, transpose]);

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
          Bass View
        </h2>
        <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
          {activePositions.length} active {activePositions.length === 1 ? "note" : "notes"}
        </span>
      </div>

      <div className="flex justify-center overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
        <div>
          <FretboardFallingNotes
            strings={BASS_STRINGS}
            chordEvents={chordEvents}
            currentMs={currentMs}
            transpose={transpose}
            getFretPosition={getFretPosition}
          />
          <div style={{ height: 3 }} />
          <Fretboard strings={BASS_STRINGS} activePositions={activePositions} />
        </div>
      </div>
    </div>
  );
}
