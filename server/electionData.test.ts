import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { buildElectionSnapshot } from "./electionData";

function zipOf(name: string, content: string) {
  const zip = new AdmZip();
  zip.addFile(name, Buffer.from(content, "latin1"));
  return zip.toBuffer();
}

describe("buildElectionSnapshot", () => {
  it("mantém apenas candidaturas deferidas ou aguardando julgamento e vincula o suplente ao titular", () => {
    const candidates = zipOf("consulta_cand_2026_PA.csv", [
      '"SQ_CANDIDATO";"NR_CANDIDATO";"NM_URNA_CANDIDATO";"SG_PARTIDO";"SG_UF";"DS_CARGO";"SG_UE";"NM_CANDIDATO";"NM_PARTIDO";"CD_CARGO";"DS_SITUACAO_CANDIDATURA"',
      '"1";"500";"SENADORA TESTE";"PT";"PA";"SENADOR";"PA";"NOME TESTE";"PARTIDO TESTE";"5";"Deferido"',
      '"2";"500";"SUPLENTE TESTE";"PT";"PA";"1º SUPLENTE";"PA";"SUPLENTE COMPLETO";"PARTIDO TESTE";"9";"Aguardando julgamento"',
      '"3";"999";"EXCLUIDA";"PT";"PA";"SENADOR";"PA";"EXCLUIDA";"PARTIDO TESTE";"5";"Renúncia"',
    ].join("\n"));
    const complementary = zipOf("consulta_cand_complementar_2026_PA.csv", [
      '"SQ_CANDIDATO";"DS_SITUACAO_JULGAMENTO"',
      '"1";"Deferido"',
      '"2";"Aguardando julgamento"',
      '"3";"Renúncia"',
    ].join("\n"));
    const snapshot = buildElectionSnapshot(candidates, complementary);
    expect(snapshot.totalElegivel).toBe(2);
    expect(snapshot.candidaturas.find((candidate) => candidate.id === "2")?.titular?.nome).toBe("SENADORA TESTE");
  });
});
