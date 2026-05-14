import { fetchQuestionData } from "@/lib/questionFetcher";
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  const { questionId } = await params;

  const result = await fetchQuestionData(questionId);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        details: result.error,
      },
      { status: result.status || 400 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: result.data,
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
}
