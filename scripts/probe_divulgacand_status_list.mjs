const base = "https://divulgacandcontas.tse.jus.br/divulga/rest/v1";
const electionId = "20322002026";
const uf = "SP";
const start = Date.now();
const get = async (url) => {
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};
const catalog = await get(`${base}/eleicao/listar/municipios/${electionId}/${uf}/cargos`);
const lists = await Promise.all((catalog.cargos ?? []).map(async (cargo) => {
  const payload = await get(`${base}/candidatura/listar/2026/${uf}/${electionId}/${cargo.codigo}/candidatos`);
  return { code: cargo.codigo, total: (payload.candidatos ?? []).length };
}));
console.log(JSON.stringify({ uf, elapsedMs: Date.now() - start, lists }, null, 2));
