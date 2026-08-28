import { readFile } from "node:fs/promises";
import { createConnection } from "mysql2/promise";
import { parse } from "csv-parse/sync";

const sourcePath = "/home/ubuntu/upload/consulta_cand_2026_BRASIL.csv";
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");

const terminalStatuses = new Set(["INDEFERIDO", "RENUNCIA", "CASSADO", "CANCELADO", "FALECIDO", "PEDIDO NAO CONHECIDO"]);
const normalizeStatus = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
const toValue = value => String(value ?? "").trim() || null;

const content = await readFile(sourcePath, "latin1");
const rows = parse(content, { columns: true, delimiter: ";", bom: true, skip_empty_lines: true, relax_column_count: true, trim: true });
const records = rows.flatMap(row => {
  const sqCandidate = toValue(row.SQ_CANDIDATO);
  const candidateName = toValue(row.NM_CANDIDATO);
  const ballotName = toValue(row.NM_URNA_CANDIDATO);
  const office = toValue(row.DS_CARGO);
  if (!sqCandidate || !candidateName || !ballotName || !office) return [];
  const uf = toValue(row.SG_UF);
  const status = toValue(row.DS_SITUACAO_CANDIDATURA);
  const category = terminalStatuses.has(normalizeStatus(status)) ? "fora_da_disputa" : "em_disputa";
  const sourceUpdatedAt = [toValue(row.DT_GERACAO), toValue(row.HH_GERACAO)].filter(Boolean).join(" ") || null;
  const officialPhotoUrl = uf ? `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/20322002026/${sqCandidate}/${uf}` : null;
  return [[sqCandidate, candidateName, ballotName, toValue(row.NR_CANDIDATO), office, toValue(row.SG_PARTIDO), toValue(row.NM_PARTIDO), uf, status, category, officialPhotoUrl, sourceUpdatedAt]];
});

const connection = await createConnection(databaseUrl);
const columns = ["sq_candidato", "nm_candidato", "nm_urna_candidato", "nr_candidato", "ds_cargo", "sg_partido", "nm_partido", "sg_uf", "ds_situacao_candidatura", "candidate_category", "foto_url", "fonte_atualizada_em"];
for (let start = 0; start < records.length; start += 400) {
  const batch = records.slice(start, start + 400);
  const placeholders = batch.map(() => `(${columns.map(() => "?").join(",")})`).join(",");
  const values = batch.flat();
  await connection.execute(`INSERT INTO candidates (${columns.map(column => `\`${column}\``).join(",")}) VALUES ${placeholders} ON DUPLICATE KEY UPDATE nm_candidato=VALUES(nm_candidato), nm_urna_candidato=VALUES(nm_urna_candidato), nr_candidato=VALUES(nr_candidato), ds_cargo=VALUES(ds_cargo), sg_partido=VALUES(sg_partido), nm_partido=VALUES(nm_partido), sg_uf=VALUES(sg_uf), ds_situacao_candidatura=VALUES(ds_situacao_candidatura), candidate_category=VALUES(candidate_category), fonte_atualizada_em=VALUES(fonte_atualizada_em)`, values);
}
const [counts] = await connection.query("SELECT candidate_category AS category, COUNT(*) AS total FROM candidates GROUP BY candidate_category");
await connection.end();
console.log(JSON.stringify({ source: sourcePath, imported: records.length, counts }, null, 2));
