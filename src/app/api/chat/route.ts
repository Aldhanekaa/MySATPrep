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
      return `You are an expert SAT vocabulary tutor. Help the user practice using the word "${data.word}" in a sentence. The user has provided their own sentence: "${data.userSentence}". The example sentence provided by dictionary is "${data.exampleSentence}," while the definition of the word "${data.word}" is "${data.correctDefinition}". Evaluate the user's sentence for correctness and provide feedback. If the sentence is incorrect, provide a correct example sentence using the word. Encourage the user to try again if they are incorrect. Always respond in JSON format with this following format : {correct: boolean, aiResponse: string; hint: string}. ${templateAtEnd}`;
  }
}

export async function POST(req: Request) {
  const {
    message,
    data,
    task,
  }: { message: string; data: any; task: Task | undefined | string } =
    await req.json();

  if (
    !task ||
    (task !== "validate-user-definition" && task !== "validate-user-sentence")
  ) {
    return NextResponse.json({ error: "Missing task" }, { status: 400 });
  }

  //   console.log("API Key:", process.env.OPENROUTER_KEY ? "Exists" : "Missing");
  //   console.log("Received message:", message);
  //   console.log("Received data:", data);

  const result = await generateText({
    model: openrouter.chat("deepseek/deepseek-chat-v3.1:free"),
    system: getSystem(task, data), // Context: ${JSON.stringify(data)}
    prompt: message,
  });

  //   console.log("Deepseeker response:", result);
  //   console.log("Deepseeker response text:", result.text);
  //   console.log("Deepseeker response providerMetadata:", result.providerMetadata);

  if (result.text) {
    const jsonResponse = JSON.parse(result.text);
    return NextResponse.json(
      { result: jsonResponse, success: true },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { message: "Unable to parse AI Response to JSON.", success: false },
    { status: 200 }
  );
}
