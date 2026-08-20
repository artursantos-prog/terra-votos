import fs from "node:fs";
import { buildElectionSnapshot } from "../server/electionData";

const [candidatesPath, complementaryPath, socialPath] = process.argv.slice(2);
if (!candidatesPath || !complementaryPath || !socialPath) {
  throw new Error("Uso: pnpm tsx scripts/inspect-official-zips.ts <candidatos.zip> <complementar.zip> <redes.zip>");
}
const snapshot = buildElectionSnapshot(fs.readFileSync(candidatesPath), fs.readFileSync(complementaryPath), fs.readFileSync(socialPath));
console.log(JSON.stringify({
  eligibleCount: snapshot.totalElegivel,
  socialProfileCount: snapshot.totalComRedes,
  sample: snapshot.candidaturas.find((candidate) => candidate.redesSociais.length > 0),
}, null, 2));
