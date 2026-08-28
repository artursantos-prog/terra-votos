import { and, eq, notInArray } from "drizzle-orm";
import { candidates, candidateTicketMembers, electionSyncState, governmentPlans } from "../drizzle/schema";
import { getDb } from "./db";

const repository = "artursantos-prog/terra-votos";
const branch = "main";
const nonVotedOffices = ["VICE-PRESIDENTE", "VICE-GOVERNADOR", "1º SUPLENTE", "2º SUPLENTE"];

const indexHtml = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Eleições no Terra — espelho de contingência</title><style>
*{box-sizing:border-box}body{margin:0;background:#fff;color:#1f1d1b;font-family:Arial,sans-serif}.wrap{max-width:1180px;margin:auto;padding:24px}.notice{border-left:4px solid #ff5a00;background:#fff3ec;padding:12px 16px;font-size:14px;line-height:1.45}.brand{font:700 34px Georgia,serif;margin:24px 0 6px}.brand em{font-style:normal;color:#ff5a00}.meta{color:#665d57;font-size:13px}.filters{display:grid;grid-template-columns:2fr repeat(3,1fr);gap:10px;margin:24px 0}input,select{padding:12px;border:1px solid #ddd;font:inherit;background:#fff}.count{font:700 20px Georgia,serif}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:16px}.card{border:1px solid #e8e0dc;border-top:3px solid #ff5a00;padding:12px;min-height:216px}.card img{width:64px;height:84px;float:right;object-fit:contain;border:1px solid #eee}.office{font-size:10px;font-weight:bold;color:#655e58;letter-spacing:.08em}.name{font:700 20px Georgia,serif;margin:8px 0}.party,.status{font-size:12px;margin:6px 0}.number{font:700 27px Georgia,serif;color:#ff5a00;margin-top:20px}.plan{display:inline-block;margin-top:10px;color:#a83e00;font-weight:bold;font-size:12px}.empty{padding:28px;border:1px dashed #ccc;text-align:center}@media(max-width:760px){.filters{grid-template-columns:1fr}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media print{.filters,.notice{display:none}.wrap{max-width:none;padding:0}.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
</style></head><body><main class="wrap"><div class="notice"><strong>Espelho de contingência.</strong> Esta cópia somente de leitura usa o último snapshot oficial do TSE preservado antes da indisponibilidade. Ela não substitui a atualização diária do buscador principal. <a href="https://buscadorv2-pzlzvemq.manus.space/owner/reports" rel="noreferrer">Acessar painel privado do dono</a>.</div><h1 class="brand">eleições <em>no Terra</em></h1><p id="meta" class="meta">Carregando snapshot oficial…</p><section class="filters"><input id="q" placeholder="Buscar por nome ou número"><select id="uf"><option value="">Todos os estados</option></select><select id="office"><option value="">Todos os cargos votados</option></select><select id="party"><option value="">Todos os partidos</option></select></section><p id="count" class="count"></p><section id="results" class="grid"></section></main><script>
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const select=(id,values)=>{const el=document.getElementById(id);[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach(v=>el.insertAdjacentHTML('beforeend','<option>'+esc(v)+'</option>'))};
fetch('./data.json?cache='+Date.now(), { cache: 'no-store' }).then(r=>r.json()).then(data=>{const all=data.candidates;document.getElementById('meta').textContent='Última sincronização bem-sucedida: '+data.lastSuccessfulSyncAt+' · Arquivo oficial do TSE: '+data.sourceUpdatedAt+'.';select('uf',all.map(x=>x.uf));select('office',all.map(x=>x.office));select('party',all.map(x=>x.partyAcronym));const render=()=>{const q=document.getElementById('q').value.trim().toLocaleLowerCase('pt-BR'),uf=document.getElementById('uf').value,office=document.getElementById('office').value,party=document.getElementById('party').value;const found=all.filter(x=>(!q||[x.ballotName,x.candidateName,x.candidateNumber].join(' ').toLocaleLowerCase('pt-BR').includes(q))&&(!uf||x.uf===uf)&&(!office||x.office===office)&&(!party||x.partyAcronym===party));document.getElementById('count').textContent=found.length.toLocaleString('pt-BR')+' candidatura(s) no snapshot';document.getElementById('results').innerHTML=found.slice(0,120).map(x=>'<article class="card">'+(x.photoUrl?'<img src="'+esc(x.photoUrl)+'" alt="Foto oficial de '+esc(x.ballotName)+'" onerror="this.remove()">':'')+'<div class="office">'+esc(x.uf)+' · '+esc(x.office)+'</div><h2 class="name">'+esc(x.ballotName)+'</h2><p class="party">Partido: '+esc(x.partyAcronym||x.partyName||'Não informado')+'</p>'+(x.ticketMembers?.length?'<p class="status">Vice: '+esc(x.ticketMembers.map(m=>m.ballotName).join(', '))+'</p>':'')+'<p class="number">'+esc(x.candidateNumber||'—')+'</p>'+(x.planUrl?'<a class="plan" target="_blank" rel="noreferrer" href="'+esc(x.planUrl)+'">Abrir proposta oficial</a>':'')+'</article>').join('')||'<p class="empty">Nenhuma candidatura corresponde aos filtros.</p>'};['q','uf','office','party'].forEach(id=>document.getElementById(id).addEventListener(id==='q'?'input':'change',render));render();});
</script></body></html>`;

type GithubContentResponse = { sha?: string };

function githubHeaders() {
  const token = process.env.GITHUB_FALLBACK_TOKEN;
  if (!token) throw new Error("Token do espelho GitHub não configurado.");
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function writeGithubFile(path: string, content: string, message: string) {
  const url = `https://api.github.com/repos/${repository}/contents/${path}`;
  const current = await fetch(`${url}?ref=${branch}`, { headers: githubHeaders() });
  let sha: string | undefined;
  if (current.ok) {
    sha = (await current.json() as GithubContentResponse).sha;
  } else if (current.status !== 404) {
    throw new Error(`Não foi possível consultar ${path} no GitHub: HTTP ${current.status}`);
  }

  const response = await fetch(url, {
    method: "PUT",
    headers: githubHeaders(),
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString("base64"),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!response.ok) throw new Error(`Não foi possível publicar ${path} no GitHub: HTTP ${response.status}`);
}

export async function buildGithubFallbackArtifacts() {
  const db = await getDb();
  if (!db) throw new Error("Banco indisponível para gerar o espelho de contingência.");
  const [candidateRows, planRows, ticketRows, syncRows] = await Promise.all([
    db.select().from(candidates).where(and(eq(candidates.category, "em_disputa"), notInArray(candidates.office, nonVotedOffices))),
    db.select().from(governmentPlans),
    db.select().from(candidateTicketMembers),
    db.select().from(electionSyncState).where(eq(electionSyncState.syncKey, "official-tse-2026")),
  ]);
  const candidateBySq = new Map(candidateRows.map(candidate => [candidate.sqCandidate, candidate]));
  const plansByCandidate = new Map(planRows.map(plan => [plan.sqCandidate, plan.officialUrl]));
  const ticketsByPrincipal = new Map<string, Array<{ ballotName: string; office: string }>>();
  for (const ticket of ticketRows) {
    const member = candidateBySq.get(ticket.memberSqCandidate);
    if (!member) continue;
    const members = ticketsByPrincipal.get(ticket.principalSqCandidate) ?? [];
    members.push({ ballotName: member.ballotName, office: ticket.memberOffice });
    ticketsByPrincipal.set(ticket.principalSqCandidate, members);
  }
  const sync = syncRows[0];
  const payload = {
    generatedAt: new Date().toISOString(),
    lastSuccessfulSyncAt: sync?.lastSuccessAt ? new Date(sync.lastSuccessAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "Não registrado",
    sourceUpdatedAt: sync?.sourceUpdatedAt ?? "Não registrado",
    candidates: candidateRows.map(candidate => ({
      candidateName: candidate.candidateName,
      ballotName: candidate.ballotName,
      candidateNumber: candidate.candidateNumber,
      office: candidate.office,
      partyAcronym: candidate.partyAcronym,
      partyName: candidate.partyName,
      uf: candidate.uf,
      photoUrl: candidate.photoUrl,
      planUrl: plansByCandidate.get(candidate.sqCandidate) ?? null,
      ticketMembers: ticketsByPrincipal.get(candidate.sqCandidate) ?? [],
    })),
  };
  return { indexHtml, dataJson: JSON.stringify(payload), candidates: payload.candidates.length };
}

export async function publishGithubFallbackSnapshot() {
  const artifacts = await buildGithubFallbackArtifacts();
  await writeGithubFile("index.html", artifacts.indexHtml, "Atualiza espelho de contingência oficial");
  await writeGithubFile("data.json", artifacts.dataJson, "Atualiza dados oficiais do espelho");
  return { candidates: artifacts.candidates };
}
