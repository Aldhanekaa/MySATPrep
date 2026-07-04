import getInternalAPITargetURL from "@/lib/getInternalAPITargetURL";

export async function fetchCbJwtTokenInternal(): Promise<{
  cbJwtToken: string | null;
  status: number;
  error?: string;
}> {
  const apiUrl = `${getInternalAPITargetURL()}/api/credentials`;
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

  const data = (await response.json()) as { cbJwtToken?: string };
  return {
    cbJwtToken: data["cbJwtToken"] ?? null,
    status: 200,
  };
}
