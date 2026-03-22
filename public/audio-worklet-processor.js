/**
 * Audio Worklet Processor for capturing audio.
 * Sends each process() call immediately for lowest latency.
 */

class AudioCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) {
      return true;
    }

    // Send immediately — no buffering
    this.port.postMessage(new Float32Array(input[0]));
    return true;
  }
}

registerProcessor("pcm-processor", AudioCaptureProcessor);
