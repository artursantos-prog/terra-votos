import { synchronizeElectionSnapshot } from "../server/electionSync";

try {
  const snapshot = await synchronizeElectionSnapshot();
  console.log(JSON.stringify({
    ok: true,
    generatedAt: snapshot.geradoEm,
    dataUrl: snapshot.dataUrl,
    eligibleCount: snapshot.totalElegivel,
    socialProfileCount: snapshot.totalComRedes,
    proposalCount: snapshot.totalComProposta ?? 0,
    source: snapshot.fonte,
  }, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
