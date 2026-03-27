import { Behavior, Type } from "@google/genai";
import type { Tool } from "@google/genai";

/** Must match client handling in `hooks/use-interview.ts`. */
export const END_INTERVIEW_FUNCTION_NAME = "end_interview";

export const interviewLiveTools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: END_INTERVIEW_FUNCTION_NAME,
        description:
          "Call exactly once when the mock interview is complete: you have given your closing thanks, any brief sell of the role if appropriate, and clear next steps. Do not call this mid-conversation or before the candidate has had a real exchange. After this call, the session ends and the candidate sees their results.",
        behavior: Behavior.BLOCKING,
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
    ],
  },
];
