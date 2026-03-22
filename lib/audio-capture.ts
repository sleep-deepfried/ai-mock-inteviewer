/**
 * Audio Capture — captures mic audio at 16kHz using AudioWorklet.
 * Uses a 16kHz AudioContext so the browser handles resampling natively.
 * The worklet buffers 4096 samples (~256ms) before sending.
 */

const SAMPLE_RATE = 16000;

export class AudioCapture {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  onPcmChunk: ((chunk: ArrayBuffer) => void) | null = null;

  async start(): Promise<void> {
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: SAMPLE_RATE,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });

    // Inline worklet as data URI to avoid Next.js dev server issues
    const captureWorkletCode = [
      'class P extends AudioWorkletProcessor{',
      'process(i){const c=i[0]&&i[0][0];',
      'if(c&&c.length>0)this.port.postMessage(new Float32Array(c));',
      'return true;}}',
      'registerProcessor("pcm-processor",P);',
    ].join('');
    const dataUrl = `data:application/javascript,${encodeURIComponent(captureWorkletCode)}`;
    await this.audioContext.audioWorklet.addModule(dataUrl);

    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

    this.analyserNode = this.audioContext.createAnalyser();
    this.sourceNode.connect(this.analyserNode);

    this.workletNode = new AudioWorkletNode(this.audioContext, "pcm-processor");
    this.workletNode.port.onmessage = (event: MessageEvent) => {
      if (event.data instanceof Float32Array && this.onPcmChunk) {
        const pcm16 = this.convertToPCM16(event.data);
        this.onPcmChunk(pcm16);
      }
    };

    this.analyserNode.connect(this.workletNode);
  }

  stop(): void {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  /** Convert Float32Array to PCM16 ArrayBuffer */
  private convertToPCM16(float32Array: Float32Array): ArrayBuffer {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = sample * 0x7fff;
    }
    return int16Array.buffer;
  }
}
