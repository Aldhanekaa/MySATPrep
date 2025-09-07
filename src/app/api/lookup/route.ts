import {
  LookupDomainData,
  LookupRequest,
  LookupResponseData,
} from "@/types/lookup";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Parse query parameters
    // const { searchParams } = new URL(request.url);
    // const lookupParams: LookupRequest = {};

    // Prepare the request to College Board API
    const apiUrl =
      "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/lookup";

    // Make the request to College Board API
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("College Board API error:", response.status, errorText);

      return NextResponse.json(
        {
          success: false,
          error: `College Board API error: ${response.status} ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data: LookupRequest | undefined = await response.json();
    let dataDuplicate: LookupResponseData | undefined = undefined;

    if (data) {
      dataDuplicate = Object.assign({}, data, {
        lookupData: {
          ...data.lookupData,
          domain: LookupDomainData,
        },
      });
    }

    // Return successful response
    return NextResponse.json(
      {
        success: true,
        data: dataDuplicate,
        message: "Question bank lookup completed successfully",
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
  } catch (error) {
    console.error("Error in question bank lookup:", error);

    // Handle different types of errors
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Request timeout - the College Board API took too long to respond",
          },
          { status: 408 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Internal server error",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
