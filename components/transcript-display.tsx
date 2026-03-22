"use client";

import { useEffect, useRef } from "react";

export interface TranscriptMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  committedText?: string;
  timestamp: number;
}

interface TranscriptDisplayProps {
  messages: TranscriptMessage[];
}

export function TranscriptDisplay({ messages }: TranscriptDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      bottomRef.current &&
      typeof bottomRef.current.scrollIntoView === "function"
    ) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((msg, i) => {
        const prevMsg = messages[i - 1];
        const showTime =
          !prevMsg ||
          formatTime(prevMsg.timestamp) !== formatTime(msg.timestamp);
        return (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-gray-200"
              }`}
            >
              {msg.text}
            </div>
            {showTime && (
              <span className="mt-1 text-xs text-gray-500">
                {formatTime(msg.timestamp)}
              </span>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
