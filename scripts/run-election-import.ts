import { importElectionSnapshotFromUploadedSources } from "../server/electionSync";

const [candidatesUrl, complementaryUrl, socialUrl] = process.argv.slice(2);

if (!candidatesUrl || !complementaryUrl || !socialUrl) {
  throw new Error("Uso: pnpm tsx scripts/run-election-import.ts <candidatesUrl> <complementaryUrl> <socialUrl>");
}

try {
  const snapshot = await importElectionSnapshotFromUploadedSources({ candidatesUrl, complementaryUrl, socialUrl });
  console.log(JSON.stringify({
    ok: true,
    generatedAt: snapshot.geradoEm,
    dataUrl: snapshot.dataUrl,
    eligibleCount: snapshot.totalElegivel,
    socialProfileCount: snapshot.totalComRedes,
    proposalCount: snapshot.totalComProposta ?? 0,
  }, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
