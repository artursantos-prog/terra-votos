import { describe, expect, it } from "vitest";
import { buildCheatSheetShareText } from "./cheatSheetSharing";

describe("cheat sheet sharing", () => {
  it("cria um texto de compartilhamento somente com seleções válidas", () => {
    const text = buildCheatSheetShareText([
      { office: "PRESIDENTE", ballotName: "Candidata A", candidateNumber: "13", partyAcronym: "PT" },
      { office: "SENADOR", ballotName: "Candidato B", candidateNumber: "500", partyAcronym: "PSB" },
    ], "https://exemplo.test");

    expect(text).toContain("Presidente da República: Candidata A 13");
    expect(text).toContain("Senadora ou senador: Candidato B 500");
    expect(text).toContain("https://exemplo.test");
  });
});
