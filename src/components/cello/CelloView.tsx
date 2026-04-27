"use client";

import { useState, useMemo } from "react";
import { usePlaybackStore } from "@/store/playback";
import CelloFingerboard from "./CelloFingerboard";
import CelloFallingNotes from "./CelloFallingNotes";
import { pitchToFingering, CELLO_MAX_POSITION } from "@/lib/cello";
import type { MidiEvent } from "@/lib/midi";

const GHOST_COUNT = 4;
const GHOST_OPACITIES = [0.68, 0.48, 0.30, 0.16] as const;
// Events within this window (ms) after quantization are treated as simultaneous
const GHOST_GROUP_WINDOW_MS = 15;

export default function CelloView() {
  const { quantizedEvents, currentMs, transpose } = usePlaybackStore();
  const [positionRange, setPositionRange] = useState<[number, number]>([1, 1]);

  const setMin = (v: number) => {
    const clamped = Math.max(1, Math.min(v, positionRange[1]));
    setPositionRange([clamped, positionRange[1]]);
  };
  const setMax = (v: number) => {
    const clamped = Math.min(CELLO_MAX_POSITION, Math.max(v, positionRange[0]));
    setPositionRange([positionRange[0], clamped]);
  };

  const activeNotes = useMemo(() => {
    const active: number[] = [];
    for (const event of quantizedEvents) {
      if (currentMs >= event.startMs && currentMs < event.endMs) {
        const pitch = event.pitch + transpose;
        if (pitchToFingering(pitch, positionRange) !== null) {
          active.push(pitch);
        }
      }
    }
    return active;
  }, [quantizedEvents, currentMs, transpose, positionRange]);

  const ghostNotes = useMemo(() => {
    const upcoming = quantizedEvents
      .filter((e) => e.startMs > currentMs)
      .sort((a, b) => a.startMs - b.startMs);

    const groups: MidiEvent[][] = [];
    for (const event of upcoming) {
      if (groups.length >= GHOST_COUNT) break;
      const pitch = event.pitch + transpose;
      if (pitchToFingering(pitch, positionRange) === null) continue;

      const lastGroup = groups[groups.length - 1];
      if (!lastGroup || event.startMs - lastGroup[0].startMs > GHOST_GROUP_WINDOW_MS) {
        groups.push([event]);
      } else {
        lastGroup.push(event);
      }
    }

    return groups.flatMap((group, i) =>
      group.map((e) => ({ pitch: e.pitch + transpose, opacity: GHOST_OPACITIES[i] }))
    );
  }, [quantizedEvents, currentMs, transpose, positionRange]);

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
          Cello View
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-medium">Position</span>
            <input
              type="number"
              min={1}
              max={positionRange[1]}
              value={positionRange[0]}
              onChange={(e) => setMin(parseInt(e.target.value) || 1)}
              className="w-10 rounded border border-zinc-300 bg-white px-1 py-0.5 text-center text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
            />
            <span>–</span>
            <input
              type="number"
              min={positionRange[0]}
              max={CELLO_MAX_POSITION}
              value={positionRange[1]}
              onChange={(e) => setMax(parseInt(e.target.value) || 1)}
              className="w-10 rounded border border-zinc-300 bg-white px-1 py-0.5 text-center text-xs dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
            />
          </div>
          <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            {activeNotes.length} active {activeNotes.length === 1 ? "note" : "notes"}
          </span>
        </div>
      </div>

      <div className="flex justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
        <div>
          <CelloFallingNotes
            events={quantizedEvents}
            currentMs={currentMs}
            transpose={transpose}
            positionRange={positionRange}
          />
          {/* 3px gap between falling notes and fingerboard */}
          <div style={{ height: 3 }} />
          <CelloFingerboard
            activeNotes={activeNotes}
            ghostNotes={ghostNotes}
            positionRange={positionRange}
            onPositionRangeChange={setPositionRange}
          />
        </div>
      </div>
    </div>
  );
}
