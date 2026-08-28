import { describe, expect, it } from "vitest";
import { candidateStatusExplanation, formatCandidateOfficialStatus } from "./candidateStatus";

describe("candidate status presentation", () => {
  it("turns the technical TSE #NE code into an understandable status", () => {
    expect(formatCandidateOfficialStatus("#NE")).toBe("Aguardando julgamento");
    expect(candidateStatusExplanation("#NE")).toBe("Registro recebido pelo TSE e aguardando julgamento.");
  });

  it("keeps an official textual status unchanged", () => {
    expect(formatCandidateOfficialStatus("Indeferido")).toBe("Indeferido");
    expect(candidateStatusExplanation("Indeferido")).toBeNull();
  });
});
