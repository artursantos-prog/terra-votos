import { describe, expect, it } from "vitest";
import { canSelectCandidate, getCheatSheetGroup, getSelectionsInGroup } from "./cheatSheet";

const federal = { sqCandidate: "federal", office: "DEPUTADO FEDERAL" };
const senatorOne = { sqCandidate: "senator-1", office: "SENADOR" };
const senatorTwo = { sqCandidate: "senator-2", office: "SENADOR" };
const senatorThree = { sqCandidate: "senator-3", office: "SENADOR" };

describe("cheat-sheet electoral capacities", () => {
  it("uses the ballot number lengths and available places for each office", () => {
    expect(getCheatSheetGroup("PRESIDENTE")).toMatchObject({ digits: 2, capacity: 1 });
    expect(getCheatSheetGroup("DEPUTADO ESTADUAL")).toMatchObject({ digits: 5, capacity: 1 });
    expect(getCheatSheetGroup("SENADOR")).toMatchObject({ digits: 3, capacity: 2 });
  });

  it("only permits one selection for a single-vacancy office", () => {
    expect(canSelectCandidate([federal], { sqCandidate: "another", office: "DEPUTADO FEDERAL" })).toBe(false);
  });

  it("permits two senator selections and requires replacement for a third", () => {
    expect(canSelectCandidate([senatorOne], senatorTwo)).toBe(true);
    expect(canSelectCandidate([senatorOne, senatorTwo], senatorThree)).toBe(false);
    expect(getSelectionsInGroup([federal, senatorOne, senatorTwo], "SENADOR")).toHaveLength(2);
  });

  it("does not treat non-voted offices as selectable in the cheat sheet", () => {
    expect(getCheatSheetGroup("1º SUPLENTE")).toBeUndefined();
    expect(canSelectCandidate([], { sqCandidate: "alternate", office: "1º SUPLENTE" })).toBe(false);
  });
});
