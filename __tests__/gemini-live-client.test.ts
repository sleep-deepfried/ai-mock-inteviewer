import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock session object
const mockSession = {
  sendRealtimeInput: vi.fn(),
  sendClientContent: vi.fn(),
  close: vi.fn(),
};

// Capture the callbacks passed to live.connect
let capturedCallbacks: Record<string, (...args: unknown[]) => void> = {};

vi.mock("@google/genai", () => ({
  Modality: { AUDIO: "AUDIO" },
  GoogleGenAI: class {
    live = {
      connect: vi.fn().mockImplementation(async (opts: Record<string, unknown>) => {
        const callbacks = (opts.callbacks || {}) as Record<string, (...args: unknown[]) => void>;
        capturedCallbacks = callbacks;
        return mockSession;
      }),
    };
  },
}));

import { GeminiLiveClient } from "@/lib/gemini-live-client";

describe("GeminiLiveClient", () => {
  let client: GeminiLiveClient;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    capturedCallbacks = {};
    client = new GeminiLiveClient("test-token");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("connect() establishes a session", async () => {
    await client.connect();
    // Session should be established (no error thrown)
    expect(capturedCallbacks).toBeDefined();
  });

  it("sendAudio() sends data to session", async () => {
    await client.connect();

    const pcmData = new ArrayBuffer(4);
    const view = new DataView(pcmData);
    view.setInt16(0, 1000, true);
    view.setInt16(2, -500, true);

    client.sendAudio(pcmData);

    expect(mockSession.sendRealtimeInput).toHaveBeenCalledTimes(1);
    const sendArg = mockSession.sendRealtimeInput.mock.calls[0][0];
    expect(sendArg.audio).toBeDefined();
    expect(sendArg.audio.mimeType).toBe("audio/pcm;rate=16000");
    expect(typeof sendArg.audio.data).toBe("string"); // base64
  });

  it("sendAudio() does nothing when not connected", () => {
    const pcmData = new ArrayBuffer(4);
    client.sendAudio(pcmData);
    expect(mockSession.sendRealtimeInput).not.toHaveBeenCalled();
  });

  it("disconnect() closes the session", async () => {
    await client.connect();
    client.disconnect();
    expect(mockSession.close).toHaveBeenCalledTimes(1);
  });

  it("onAudio callback fires when audio data is received", async () => {
    const audioHandler = vi.fn();
    client.onAudio = audioHandler;

    await client.connect();

    // Simulate a server message with audio data
    // Create some base64 audio data
    const testBytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    let binary = "";
    for (let i = 0; i < testBytes.length; i++) {
      binary += String.fromCharCode(testBytes[i]);
    }
    const base64Data = btoa(binary);

    capturedCallbacks.onmessage({
      serverContent: {
        modelTurn: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: "audio/pcm",
              },
            },
          ],
        },
      },
    });

    expect(audioHandler).toHaveBeenCalledTimes(1);
    const receivedBuffer = audioHandler.mock.calls[0][0] as ArrayBuffer;
    expect(new Uint8Array(receivedBuffer)).toEqual(testBytes);
  });

  it("session timeout fires after 15 minutes", async () => {
    const timeoutHandler = vi.fn();
    client.onSessionTimeout = timeoutHandler;

    await client.connect();

    // Advance time by 15 minutes
    vi.advanceTimersByTime(15 * 60 * 1000);

    expect(timeoutHandler).toHaveBeenCalledTimes(1);
    expect(mockSession.close).toHaveBeenCalledTimes(1);
  });

  it("disconnect() clears the timeout timer", async () => {
    const timeoutHandler = vi.fn();
    client.onSessionTimeout = timeoutHandler;

    await client.connect();
    client.disconnect();

    // Advance time past 15 minutes — timeout should NOT fire
    vi.advanceTimersByTime(15 * 60 * 1000);

    expect(timeoutHandler).not.toHaveBeenCalled();
  });
});
