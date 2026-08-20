import AdmZip from "adm-zip";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildElectionSnapshot, enrichOfficialCandidateMetadata } from "./electionData";

function zipOf(name: string, content: string) {
  const zip = new AdmZip();
  zip.addFile(name, Buffer.from(content, "latin1"));
  return zip.toBuffer();
}

function candidateZip(rows: string[]) {
  return zipOf("consulta_cand_2026_PA.csv", [
    '"SQ_CANDIDATO";"NR_CANDIDATO";"NM_URNA_CANDIDATO";"SG_PARTIDO";"SG_UF";"DS_CARGO";"SG_UE";"NM_CANDIDATO";"NM_PARTIDO";"CD_CARGO";"DS_SITUACAO_CANDIDATURA"',
    ...rows,
  ].join("\n"));
}

function complementaryZip(ids: string[]) {
  return zipOf("consulta_cand_complementar_2026_PA.csv", [
    '"SQ_CANDIDATO";"DS_SITUACAO_JULGAMENTO"',
    ...ids.map((id) => `"${id}";"Deferido"`),
  ].join("\n"));
}

afterEach(() => vi.unstubAllGlobals());

describe("buildElectionSnapshot", () => {
  it("mantém apenas candidaturas elegíveis e inclui redes sociais oficiais, sem inferir vínculos por número", () => {
    const candidates = candidateZip([
      '"1";"500";"SENADORA TESTE";"PT";"PA";"SENADOR";"PA";"NOME TESTE";"PARTIDO TESTE";"5";"Deferido"',
      '"2";"500";"SUPLENTE TESTE";"PV";"PA";"1º SUPLENTE";"PA";"SUPLENTE COMPLETO";"PARTIDO VERDE";"9";"Aguardando julgamento"',
      '"3";"999";"EXCLUIDA";"PT";"PA";"SENADOR";"PA";"EXCLUIDA";"PARTIDO TESTE";"5";"Renúncia"',
    ]);
    const socials = zipOf("rede_social_candidato_2026.csv", [
      '"SQ_CANDIDATO";"NR_ORDEM_REDE_SOCIAL";"DS_URL"',
      '"2";"1";"https://social.exemplo/candidata"',
      '"2";"2";"https://social.exemplo/candidata"',
      '"3";"1";"javascript:alert(1)"',
    ].join("\n"));
    const snapshot = buildElectionSnapshot(candidates, complementaryZip(["1", "2"]), socials);
    expect(snapshot.totalElegivel).toBe(2);
    expect(snapshot.candidaturas.find((candidate) => candidate.id === "2")?.titular).toBeUndefined();
    expect(snapshot.candidaturas.find((candidate) => candidate.id === "2")?.redesSociais).toEqual(["https://social.exemplo/candidata"]);
    expect(snapshot.totalComRedes).toBe(1);
  });

  it("associa suplente e disponibiliza proposta apenas quando a API oficial confirma ambos", async () => {
    const snapshot = buildElectionSnapshot(candidateZip([
      '"1";"500";"SENADORA TESTE";"PT";"PA";"SENADOR";"PA";"NOME TESTE";"PARTIDO TESTE";"5";"Deferido"',
      '"2";"500";"SUPLENTE TESTE";"PV";"PA";"1º SUPLENTE";"PA";"SUPLENTE COMPLETO";"PARTIDO VERDE";"9";"Deferido"',
      '"4";"30";"PRESIDENTE TESTE";"NOVO";"PA";"PRESIDENTE";"PA";"PRESIDENTE TESTE";"PARTIDO NOVO";"1";"Deferido"',
    ]), complementaryZip(["1", "2", "4"]));
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/candidato/2")) return new Response(JSON.stringify({ vices: [{ sq_CANDIDATO: "1", nm_URNA: "SENADORA TESTE", ds_CARGO: "SENADOR" }] }), { status: 200 });
      if (url.includes("/candidato/4")) return new Response(JSON.stringify({ arquivos: [{ idArquivo: "99", codTipo: "5" }] }), { status: 200 });
      return new Response(JSON.stringify({}), { status: 200 });
    }));
    const enriched = await enrichOfficialCandidateMetadata(snapshot);
    expect(enriched.candidaturas.find((candidate) => candidate.id === "2")?.titular).toMatchObject({ id: "1", nome: "SENADORA TESTE" });
    expect(enriched.candidaturas.find((candidate) => candidate.id === "4")?.propostaGovernoUrl).toBe("https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/99");
  });

  it("mantém a chapa sem associação quando o retorno oficial tem mais de uma opção", async () => {
    const snapshot = buildElectionSnapshot(candidateZip([
      '"10";"700";"SENADORA A";"PT";"PA";"SENADOR";"PA";"SENADORA A";"PARTIDO A";"5";"Deferido"',
      '"11";"700";"SENADOR B";"PV";"PA";"SENADOR";"PA";"SENADOR B";"PARTIDO B";"5";"Deferido"',
      '"12";"700";"SUPLENTE";"PDT";"PA";"1º SUPLENTE";"PA";"SUPLENTE";"PARTIDO C";"9";"Deferido"',
    ]), complementaryZip(["10", "11", "12"]));
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      vices: [{ sq_CANDIDATO: "10", ds_CARGO: "SENADOR" }, { sq_CANDIDATO: "11", ds_CARGO: "SENADOR" }],
    }), { status: 200 })));
    const enriched = await enrichOfficialCandidateMetadata(snapshot);
    const suplente = enriched.candidaturas.find((candidate) => candidate.id === "12");
    expect(suplente?.titular).toBeUndefined();
    expect(suplente?.vinculoChapaIndisponivel).toBe(true);
  });

  it("mantém a importação quando o detalhe oficial de uma chapa está temporariamente indisponível", async () => {
    const snapshot = buildElectionSnapshot(candidateZip([
      '"20";"800";"SENADOR TESTE";"PT";"PA";"SENADOR";"PA";"SENADOR TESTE";"PARTIDO A";"5";"Deferido"',
      '"21";"800";"SUPLENTE TESTE";"PV";"PA";"1º SUPLENTE";"PA";"SUPLENTE TESTE";"PARTIDO B";"9";"Deferido"',
    ]), complementaryZip(["20", "21"]));
    vi.stubGlobal("fetch", vi.fn(async () => new Response("temporariamente indisponível", { status: 403 })));
    const enriched = await enrichOfficialCandidateMetadata(snapshot);
    const suplente = enriched.candidaturas.find((candidate) => candidate.id === "21");
    expect(enriched.totalElegivel).toBe(2);
    expect(suplente?.titular).toBeUndefined();
    expect(suplente?.vinculoChapaIndisponivel).toBe(true);
  });
});
