export async function fetchCbJwtTokenInternal(): Promise<{
  cbJwtToken: string | null;
  status: number;
  error?: string;
}> {
  const targetUrl = `${
    process.env.NEXT_PUBLIC_URL
      ? process.env.NEXT_PUBLIC_URL
      : process.env.NEXT_PUBLIC_VERCEL_ENV !== "production"
        ? `${
            process.env.VERCEL_BRANCH_URL
              ? `https://${process.env.VERCEL_BRANCH_URL}`
              : "http://localhost:3000"
          }`
        : `${
            process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL
              ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`
              : "http://localhost:3000"
          }`
  }`;

  const apiUrl = `${targetUrl}/api/credentials`;
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return {
      cbJwtToken: null,
      status: response.status,
      error: `Upstream responded with status ${response.status}`,
    };
  }

  const data = await response.json();
  return {
    cbJwtToken: data["cbJwtToken"] ?? null,
    status: 200,
  };
}
