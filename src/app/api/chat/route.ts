import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

import { NextResponse } from "next/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_KEY || "",
});

type Task = "validate-user-definition" | "validate-user-sentence";

function getSystem(task: Task, data: any) {
  const templateAtEnd = `DO NOT RESPONSE A JSON FORMaT WITH ${"```json"} at the beginnning or ${"```"} at the end. ONLY RESPOND WITH THE RAW JSON.`;
  switch (task) {
    case "validate-user-definition":
      return `You are an expert SAT vocabulary tutor. Help the user learn the meaning of the word "${data.word}". The user has provided their own definition: "${data.userDefinition}". The correct definition of the word "${data.word}" is: "${data.correctDefinition}". Evaluate the user's definition for correctness and provide feedback, user's definition DOESNT HAVE TO BE EXACTLY THE SAME, it has to be sounds the same thing not exactly the same. If the definition is incorrect, provide the correct definition and an example sentence using the word. Encourage the user to try again if they are incorrect. Always respond in JSON format with this following format : {correct: boolean, exampleSentence: string, aiResponse: string; hint: string}. ${templateAtEnd}`;
    case "validate-user-sentence":
      return `You are an expert SAT vocabulary tutor. Help the user practice using the word "${data.word}" in a sentence. The user has provided their own sentence: "${data.userSentence}". The example sentence provided by dictionary is "${data.exampleSentence}," while the definition of the word "${data.word}" is "${data.correctDefinition}". Evaluate the user's sentence for correctness and provide feedback. If the sentence is incorrect, provide a correct example sentence using the word. Encourage the user to try again if they are incorrect. Always respond in JSON format with this following format : {correct: boolean, aiResponse: string; hint: string}. And also show minimum of 3 example sentences of properly using that word. ${templateAtEnd}`;
  }
}

export async function POST(req: Request) {
  let body: { message: string; data: any; task: Task | undefined | string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }

  const { message, data, task } = body;

  if (
    !task ||
    (task !== "validate-user-definition" && task !== "validate-user-sentence")
  ) {
    return NextResponse.json(
      { success: false, error: "Missing or invalid task" },
      { status: 400 },
    );
  }

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { success: false, error: "message must be a non-empty string" },
      { status: 400 },
    );
  }

  const system = getSystem(task, data);

  try {
    const result = await generateText({
      model: openrouter.chat("z-ai/glm-4.5-air:free"),
      system: system,
      prompt: message,
    });

    if (!result.text) {
      return NextResponse.json(
        { success: false, error: "AI returned an empty response" },
        { status: 502 },
      );
    }

    try {
      const jsonResponse = JSON.parse(result.text);
      return NextResponse.json(
        { result: jsonResponse, success: true },
        { status: 200 },
      );
    } catch {
      return NextResponse.json(
        { success: false, error: "Unable to parse AI response as JSON" },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("[POST /api/chat] AI generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate AI response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
