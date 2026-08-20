import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { buildElectionSnapshot } from "./electionData";

function zipOf(name: string, content: string) {
  const zip = new AdmZip();
  zip.addFile(name, Buffer.from(content, "latin1"));
  return zip.toBuffer();
}

describe("buildElectionSnapshot", () => {
  it("mantém apenas candidaturas elegíveis, vincula a chapa pelo número e inclui redes sociais oficiais", () => {
    const candidates = zipOf("consulta_cand_2026_PA.csv", [
      '"SQ_CANDIDATO";"NR_CANDIDATO";"NM_URNA_CANDIDATO";"SG_PARTIDO";"SG_UF";"DS_CARGO";"SG_UE";"NM_CANDIDATO";"NM_PARTIDO";"CD_CARGO";"DS_SITUACAO_CANDIDATURA"',
      '"1";"500";"SENADORA TESTE";"PT";"PA";"SENADOR";"PA";"NOME TESTE";"PARTIDO TESTE";"5";"Deferido"',
      '"2";"500";"SUPLENTE TESTE";"PV";"PA";"1º SUPLENTE";"PA";"SUPLENTE COMPLETO";"PARTIDO VERDE";"9";"Aguardando julgamento"',
      '"3";"999";"EXCLUIDA";"PT";"PA";"SENADOR";"PA";"EXCLUIDA";"PARTIDO TESTE";"5";"Renúncia"',
    ].join("\n"));
    const complementary = zipOf("consulta_cand_complementar_2026_PA.csv", [
      '"SQ_CANDIDATO";"DS_SITUACAO_JULGAMENTO"',
      '"1";"Deferido"',
      '"2";"Aguardando julgamento"',
      '"3";"Renúncia"',
    ].join("\n"));
    const socials = zipOf("rede_social_candidato_2026.csv", [
      '"SQ_CANDIDATO";"DS_URL"',
      '"2";"https://social.exemplo/candidata"',
      '"2";"https://social.exemplo/candidata"',
      '"3";"javascript:alert(1)"',
    ].join("\n"));
    const snapshot = buildElectionSnapshot(candidates, complementary, socials);
    expect(snapshot.totalElegivel).toBe(2);
    expect(snapshot.candidaturas.find((candidate) => candidate.id === "2")?.titular?.nome).toBe("SENADORA TESTE");
    expect(snapshot.candidaturas.find((candidate) => candidate.id === "2")?.redesSociais).toEqual(["https://social.exemplo/candidata"]);
    expect(snapshot.totalComRedes).toBe(1);
  });

  it("sinaliza suplências sem correspondência única, sem atribuir titular incorreto", () => {
    const candidates = zipOf("consulta_cand_2026_PA.csv", [
      '"SQ_CANDIDATO";"NR_CANDIDATO";"NM_URNA_CANDIDATO";"SG_PARTIDO";"SG_UF";"DS_CARGO";"SG_UE";"NM_CANDIDATO";"NM_PARTIDO";"CD_CARGO";"DS_SITUACAO_CANDIDATURA"',
      '"10";"700";"SENADORA A";"PT";"PA";"SENADOR";"PA";"SENADORA A";"PARTIDO A";"5";"Deferido"',
      '"11";"700";"SENADOR B";"PV";"PA";"SENADOR";"PA";"SENADOR B";"PARTIDO B";"5";"Deferido"',
      '"12";"700";"SUPLENTE";"PDT";"PA";"1º SUPLENTE";"PA";"SUPLENTE";"PARTIDO C";"9";"Deferido"',
    ].join("\n"));
    const complementary = zipOf("consulta_cand_complementar_2026_PA.csv", [
      '"SQ_CANDIDATO";"DS_SITUACAO_JULGAMENTO"',
      '"10";"Deferido"',
      '"11";"Deferido"',
      '"12";"Deferido"',
    ].join("\n"));
    const snapshot = buildElectionSnapshot(candidates, complementary);
    const suplente = snapshot.candidaturas.find((candidate) => candidate.id === "12");
    expect(suplente?.titular).toBeUndefined();
    expect(suplente?.vinculoChapaIndisponivel).toBe(true);
  });
});
