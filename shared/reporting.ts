export type CandidateReportCategory = "em_disputa" | "fora_da_disputa";

export function getPrimaryReportIssueLabel(category: CandidateReportCategory) {
  return category === "fora_da_disputa"
    ? "O candidato está concorrendo"
    : "O candidato não está mais concorrendo";
}
