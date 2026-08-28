import { fetchOfficialTseSupplement } from "../server/officialTseDetails";

async function main() {
  const endpoint = "https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/2026/BR/20322002026/candidato/280002542548";
  const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
  const payload = await response.json();
  const supplement = await fetchOfficialTseSupplement("280002542548", "BR");
  console.log(JSON.stringify({ status: response.status, keys: Object.keys(payload), arquivos: payload.arquivos?.slice(0, 2), vices: payload.vices, supplement }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
