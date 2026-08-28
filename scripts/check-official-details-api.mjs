const samples = [
  { uf: "BR", sqCandidate: "280002542548" },
  { uf: "PR", sqCandidate: "160002547532" },
];

const results = [];
for (const sample of samples) {
  const url = `https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/2026/${sample.uf}/20322002026/candidato/${sample.sqCandidate}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  results.push({ uf: sample.uf, sqCandidate: sample.sqCandidate, status: response.status, contentType: response.headers.get("content-type") });
}

console.log(JSON.stringify(results, null, 2));
