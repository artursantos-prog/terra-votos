export const ELECTION_OFFICE_ORDER = [
  "PRESIDENTE",
  "VICE-PRESIDENTE",
  "GOVERNADOR",
  "VICE-GOVERNADOR",
  "SENADOR",
  "DEPUTADO FEDERAL",
  "DEPUTADO ESTADUAL",
  "DEPUTADO DISTRITAL",
] as const;

const OFFICE_RANK = new Map<string, number>(ELECTION_OFFICE_ORDER.map((office, index) => [office, index]));

/** Ordena os cargos conforme a sequência de votação informada na página. */
export function orderElectionOffices(offices: string[]): string[] {
  return [...offices].sort((first, second) => {
    const firstRank = OFFICE_RANK.get(first) ?? Number.MAX_SAFE_INTEGER;
    const secondRank = OFFICE_RANK.get(second) ?? Number.MAX_SAFE_INTEGER;
    return firstRank - secondRank || first.localeCompare(second, "pt-BR");
  });
}
