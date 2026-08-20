import fs from "node:fs";

const snapshotPath = process.env.SNAPSHOT_PATH ?? "/home/ubuntu/webdev-static-assets/candidatos-eleicoes-2026.json";
const ticketAuditPath = process.env.TICKET_AUDIT_PATH ?? "/home/ubuntu/webdev-static-assets/auditoria-vinculos-chapa-2026.json";
const proposalLinksPath = process.env.PROPOSAL_LINKS_PATH ?? "/home/ubuntu/Downloads/tse-proposal-links-2026.json";
const outputPath = process.env.OUTPUT_PATH ?? "/home/ubuntu/webdev-static-assets/candidatos-eleicoes-2026-enriquecido.json";

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
const candidates = snapshot.candidaturas ?? snapshot.candidatos ?? [];
const candidateById = new Map(candidates.map((candidate) => [String(candidate.id), candidate]));
const audit = JSON.parse(fs.readFileSync(ticketAuditPath, "utf8"));
const confirmedTickets = new Map(audit.links.filter((entry) => entry.status === "confirmed").map((entry) => [String(entry.candidateId), String(entry.titularId)]));
const proposalAudit = JSON.parse(fs.readFileSync(proposalLinksPath, "utf8"));
const proposalUrls = new Map(proposalAudit.links.map((entry) => [String(entry.id), `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/${entry.fileId}`]));

const enrichedCandidates = candidates.map((candidate) => {
  const { titular: _titularAnterior, vinculoChapaIndisponivel: _vinculoAnterior, propostaGovernoUrl: _propostaAnterior, ...candidateData } = candidate;
  const titularId = confirmedTickets.get(String(candidate.id));
  const titular = titularId ? candidateById.get(titularId) : undefined;
  const needsTicket = candidate.cargo === "VICE-PRESIDENTE" || candidate.cargo === "VICE-GOVERNADOR" || candidate.cargo.includes("SUPLENTE");
  const proposalUrl = proposalUrls.get(String(candidate.id));
  return {
    ...candidateData,
    ...(titular ? { titular: { id: titular.id, nome: titular.nome, cargo: titular.cargo } } : {}),
    ...(needsTicket && !titular ? { vinculoChapaIndisponivel: true } : {}),
    ...(proposalUrl ? { propostaGovernoUrl: proposalUrl } : {}),
  };
});

const output = { candidatos: enrichedCandidates };
fs.writeFileSync(outputPath, JSON.stringify(output));
console.log(JSON.stringify({
  outputPath,
  candidates: enrichedCandidates.length,
  officialTicketLinks: enrichedCandidates.filter((candidate) => candidate.titular).length,
  unconfirmedTicketMembers: enrichedCandidates.filter((candidate) => candidate.vinculoChapaIndisponivel).length,
  officialProposalLinks: enrichedCandidates.filter((candidate) => candidate.propostaGovernoUrl).length,
}, null, 2));
