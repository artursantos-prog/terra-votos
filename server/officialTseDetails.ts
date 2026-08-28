import { buildOfficialCandidateDetailsUrl, parseOfficialTseSupplement, type OfficialTseSupplement } from "../shared/officialTseDetails";

export async function fetchOfficialTseSupplement(sqCandidate: string, uf: string | null): Promise<OfficialTseSupplement | null> {
  const endpoint = buildOfficialCandidateDetailsUrl(sqCandidate, uf ?? "");
  if (!endpoint) return null;

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return null;
    return parseOfficialTseSupplement(await response.json(), sqCandidate, uf ?? "");
  } catch {
    return null;
  }
}
