import { fetchQuestionData } from "@/lib/questionFetcher";
import {
  DictionaryAPI_Response_NOTFOUND,
  DictionaryAPI_Response_OK,
  Vocab_Phonetic,
  VocabAPI_Meaning,
} from "@/types/dictionaryapi";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vocab: string }> }
) {
  const { vocab } = await params;

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${vocab}`,
      {
        next: { revalidate: 86400 },
        cache: "force-cache",
      }
    );
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch data from dictionary API",
        },
        { status: 500 }
      );
    }
    const data: DictionaryAPI_Response_NOTFOUND | DictionaryAPI_Response_OK =
      await response.json();
    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No data found for the given vocabulary",
        },
        { status: 404 }
      );
    }

    const oneData = data[0];
    let phoneticData: Vocab_Phonetic | null = null;

    oneData.phonetics.forEach((phonetic) => {
      if (!phoneticData && typeof phonetic.text === "string") {
        phoneticData = {
          ...phonetic,
          text: phonetic.text as string,
        };
        return;
      }
    });

    let meanings: VocabAPI_Meaning = {};

    oneData.meanings.forEach((meaning) => {
      if (meaning.partOfSpeech) {
        meanings[meaning.partOfSpeech as keyof VocabAPI_Meaning] = meaning;
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          word: oneData.word,
          phonetic: phoneticData,
          meanings: meanings,
        },
        message: "Question retrieved successfully",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "CDN-Cache-Control": "public, s-maxage=60",
          "Vercel-CDN-Cache-Control": "public, s-maxage=3600",
        },
      }
    );

    // Process the data as needed
  } catch (error) {}
}
