import { readFile } from "node:fs/promises";

const resources = JSON.parse(await readFile(new URL("../official_photo_resources.json", import.meta.url), "utf8"));
const results = [];

for (const resource of resources) {
  const response = await fetch(resource.url, {
    method: "HEAD",
    headers: { Accept: "application/zip,application/octet-stream;q=0.9,*/*;q=0.8" },
  });
  results.push({
    name: resource.name,
    url: resource.url,
    ok: response.ok,
    status: response.status,
    contentLength: response.headers.get("content-length"),
    contentType: response.headers.get("content-type"),
  });
}

console.log(JSON.stringify(results, null, 2));
