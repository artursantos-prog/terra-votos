const archives = [
  {
    name: "Informações complementares",
    url: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand_complementar/consulta_cand_complementar_2026.zip",
  },
  {
    name: "Redes sociais",
    url: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_2026.zip",
  },
];

const results = [];
for (const archive of archives) {
  const response = await fetch(archive.url, { method: "HEAD" });
  results.push({
    name: archive.name,
    url: archive.url,
    ok: response.ok,
    status: response.status,
    contentType: response.headers.get("content-type"),
    contentLength: response.headers.get("content-length"),
  });
}

console.log(JSON.stringify(results, null, 2));
