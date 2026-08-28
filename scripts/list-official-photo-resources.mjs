const resourceIds = [
  "e8f0a648-b438-4117-814a-f32f4c4977c8",
  "be039588-268d-441d-ad98-fab9e7839ceb",
  "72b5832c-a4fe-49aa-b0e4-791901a99ef8",
  "892b8391-89ba-44f0-824d-b2d49c61cc5a",
  "160c5b78-9817-45a8-9c67-1ff664e47252",
  "d1b0b207-2510-4498-967c-9cf11d218c78",
  "7a919286-5e8b-4ca2-b655-eaf16ee86630",
  "af942fcc-8dd5-4338-b19a-c35ebed7cec1",
  "ce184315-269e-49fa-a0d7-fab95286e0f3",
  "ec8cb889-cdde-4e18-b6ff-3be71080760c",
  "f3fd6ec8-70a9-4b99-b9de-fb628e7dd14b",
  "6a3b9da4-ce96-41b5-b821-c58f521f51fd",
  "7cc99120-3eb6-4a5c-bde3-61fb22eab585",
  "2e0edc7d-8bf0-4ec9-b54a-6fbe5bb6f430",
  "07098d12-a29a-4b5a-96a0-52984465b1d6",
  "7a697c44-7801-43f5-8950-9ac6341c0eba",
  "b9e35c4a-0912-4ad4-8086-7db9eba67b29",
  "75331bb4-c14b-4817-a3c3-c1ab64bae702",
  "04dfe503-a4d2-488e-bded-e5368025bcbb",
  "893ddc5a-bf4a-4c90-890d-7eae2a4527fb",
  "a76928e8-fed7-4361-a592-0c40824ac6ed",
  "a2e40197-4d32-4282-87a5-59023a7ea3cd",
  "50c99af8-c12e-4e87-a966-a60b0ac21c8b",
  "383b7b3a-fdd6-4521-a3a3-b6fe25a0ed39",
];

const response = await fetch("https://dadosabertos.tse.jus.br/api/3/action/package_show?id=candidatos-2026");
if (!response.ok) throw new Error(`TSE catalog responded with HTTP ${response.status}`);

const payload = await response.json();
if (!payload.success) throw new Error("TSE catalog returned an unsuccessful response");

const resourcesById = new Map(payload.result.resources.map(resource => [resource.id, resource]));
const resources = resourceIds.map(id => {
  const resource = resourcesById.get(id);
  return resource
    ? { id, name: resource.name, url: resource.url, format: resource.format }
    : { id, name: null, url: null, format: null };
});

console.log(JSON.stringify(resources, null, 2));
