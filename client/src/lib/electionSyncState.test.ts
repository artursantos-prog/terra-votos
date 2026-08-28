import { describe, expect, it } from "vitest";
import { getElectionSyncDegradationNotice } from "./electionSyncState";

describe("getElectionSyncDegradationNotice", () => {
  it("does not show a notice when the latest success is newer than a prior failure", () => {
    expect(getElectionSyncDegradationNotice(
      new Date("2026-08-25T12:13:01Z"),
      new Date("2026-08-25T11:00:00Z"),
    )).toBeNull();
  });

  it("explains that the last official snapshot remains available after a newer failure", () => {
    expect(getElectionSyncDegradationNotice(
      new Date("2026-08-25T12:13:01Z"),
      new Date("2026-08-26T12:00:00Z"),
    )).toContain("último conjunto oficial disponível");
  });

  it("does not claim a preserved snapshot when there has never been a successful sync", () => {
    expect(getElectionSyncDegradationNotice(null, new Date("2026-08-25T12:00:00Z")))
      .toContain("após uma sincronização oficial bem-sucedida");
  });
});
