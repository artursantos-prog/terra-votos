import { describe, expect, it } from "vitest";
import { chooseOfficialPhotoUrl, classifyCandidateStatus, isTerminalCandidateStatus, preserveCurrentOfficialStatus } from "./db";
import { buildElectionSyncFailureMessage, buildElectionSyncSuccessMessage, buildOfficialCandidatePhotoUrl, mapTseCandidate, mapTseGovernmentPlan, mapTseSocialProfile, mergeCandidateComplement } from "./electionSync";

describe("candidate status classification", () => {
  it("places only terminal TSE statuses outside the active search", () => {
    expect(classifyCandidateStatus("Indeferido")).toBe("fora_da_disputa");
    expect(classifyCandidateStatus("Indeferido em prazo recursal ou com recurso")).toBe("fora_da_disputa");
    expect(classifyCandidateStatus("Renúncia")).toBe("fora_da_disputa");
    expect(classifyCandidateStatus("Pedido não conhecido")).toBe("fora_da_disputa");
    expect(classifyCandidateStatus("Pendente de julgamento")).toBe("em_disputa");
    expect(classifyCandidateStatus("Deferido com recurso")).toBe("em_disputa");
  });

  it("normalizes accents while checking terminal statuses", () => {
    expect(isTerminalCandidateStatus("RENUNCIA")).toBe(true);
    expect(isTerminalCandidateStatus("Renúncia")).toBe(true);
  });

  it("preserves a current detailed status when a later ZIP still reports only #NE", () => {
    expect(preserveCurrentOfficialStatus("#NE", "Deferido")).toBe("Deferido");
    expect(preserveCurrentOfficialStatus("Aguardando julgamento", "Renúncia")).toBe("Renúncia");
    expect(preserveCurrentOfficialStatus("Indeferido", "Deferido")).toBe("Indeferido");
  });
});

describe("TSE candidate mapping", () => {
  it("maps official candidate fields used by the search", () => {
    const record = mapTseCandidate({
      SQ_CANDIDATO: "123",
      NM_CANDIDATO: "NOME CIVIL",
      NM_URNA_CANDIDATO: "NOME DE URNA",
      NR_CANDIDATO: "45",
      DS_CARGO: "Governador",
      SG_PARTIDO: "ABC",
      NM_PARTIDO: "PARTIDO ABC",
      SG_UF: "AC",
      DS_SITUACAO_CANDIDATURA: "Indeferido",
      NR_CPF_CANDIDATO: "12345678901",
      DT_GERACAO: "21/08/2026",
      HH_GERACAO: "10:20:00",
    });

    expect(record).toMatchObject({
      sqCandidate: "123",
      ballotName: "NOME DE URNA",
      office: "Governador",
      candidateNumber: "45",
      officialStatus: "Indeferido",
      sourceUpdatedAt: "21/08/2026 10:20:00",
      photoUrl: "https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/20322002026/123/AC",
      personKey: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(record?.personKey).not.toBe("12345678901");
  });

  it("builds the official DivulgaCandContas photo URL from candidacy and UF", () => {
    expect(buildOfficialCandidatePhotoUrl("123", "AC"))
      .toBe("https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/20322002026/123/AC");
    expect(buildOfficialCandidatePhotoUrl("123", "")).toBeNull();
  });

  it("uses the photo URL provided by the official complementary archive when available", () => {
    const records = mergeCandidateComplement([
      {
        sqCandidate: "123",
        candidateName: "NOME COMPLETO",
        ballotName: "NOME DE URNA",
        office: "Governador",
      },
    ], [{
      SQ_CANDIDATO: "123",
      DS_URL_FOTO_CANDIDATO: "https://cdn.tse.jus.br/foto-oficial.jpg",
    }]);

    expect(records[0]?.photoUrl).toBe("https://cdn.tse.jus.br/foto-oficial.jpg");
  });

  it("preserves a prior official photo when a partial import has no replacement", () => {
    expect(chooseOfficialPhotoUrl(
      "https://cdn.tse.jus.br/foto-anterior.jpg",
      null,
    )).toBe("https://cdn.tse.jus.br/foto-anterior.jpg");
  });

  it("maps official social entries by candidate and URL without fabricating profiles", () => {
    expect(mapTseSocialProfile({
      SQ_CANDIDATO: "123",
      DS_URL: "https://instagram.com/candidato",
      DT_GERACAO: "21/08/2026",
      HH_GERACAO: "10:20:00",
    })).toMatchObject({
      sqCandidate: "123",
      label: "Instagram",
      url: "https://instagram.com/candidato",
    });
  });

  it("uses the exact known platform name for official social URLs", () => {
    expect(mapTseSocialProfile({
      SQ_CANDIDATO: "123",
      DS_URL: "https://www.youtube.com/@candidato",
    })?.label).toBe("YouTube");
  });

  it("labels Threads and WhatsApp explicitly when those domains appear in the official file", () => {
    expect(mapTseSocialProfile({
      SQ_CANDIDATO: "123",
      DS_URL: "https://www.threads.com/@candidato",
    })?.label).toBe("Threads");
    expect(mapTseSocialProfile({
      SQ_CANDIDATO: "123",
      DS_URL: "https://wa.me/5511999999999",
    })?.label).toBe("WhatsApp");
  });

  it("normalizes only verified aliases for known social platforms", () => {
    expect(mapTseSocialProfile({ SQ_CANDIDATO: "123", DS_URL: "https://bsky.app/profile/candidato" })?.label).toBe("Bluesky");
    expect(mapTseSocialProfile({ SQ_CANDIDATO: "123", DS_URL: "https://kwai-video.com/@candidato" })?.label).toBe("Kwai");
    expect(mapTseSocialProfile({ SQ_CANDIDATO: "123", DS_URL: "https://m.me/candidato" })?.label).toBe("Facebook");
    expect(mapTseSocialProfile({ SQ_CANDIDATO: "123", DS_URL: "https://instagran.com/candidato" })?.label).toBe("instagran.com");
  });

  it("stores a government-plan URL only when the official complementary row exposes a proposal field", () => {
    expect(mapTseGovernmentPlan({
      SQ_CANDIDATO: "123",
      NM_ARQUIVO: "proposta.pdf",
      DS_PROPOSTA_GOVERNO: "https://cdn.tse.jus.br/proposta.pdf",
    })).toMatchObject({
      sqCandidate: "123",
      title: "proposta.pdf",
      officialUrl: "https://cdn.tse.jus.br/proposta.pdf",
    });
    expect(mapTseGovernmentPlan({ SQ_CANDIDATO: "123", DS_URL_FOTO_CANDIDATO: "https://cdn.tse.jus.br/foto.jpg" })).toBeNull();
  });
});

describe("election synchronization alerts", () => {
  it("summarizes successful imports for the owner", () => {
    expect(buildElectionSyncSuccessMessage({ imported: 20, socialProfilesImported: 8, governmentPlansImported: 2 }))
      .toContain("Candidaturas importadas: 20.");
  });

  it("offers only official-TSE manual steps after a failed import", () => {
    const message = buildElectionSyncFailureMessage("HTTP 403");
    expect(message).toContain("três endereços oficiais do TSE");
    expect(message).toContain("não use fontes alternativas");
  });
});
