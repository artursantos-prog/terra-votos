const response = await fetch("https://dadosabertos.tse.jus.br/api/3/action/package_show?id=candidatos-2026");
if (!response.ok) throw new Error(`TSE catalog responded with HTTP ${response.status}`);

const payload = await response.json();
if (!payload.success) throw new Error("TSE catalog returned an unsuccessful response");

const relevant = payload.result.resources
  .filter(resource => /fotos?|complement|redes? sociais?|proposta/i.test(resource.name ?? ""))
  .map(resource => ({ id: resource.id, name: resource.name, url: resource.url, format: resource.format }));

console.log(JSON.stringify(relevant, null, 2));
