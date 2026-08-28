const archiveUrl = "https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/fotos/foto_cand2026_BR_div.zip";

const response = await fetch(archiveUrl, {
  headers: {
    Accept: "application/zip,application/octet-stream;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
    Referer: "https://dadosabertos.tse.jus.br/dataset/candidatos-2026/resource/e8f0a648-b438-4117-814a-f32f4c4977c8",
    Range: "bytes=0-8191",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36",
  },
});

const sample = Buffer.from(await response.arrayBuffer());
console.log(JSON.stringify({
  ok: response.ok,
  status: response.status,
  contentType: response.headers.get("content-type"),
  contentRange: response.headers.get("content-range"),
  contentLength: response.headers.get("content-length"),
  startsWithZipSignature: sample.subarray(0, 4).toString("hex") === "504b0304",
  bytesRead: sample.length,
}, null, 2));
