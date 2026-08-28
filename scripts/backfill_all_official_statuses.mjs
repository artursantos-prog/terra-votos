import { candidates } from "../drizzle/schema.ts";
import { getDb, updateCandidateOfficialStatuses } from "../server/db.ts";
import { discoverOfficialStatuses } from "../server/electionSync.ts";

const db = await getDb();
if (!db) throw new Error("Banco indisponível");
const rows = await db.select().from(candidates);
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

const updates = await discoverOfficialStatuses(records);
await updateCandidateOfficialStatuses(updates);
console.log(JSON.stringify({ candidatesChecked: records.length, statusesUpdated: updates.length }, null, 2));
