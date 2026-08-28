export function getCandidateDisplayName(ballotName: string | null | undefined, candidateName: string): string {
  return ballotName?.trim() || candidateName;
}

export function formatCandidateParty(partyAcronym: string | null | undefined, partyName: string | null | undefined): string {
  return `Partido: ${partyAcronym?.trim() || partyName?.trim() || "não informado"}`;
}
