import fs from "node:fs";

const [portalPath, csvPath, expectedUf, expectedOffice] = process.argv.slice(2);

if (!portalPath || !csvPath || !expectedUf || !expectedOffice) {
  throw new Error("Uso: node scripts/compare-portal-list.mjs <portal.json> <csv.csv> <UF> <CD_CARGO>");
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];
    if (character === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ";" && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
}

const portal = JSON.parse(fs.readFileSync(portalPath, "utf8")).candidatos ?? [];
const rows = fs.readFileSync(csvPath, "latin1").split(/\r?\n/).filter(Boolean);
const headers = parseCsvLine(rows[0]);
const index = new Map(headers.map((header, position) => [header, position]));
const csv = rows
  .slice(1)
  .map(parseCsvLine)
  .filter((fields) => fields[index.get("SG_UE")] === expectedUf && fields[index.get("CD_CARGO")] === expectedOffice)
  .map((fields) => ({
    id: fields[index.get("SQ_CANDIDATO")],
    nome: fields[index.get("NM_URNA_CANDIDATO")],
    numero: fields[index.get("NR_CANDIDATO")],
    partido: fields[index.get("SG_PARTIDO")],
  }));

const portalById = new Map(portal.map((candidate) => [String(candidate.id), candidate]));
const csvById = new Map(csv.map((candidate) => [String(candidate.id), candidate]));
const onlyPortal = [...portalById.keys()].filter((id) => !csvById.has(id)).map((id) => portalById.get(id));
const onlyCsv = [...csvById.keys()].filter((id) => !portalById.has(id)).map((id) => csvById.get(id));

console.log(JSON.stringify({ portal: portal.length, csv: csv.length, somentePortal: onlyPortal, somenteCsv: onlyCsv }, null, 2));
