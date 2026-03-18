"use client";

import { useState } from "react";
import { usePlaybackStore } from "@/store/playback";

function formatMs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const TEMPO_PRESETS = [0.5, 0.75, 1, 1.25, 1.5];

export default function PlaybackControls() {
  const {
    currentMs,
    isPlaying,
    duration,
    tempo,
    transpose,
    loopStart,
    loopEnd,
    loopEnabled,
    audioEnabled,
    play,
    pause,
    seek,
    setTempo,
    setTranspose,
    setLoop,
    toggleLoop,
    toggleAudio,
  } = usePlaybackStore();

  const [scrubbing, setScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const displayMs = scrubbing ? scrubValue : currentMs;

  function handleScrubStart() {
    setScrubbing(true);
    setScrubValue(currentMs);
  }

  function handleScrubChange(e: React.ChangeEvent<HTMLInputElement>) {
    setScrubValue(Number(e.target.value));
  }

  function handleScrubEnd() {
    seek(scrubValue);
    setScrubbing(false);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Transport row */}
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={isPlaying ? pause : play}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow transition hover:bg-indigo-500 active:scale-95"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
              <rect x="3" y="2" width="4" height="12" rx="1" />
              <rect x="9" y="2" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
              <path d="M4 2.5l9 5.5-9 5.5V2.5z" />
            </svg>
          )}
        </button>

        {/* Time */}
        <span className="w-20 text-right font-mono text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
          {formatMs(displayMs)}
          <span className="text-zinc-400 dark:text-zinc-600">
            {" "}/ {formatMs(duration)}
          </span>
        </span>

        {/* Scrubber */}
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={100}
          value={displayMs}
          onMouseDown={handleScrubStart}
          onTouchStart={handleScrubStart}
          onChange={handleScrubChange}
          onMouseUp={handleScrubEnd}
          onTouchEnd={handleScrubEnd}
          className="h-2 flex-1 cursor-pointer accent-indigo-600"
        />
      </div>

      {/* Controls row */}
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {/* Speed */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Speed
          </span>
          <div className="flex gap-1">
            {TEMPO_PRESETS.map((t) => (
              <button
                key={t}
                onClick={() => setTempo(t)}
                className={`rounded px-2 py-0.5 text-xs font-medium transition ${
                  tempo === t
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                }`}
              >
                {t}×
              </button>
            ))}
          </div>
        </div>

        {/* Transpose */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Transpose
          </span>
          <button
            onClick={() => setTranspose(Math.max(-12, transpose - 1))}
            className="flex h-6 w-6 items-center justify-center rounded bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
          >
            −
          </button>
          <span className="w-8 text-center font-mono text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
            {transpose > 0 ? `+${transpose}` : transpose}
          </span>
          <button
            onClick={() => setTranspose(Math.min(12, transpose + 1))}
            className="flex h-6 w-6 items-center justify-center rounded bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
          >
            +
          </button>
        </div>

        {/* Audio toggle */}
        <button
          onClick={toggleAudio}
          className={`rounded px-2 py-0.5 text-xs font-medium transition ${
            audioEnabled
              ? "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
              : "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60"
          }`}
          aria-label={audioEnabled ? "Mute audio" : "Unmute audio"}
        >
          {audioEnabled ? "♪ On" : "♪ Off"}
        </button>

        {/* Loop */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLoop}
            className={`rounded px-2 py-0.5 text-xs font-medium transition ${
              loopEnabled
                ? "bg-indigo-600 text-white"
                : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
            }`}
          >
            Loop
          </button>
          {loopEnabled && (
            <>
              <div className="flex items-center gap-1">
                <span className="text-xs text-zinc-400">from</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={100}
                  value={loopStart}
                  onChange={(e) => setLoop(Number(e.target.value), loopEnd)}
                  className="w-20 cursor-pointer accent-indigo-500"
                />
                <span className="w-10 font-mono text-xs tabular-nums text-zinc-500">
                  {formatMs(loopStart)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-zinc-400">to</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 1}
                  step={100}
                  value={loopEnd}
                  onChange={(e) => setLoop(loopStart, Number(e.target.value))}
                  className="w-20 cursor-pointer accent-indigo-500"
                />
                <span className="w-10 font-mono text-xs tabular-nums text-zinc-500">
                  {formatMs(loopEnd)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
