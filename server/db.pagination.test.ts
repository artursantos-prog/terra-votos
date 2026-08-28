import { describe, expect, it } from "vitest";
import { CANDIDATES_PER_PAGE, getCandidatePagination, OFFICIAL_CANDIDATE_ORDER } from "./db";

describe("candidate pagination", () => {
  it("limits each result page to exactly twelve candidates", () => {
    const pagination = getCandidatePagination(23, 1);

    expect(CANDIDATES_PER_PAGE).toBe(12);
    expect(pagination).toMatchObject({ total: 23, page: 1, pageSize: 12, pageCount: 2, offset: 0 });
  });

  it("calculates the final page and clamps requests outside the available range", () => {
    expect(getCandidatePagination(23, 2)).toMatchObject({ page: 2, pageCount: 2, offset: 12 });
    expect(getCandidatePagination(23, 99)).toMatchObject({ page: 2, pageCount: 2, offset: 12 });
    expect(getCandidatePagination(0, 4)).toMatchObject({ total: 0, page: 1, pageCount: 1, offset: 0 });
  });

  it("orders the public list by the full official name before the ballot name", () => {
    expect(OFFICIAL_CANDIDATE_ORDER).toEqual({ primary: "candidateName", secondary: "ballotName" });
  });
});
