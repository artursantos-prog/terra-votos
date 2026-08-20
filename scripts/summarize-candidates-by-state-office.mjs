import fs from "node:fs";

const sourcePath = "/home/ubuntu/tse-validation/current-candidates/consulta_cand_2026_BRASIL.csv";

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

const rows = fs.readFileSync(sourcePath, "latin1").split(/\r?\n/).filter(Boolean);
const headers = parseCsvLine(rows[0]);
const stateIndex = headers.indexOf("SG_UE");
const officeIndex = headers.indexOf("CD_CARGO");
const summary = new Map();

for (const row of rows.slice(1)) {
  const fields = parseCsvLine(row);
  const key = `${fields[stateIndex]}:${fields[officeIndex]}`;
  summary.set(key, (summary.get(key) ?? 0) + 1);
}

console.log(JSON.stringify(Object.fromEntries([...summary.entries()].sort(([first], [second]) => first.localeCompare(second, "pt-BR"))), null, 2));
