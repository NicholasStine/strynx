"use client";

import { useCallback, useEffect, useState } from "react";
import { parseMidi } from "@/lib/midi";
import { usePlaybackStore } from "@/store/playback";

export default function ExampleSongs() {
  const { setEvents } = usePlaybackStore();
  const [songs, setSongs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/examples")
      .then((r) => r.json())
      .then(setSongs)
      .catch(() => {});
  }, []);

  const loadSong = useCallback(
    async (filename: string) => {
      setLoading(true);
      try {
        const res = await fetch(`/midi/${filename}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();
        const parsed = parseMidi(buffer);
        const displayName = filename.replace(/\.midi?$/i, "").replace(/[_-]/g, " ");
        setEvents(parsed, displayName);
      } catch (err) {
        console.error("Failed to load example song:", err);
      } finally {
        setLoading(false);
      }
    },
    [setEvents]
  );

  if (songs.length === 0) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <span className="text-sm text-zinc-500 dark:text-zinc-400">or try an example:</span>
      <select
        disabled={loading}
        value=""
        onChange={(e) => {
          if (e.target.value) loadSong(e.target.value);
        }}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 shadow-sm transition-colors hover:border-zinc-400 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
      >
        <option value="" disabled>
          Select a song…
        </option>
        {songs.map((s) => (
          <option key={s} value={s}>
            {s.replace(/\.midi?$/i, "").replace(/[_-]/g, " ")}
          </option>
        ))}
      </select>
      {loading && (
        <span className="text-xs text-zinc-400 dark:text-zinc-500">Loading…</span>
      )}
    </div>
  );
}
