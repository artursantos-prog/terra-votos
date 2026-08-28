import { inArray, sql } from "drizzle-orm";
import { candidates, electionSyncState } from "/home/ubuntu/buscados-de-numeros-v2/drizzle/schema";
import {
  getDb,
  recordElectionSyncSuccess,
  replaceCandidateTicketMembers,
  replaceGovernmentPlans,
  upsertCandidateTicketMembers,
  upsertGovernmentPlans,
} from "/home/ubuntu/buscados-de-numeros-v2/server/db";
import { discoverOfficialPlansAndTickets } from "/home/ubuntu/buscados-de-numeros-v2/server/electionSync";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível");

  const executiveCandidates = await db.select().from(candidates)
    .where(inArray(candidates.office, ["PRESIDENTE", "GOVERNADOR"]));
  const records = executiveCandidates.map(candidate => ({
    sqCandidate: candidate.sqCandidate,
    candidateName: candidate.candidateName,
    ballotName: candidate.ballotName,
    candidateNumber: candidate.candidateNumber,
    office: candidate.office,
    partyAcronym: candidate.partyAcronym,
    partyName: candidate.partyName,
    uf: candidate.uf,
    officialStatus: candidate.officialStatus,
    photoUrl: candidate.photoUrl,
    sourceUpdatedAt: candidate.sourceUpdatedAt,
  }));
  const result = await discoverOfficialPlansAndTickets(records);

  if (result.fullyRead) {
    await replaceGovernmentPlans(result.plans);
    await replaceCandidateTicketMembers(result.ticketMembers);
  } else {
    await upsertGovernmentPlans(result.plans);
    await upsertCandidateTicketMembers(result.ticketMembers);
  }

  const [state] = await db.select().from(electionSyncState)
    .where(sql`${electionSyncState.syncKey} = 'official-tse-2026'`).limit(1);
  await recordElectionSyncSuccess({
    sourceUpdatedAt: records.map(record => record.sourceUpdatedAt).filter((value): value is string => Boolean(value)).sort().at(-1) ?? null,
    candidatesImported: state?.candidatesImported ?? 0,
    socialProfilesImported: state?.socialProfilesImported ?? 0,
    governmentPlansImported: result.plans.length,
    ticketMembersImported: result.ticketMembers.length,
  });

  console.log(JSON.stringify({
    executiveCandidates: records.length,
    fullyRead: result.fullyRead,
    plansImported: result.plans.length,
    ticketMembersImported: result.ticketMembers.length,
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
