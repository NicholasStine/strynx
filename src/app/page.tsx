"use client";

import MidiImport from "@/components/MidiImport";
import PlaybackControls from "@/components/PlaybackControls";
import PianoView from "@/components/piano/PianoView";
import CelloView from "@/components/cello/CelloView";
import { usePlaybackStore } from "@/store/playback";

export default function Home() {
  const { events, instrument, setInstrument } = usePlaybackStore();
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
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Instrument
                </h2>
                {/* Instrument selector */}
                <div className="flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
                  {(["piano", "cello"] as const).map((inst) => (
                    <button
                      key={inst}
                      onClick={() => setInstrument(inst)}
                      className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                        instrument === inst
                          ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                          : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                      }`}
                    >
                      {inst}
                    </button>
                  ))}
                </div>
              </div>
              {instrument === "piano" ? <PianoView /> : <CelloView />}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
