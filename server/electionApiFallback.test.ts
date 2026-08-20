import { afterEach, describe, expect, it, vi } from "vitest";
import { buildElectionSnapshotFromPublicApi } from "./electionApiFallback";
import type { ElectionSnapshot } from "./electionData";

afterEach(() => vi.unstubAllGlobals());

describe("buildElectionSnapshotFromPublicApi", () => {
  it("mantém apenas a situação editorial elegível e preserva metadados oficiais do snapshot anterior", async () => {
    const previous: ElectionSnapshot = {
      geradoEm: "2026-08-20T00:00:00.000Z",
      fonte: "teste",
      filtro: "teste",
      totalOriginal: 1,
      totalElegivel: 1,
      totalComRedes: 1,
      candidaturas: [{
        id: "1", nome: "NOME ANTIGO", nomeCompleto: "NOME ANTIGO", numero: "10", partido: "PT", partidoNome: "PT", uf: "BR", unidadeEleitoral: "BR", cargo: "PRESIDENTE", codigoCargo: 1, situacao: "Deferido", fotoUrl: "foto", redesSociais: ["https://rede.oficial/exemplo"], propostaGovernoUrl: "https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/99", pesquisa: "NOME",
      }],
    };
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/BR/20322002026/1/candidatos")) {
        return new Response(JSON.stringify({ candidatos: [
          { id: 1, nomeUrna: "NOME NOVO", nomeCompleto: "NOME NOVO COMPLETO", numero: 10, descricaoSituacao: "Deferido", partido: { sigla: "PT", nome: "Partido dos Testes" } },
          { id: 2, nomeUrna: "EXCLUIDO", nomeCompleto: "EXCLUIDO", numero: 20, descricaoSituacao: "Renúncia", partido: { sigla: "PV", nome: "Partido Verde" } },
        ] }), { status: 200 });
      }
      return new Response(JSON.stringify({ candidatos: [] }), { status: 200 });
    }));
    const snapshot = await buildElectionSnapshotFromPublicApi(previous);
    expect(snapshot.totalElegivel).toBe(1);
    expect(snapshot.candidaturas[0]).toMatchObject({
      id: "1",
      nome: "NOME NOVO",
      redesSociais: ["https://rede.oficial/exemplo"],
      propostaGovernoUrl: "https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/99",
    });
  });
});
