import AdmZip from "adm-zip";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authenticateRequest = vi.fn();
const replaceCandidates = vi.fn().mockResolvedValue(undefined);
const replaceCandidateSocialProfiles = vi.fn().mockResolvedValue(undefined);
const replaceGovernmentPlans = vi.fn().mockResolvedValue(undefined);
const upsertGovernmentPlans = vi.fn().mockResolvedValue(undefined);
const replaceCandidateTicketMembers = vi.fn().mockResolvedValue(undefined);
const upsertCandidateTicketMembers = vi.fn().mockResolvedValue(undefined);
const updateCandidateOfficialStatuses = vi.fn().mockResolvedValue(undefined);
const getElectionSyncSnapshot = vi.fn().mockResolvedValue({ candidateRows: [], socialRows: [], planRows: [], ticketRows: [] });
const recordElectionSyncSuccess = vi.fn().mockResolvedValue(undefined);
const recordElectionSyncFailure = vi.fn().mockResolvedValue(undefined);
const fetchOfficialTseSupplement = vi.fn();
const sendOwnerEmail = vi.fn().mockResolvedValue(true);
const publishGithubFallbackSnapshot = vi.fn().mockResolvedValue({ candidates: 1 });

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest } }));
vi.mock("./db", () => ({
  replaceCandidates,
  replaceCandidateSocialProfiles,
  replaceGovernmentPlans,
  upsertGovernmentPlans,
  replaceCandidateTicketMembers,
  upsertCandidateTicketMembers,
  updateCandidateOfficialStatuses,
  getElectionSyncSnapshot,
  recordElectionSyncSuccess,
  recordElectionSyncFailure,
  isDirectlyVotedOffice: (office: string) => !["Vice-presidente", "Vice-governador"].includes(office),
  isTerminalCandidateStatus: (status: string | null | undefined) => status === "Renúncia",
  chooseOfficialPhotoUrl: (existingPhotoUrl: string | null | undefined, incomingPhotoUrl: string | null | undefined) => incomingPhotoUrl?.trim() || existingPhotoUrl?.trim() || null,
}));
vi.mock("./ownerEmail", () => ({ sendOwnerEmail }));
vi.mock("./officialTseDetails", () => ({ fetchOfficialTseSupplement }));
vi.mock("./githubFallback", () => ({ publishGithubFallbackSnapshot }));

const { discoverOfficialPlansAndTickets, discoverOfficialStatuses, electionSyncImportHandler } = await import("./electionSync");

function archive(csv: string, name: string) {
  const zip = new AdmZip();
  zip.addFile(name, Buffer.from(csv, "latin1"));
  return zip.toBuffer();
}

function request(body: Record<string, string>) {
  return { body, path: "/api/scheduled/election-sync-import" } as never;
}

function response() {
  const state = { statusCode: 200, body: undefined as unknown };
  const res = {
    status: (code: number) => { state.statusCode = code; return res; },
    json: (body: unknown) => { state.body = body; return res; },
  } as never;
  return { state, res };
}

const candidatesCsv = `SQ_CANDIDATO;NM_CANDIDATO;NM_URNA_CANDIDATO;DS_CARGO;SG_UF;DS_SITUACAO_CANDIDATURA;NR_CANDIDATO\n1;Nome Oficial;Nome de Urna;GOVERNADOR;AC;Indeferido;10\n`;
const complementCsv = `SQ_CANDIDATO;DS_URL_FOTO_CANDIDATO\n1;https://cdn.tse.jus.br/foto.jpg\n`;
const socialCsv = `SQ_CANDIDATO;DS_URL\n1;https://instagram.com/nomeoficial\n`;

