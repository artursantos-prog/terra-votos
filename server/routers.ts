import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { synchronizeElectionSnapshot } from "./electionSync";

const fallbackDataUrl = "/manus-storage/candidatos-eleicoes-2026-enriquecido_1a1dd430.json";

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
  election: router({
    snapshot: publicProcedure.query(async () => {
      const snapshot = await db.getPublishedElectionSnapshot();
      return {
        dataUrl: snapshot?.dataUrl ?? fallbackDataUrl,
        updatedAt: snapshot?.completedAt ?? null,
        eligibleCount: snapshot?.eligibleCount ?? null,
        filter: "Deferido ou Aguardando julgamento",
      };
    }),
  }),
  reports: router({
    create: publicProcedure.input(z.object({
      candidateId: z.string().min(1).max(32),
      candidateName: z.string().min(1).max(255),
      candidateNumber: z.string().max(16).optional(),
      candidateUf: z.string().max(4).optional(),
      candidateOffice: z.string().max(80).optional(),
      category: z.string().min(2).max(80),
      message: z.string().min(10).max(3000),
      contactEmail: z.string().email().max(320).optional().or(z.literal("")),
    })).mutation(async ({ input }) => {
      await db.createCandidateReport({ ...input, contactEmail: input.contactEmail || undefined });
      return { ok: true };
    }),
  }),
  admin: router({
    status: adminProcedure.query(async () => ({
      runs: await db.listElectionSyncRuns(),
      reports: await db.listCandidateReports(),
    })),
    reviewReport: adminProcedure.input(z.object({
      id: z.number().int().positive(),
      status: z.enum(["new", "in_review", "resolved"]),
      reviewNote: z.string().max(3000).optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.reviewCandidateReport({ ...input, reviewerId: ctx.user.id });
      return { ok: true };
    }),
    syncNow: adminProcedure.mutation(async () => {
      const snapshot = await synchronizeElectionSnapshot();
      return { ok: true, dataUrl: snapshot.dataUrl, eligibleCount: snapshot.totalElegivel };
    }),
  }),
});

export type AppRouter = typeof appRouter;
