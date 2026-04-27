"use client";

import { useMemo } from "react";
import { usePlaybackStore } from "@/store/playback";
import PianoKeyboard from "./PianoKeyboard";
import FallingNotes from "./FallingNotes";
import type { MidiEvent } from "@/lib/midi";

const GHOST_COUNT = 4;
const GHOST_OPACITIES = [0.68, 0.48, 0.30, 0.16] as const;
const GHOST_GROUP_WINDOW_MS = 15;

export default function PianoView() {
  const { quantizedEvents, currentMs, transpose } = usePlaybackStore();

  const activeNotes = useMemo(() => {
    const active: number[] = [];
    for (const event of quantizedEvents) {
      if (currentMs >= event.startMs && currentMs < event.endMs) {
        // Clamp transposed pitch to 88-key range (MIDI 21–108)
        const pitch = Math.max(21, Math.min(108, event.pitch + transpose));
        active.push(pitch);
      }
    }
    return active;
  }, [quantizedEvents, currentMs, transpose]);

  const ghostNotes = useMemo(() => {
    const upcoming = quantizedEvents
      .filter((e) => e.startMs > currentMs)
      .sort((a, b) => a.startMs - b.startMs);

    const groups: MidiEvent[][] = [];
    for (const event of upcoming) {
      if (groups.length >= GHOST_COUNT) break;
      const lastGroup = groups[groups.length - 1];
      if (!lastGroup || event.startMs - lastGroup[0].startMs > GHOST_GROUP_WINDOW_MS) {
        groups.push([event]);
      } else {
        lastGroup.push(event);
      }
    }

    return groups.flatMap((group, i) =>
      group.map((e) => ({
        pitch: Math.max(21, Math.min(108, e.pitch + transpose)),
        opacity: GHOST_OPACITIES[i],
      }))
    );
  }, [quantizedEvents, currentMs, transpose]);

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

      {/* Shared horizontal scroll container — keeps falling notes and keyboard aligned */}
      <div className="w-full overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
        <FallingNotes
          events={quantizedEvents}
          currentMs={currentMs}
          transpose={transpose}
        />
        {/* 3px gap between falling notes and keyboard */}
        <div style={{ height: 3, background: "transparent" }} />
        <div className="px-3 pb-3">
          <PianoKeyboard activeNotes={activeNotes} ghostNotes={ghostNotes} />
        </div>
      </div>
    </div>
  );
}
