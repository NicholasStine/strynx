"use client";

import { useMemo } from "react";
import { usePlaybackStore } from "@/store/playback";
import CelloFingerboard from "./CelloFingerboard";
import CelloFallingNotes from "./CelloFallingNotes";
import { pitchToFingering } from "@/lib/cello";

export default function CelloView() {
  const { events, currentMs, transpose } = usePlaybackStore();

  const activeNotes = useMemo(() => {
    const active: number[] = [];
    for (const event of events) {
      if (currentMs >= event.startMs && currentMs < event.endMs) {
        const pitch = event.pitch + transpose;
        if (pitchToFingering(pitch) !== null) {
          active.push(pitch);
        }
      }
    }
    return active;
  }, [events, currentMs, transpose]);

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
          Cello View
        </h2>
        <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
          {activeNotes.length} active {activeNotes.length === 1 ? "note" : "notes"}
        </span>
      </div>

      <div className="flex justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
        <div>
          <CelloFallingNotes
            events={events}
            currentMs={currentMs}
            transpose={transpose}
          />
          {/* 3px gap between falling notes and fingerboard */}
          <div style={{ height: 3 }} />
          <CelloFingerboard activeNotes={activeNotes} />
        </div>
      </div>
    </div>
  );
}
