import { StatsAPIErrorResponse } from "@/types";
import { NextResponse } from "next/server";
import { fetchCbJwtToken } from "@/lib/fetchCbJwtToken";

export async function GET(): Promise<NextResponse> {
  try {
    const { cbJwtToken, status, error } = await fetchCbJwtToken();

    if (status !== 200) {
      return NextResponse.json<StatsAPIErrorResponse>(
        {
          success: false,
          error: "Failed to fetch credentials",
          details: error || "Unknown upstream error",
        },
        { status },
      );
    }

    if (!cbJwtToken) {
      return NextResponse.json<StatsAPIErrorResponse>(
        {
          success: false,
          error: "Missing cbJwtToken",
          details: "Upstream response did not include cbJwtToken",
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        cbJwtToken,

        message: "cbJwtToken fetched successfully",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300",
          "CDN-Cache-Control": "public, s-maxage=300",
          "Vercel-CDN-Cache-Control": "public, s-maxage=300",
        },
      },
    );
  } catch (error) {
    console.log("Error fetching credentials:", error);
    console.error("Error fetching credentials:", error);
    return NextResponse.json<StatsAPIErrorResponse>(
      {
        success: false,
        error: "Failed to fetch credentials",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
