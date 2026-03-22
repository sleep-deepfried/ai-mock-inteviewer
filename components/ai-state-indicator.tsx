"use client";

export type AIState = "idle" | "listening" | "thinking" | "speaking";

interface AIStateIndicatorProps {
  state: AIState;
}

const labels: Record<AIState, string> = {
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

export function AIStateIndicator({ state }: AIStateIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-300">
      <span className="relative flex h-3 w-3">
        {(state === "listening" || state === "speaking") && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex h-3 w-3 rounded-full ${
            state === "idle"
              ? "bg-gray-500"
              : state === "listening"
                ? "bg-green-400"
                : state === "thinking"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-purple-400"
          }`}
        />
      </span>
      {labels[state]}
    </div>
  );
}
