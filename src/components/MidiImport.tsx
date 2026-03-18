"use client";

import { useCallback, useState } from "react";
import { parseMidi } from "@/lib/midi";
import { usePlaybackStore } from "@/store/playback";

export default function MidiImport() {
  const { setEvents, events, fileName } = usePlaybackStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!file.name.endsWith(".mid") && !file.name.endsWith(".midi")) {
        setError("Please upload a .mid or .midi file.");
        return;
      }
      try {
        const buffer = await file.arrayBuffer();
        const parsed = parseMidi(buffer);
        setEvents(parsed, file.name);
      } catch (err) {
        console.error(err);
        setError("Failed to parse MIDI file. Make sure it is a valid MIDI file.");
      }
    },
    [setEvents]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so same file can be re-uploaded
      e.target.value = "";
    },
    [handleFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-12 text-center transition-colors ${
          isDragging
            ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
            : "border-zinc-300 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
        }`}
      >
        <svg
          className="h-10 w-10 text-zinc-400 dark:text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Drag and drop a MIDI file here
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            or click to browse — .mid / .midi files supported
          </p>
        </div>
        <label className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800">
          Choose file
          <input
            type="file"
            accept=".mid,.midi"
            className="sr-only"
            onChange={onInputChange}
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {fileName && events.length > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm dark:border-green-800 dark:bg-green-950/30">
          <svg
            className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-green-800 dark:text-green-200">
            <span className="font-medium">{fileName}</span> loaded —{" "}
            <span className="font-medium">{events.length}</span> note events
          </span>
        </div>
      )}
    </div>
  );
}
