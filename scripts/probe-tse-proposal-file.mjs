const idArquivo = "280017016005";
const path = "candidaturas/oficial/2026/BR/BR/6257/candidatos/15761/";
const filename = "0806JOB838PTlivroplanodegovernocompressed.pdf";
const candidates = [
  `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/${idArquivo}`,
  `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/arquivo/${idArquivo}`,
  `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/download/${idArquivo}`,
  `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/baixar/${idArquivo}`,
  `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/${path}${filename}`,
  `https://cdn.tse.jus.br/arquivos/${path}${filename}`,
];

const results = [];
for (const url of candidates) {
  const response = await fetch(url, {
    headers: { Range: "bytes=0-32" },
    redirect: "manual",
  });
  results.push({
    url,
    status: response.status,
    contentType: response.headers.get("content-type"),
    contentLength: response.headers.get("content-length"),
    location: response.headers.get("location"),
  });
}

console.log(JSON.stringify(results, null, 2));
