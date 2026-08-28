import { describe, expect, it } from "vitest";
import { buildOfficialCandidateDetailsUrl, buildOfficialCandidateProfileUrl, parseOfficialTseSupplement } from "./officialTseDetails";

describe("official TSE candidate details", () => {
  it("builds the official candidate-details endpoint", () => {
    expect(buildOfficialCandidateDetailsUrl("280002542548", "BR"))
      .toBe("https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/2026/BR/20322002026/candidato/280002542548");
  });

  it("builds the public individual DivulgaCand profile with the candidate region and UF", () => {
    expect(buildOfficialCandidateProfileUrl("280002542548", "BR"))
      .toBe("https://divulgacandcontas.tse.jus.br/divulga/#/candidato/BR/BR/20322002026/280002542548/2026/BR");
    expect(buildOfficialCandidateProfileUrl("50002532270", "BA"))
      .toBe("https://divulgacandcontas.tse.jus.br/divulga/#/candidato/NORDESTE/BA/20322002026/50002532270/2026/BA");
  });

  it("keeps only permitted official social platforms and recognizes a registered proposal by the current TSE file type", () => {
    const result = parseOfficialTseSupplement({
      sites: ["HTTPS://WWW.INSTAGRAM.COM/LULA", "https://x.com/lula", "https://bsky.app/profile/lula", "invalido://endereco"],
      arquivos: [{ idArquivo: 280017016005, codigoTipo: "5", nome: "documento.pdf" }],
      vices: [{ sq_CANDIDATO: 280002542549, ds_CARGO: "VICE-PRESIDENTE" }],
    }, "280002542548", "BR");

    expect(result?.governmentProposalUrl).toBe("https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/280017016005");
    expect(result?.profileUrl).toBe("https://divulgacandcontas.tse.jus.br/divulga/#/candidato/BR/BR/20322002026/280002542548/2026/BR");
    expect(result?.governmentProposalTitle).toBe("documento.pdf");
    expect(result?.ticketMembers).toEqual([{ sqCandidate: "280002542549", office: "VICE-PRESIDENTE" }]);
    expect(result?.socialProfiles).toEqual([
      { label: "Instagram", url: "https://www.instagram.com/LULA" },
      { label: "X", url: "https://x.com/lula" },
    ]);
  });
});
