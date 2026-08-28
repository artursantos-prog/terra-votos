import { describe, expect, it } from "vitest";
import { getPrimaryReportIssueLabel } from "./reporting";

describe("getPrimaryReportIssueLabel", () => {
  it("mantém o motivo de saída na lista de candidaturas em disputa", () => {
    expect(getPrimaryReportIssueLabel("em_disputa")).toBe("O candidato não está mais concorrendo");
  });

  it("inverte o sentido do reporte na lista Fora da Disputa", () => {
    expect(getPrimaryReportIssueLabel("fora_da_disputa")).toBe("O candidato está concorrendo");
  });
});
