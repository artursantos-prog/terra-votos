import { describe, expect, it } from "vitest";

const repositoryUrl = "https://api.github.com/repos/artursantos-prog/terra-votos/contents/README.md";

describe("token do espelho GitHub", () => {
  it("acessa o conteúdo do repositório de contingência autorizado", async () => {
    const token = process.env.GITHUB_FALLBACK_TOKEN;
    expect(token).toBeTruthy();

    const response = await fetch(repositoryUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    expect(response.status).toBe(200);
    const body = await response.json() as { name?: string; type?: string };
    expect(body).toMatchObject({ name: "README.md", type: "file" });
  }, 15_000);
});
