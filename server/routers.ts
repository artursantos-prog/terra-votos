import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import { sendOwnerEmail } from "./ownerEmail";
import { fetchOfficialTseSupplement } from "./officialTseDetails";
import { getPrimaryReportIssueLabel } from "@shared/reporting";
import { buildOfficialCandidateProfileUrl } from "@shared/officialTseDetails";
import {
  createErrorReport,
  createSiteFeedback,
  deleteErrorReport,
  deleteSiteFeedback,
  decideErrorReport,
  getCandidateBySqCandidate,
  getCandidateDetails,
  getCandidateFilterOptions,
  getCandidateStats,
  listCandidates,
  listErrorReports,
  listSiteFeedback,
  getErrorReportById,
  recordOfficialReportEvidence,
  updateErrorReportStatus,
  updateSiteFeedbackStatus,
} from "./db";

const candidateCategorySchema = z.enum(["em_disputa", "fora_da_disputa"]);
const candidateFiltersSchema = z.object({
  category: candidateCategorySchema,
  query: z.string().trim().max(120).optional(),
  uf: z.string().trim().length(2).optional(),
  office: z.string().trim().max(128).optional(),
  party: z.string().trim().max(32).optional(),
  page: z.number().int().min(1).max(100000).optional(),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  candidates: router({
    list: publicProcedure.input(candidateFiltersSchema)
      .query(({ input }) => listCandidates(input)),
    filterOptions: publicProcedure.input(z.object({ category: candidateCategorySchema }))
      .query(({ input }) => getCandidateFilterOptions(input.category)),
    getBySqCandidate: publicProcedure.input(z.object({ sqCandidate: z.string().min(1).max(32) }))
      .query(({ input }) => getCandidateBySqCandidate(input.sqCandidate)),
    details: publicProcedure.input(z.object({ sqCandidate: z.string().min(1).max(32) }))
      .query(({ input }) => getCandidateDetails(input.sqCandidate)),
    officialSupplement: publicProcedure.input(z.object({ sqCandidate: z.string().min(1).max(32) }))
      .query(async ({ input }) => {
        const candidate = await getCandidateBySqCandidate(input.sqCandidate);
        if (!candidate) return null;
        return fetchOfficialTseSupplement(candidate.sqCandidate, candidate.uf);
      }),
    stats: publicProcedure.query(() => getCandidateStats()),
  }),
  reports: router({
    create: publicProcedure.input(z.object({
      sqCandidate: z.string().min(1).max(32),
      candidateName: z.string().min(1).max(255),
      candidateCategory: candidateCategorySchema,
      issueType: z.enum(["nao_esta_concorrendo", "informacao_incorreta"]),
      description: z.string().trim().max(2000).optional(),
      contactEmail: z.string().trim().email().max(320).optional(),
    })).mutation(async ({ input }) => {
      await createErrorReport(input);
      const issueLabel = input.issueType === "nao_esta_concorrendo"
        ? getPrimaryReportIssueLabel(input.candidateCategory)
        : "Informação incorreta";
      const content = `Candidato: ${input.candidateName}\nProblema: ${issueLabel}\nDescrição: ${input.description || "Sem descrição."}\nE-mail: ${input.contactEmail || "Não informado"}`;
      const [ownerNotified, emailSent] = await Promise.all([
        notifyOwner({ title: "Novo reporte no Buscador de Candidaturas", content }).catch(() => false),
        sendOwnerEmail({ subject: "Novo reporte no Buscador de Candidaturas", text: content }),
      ]);
      return { success: true, ownerNotified, emailSent } as const;
    }),
    list: adminProcedure.query(() => listErrorReports()),
    updateStatus: adminProcedure.input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["verificado", "resolvido"]),
    })).mutation(async ({ input }) => {
      await updateErrorReportStatus(input.id, input.status);
      return { success: true } as const;
    }),
    delete: adminProcedure.input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deleteErrorReport(input.id);
        return { success: true } as const;
      }),
    inspectOfficial: adminProcedure.input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const report = await getErrorReportById(input.id);
        if (!report) throw new Error("Reporte não encontrado.");
        const candidate = await getCandidateBySqCandidate(report.sqCandidate);
        if (!candidate) throw new Error("Candidatura não encontrada na base oficial atual.");
        const supplement = await fetchOfficialTseSupplement(candidate.sqCandidate, candidate.uf);
        const officialStatus = supplement?.officialStatus ?? candidate.officialStatus ?? null;
        const evidenceUrl = buildOfficialCandidateProfileUrl(candidate.sqCandidate, candidate.uf ?? "");
        await recordOfficialReportEvidence({ id: report.id, evidenceUrl, officialStatus });
        return { officialStatus, evidenceUrl };
      }),
    decide: adminProcedure.input(z.object({
      id: z.number().int().positive(),
      decision: z.enum(["aprovado", "recusado"]),
      note: z.string().trim().max(1000).optional(),
    })).mutation(async ({ input }) => {
      const result = await decideErrorReport(input);
      return { success: true, ...result } as const;
    }),
  }),
  feedback: router({
    create: publicProcedure.input(z.object({
      message: z.string().trim().min(1).max(2000),
      contactEmail: z.string().trim().email().max(320).optional(),
    })).mutation(async ({ input }) => {
      await createSiteFeedback(input);
      const content = `Mensagem: ${input.message}\nE-mail: ${input.contactEmail || "Não informado"}`;
      const [ownerNotified, emailSent] = await Promise.all([
        notifyOwner({ title: "Novo comentário ou sugestão no Buscador de Candidaturas", content }).catch(() => false),
        sendOwnerEmail({ subject: "Novo comentário ou sugestão no Buscador de Candidaturas", text: content }),
      ]);
      return { success: true, ownerNotified, emailSent } as const;
    }),
    list: adminProcedure.query(() => listSiteFeedback()),
    updateStatus: adminProcedure.input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["verificado", "resolvido"]),
    })).mutation(async ({ input }) => {
      await updateSiteFeedbackStatus(input.id, input.status);
      return { success: true } as const;
    }),
    delete: adminProcedure.input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        await deleteSiteFeedback(input.id);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
