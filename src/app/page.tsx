"use client";

import MidiImport from "@/components/MidiImport";
import PlaybackControls from "@/components/PlaybackControls";
import PianoView from "@/components/piano/PianoView";
import { usePlaybackStore } from "@/store/playback";

export default function Home() {
  const { events } = usePlaybackStore();
  const hasEvents = events.length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Strynx
          </h1>
          <p className="mt-2 text-base text-zinc-500 dark:text-zinc-400">
            MIDI visualizer and practice tool for piano and cello
          </p>
        </header>

        {/* MIDI Import */}
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Load MIDI File
          </h2>
          <MidiImport />
        </section>

        {/* Playback controls + instrument view — only shown after MIDI is loaded */}
        {hasEvents && (
          <>
            <section className="mb-10">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Playback
              </h2>
              <PlaybackControls />
            </section>
            <section>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Instrument
              </h2>
              <PianoView />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
