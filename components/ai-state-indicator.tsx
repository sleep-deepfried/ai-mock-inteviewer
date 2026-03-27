"use client";

export type AIState = "idle" | "listening" | "thinking" | "speaking";

interface AIStateIndicatorProps {
  state: AIState;
}

const labels: Record<AIState, string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Interviewer speaking",
};

const hints: Record<AIState, string> = {
  idle: "Session will begin shortly.",
  listening: "Unmute and answer when you are ready.",
  thinking: "Processing your answer…",
  speaking: "You can interrupt by speaking while unmuted.",
};

export function AIStateIndicator({ state }: AIStateIndicatorProps) {
  return (
    <div className="flex max-w-xs flex-col items-center gap-1 text-center sm:max-w-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
        <span className="relative flex h-3 w-3">
          {(state === "listening" || state === "speaking") && (
            <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-purple-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex h-3 w-3 rounded-full ${
              state === "idle"
                ? "bg-gray-500"
                : state === "listening"
                  ? "bg-emerald-400"
                  : state === "thinking"
                    ? "motion-safe:animate-pulse bg-amber-400"
                    : "bg-purple-400"
            }`}
          />
        </span>
        {labels[state]}
      </div>
      <p className="text-xs leading-relaxed text-gray-500">{hints[state]}</p>
    </div>
  );
}
