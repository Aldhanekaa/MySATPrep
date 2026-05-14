import { NextRequest, NextResponse } from "next/server";
import getInternalAPITargetURL from "@/lib/getInternalAPITargetURL";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
): Promise<NextResponse> {
  const { questionId } = await params;

  if (!questionId) {
    return NextResponse.json(
      {
        success: false,
        error: "Question ID parameter is required",
      },
      { status: 400 },
    );
  }

  try {
    // Call the internal student-qb API
    const internalApiUrl = getInternalAPITargetURL();
    const response = await fetch(
      `${internalApiUrl}/api/student-qb/question-by-id/${questionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || "Failed to fetch question",
          details: errorData.details,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json(
      {
        success: data.success,
        data: data.data,
        message: data.message || "Question bank stats fetched successfully",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600",
          "CDN-Cache-Control": "public, s-maxage=60",
          "Vercel-CDN-Cache-Control": "public, s-maxage=3600",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching question stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch question bank stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
