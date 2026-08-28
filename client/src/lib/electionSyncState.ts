export function getElectionSyncDegradationNotice(lastSuccessfulSyncAt: Date | null | undefined, lastSyncFailedAt: Date | null | undefined): string | null {
  if (!lastSyncFailedAt) return null;
  if (lastSuccessfulSyncAt && lastSyncFailedAt.getTime() <= lastSuccessfulSyncAt.getTime()) return null;
  return lastSuccessfulSyncAt
    ? "A atualização mais recente não foi concluída. A busca continua mostrando o último conjunto oficial disponível."
    : "A atualização mais recente não foi concluída. As candidaturas serão exibidas após uma sincronização oficial bem-sucedida.";
}
