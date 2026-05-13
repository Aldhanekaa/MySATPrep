export async function fetchCbJwtToken(): Promise<{
  cbJwtToken: string | null;
  status: number;
  error?: string;
}> {
  const apiUrl = `https://sucred.catapult-prod.collegeboard.org/rel/temp-user-aws-creds?cbEnv=pine&cbAWSDomains=digitalpractice,catapult&cacheNonce=-${process.env.CB_MYPRACTICE_SESSION_ID}`;
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: process.env.AUTHENTICATION_CB_MYPRACTICE || "",
      Origin: "https://mypractice.collegeboard.org",
      Referer: "https://mypractice.collegeboard.org/",
    },

    cache: "force-cache",
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(30000), // 30 second timeout
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
