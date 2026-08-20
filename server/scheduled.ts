import type { Express, Request, Response } from "express";
import * as db from "./db";
import { synchronizeElectionSnapshot } from "./electionSync";
import { sdk } from "./_core/sdk";

export function registerScheduledRoutes(app: Express) {
  app.post("/api/scheduled/election-sync", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const config = await db.getElectionSyncConfigByTaskUid(user.taskUid);
      if (!config) return res.json({ ok: true, skipped: "orphan" });
      const snapshot = await synchronizeElectionSnapshot();
      return res.json({ ok: true, candidates: snapshot.totalElegivel, generatedAt: snapshot.geradoEm });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[Scheduled election sync]", error);
      return res.status(500).json({
        error: message,
        timestamp: new Date().toISOString(),
        context: { path: "/api/scheduled/election-sync" },
      });
    }
  });
}
