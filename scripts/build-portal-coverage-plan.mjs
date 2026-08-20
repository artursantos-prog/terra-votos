import fs from "node:fs";
import path from "node:path";

const inputDirectory = "/home/ubuntu/tse-validation/current-candidates";
const outputPath = "/home/ubuntu/tse-validation/plano-consulta-portal.json";

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

const plans = new Map();
for (const fileName of fs.readdirSync(inputDirectory).filter((file) => /^consulta_cand_2026_(?:[A-Z]{2}|BRASIL)\.csv$/.test(file))) {
  const rows = fs.readFileSync(path.join(inputDirectory, fileName), "latin1").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(rows[0]);
  const index = new Map(headers.map((header, position) => [header, position]));
  for (const row of rows.slice(1)) {
    const fields = parseCsvLine(row);
    const uf = fields[index.get("SG_UE")];
    const cargo = fields[index.get("CD_CARGO")];
    const cargoNome = fields[index.get("DS_CARGO")];
    if (!uf || !cargo) continue;
    plans.set(`${uf}:${cargo}`, { uf, cargo: Number(cargo), cargoNome });
  }
}

const result = [...plans.values()].sort((first, second) => first.uf.localeCompare(second.uf) || first.cargo - second.cargo);
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
