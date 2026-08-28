export function formatCandidateOfficialStatus(status: string | null | undefined): string {
  const normalized = status?.trim().toUpperCase();
  if (!normalized) return "Situação não informada";
  if (normalized === "#NE") return "Aguardando julgamento";
  return status?.trim() || "Situação não informada";
}

export function candidateStatusExplanation(status: string | null | undefined): string | null {
  if (status?.trim().toUpperCase() === "#NE") {
    return "Registro recebido pelo TSE e aguardando julgamento.";
  }
  return null;
}
