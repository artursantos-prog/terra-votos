export const CHEAT_SHEET_GROUPS = [
  { key: "federal", offices: ["DEPUTADO FEDERAL"], label: "Deputada ou deputado federal", digits: 4, capacity: 1 },
  { key: "state", offices: ["DEPUTADO ESTADUAL", "DEPUTADO DISTRITAL"], label: "Deputada ou deputado estadual ou distrital", digits: 5, capacity: 1 },
  { key: "senator", offices: ["SENADOR"], label: "Senadora ou senador", digits: 3, capacity: 2 },
  { key: "governor", offices: ["GOVERNADOR"], label: "Governadora ou governador", digits: 2, capacity: 1 },
  { key: "president", offices: ["PRESIDENTE"], label: "Presidente da República", digits: 2, capacity: 1 },
] as const;

export type CheatSheetGroup = typeof CHEAT_SHEET_GROUPS[number];

export type CheatSheetCandidate = {
  sqCandidate: string;
  office: string;
};

function includesOffice(group: CheatSheetGroup, office: string): boolean {
  return (group.offices as readonly string[]).includes(office);
}

export function getCheatSheetGroup(office: string): CheatSheetGroup | undefined {
  return CHEAT_SHEET_GROUPS.find(group => includesOffice(group, office));
}

export function getSelectionsInGroup<T extends CheatSheetCandidate>(candidates: T[], office: string): T[] {
  const group = getCheatSheetGroup(office);
  return group ? candidates.filter(candidate => includesOffice(group, candidate.office)) : [];
}

export function canSelectCandidate<T extends CheatSheetCandidate>(selectedCandidates: T[], candidate: T): boolean {
  const group = getCheatSheetGroup(candidate.office);
  if (!group) return false;
  return getSelectionsInGroup(selectedCandidates, candidate.office).length < group.capacity;
}
