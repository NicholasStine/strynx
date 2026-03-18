export type TickCallback = (currentMs: number) => void;

export class PlaybackEngine {
  private rafId: number | null = null;
  private startWallTime: number = 0;
  private startSongMs: number = 0;
  private _currentMs: number = 0;
  private _isPlaying: boolean = false;
  private _tempo: number = 1;
  private _duration: number = 0;
  private _loopStart: number = 0;
  private _loopEnd: number = 0;
  private _loopEnabled: boolean = false;
  private onTick: TickCallback;

  constructor(onTick: TickCallback) {
    this.onTick = onTick;
  }

  get currentMs() {
    return this._currentMs;
  }

  get isPlaying() {
    return this._isPlaying;
  }

  setDuration(duration: number) {
    this._duration = duration;
  }

  setTempo(tempo: number) {
    if (this._isPlaying) {
      // Rebase so position doesn't jump on tempo change
      this.startSongMs = this._currentMs;
      this.startWallTime = performance.now();
    }
    this._tempo = tempo;
  }

  setLoop(enabled: boolean, start: number, end: number) {
    this._loopEnabled = enabled;
    this._loopStart = start;
    this._loopEnd = end;
  }

  play() {
    if (this._isPlaying) return;
    this._isPlaying = true;
    this.startSongMs = this._currentMs;
    this.startWallTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  pause() {
    this._isPlaying = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  seek(ms: number) {
    this._currentMs = Math.max(0, Math.min(ms, this._duration));
    if (this._isPlaying) {
      this.startSongMs = this._currentMs;
      this.startWallTime = performance.now();
    }
    this.onTick(this._currentMs);
  }

  destroy() {
    this.pause();
  }

  private tick = () => {
    if (!this._isPlaying) return;

    const elapsed = (performance.now() - this.startWallTime) * this._tempo;
    let current = this.startSongMs + elapsed;

    if (this._loopEnabled && this._loopEnd > this._loopStart) {
      if (current >= this._loopEnd) {
        const loopLen = this._loopEnd - this._loopStart;
        current = this._loopStart + ((current - this._loopStart) % loopLen);
        this.startSongMs = current;
        this.startWallTime = performance.now();
      }
    } else if (this._duration > 0 && current >= this._duration) {
      this._currentMs = this._duration;
      this._isPlaying = false;
      this.rafId = null;
      this.onTick(this._currentMs);
      return;
    }

    this._currentMs = current;
    this.onTick(current);
    this.rafId = requestAnimationFrame(this.tick);
  };
}
