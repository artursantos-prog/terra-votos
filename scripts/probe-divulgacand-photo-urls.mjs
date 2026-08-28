const electionId = "20322002026";
const samples = [
  { sqCandidate: "280002542548", uf: "BR", ballotName: "LULA" },
  { sqCandidate: "100002534190", uf: "MA", ballotName: "SAULO ARCANGELI" },
];

const results = [];
for (const candidate of samples) {
  const url = `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/${electionId}/${candidate.sqCandidate}/${candidate.uf}`;
  const response = await fetch(url, { method: "HEAD" });
  results.push({
    ...candidate,
    url,
    ok: response.ok,
    status: response.status,
    contentType: response.headers.get("content-type"),
    contentLength: response.headers.get("content-length"),
  });
}

console.log(JSON.stringify(results, null, 2));
