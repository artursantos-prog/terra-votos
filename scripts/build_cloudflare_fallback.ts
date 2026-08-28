import { mkdir, writeFile } from "node:fs/promises";
import { buildGithubFallbackArtifacts } from "../server/githubFallback";

const destination = "/home/ubuntu/webdev-static-assets/buscador-eleitoral-fallback";

async function main() {
  const artifacts = await buildGithubFallbackArtifacts();
  await mkdir(destination, { recursive: true });
  await Promise.all([
    writeFile(`${destination}/index.html`, artifacts.indexHtml),
    writeFile(`${destination}/data.json`, artifacts.dataJson),
  ]);
  console.log(JSON.stringify({ destination, candidates: artifacts.candidates }, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
