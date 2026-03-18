"use client";

import { useMemo } from "react";
import { usePlaybackStore } from "@/store/playback";
import PianoKeyboard from "./PianoKeyboard";

export default function PianoView() {
  const { events, currentMs, transpose } = usePlaybackStore();

  const activeNotes = useMemo(() => {
    const active: number[] = [];
    for (const event of events) {
      if (currentMs >= event.startMs && currentMs < event.endMs) {
        // Clamp transposed pitch to 88-key range (MIDI 21–108)
        const pitch = Math.max(21, Math.min(108, event.pitch + transpose));
        active.push(pitch);
      }
    }
    return active;
  }, [events, currentMs, transpose]);

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
          Piano View
        </h2>
        <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
          {activeNotes.length} active {activeNotes.length === 1 ? "note" : "notes"}
        </span>
      </div>
      <PianoKeyboard activeNotes={activeNotes} />
    </div>
  );
}
