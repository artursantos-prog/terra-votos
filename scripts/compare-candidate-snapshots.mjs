import fs from "node:fs";
import path from "node:path";

const localPath = "/home/ubuntu/upload/consulta_cand_2026_BRASIL.csv";
const remotePath = "/home/ubuntu/tse-validation/current-candidates/consulta_cand_2026_BRASIL.csv";
const outputPath = "/home/ubuntu/tse-validation/comparacao-candidaturas.json";

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];
    if (character === '"' && quoted && nextCharacter === '"') {
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

function readCandidates(filePath) {
  const rows = fs.readFileSync(filePath, "latin1").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(rows[0]);
  const indexes = new Map(headers.map((header, index) => [header, index]));
  const fields = [
    "SQ_CANDIDATO",
    "NM_URNA_CANDIDATO",
    "NR_CANDIDATO",
    "SG_PARTIDO",
    "SG_UF",
    "DS_CARGO",
    "DS_SITUACAO_CANDIDATURA",
    "DS_SIT_TOT_TURNO",
  ];

  return new Map(
    rows.slice(1).map((row) => {
      const values = parseCsvLine(row);
      const candidate = Object.fromEntries(fields.map((field) => [field, values[indexes.get(field)]?.trim() ?? ""]));
      return [candidate.SQ_CANDIDATO, candidate];
    }),
  );
}

const local = readCandidates(localPath);
const remote = readCandidates(remotePath);
const differences = [
  "NM_URNA_CANDIDATO",
  "NR_CANDIDATO",
  "SG_PARTIDO",
  "SG_UF",
  "DS_CARGO",
  "DS_SITUACAO_CANDIDATURA",
  "DS_SIT_TOT_TURNO",
];

const added = [...remote.keys()].filter((id) => !local.has(id)).map((id) => remote.get(id));
const removed = [...local.keys()].filter((id) => !remote.has(id)).map((id) => local.get(id));
const changed = [...remote.keys()]
  .filter((id) => local.has(id))
  .map((id) => {
    const before = local.get(id);
    const after = remote.get(id);
    const fields = differences.filter((field) => before[field] !== after[field]).map((field) => ({ field, before: before[field], after: after[field] }));
    return fields.length ? { id, candidato: after.NM_URNA_CANDIDATO, fields } : null;
  })
  .filter(Boolean);

const result = {
  local: { registros: local.size, arquivo: path.basename(localPath) },
  oficial: { registros: remote.size, arquivo: path.basename(remotePath) },
  resumo: { adicionados: added.length, removidos: removed.length, alterados: changed.length },
  adicionados: added,
  removidos: removed,
  alterados: changed,
};

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
