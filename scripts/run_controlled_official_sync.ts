import { runOfficialElectionSync } from "../server/electionSync";

const result = await runOfficialElectionSync({
  candidatesUrl: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip",
  complementaryUrl: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand_complementar/consulta_cand_complementar_2026.zip",
  socialUrl: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_2026.zip",
});

console.log(JSON.stringify(result, null, 2));
