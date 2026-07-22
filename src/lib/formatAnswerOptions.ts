import { API_Response_Question } from "@/types";

export const normalizeAnswerOptions = (
  answeroptions: unknown,
): API_Response_Question["answerOptions"] => {
  if (Array.isArray(answeroptions)) {
    const arr = answeroptions as Array<{ content?: unknown }>;
    const [a, b, c, d] = arr.map((item) => item?.content);
    if (
      typeof a === "string" &&
      typeof b === "string" &&
      typeof c === "string" &&
      typeof d === "string"
    ) {
      return { A: a, B: b, C: c, D: d };
    }
    return undefined;
  }

  if (answeroptions && typeof answeroptions === "object") {
    const obj = answeroptions as Record<string, unknown>;
    const a = obj.A ?? obj.a;
    const b = obj.B ?? obj.b;
    const c = obj.C ?? obj.c;
    const d = obj.D ?? obj.d;

    if (
      typeof a === "string" &&
      typeof b === "string" &&
      typeof c === "string" &&
      typeof d === "string"
    ) {
      return { A: a, B: b, C: c, D: d };
    }
  }

  return undefined;
};