describe("election sync import handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authenticateRequest.mockResolvedValue({ isCron: true, taskUid: "task-1" });
    fetchOfficialTseSupplement.mockResolvedValue({
      profileUrl: "https://divulgacandcontas.tse.jus.br/divulga/#/candidato/AC/AC/20322002026/1/2026/AC",
      socialProfiles: [],
      governmentProposalUrl: "https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/42",
      governmentProposalTitle: "Plano oficial.pdf",
      ticketMembers: [{ sqCandidate: "2", office: "Vice-governador" }],
      officialStatus: "Deferido",
    });
  });

  it("imports official archives and alerts the owner after success", async () => {
    const candidateZip = archive(candidatesCsv, "consulta_cand_2026_BRASIL.CSV");
    const complementZip = archive(complementCsv, "consulta_cand_complementar_2026_BRASIL.CSV");
    const socialZip = archive(socialCsv, "rede_social_candidato_2026_BRASIL.CSV");
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => candidateZip })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => complementZip })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => socialZip })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cargos: [{ codigo: 3 }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ candidatos: [{ id: 1, descricaoSituacao: "Deferido" }] }) }));
    const { state, res } = response();

    await electionSyncImportHandler(request({
      candidatesUrl: "https://storage.example/candidates.zip",
      complementaryUrl: "https://storage.example/complement.zip",
      socialUrl: "https://storage.example/social.zip",
    }), res);

    expect(state.statusCode).toBe(200);
    expect(state.body).toMatchObject({ ok: true, imported: 1, socialProfilesImported: 1, governmentPlansImported: 1, ticketMembersImported: 1, statusUpdatesImported: 1, emailAlertSent: true });
    expect(replaceCandidates).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ sqCandidate: "1" })]));
    expect(replaceCandidateSocialProfiles).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ sqCandidate: "1", label: "Instagram" })]));
    expect(replaceGovernmentPlans).toHaveBeenCalledWith([expect.objectContaining({ sqCandidate: "1", officialUrl: "https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/42" })]);
    expect(replaceCandidateTicketMembers).toHaveBeenCalledWith([{ principalSqCandidate: "1", memberSqCandidate: "2", memberOffice: "Vice-governador" }]);
    expect(updateCandidateOfficialStatuses).toHaveBeenCalledWith([{ sqCandidate: "1", officialStatus: "Deferido" }]);
    expect(recordElectionSyncSuccess).toHaveBeenCalledWith(expect.objectContaining({ candidatesImported: 1, governmentPlansImported: 1, ticketMembersImported: 1 }));
    expect(sendOwnerEmail).toHaveBeenCalledWith(expect.objectContaining({
      subject: "Sincronização eleitoral concluída — Buscador de Candidaturas",
      text: expect.stringContaining("Candidatura incluída"),
    }));
    expect(sendOwnerEmail).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("espelho de contingência no GitHub está sendo atualizado no mesmo ciclo"),
    }));
    expect(publishGithubFallbackSnapshot).toHaveBeenCalledOnce();
  });

  it("alerts the owner with manual official-TSE guidance after a failed download", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    const { state, res } = response();

    await electionSyncImportHandler(request({
      candidatesUrl: "https://storage.example/candidates.zip",
      complementaryUrl: "https://storage.example/complement.zip",
      socialUrl: "https://storage.example/social.zip",
    }), res);

    expect(state.statusCode).toBe(500);
    expect(state.body).toMatchObject({ error: "Unable to download import archive: HTTP 403", emailAlertSent: true });
    expect(sendOwnerEmail).toHaveBeenCalledWith(expect.objectContaining({
      subject: "Falha na sincronização eleitoral — ação necessária",
      text: expect.stringContaining("não use fontes alternativas"),
    }));
    expect(recordElectionSyncFailure).toHaveBeenCalledWith("Unable to download import archive: HTTP 403");
  });

  it("retains statuses returned by an official cargo list when another cargo list fails", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ cargos: [{ codigo: 3 }, { codigo: 6 }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ candidatos: [{ id: 1, descricaoSituacao: "Deferido" }] }) })
      .mockResolvedValueOnce({ ok: false, status: 503 }));

    const statuses = await discoverOfficialStatuses([
      { sqCandidate: "1", candidateName: "Nome Oficial", ballotName: "Nome de Urna", office: "GOVERNADOR", uf: "AC" },
      { sqCandidate: "2", candidateName: "Outro Nome", ballotName: "Outro", office: "SENADOR", uf: "AC" },
    ]);

    expect(statuses).toEqual([{ sqCandidate: "1", officialStatus: "Deferido" }]);
  });

  it("associa os suplentes retornados pelo TSE ao senador titular", async () => {
    fetchOfficialTseSupplement.mockResolvedValue({
      profileUrl: "https://divulgacandcontas.tse.jus.br/divulga/#/candidato/AC/AC/20322002026/9/2026/AC",
      socialProfiles: [],
      governmentProposalUrl: null,
      governmentProposalTitle: null,
      ticketMembers: [
        { sqCandidate: "10", office: "1º SUPLENTE" },
        { sqCandidate: "11", office: "2º SUPLENTE" },
      ],
      officialStatus: "Deferido",
    });

    const result = await discoverOfficialPlansAndTickets([
      { sqCandidate: "9", candidateName: "Senador Oficial", ballotName: "Senador", office: "SENADOR", uf: "AC" },
    ]);

    expect(result.ticketMembers).toEqual([
      { principalSqCandidate: "9", memberSqCandidate: "10", memberOffice: "1º SUPLENTE" },
      { principalSqCandidate: "9", memberSqCandidate: "11", memberOffice: "2º SUPLENTE" },
    ]);
    expect(result.plans).toEqual([]);
  });

  it("omite integrantes de chapa com situação terminal oficial", async () => {
    fetchOfficialTseSupplement.mockResolvedValue({
      profileUrl: "https://divulgacandcontas.tse.jus.br/divulga/#/candidato/AC/AC/20322002026/9/2026/AC",
      socialProfiles: [],
      governmentProposalUrl: null,
      governmentProposalTitle: null,
      ticketMembers: [
        { sqCandidate: "10", office: "1º SUPLENTE" },
        { sqCandidate: "11", office: "2º SUPLENTE" },
      ],
      officialStatus: "Deferido",
    });

    const result = await discoverOfficialPlansAndTickets([
      { sqCandidate: "9", candidateName: "Senador Oficial", ballotName: "Senador", office: "SENADOR", uf: "AC" },
      { sqCandidate: "10", candidateName: "Suplente Renunciante", ballotName: "Renunciante", office: "1º SUPLENTE", uf: "AC", officialStatus: "Renúncia" },
      { sqCandidate: "11", candidateName: "Suplente Atual", ballotName: "Atual", office: "2º SUPLENTE", uf: "AC", officialStatus: "#NE" },
    ]);

    expect(result.ticketMembers).toEqual([
      { principalSqCandidate: "9", memberSqCandidate: "11", memberOffice: "2º SUPLENTE" },
    ]);
  });
});
