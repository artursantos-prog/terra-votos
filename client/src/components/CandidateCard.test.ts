import { describe, expect, it } from "vitest";
import { formatCandidateParty, getCandidateDisplayName } from "../lib/candidatePresentation";
import { isOfficialTsePhotoPlaceholder } from "../lib/tsePhoto";

describe("isOfficialTsePhotoPlaceholder", () => {
  it("identifies the official TSE silhouette used when no candidate photo is available", () => {
    expect(isOfficialTsePhotoPlaceholder(171, 235)).toBe(true);
  });

  it("keeps valid official photo dimensions visible", () => {
    expect(isOfficialTsePhotoPlaceholder(161, 225)).toBe(false);
    expect(isOfficialTsePhotoPlaceholder(111, 155)).toBe(false);
  });

  it("uses the ballot name in the card and labels the party", () => {
    expect(getCandidateDisplayName("Ana da Cidade", "Ana Maria da Silva")).toBe("Ana da Cidade");
    expect(formatCandidateParty("ABC", "Partido ABC")).toBe("Partido: ABC");
    expect(formatCandidateParty(null, "Partido ABC")).toBe("Partido: Partido ABC");
  });
});
