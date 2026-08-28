import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const createErrorReport = vi.fn().mockResolvedValue(undefined);
const createSiteFeedback = vi.fn().mockResolvedValue(undefined);
const listErrorReports = vi.fn().mockResolvedValue([]);
const listSiteFeedback = vi.fn().mockResolvedValue([]);
const getErrorReportById = vi.fn();
const getCandidateBySqCandidate = vi.fn();
const recordOfficialReportEvidence = vi.fn().mockResolvedValue(undefined);
const decideErrorReport = vi.fn().mockResolvedValue({ appliedOfficialStatus: "Deferido" });
const deleteErrorReport = vi.fn().mockResolvedValue(undefined);
const updateErrorReportStatus = vi.fn().mockResolvedValue(undefined);
const deleteSiteFeedback = vi.fn().mockResolvedValue(undefined);
const updateSiteFeedbackStatus = vi.fn().mockResolvedValue(undefined);
const notifyOwner = vi.fn().mockResolvedValue(true);
const sendOwnerEmail = vi.fn().mockResolvedValue(true);
const fetchOfficialTseSupplement = vi.fn();

vi.mock("./db", () => ({
  createErrorReport,
  createSiteFeedback,
  deleteErrorReport,
  deleteSiteFeedback,
  decideErrorReport,
  getErrorReportById,
  getCandidateBySqCandidate,
  listErrorReports,
  listSiteFeedback,
  recordOfficialReportEvidence,
  updateErrorReportStatus,
  updateSiteFeedbackStatus,
  getCandidateDetails: vi.fn(),
  getCandidateFilterOptions: vi.fn(),
  getCandidateStats: vi.fn(),
  listCandidates: vi.fn(),
}));

vi.mock("./_core/notification", () => ({ notifyOwner }));
vi.mock("./ownerEmail", () => ({ sendOwnerEmail }));
vi.mock("./officialTseDetails", () => ({ fetchOfficialTseSupplement }));

const { appRouter } = await import("./routers");

function context(role: "user" | "admin" | null): TrpcContext {
  return {
    user: role ? {
      id: 1,
      openId: `${role}-id`,
      name: "Usuário de teste",
      email: "teste@exemplo.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } : null,
    req: {} as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("report and feedback procedures", () => {
  it("persists an explicit candidate report and alerts the project owner", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.reports.create({
      sqCandidate: "123",
      candidateName: "NOME DE URNA",
      candidateCategory: "em_disputa",
      issueType: "nao_esta_concorrendo",
      description: "A candidatura foi encerrada.",
    })).resolves.toEqual({ success: true, ownerNotified: true, emailSent: true });

    expect(createErrorReport).toHaveBeenCalledWith(expect.objectContaining({
      sqCandidate: "123",
      issueType: "nao_esta_concorrendo",
    }));
    expect(notifyOwner).toHaveBeenCalledWith(expect.objectContaining({ title: "Novo reporte no Buscador de Candidaturas" }));
    expect(sendOwnerEmail).toHaveBeenCalledWith(expect.objectContaining({ subject: "Novo reporte no Buscador de Candidaturas" }));
  });

  it("informa que o candidato está concorrendo quando o reporte vier da lista Fora da Disputa", async () => {
    const caller = appRouter.createCaller(context(null));
    await caller.reports.create({
      sqCandidate: "456",
      candidateName: "CANDIDATO FORA DA DISPUTA",
      candidateCategory: "fora_da_disputa",
      issueType: "nao_esta_concorrendo",
    });

    expect(sendOwnerEmail).toHaveBeenCalledWith(expect.objectContaining({
      text: expect.stringContaining("Problema: O candidato está concorrendo"),
    }));
  });

  it("blocks non-owners from viewing reports", async () => {
    const caller = appRouter.createCaller(context("user"));
    await expect(caller.reports.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows the owner to update a report from pending to verified or resolved", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await expect(caller.reports.updateStatus({ id: 4, status: "verificado" }))
      .resolves.toEqual({ success: true });
    await expect(caller.reports.updateStatus({ id: 4, status: "resolvido" }))
      .resolves.toEqual({ success: true });

    expect(updateErrorReportStatus).toHaveBeenNthCalledWith(1, 4, "verificado");
    expect(updateErrorReportStatus).toHaveBeenNthCalledWith(2, 4, "resolvido");
  });

  it("permite que somente o dono exclua um reporte sem alterar a candidatura", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await expect(caller.reports.delete({ id: 4 })).resolves.toEqual({ success: true });
    expect(deleteErrorReport).toHaveBeenCalledWith(4);
  });

  it("consulta a ficha oficial do TSE antes de registrar a evidência do reporte", async () => {
    getErrorReportById.mockResolvedValue({ id: 7, sqCandidate: "123" });
    getCandidateBySqCandidate.mockResolvedValue({ sqCandidate: "123", uf: "AC", officialStatus: "Aguardando julgamento" });
    fetchOfficialTseSupplement.mockResolvedValue({ profileUrl: "https://divulgacandcontas.tse.jus.br/divulga/#/candidato/NORTE/AC/20322002026/123/2026/AC", officialStatus: "Deferido" });
    const caller = appRouter.createCaller(context("admin"));

    await expect(caller.reports.inspectOfficial({ id: 7 })).resolves.toEqual({
      officialStatus: "Deferido",
      evidenceUrl: "https://divulgacandcontas.tse.jus.br/divulga/#/candidato/NORTE/AC/20322002026/123/2026/AC",
    });

    expect(recordOfficialReportEvidence).toHaveBeenCalledWith(expect.objectContaining({ id: 7, officialStatus: "Deferido" }));
  });

  it("permite que somente o dono aprove ou recuse um reporte já verificado", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await expect(caller.reports.decide({ id: 7, decision: "aprovado", note: "Confirmado pela ficha oficial." }))
      .resolves.toEqual({ success: true, appliedOfficialStatus: "Deferido" });
    expect(decideErrorReport).toHaveBeenCalledWith({ id: 7, decision: "aprovado", note: "Confirmado pela ficha oficial." });
  });

  it("persists a page suggestion and alerts the project owner", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.feedback.create({ message: "Gostaria de sugerir um novo filtro." }))
      .resolves.toEqual({ success: true, ownerNotified: true, emailSent: true });
    expect(createSiteFeedback).toHaveBeenCalledWith({ message: "Gostaria de sugerir um novo filtro." });
    expect(notifyOwner).toHaveBeenCalledWith(expect.objectContaining({ title: "Novo comentário ou sugestão no Buscador de Candidaturas" }));
    expect(sendOwnerEmail).toHaveBeenCalledWith(expect.objectContaining({ subject: "Novo comentário ou sugestão no Buscador de Candidaturas" }));
  });

  it("allows the owner to update a comment status", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await expect(caller.feedback.updateStatus({ id: 3, status: "resolvido" })).resolves.toEqual({ success: true });
    expect(updateSiteFeedbackStatus).toHaveBeenCalledWith(3, "resolvido");
  });

  it("permite que somente o dono exclua uma sugestão", async () => {
    const caller = appRouter.createCaller(context("admin"));
    await expect(caller.feedback.delete({ id: 3 })).resolves.toEqual({ success: true });
    expect(deleteSiteFeedback).toHaveBeenCalledWith(3);
  });
});
