import { DomainItemsArray } from "@/types/lookup";
import { NextResponse } from "next/server";

export async function GET(request: NextResponse) {
  const { searchParams } = new URL(request.url);
  const domains = searchParams.get("domains");

  console.log("domains", domains);

  if (domains === null || domains === "") {
    return NextResponse.json(
      {
        success: false,
        error: "Domains parameter is required",
      },
      { status: 400 }
    );
  }

  if (domains && !DomainItemsArray.includes(domains)) {
    // Validate domains parameter
    const domainList = domains.split(",");
    const validDomains = DomainItemsArray;
    const invalidDomains = domainList.filter(
      (domain) => !validDomains.includes(domain.trim())
    );

    if (invalidDomains.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid domains provided: ${invalidDomains.join(", ")}`,
        },
        { status: 400 }
      );
    }
  }

  // Prepare the request to College Board API
  const apiUrl =
    "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-questions";

  try {
    // Make the request to College Board API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Add any required authentication headers here if needed
        // 'Authorization': `Bearer ${process.env.COLLEGEBOARD_API_KEY}`,
      },
      body: JSON.stringify({ asmtEventId: 99, test: 2, domain: domains }),
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

    const data = await response.json();

    console.log(response);

    return NextResponse.json(
      {
        success: true,
        data: data,
        message: "Fetching question bank successfully",
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
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch questions",
      },
      { status: 500 }
    );
  }
}
