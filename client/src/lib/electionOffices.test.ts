import { describe, expect, it } from "vitest";
import { orderElectionOffices } from "./electionOffices";

describe("orderElectionOffices", () => {
  it("organizes filter options in the public electoral sequence", () => {
    expect(orderElectionOffices([
      "DEPUTADO DISTRITAL",
      "SENADOR",
      "PRESIDENTE",
      "VICE-PRESIDENTE",
      "GOVERNADOR",
      "VICE-GOVERNADOR",
      "DEPUTADO FEDERAL",
      "DEPUTADO ESTADUAL",
    ])).toEqual([
      "PRESIDENTE",
      "VICE-PRESIDENTE",
      "GOVERNADOR",
      "VICE-GOVERNADOR",
      "SENADOR",
      "DEPUTADO FEDERAL",
      "DEPUTADO ESTADUAL",
      "DEPUTADO DISTRITAL",
    ]);
  });
});
