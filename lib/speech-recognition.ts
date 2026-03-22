/**
 * Browser SpeechRecognition wrapper for real-time user transcript.
 * Works in Chrome and Brave (uses webkitSpeechRecognition).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognitionAPI = typeof window !== "undefined"
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : null;

export class SpeechRecognizer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private running = false;

  onInterim: ((text: string) => void) | null = null;
  onFinal: ((text: string) => void) | null = null;

  start(): void {
    if (!SpeechRecognitionAPI || this.running) return;

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";

    this.recognition.onresult = (event: { resultIndex: number; results: { length: number; [index: number]: { isFinal: boolean; [index: number]: { transcript: string } } } }) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final && this.onFinal) {
        this.onFinal(final);
      }
      if (interim && this.onInterim) {
        this.onInterim(interim);
      }
    };

    // Auto-restart on end (browser stops after silence)
    this.recognition.onend = () => {
      if (this.running) {
        try {
          this.recognition.start();
        } catch {
          // already started
        }
      }
    };

    this.recognition.onerror = () => {
      // Silently handle errors — recognition will auto-restart via onend
    };

    this.running = true;
    this.recognition.start();
  }

  stop(): void {
    this.running = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // already stopped
      }
      this.recognition = null;
    }
  }

  static isSupported(): boolean {
    return !!SpeechRecognitionAPI;
  }
}
