import * as Tone from "tone";
import { MidiEvent } from "./midi";

type PartEvent = {
  time: number;
  pitch: number;
  duration: number;
  velocity: number;
};

const SALAMANDER_BASE_URL = "https://tonejs.github.io/audio/salamander/";

const SAMPLE_URLS: Record<string, string> = {
  A1: "A1.mp3",
  A2: "A2.mp3",
  A3: "A3.mp3",
  A4: "A4.mp3",
  A5: "A5.mp3",
  A6: "A6.mp3",
  A7: "A7.mp3",
};

export class AudioEngine {
  private sampler: Tone.Sampler | null = null;
  private part: Tone.Part<PartEvent> | null = null;
  private events: MidiEvent[] = [];
  private tempo = 1;
  private transpose = 0;
  private enabled = true;
  private initPromise: Promise<void> | null = null;

  private ensureInit(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      await Tone.start();
      this.sampler = new Tone.Sampler({
        urls: SAMPLE_URLS,
        baseUrl: SALAMANDER_BASE_URL,
      }).toDestination();
      await Tone.loaded();
    })();
    return this.initPromise;
  }

  load(events: MidiEvent[]): void {
    this.events = events;
    this.stopTransport();
  }

  async play(fromMs: number): Promise<void> {
    if (!this.enabled) return;
    await this.ensureInit();
    this.stopTransport();
    this.buildPart(fromMs);
    Tone.getTransport().start("+0.05");
  }

  pause(): void {
    this.sampler?.releaseAll();
    Tone.getTransport().pause();
  }

  seek(ms: number, isPlaying: boolean): void {
    this.sampler?.releaseAll();
    this.stopTransport();
    if (isPlaying && this.enabled && this.sampler) {
      this.buildPart(ms);
      Tone.getTransport().start("+0.05");
    }
  }

  setTempo(multiplier: number, currentMs: number, isPlaying: boolean): void {
    const shouldResume = isPlaying && this.enabled && !!this.sampler;
    this.sampler?.releaseAll();
    this.stopTransport();
    this.tempo = multiplier;
    if (shouldResume) {
      this.buildPart(currentMs);
      Tone.getTransport().start("+0.05");
    }
  }

  setTranspose(semitones: number, currentMs: number, isPlaying: boolean): void {
    const shouldResume = isPlaying && this.enabled && !!this.sampler;
    this.sampler?.releaseAll();
    this.stopTransport();
    this.transpose = semitones;
    if (shouldResume) {
      this.buildPart(currentMs);
      Tone.getTransport().start("+0.05");
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.sampler?.releaseAll();
      this.stopTransport();
    }
  }

  destroy(): void {
    this.stopTransport();
    this.sampler?.dispose();
    this.sampler = null;
    this.initPromise = null;
  }

  private buildPart(fromMs: number): void {
    this.disposePart();
    if (!this.sampler || !this.events.length) return;

    // Include events that haven't fully ended yet; notes in progress start immediately
    const partEvents = this.events
      .filter((e) => e.endMs > fromMs)
      .map((e) => ({
        time: Math.max(0, e.startMs - fromMs) / 1000 / this.tempo,
        pitch: Math.max(21, Math.min(108, e.pitch + this.transpose)),
        duration: Math.max(
          0.05,
          (e.endMs - Math.max(e.startMs, fromMs)) / 1000 / this.tempo
        ),
        velocity: e.velocity / 127,
      }));

    this.part = new Tone.Part<PartEvent>((time, event) => {
      if (this.enabled && this.sampler) {
        const note = Tone.Frequency(event.pitch, "midi").toNote();
        this.sampler.triggerAttackRelease(
          note,
          event.duration,
          time,
          event.velocity
        );
      }
    }, partEvents);

    this.part.start(0);
  }

  private disposePart(): void {
    if (this.part) {
      this.part.dispose();
      this.part = null;
    }
  }

  private stopTransport(): void {
    this.disposePart();
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
  }
}
