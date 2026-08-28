import { describe, expect, it } from "vitest";
import { isDirectlyVotedOffice, NATIONAL_CANDIDACY_UF, NON_VOTED_OFFICES } from "./db";

describe("cargos elegíveis à seleção direta", () => {
  it("reserva BR para candidaturas nacionais, sem tratá-lo como estado", () => {
    expect(NATIONAL_CANDIDACY_UF).toBe("BR");
  });

  it("mantém vices e suplentes fora da escolha individual", () => {
    expect(NON_VOTED_OFFICES).toEqual(["VICE-PRESIDENTE", "VICE-GOVERNADOR", "1º SUPLENTE", "2º SUPLENTE"]);
    expect(isDirectlyVotedOffice("VICE-PRESIDENTE")).toBe(false);
    expect(isDirectlyVotedOffice("VICE-GOVERNADOR")).toBe(false);
    expect(isDirectlyVotedOffice("1º SUPLENTE")).toBe(false);
    expect(isDirectlyVotedOffice("2º SUPLENTE")).toBe(false);
  });

  it("mantém os cargos votados disponíveis para busca e colinha", () => {
    expect(isDirectlyVotedOffice("PRESIDENTE")).toBe(true);
    expect(isDirectlyVotedOffice("GOVERNADOR")).toBe(true);
    expect(isDirectlyVotedOffice("SENADOR")).toBe(true);
  });
});
