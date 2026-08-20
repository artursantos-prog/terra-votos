import { describe, expect, it } from "vitest";
import { isTrustedUploadedArchiveUrl } from "./electionSync";

describe("isTrustedUploadedArchiveUrl", () => {
  it("aceita somente URLs HTTPS de upload Manus e recusa fontes arbitrárias", () => {
    expect(isTrustedUploadedArchiveUrl("https://files.manuscdn.com/elections/consulta_cand.zip")).toBe(true);
    expect(isTrustedUploadedArchiveUrl("http://files.manuscdn.com/elections/consulta_cand.zip")).toBe(false);
    expect(isTrustedUploadedArchiveUrl("https://cdn.tse.jus.br/consulta_cand.zip")).toBe(false);
    expect(isTrustedUploadedArchiveUrl("https://files.manuscdn.com.evil.example/consulta_cand.zip")).toBe(false);
  });
});
