import { describe, expect, it } from "vitest";
import { getTicketHeading, getTicketMemberRole } from "./ticketPresentation";

describe("apresentação de integrantes da chapa", () => {
  it("identifica os suplentes como parte da chapa do senador", () => {
    expect(getTicketHeading("SENADOR")).toBe("Suplentes");
    expect(getTicketMemberRole("SENADOR", "1º SUPLENTE")).toBe("1º suplente");
    expect(getTicketMemberRole("SENADOR", "2º SUPLENTE")).toBe("2º suplente");
  });

  it("mantém vices para os cargos do Executivo", () => {
    expect(getTicketHeading("GOVERNADOR")).toBe("Vice");
    expect(getTicketMemberRole("GOVERNADOR", "VICE-GOVERNADOR")).toBe("Vice");
  });
});
