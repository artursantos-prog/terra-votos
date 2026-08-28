export const TSE_ELECTION_ID_2026 = "20322002026";
export const TSE_DIVULGACAND_BASE_URL = "https://divulgacandcontas.tse.jus.br/divulga";

type OfficialTseFile = {
  idArquivo?: string | number | null;
  codTipo?: string | number | null;
  codigoTipo?: string | number | null;
  nome?: string | null;
};

type OfficialTseTicketMember = {
  sq_CANDIDATO?: string | number | null;
  ds_CARGO?: string | null;
};

export type OfficialTseCandidatePayload = {
  sites?: unknown;
  arquivos?: unknown;
  eleicoesAnteriores?: unknown;
  vices?: unknown;
  suplentes?: unknown;
  descricaoSituacao?: unknown;
};

export type OfficialTseSupplement = {
  profileUrl: string;
  socialProfiles: Array<{ label: string; url: string }>;
  governmentProposalUrl: string | null;
  governmentProposalTitle: string | null;
  ticketMembers: Array<{ sqCandidate: string; office: string }>;
  officialStatus: string | null;
};

function normalizeOfficialUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const raw = value.trim();
  const hasExplicitScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(raw);
  if (hasExplicitScheme && !/^https?:\/\//i.test(raw)) return null;
  const withProtocol = hasExplicitScheme ? raw : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

export function getOfficialPlatformLabel(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  if (hostname.includes("instagram.com")) return "Instagram";
  if (hostname.includes("facebook.com")) return "Facebook";
  if (hostname === "x.com" || hostname.endsWith(".x.com") || hostname.includes("twitter.com")) return "X";
  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return "YouTube";
  if (hostname.includes("tiktok.com")) return "TikTok";
  if (hostname.includes("linkedin.com")) return "LinkedIn";
  if (hostname.includes("threads.net")) return "Threads";
  if (hostname.includes("bsky.social")) return "Bluesky";
  if (hostname.includes("kwai.com")) return "Kwai";
  if (hostname.includes("flickr.com")) return "Flickr";
  return hostname;
}

export function isAllowedOfficialPlatform(label: string): boolean {
  return ["X", "Instagram", "Facebook", "TikTok", "YouTube"].includes(label);
}

const regionByUf: Record<string, string> = {
  AC: "NORTE", AP: "NORTE", AM: "NORTE", PA: "NORTE", RO: "NORTE", RR: "NORTE", TO: "NORTE",
  AL: "NORDESTE", BA: "NORDESTE", CE: "NORDESTE", MA: "NORDESTE", PB: "NORDESTE", PE: "NORDESTE", PI: "NORDESTE", RN: "NORDESTE", SE: "NORDESTE",
  DF: "CENTROOESTE", GO: "CENTROOESTE", MT: "CENTROOESTE", MS: "CENTROOESTE",
  ES: "SUDESTE", MG: "SUDESTE", RJ: "SUDESTE", SP: "SUDESTE",
  PR: "SUL", RS: "SUL", SC: "SUL",
};

export function buildOfficialCandidateProfileUrl(sqCandidate: string, uf: string): string | null {
  const normalizedUf = uf.trim().toUpperCase();
  if (!sqCandidate || !normalizedUf) return null;
  const region = normalizedUf === "BR" ? "BR" : regionByUf[normalizedUf];
  if (!region) return null;
  return `${TSE_DIVULGACAND_BASE_URL}/#/candidato/${region}/${normalizedUf}/${TSE_ELECTION_ID_2026}/${sqCandidate}/2026/${normalizedUf}`;
}

export function buildOfficialCandidateDetailsUrl(sqCandidate: string, uf: string): string | null {
  if (!sqCandidate || !uf) return null;
  return `${TSE_DIVULGACAND_BASE_URL}/rest/v1/candidatura/buscar/2026/${uf}/${TSE_ELECTION_ID_2026}/candidato/${sqCandidate}`;
}

export function parseOfficialTseSupplement(payload: OfficialTseCandidatePayload, sqCandidate: string, uf: string): OfficialTseSupplement | null {
  const fallbackProfileUrl = buildOfficialCandidateProfileUrl(sqCandidate, uf);
  if (!fallbackProfileUrl) return null;

  const profileUrl = fallbackProfileUrl;

  const seen = new Set<string>();
  const socialProfiles = (Array.isArray(payload.sites) ? payload.sites : [])
    .map(normalizeOfficialUrl)
    .filter((url): url is string => Boolean(url))
    .filter(url => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    })
    .map(url => ({ label: getOfficialPlatformLabel(url), url }))
    .filter(profile => isAllowedOfficialPlatform(profile.label));

  const governmentProposal = (Array.isArray(payload.arquivos) ? payload.arquivos : [])
    .map((file) => file as OfficialTseFile)
    .find((candidateFile) => {
      return String(candidateFile.codigoTipo ?? candidateFile.codTipo ?? "") === "5" || /proposta|plano.*governo/i.test(candidateFile.nome ?? "");
    });
  const governmentProposalUrl = governmentProposal?.idArquivo
    ? `${TSE_DIVULGACAND_BASE_URL}/rest/arquivo/doc/${governmentProposal.idArquivo}`
    : null;

  const seenTicketMembers = new Set<string>();
  const ticketMembers = [...(Array.isArray(payload.vices) ? payload.vices : []), ...(Array.isArray(payload.suplentes) ? payload.suplentes : [])]
    .map(member => member as OfficialTseTicketMember)
    .flatMap(member => {
      const memberSqCandidate = String(member.sq_CANDIDATO ?? "").trim();
      const office = String(member.ds_CARGO ?? "").trim();
      if (!memberSqCandidate || !office || seenTicketMembers.has(memberSqCandidate)) return [];
      seenTicketMembers.add(memberSqCandidate);
      return [{ sqCandidate: memberSqCandidate, office }];
    });

  return {
    profileUrl,
    socialProfiles,
    governmentProposalUrl,
    governmentProposalTitle: governmentProposal?.nome?.trim() || null,
    ticketMembers,
    officialStatus: typeof payload.descricaoSituacao === "string" && payload.descricaoSituacao.trim()
      ? payload.descricaoSituacao.trim()
      : null,
  };
}
