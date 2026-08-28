import { inArray } from "drizzle-orm";
import { candidates } from "../drizzle/schema.ts";
import {
  getDb,
  updateCandidateOfficialStatuses,
  upsertCandidateTicketMembers,
  upsertGovernmentPlans,
} from "../server/db.ts";
import { discoverOfficialPlansAndTickets } from "../server/electionSync.ts";

const db = await getDb();
if (!db) throw new Error("Banco indisponível");

const rows = await db.select().from(candidates)
  .where(inArray(candidates.office, ["PRESIDENTE", "GOVERNADOR"]));

const records = rows.map(row => ({
  sqCandidate: row.sqCandidate,
  candidateName: row.candidateName,
  ballotName: row.ballotName,
  candidateNumber: row.candidateNumber,
  office: row.office,
  partyAcronym: row.partyAcronym,
  partyName: row.partyName,
  uf: row.uf,
  officialStatus: row.officialStatus,
  photoUrl: row.photoUrl,
  sourceUpdatedAt: row.sourceUpdatedAt,
}));

const result = await discoverOfficialPlansAndTickets(records);
await upsertGovernmentPlans(result.plans);
await upsertCandidateTicketMembers(result.ticketMembers);
await updateCandidateOfficialStatuses(result.statusUpdates);

console.log(JSON.stringify({
  candidatesChecked: records.length,
  fullyRead: result.fullyRead,
  plansFound: result.plans.length,
  ticketMembersFound: result.ticketMembers.length,
  statusesUpdated: result.statusUpdates.length,
}, null, 2));
