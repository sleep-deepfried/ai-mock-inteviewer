/**
 * Audio Playback — worklet-based queue playback for smooth, gapless audio.
 * Receives PCM16 data, converts to Float32, and sends to the playback worklet.
 */

const PLAYBACK_SAMPLE_RATE = 24000;

/**
 * Convert 16-bit little-endian PCM to Float32 (divide by 32768).
 */
export function pcmToFloat32(pcmData: ArrayBuffer): Float32Array {
  const view = new DataView(pcmData);
  const numSamples = Math.floor(pcmData.byteLength / 2);
  const float32 = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const int16 = view.getInt16(i * 2, true);
    float32[i] = int16 / 32768;
  }

  return float32;
}

/**
 * Convert Float32 back to 16-bit little-endian PCM.
 */
export function float32ToPcm16(float32: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < float32.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32[i]));
    const int16 = Math.round(sample * 32768);
    const clamped = Math.max(-32768, Math.min(32767, int16));
    view.setInt16(i * 2, clamped, true);
  }

  return buffer;
}

/**
 * Compute the next start time for gapless scheduling.
 */
export function computeNextStartTime(
  currentNextStartTime: number,
  contextCurrentTime: number,
  bufferDuration: number
): { scheduleTime: number; newNextStartTime: number } {
  const scheduleTime = Math.max(currentNextStartTime, contextCurrentTime);
  return {
    scheduleTime,
    newNextStartTime: scheduleTime + bufferDuration,
  };
}

export class AudioPlayback {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private initialized = false;
  private useFallback = false;
  private sources: AudioBufferSourceNode[] = [];
  private nextStartTime = 0;

  private async init(): Promise<void> {
    if (this.initialized) return;

    this.audioContext = new AudioContext({ sampleRate: PLAYBACK_SAMPLE_RATE });

    try {
      // Try loading from static file first (most reliable)
      try {
        await this.audioContext.audioWorklet.addModule("/audio-playback-processor.js");
        this.workletNode = new AudioWorkletNode(this.audioContext, "pcm-playback-processor");
        this.workletNode.connect(this.audioContext.destination);
        this.initialized = true;
        return;
      } catch {
        // Static file failed, try Blob URL
      }

      // Fallback: inline worklet via Blob URL
      const workletCode = `
class P extends AudioWorkletProcessor {
  constructor() {
    super();
    this.q = [];
    this.port.onmessage = (e) => {
      if (e.data === "interrupt") this.q = [];
      else if (e.data instanceof Float32Array) this.q.push(e.data);
    };
  }
  process(i, o) {
    const c = o[0] && o[0][0];
    if (!c) return true;
    let x = 0;
    while (x < c.length && this.q.length > 0) {
      const b = this.q[0];
      if (!b || !b.length) { this.q.shift(); continue; }
      const n = Math.min(c.length - x, b.length);
      for (let j = 0; j < n; j++) c[x++] = b[j];
      if (n < b.length) this.q[0] = b.slice(n); else this.q.shift();
    }
    while (x < c.length) c[x++] = 0;
    return true;
  }
}
registerProcessor("pcm-playback-processor", P);`;
      const blob = new Blob([workletCode], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      await this.audioContext.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      this.workletNode = new AudioWorkletNode(this.audioContext, "pcm-playback-processor");
      this.workletNode.connect(this.audioContext.destination);
      this.initialized = true;
    } catch (err) {
      // Fallback: use buffer source scheduling if worklet fails
      console.warn("Playback worklet failed, using fallback", err);
      this.initialized = true;
      this.useFallback = true;
    }
  }

  async play(pcmData: ArrayBuffer): Promise<void> {
    await this.init();

    const float32 = pcmToFloat32(pcmData);

    if (this.useFallback) {
      // Fallback: createBufferSource scheduling
      const audioBuffer = this.audioContext!.createBuffer(
        1,
        float32.length,
        PLAYBACK_SAMPLE_RATE
      );
      audioBuffer.copyToChannel(float32 as Float32Array<ArrayBuffer>, 0);

      const source = this.audioContext!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext!.destination);

      const scheduleTime = Math.max(this.nextStartTime, this.audioContext!.currentTime);
      source.start(scheduleTime);
      this.nextStartTime = scheduleTime + audioBuffer.duration;

      source.onended = () => {
        const idx = this.sources.indexOf(source);
        if (idx !== -1) this.sources.splice(idx, 1);
      };
      this.sources.push(source);
    } else {
      this.workletNode!.port.postMessage(float32);
    }
  }

  stop(): void {
    if (this.useFallback) {
      for (const source of this.sources) {
        try { source.stop(); } catch { /* already stopped */ }
      }
      this.sources = [];
      this.nextStartTime = 0;
    } else if (this.workletNode) {
      this.workletNode.port.postMessage("interrupt");
    }
  }

  isPlaying(): boolean {
    return this.initialized;
  }
}
