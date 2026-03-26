/**
 * Gemini Live Client — wraps @google/genai SDK live.connect() with ephemeral token.
 * Handles bidirectional audio streaming, transcript events, and session timeout.
 */

import { GoogleGenAI, Modality } from "@google/genai";

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export class GeminiLiveClient {
  private client: GoogleGenAI;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private session: any = null;
  private timeoutTimer: ReturnType<typeof setTimeout> | null = null;

  onAudio: ((pcmData: ArrayBuffer) => void) | null = null;
  onTurnComplete: (() => void) | null = null;
  onInterrupted: (() => void) | null = null;
  onError: ((error: Error) => void) | null = null;
  onSessionTimeout: (() => void) | null = null;
  onInputTranscript: ((text: string) => void) | null = null;
  onOutputTranscript: ((text: string) => void) | null = null;

  constructor(token: string) {
    this.client = new GoogleGenAI({
      apiKey: token,
      httpOptions: { apiVersion: "v1alpha" },
    });
  }

  async connect(): Promise<void> {
    try {
      const session = await this.client.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
        },
        callbacks: {
          onopen: () => {
            // Connection established
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onmessage: (message: any) => {
            this.handleMessage(message);
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onerror: (error: any) => {
            if (this.onError) {
              this.onError(
                error instanceof Error ? error : new Error(String(error))
              );
            }
          },
          onclose: () => {
            // Connection closed
          },
        },
      });

      this.session = session;

      // Send initial prompt to make the AI greet the candidate first
      session.sendClientContent({
        turns: [{ role: "user", parts: [{ text: "Please begin the interview by introducing yourself and asking your first question." }] }],
        turnComplete: true,
      });

      // Start the 15-minute session timer
      this.timeoutTimer = setTimeout(() => {
        this.handleSessionTimeout();
      }, SESSION_TIMEOUT_MS);
    } catch (error) {
      if (this.onError) {
        this.onError(
          error instanceof Error ? error : new Error(String(error))
        );
      }
      throw error;
    }
  }

  sendActivityStart(): void {
    if (!this.session) return;
    this.session.sendRealtimeInput({ activityStart: {} });
  }

  sendActivityEnd(): void {
    if (!this.session) return;
    this.session.sendRealtimeInput({ activityEnd: {} });
  }

  sendAudio(pcmData: ArrayBuffer): void {
    if (!this.session) {
      return;
    }

    // Convert ArrayBuffer to base64 for the SDK
    const bytes = new Uint8Array(pcmData);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    this.session.sendRealtimeInput({
      audio: {
        data: base64,
        mimeType: "audio/pcm;rate=16000",
      },
    });
  }

  disconnect(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }

    if (this.session) {
      try {
        this.session.close();
      } catch {
        // already closed
      }
      this.session = null;
    }
  }

  private handleSessionTimeout(): void {
    this.disconnect();
    if (this.onSessionTimeout) {
      this.onSessionTimeout();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleMessage(message: any): void {
    // Handle audio data from server turns
    const serverContent = message.serverContent;
    if (serverContent) {
      const modelTurn = serverContent.modelTurn;
      if (modelTurn?.parts && this.onAudio) {
        let total = 0;
        const chunks: Uint8Array[] = [];
        for (const part of modelTurn.parts) {
          if (part.inlineData?.data && typeof part.inlineData.data === "string") {
            const binaryStr = atob(part.inlineData.data);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            chunks.push(bytes);
            total += bytes.length;
          }
        }
        if (total > 0) {
          const merged = new Uint8Array(total);
          let offset = 0;
          for (const c of chunks) {
            merged.set(c, offset);
            offset += c.length;
          }
          this.onAudio(merged.buffer);
        }
      }

      // Handle turn complete (AI finished speaking)
      if (serverContent.turnComplete) {
        if (this.onTurnComplete) {
          this.onTurnComplete();
        }
      }

      // Handle interruption (user started talking while AI was speaking)
      if (serverContent.interrupted) {
        if (this.onInterrupted) {
          this.onInterrupted();
        }
      }

      // Handle input audio transcription (user speech)
      if (serverContent.inputTranscription?.text) {
        if (this.onInputTranscript) {
          this.onInputTranscript(serverContent.inputTranscription.text);
        }
      }

      // Handle output audio transcription (AI speech)
      if (serverContent.outputTranscription?.text) {
        if (this.onOutputTranscript) {
          this.onOutputTranscript(serverContent.outputTranscription.text);
        }
      }
    }
  }
}
