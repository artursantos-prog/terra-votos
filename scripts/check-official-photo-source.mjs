const photoArchiveUrl = "https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/fotos/foto_cand2026_BR_div.zip";

const response = await fetch(photoArchiveUrl, {
  method: "HEAD",
  headers: {
    Accept: "application/zip,application/octet-stream;q=0.9,*/*;q=0.8",
  },
});

console.log(JSON.stringify({
  ok: response.ok,
  status: response.status,
  contentType: response.headers.get("content-type"),
  contentLength: response.headers.get("content-length"),
}, null, 2));
