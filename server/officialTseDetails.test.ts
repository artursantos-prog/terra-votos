import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchOfficialTseSupplement } from "./officialTseDetails";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("official TSE detail fetch", () => {
  it("retrieves the public TSE supplement through the server and labels official platforms", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      sites: ["https://www.instagram.com/candidata"],
      arquivos: [{ idArquivo: 280017016005, codTipo: "5", nome: "plano-governo.pdf" }],
    }), { status: 200 })) as typeof fetch;

    await expect(fetchOfficialTseSupplement("160002547532", "PR")).resolves.toMatchObject({
      governmentProposalUrl: "https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/280017016005",
      socialProfiles: [{ label: "Instagram", url: "https://www.instagram.com/candidata" }],
    });
  });
});
