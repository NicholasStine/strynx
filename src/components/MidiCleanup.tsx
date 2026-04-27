"use client";

import { usePlaybackStore } from "@/store/playback";

function formatMs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MidiCleanup() {
  const {
    events,
    cropStart,
    cropEnd,
    detectedBpm,
    bpmAdjustment,
    setCropRange,
    applyCrop,
    resetCrop,
    setBpmAdjustment,
  } = usePlaybackStore();

  const rawDuration =
    events.length > 0 ? Math.max(...events.map((e) => e.endMs)) : 0;

  const activeBpm = Math.round(detectedBpm * bpmAdjustment);

  // Count notes that fall within the current (unapplied) crop window
  const notesInRange = events.filter(
    (e) => e.startMs < cropEnd && e.endMs > cropStart
  ).length;

  // BPM slider range: detected ± 10%
  const bpmMin = 0.9;
  const bpmMax = 1.1;

  if (rawDuration === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Crop section */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Crop
          </span>
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {formatMs(cropStart)} – {formatMs(cropEnd)}{" "}
            <span className="text-zinc-400 dark:text-zinc-600">
              ({notesInRange} notes)
            </span>
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {/* Start slider */}
          <div className="flex items-center gap-2">
            <span className="w-8 text-right text-xs text-zinc-400">Start</span>
            <input
              type="range"
              min={0}
              max={rawDuration}
              step={100}
              value={cropStart}
              onChange={(e) =>
                setCropRange(
                  Math.min(Number(e.target.value), cropEnd - 100),
                  cropEnd
                )
              }
              className="flex-1 cursor-pointer accent-indigo-600"
            />
            <span className="w-12 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
              {formatMs(cropStart)}
            </span>
          </div>

          {/* End slider */}
          <div className="flex items-center gap-2">
            <span className="w-8 text-right text-xs text-zinc-400">End</span>
            <input
              type="range"
              min={0}
              max={rawDuration}
              step={100}
              value={cropEnd}
              onChange={(e) =>
                setCropRange(
                  cropStart,
                  Math.max(Number(e.target.value), cropStart + 100)
                )
              }
              className="flex-1 cursor-pointer accent-indigo-600"
            />
            <span className="w-12 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
              {formatMs(cropEnd)}
            </span>
          </div>
        </div>

        {/* Crop actions */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={applyCrop}
            className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-indigo-500 active:scale-95"
          >
            Apply Crop
          </button>
          <button
            onClick={resetCrop}
            className="rounded bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="mb-4 border-t border-zinc-200 dark:border-zinc-800" />

      {/* BPM section */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Tempo
          </span>
          <div className="flex items-center gap-2 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
            <span>detected {detectedBpm} BPM</span>
            {bpmAdjustment !== 1.0 && (
              <span className="text-indigo-500 dark:text-indigo-400">
                → active {activeBpm} BPM
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-8 text-right text-xs text-zinc-400">−10%</span>
          <input
            type="range"
            min={bpmMin}
            max={bpmMax}
            step={0.005}
            value={bpmAdjustment}
            onChange={(e) => setBpmAdjustment(Number(e.target.value))}
            className="flex-1 cursor-pointer accent-indigo-600"
          />
          <span className="w-8 text-xs text-zinc-400">+10%</span>
          <span className="w-16 font-mono text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
            {activeBpm} BPM
          </span>
          {bpmAdjustment !== 1.0 && (
            <button
              onClick={() => setBpmAdjustment(1.0)}
              className="rounded bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
            >
              reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
