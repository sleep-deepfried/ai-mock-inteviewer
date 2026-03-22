/**
 * AudioWorklet processor that downsamples audio to 16kHz 16-bit PCM mono.
 *
 * This module exports a pure `downsampleToPcm16` function for testability,
 * and conditionally registers the AudioWorklet processor when running
 * inside an AudioWorklet context.
 */

/* AudioWorklet global types — only available inside the worklet scope */
declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean;
}
declare function registerProcessor(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processorCtor: new () => any
): void;
declare const sampleRate: number;

const TARGET_SAMPLE_RATE = 16000;

/**
 * Downsample Float32 audio from a source sample rate to 16kHz 16-bit PCM (little-endian).
 * Uses linear interpolation for resampling.
 */
export function downsampleToPcm16(
  input: Float32Array,
  sourceSampleRate: number
): ArrayBuffer {
  const ratio = sourceSampleRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.floor(input.length / ratio);
  const buffer = new ArrayBuffer(outputLength * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const index0 = Math.floor(srcIndex);
    const index1 = Math.min(index0 + 1, input.length - 1);
    const frac = srcIndex - index0;

    // Linear interpolation
    const sample = input[index0] * (1 - frac) + input[index1] * frac;

    // Clamp to [-1, 1] and convert to 16-bit signed integer
    const clamped = Math.max(-1, Math.min(1, sample));
    const int16 = Math.round(clamped * 32767);

    view.setInt16(i * 2, int16, true); // little-endian
  }

  return buffer;
}

// Register the AudioWorklet processor only when running in an AudioWorklet context
if (typeof registerProcessor !== "undefined") {
  class PcmProcessor extends AudioWorkletProcessor {
    process(inputs: Float32Array[][]): boolean {
      const input = inputs[0];
      if (!input || !input[0] || input[0].length === 0) {
        return true;
      }

      const channelData = input[0];
      const pcmBuffer = downsampleToPcm16(channelData, sampleRate);
      this.port.postMessage(pcmBuffer);

      return true;
    }
  }

  registerProcessor("pcm-processor", PcmProcessor);
}
