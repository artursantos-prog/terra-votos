import { trpc } from "@/lib/trpc";
import { jsPDF } from "jspdf";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Flag,
  Loader2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

type Candidate = {
  id: string;
  nome: string;
  nomeCompleto: string;
  numero: string;
  partido: string;
  partidoNome: string;
  uf: string;
  unidadeEleitoral?: string;
  cargo: string;
  codigoCargo?: number;
  situacao: string;
  fotoUrl: string;
  redesSociais?: string[];
  titular?: { id: string; nome: string; cargo: string };
  vinculoChapaIndisponivel?: boolean;
  propostaGovernoUrl?: string;
  pesquisa: string;
};

type CandidateResponse = { candidaturas?: Candidate[]; candidatos?: Candidate[] };

const FALLBACK_DATA_URL = "/manus-storage/candidatos-eleicoes-2026-enriquecido_1a1dd430.json";
const PAGE_SIZE = 12;
const STORAGE_KEY = "terra-eleicoes-colinha-2026";
const FEATURED_OFFICES = ["PRESIDENTE", "GOVERNADOR", "SENADOR", "DEPUTADO FEDERAL", "DEPUTADO ESTADUAL", "DEPUTADO DISTRITAL"];

const STATE_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá", BA: "Bahia", BR: "Brasil", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MG: "Minas Gerais", MS: "Mato Grosso do Sul", MT: "Mato Grosso", PA: "Pará", PB: "Paraíba", PE: "Pernambuco", PI: "Piauí", PR: "Paraná", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RO: "Rondônia", RR: "Roraima", RS: "Rio Grande do Sul", SC: "Santa Catarina", SE: "Sergipe", SP: "São Paulo", TO: "Tocantins",
};

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

function formatOfficeLabel(value: string) {
  const normalized = value.toLocaleLowerCase("pt-BR");
  return normalized.charAt(0).toLocaleUpperCase("pt-BR") + normalized.slice(1);
}

function isSelectable(candidate: Candidate) {
  return Boolean(candidate.id);
}

function OptionSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { label: string; value: string }[] }) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <div className="select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => <option key={option.value || "all"} value={option.value}>{option.label}</option>)}
        </select>
        <ChevronDown aria-hidden="true" size={15} strokeWidth={2.2} />
      </div>
    </label>
  );
}

function CandidateCard({ candidate, index, selected, onToggle, onReport }: { candidate: Candidate; index: number; selected: boolean; onToggle: () => void; onReport: () => void }) {
  const selectable = isSelectable(candidate);
  const proposalUrl = candidate.propostaGovernoUrl;
  return (
    <article className="candidate-card" style={{ "--card-index": index } as React.CSSProperties}>
      <div className="candidate-topline" />
      <div className="candidate-meta"><span>{STATE_NAMES[candidate.uf] ?? candidate.uf} / {candidate.uf}</span><span>{candidate.cargo}</span></div>
      <div className="candidate-main">
        <div><h3>{candidate.nome}</h3><p title={candidate.partidoNome}>{candidate.partido}</p></div>
        <div className="candidate-photo"><span>Foto</span><img src={candidate.fotoUrl} alt={`Foto de ${candidate.nome}`} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} /></div>
      </div>
      {candidate.titular && <p className="linked-ticket">Vinculado a <b>{candidate.titular.nome}</b> · {candidate.titular.cargo.toLowerCase()}</p>}
      {candidate.vinculoChapaIndisponivel && <p className="linked-ticket linked-ticket-unavailable">Composição da chapa não identificada de forma única na base oficial.</p>}
      {candidate.redesSociais && candidate.redesSociais.length > 0 && <div className="social-links">{candidate.redesSociais.slice(0, 2).map((url) => <a key={url} href={url} target="_blank" rel="noreferrer">Rede oficial <ArrowUpRight size={11} /></a>)}</div>}
      {proposalUrl && <a className="proposal-link" href={proposalUrl} target="_blank" rel="noreferrer">Abrir plano de governo oficial <ArrowUpRight size={12} /></a>}
      <div className="candidate-number" aria-label={`Número de urna ${candidate.numero}`}><span>Número</span><strong>{candidate.numero}</strong></div>
      <div className="candidate-bottomline"><span>{candidate.situacao}</span><ShieldCheck aria-hidden="true" size={16} /></div>
      <div className="candidate-actions">
        {selectable && <button className={selected ? "select-candidate selected" : "select-candidate"} type="button" onClick={onToggle} aria-pressed={selected}>{selected ? <><Check size={14} /> Na colinha</> : <><Bookmark size={14} /> Adicionar à colinha</>}</button>}
        <button className="report-button" type="button" onClick={onReport}><Flag size={14} /> Reportar informação</button>
      </div>
    </article>
  );
}

function ReportDialog({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
  const [category, setCategory] = useState("Outro dado do candidato");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const report = trpc.reports.create.useMutation({
    onSuccess: () => { toast.success("Apontamento recebido para revisão editorial."); onClose(); },
    onError: () => toast.error("Não foi possível enviar o apontamento. Tente novamente."),
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    report.mutate({ candidateId: candidate.id, candidateName: candidate.nome, candidateNumber: candidate.numero, candidateUf: candidate.uf, candidateOffice: candidate.cargo, category, message, contactEmail: email });
  }
  return <div className="dialog-backdrop" role="presentation"><section className="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title"><button className="dialog-close" type="button" onClick={onClose} aria-label="Fechar"><X size={18} /></button><p className="section-kicker"><Flag size={14} /> Revisão editorial</p><h2 id="report-title">Reportar erro ou inconsistência</h2><p>Use este formulário para relatar qualquer informação incorreta ou incompleta sobre <b>{candidate.nome}</b>: nome, número, cargo, partido, situação, foto, rede social, vínculo de chapa ou plano de governo. A equipe editorial receberá o apontamento para verificação.</p><form onSubmit={submit}><label>Qual informação precisa de revisão?<select value={category} onChange={(event) => setCategory(event.target.value)}><option>Nome ou número de urna</option><option>Partido, cargo ou situação</option><option>Foto do candidato</option><option>Rede social</option><option>Vínculo de chapa</option><option>Plano de governo</option><option>Outro dado do candidato</option></select></label><label>Descreva o erro ou a inconsistência<textarea value={message} onChange={(event) => setMessage(event.target.value)} minLength={10} maxLength={3000} required placeholder="Informe o que está incorreto e, se possível, inclua a URL ou referência oficial para conferência." /></label><label>E-mail para retorno <small>(opcional)</small><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" /></label><button className="dialog-submit" type="submit" disabled={report.isPending}>{report.isPending ? "Enviando…" : "Enviar para revisão"}</button></form></section></div>;
}

function exportColinha(candidates: Candidate[]) {
  if (!candidates.length) return;
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const grouped = new Map<string, Candidate[]>();
  candidates.forEach((candidate) => grouped.set(candidate.cargo, [...(grouped.get(candidate.cargo) ?? []), candidate]));
  pdf.setFillColor(255, 90, 0); pdf.rect(15, 15, 56, 2, "F");
  pdf.setTextColor(37, 32, 30); pdf.setFont("helvetica", "bold"); pdf.setFontSize(9); pdf.text("ELEIÇÕES 2026 · MINHA COLINHA", 15, 12);
  pdf.setFontSize(24); pdf.text("Minha colinha", 15, 29);
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(110, 98, 92); pdf.text("Candidaturas selecionadas para consulta e impressão.", 15, 35);
  let y = 49;
  grouped.forEach((group, cargo) => {
    if (y > 262) { pdf.addPage(); y = 18; }
    pdf.setTextColor(255, 90, 0); pdf.setFont("helvetica", "bold"); pdf.setFontSize(8); pdf.text(cargo, 15, y); y += 7;
    group.forEach((candidate) => {
      if (y > 274) { pdf.addPage(); y = 18; }
      pdf.setDrawColor(211, 196, 187); pdf.line(15, y + 13, 195, y + 13);
      const digits = candidate.numero.split("");
      digits.forEach((digit, index) => { pdf.setDrawColor(41, 74, 46); pdf.roundedRect(15 + index * 8, y, 6.5, 8, 1, 1, "S"); pdf.setTextColor(37, 32, 30); pdf.setFontSize(12); pdf.text(digit, 17.05 + index * 8, y + 5.6); });
      pdf.setTextColor(37, 32, 30); pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.text(candidate.nome.slice(0, 62), 15 + digits.length * 8 + 8, y + 3.4);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(110, 98, 92); pdf.text(`${candidate.partido} · ${candidate.uf}`, 15 + digits.length * 8 + 8, y + 7.1); y += 18;
    });
    y += 4;
  });
  pdf.setTextColor(130, 119, 113); pdf.setFontSize(7); pdf.text("Dados públicos do TSE · Consulte sempre a situação atual da candidatura.", 15, 289);
  pdf.save("minha-colinha-eleicoes-2026.pdf");
}

export default function Home() {
  const [, setLocation] = useLocation();
  const snapshot = trpc.election.snapshot.useQuery(undefined, {
    refetchInterval: 5 * 60_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState(""); const [state, setState] = useState(""); const [party, setParty] = useState(""); const [office, setOffice] = useState(""); const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")));
  const [reportCandidate, setReportCandidate] = useState<Candidate | null>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(selectedIds))); }, [selectedIds]);
  useEffect(() => {
    let active = true; setLoadingCandidates(true); setLoadError(false);
    fetch(snapshot.data?.dataUrl ?? FALLBACK_DATA_URL).then((response) => { if (!response.ok) throw new Error("Falha na base"); return response.json() as Promise<CandidateResponse>; }).then((response) => {
      if (!active) return; const raw = response.candidaturas ?? response.candidatos ?? []; setCandidates(raw.filter((candidate) => ["DEFERIDO", "AGUARDANDO JULGAMENTO"].includes(normalizeSearch(candidate.situacao))));
    }).catch(() => active && setLoadError(true)).finally(() => active && setLoadingCandidates(false));
    return () => { active = false; };
  }, [snapshot.data?.dataUrl]);

  const stateOptions = useMemo(() => [{ label: "Todos os estados", value: "" }, ...Array.from(new Set(candidates.map((candidate) => candidate.uf))).sort((a, b) => (STATE_NAMES[a] ?? a).localeCompare(STATE_NAMES[b] ?? b, "pt-BR")).map((uf) => ({ label: `${STATE_NAMES[uf] ?? uf} (${uf})`, value: uf }))], [candidates]);
  const partyOptions = useMemo(() => [{ label: "Todos os partidos", value: "" }, ...Array.from(new Set(candidates.map((candidate) => candidate.partido))).sort().map((item) => ({ label: item, value: item }))], [candidates]);
  const officeOptions = useMemo(() => [{ label: "Todos os cargos", value: "" }, ...Array.from(new Set(candidates.map((candidate) => candidate.cargo))).sort((a, b) => a.localeCompare(b, "pt-BR")).map((item) => ({ label: item, value: item }))], [candidates]);
  const featuredOffices = useMemo(() => FEATURED_OFFICES.filter((item) => candidates.some((candidate) => candidate.cargo === item)), [candidates]);
  const filteredCandidates = useMemo(() => { const normalizedQuery = normalizeSearch(query); return candidates.filter((candidate) => (!normalizedQuery || candidate.pesquisa.includes(normalizedQuery)) && (!state || candidate.uf === state) && (!party || candidate.partido === party) && (!office || candidate.cargo === office)); }, [candidates, office, party, query, state]);
  const selectedCandidates = useMemo(() => candidates.filter((candidate) => selectedIds.has(candidate.id)), [candidates, selectedIds]);
  useEffect(() => setPage(1), [query, state, party, office]);
  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / PAGE_SIZE)); const pageStart = (page - 1) * PAGE_SIZE; const visibleCandidates = filteredCandidates.slice(pageStart, pageStart + PAGE_SIZE); const hasFilters = Boolean(query || state || party || office);
  const toggleCandidate = (id: string) => setSelectedIds((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const clearFilters = () => { setQuery(""); setState(""); setParty(""); setOffice(""); };

  return <main className="election-page"><section className="editorial-shell">
    <header className="site-header" aria-label="Cabeçalho Eleições no Terra"><div className="brand-lockup"><img src="/manus-storage/terra-election-mark_debb05e3.png" alt="" className="brand-mark" /><div className="brand-name"><span>eleições</span><span>no terra</span><b>PRIMEIRO TURNO</b></div></div><div className="header-rule" /><div className="header-tools"><div className="powered-by"><span>Powered by</span><strong>terra</strong></div></div></header>
    <div className="intro-panel"><div className="intro-copy"><p className="eyebrow">Eleições 2026</p><h1>Buscador de candidatos</h1><p>Consulte candidaturas deferidas ou aguardando julgamento, partidos e números de urna.</p></div><div className="intro-data"><strong>{loadingCandidates ? "…" : candidates.length.toLocaleString("pt-BR")}</strong><span>candidaturas<br />aptas na base</span></div></div>
    <section className="trust-strip"><ShieldCheck size={17} /><span>{snapshot.data?.filter ?? "Deferido ou Aguardando julgamento"}</span><span className="trust-divider">•</span><span>{snapshot.data?.updatedAt ? `Atualizado em ${new Date(snapshot.data.updatedAt).toLocaleString("pt-BR")}` : "Base oficial em consolidação"}</span></section>
    <section className="search-panel" aria-label="Filtros de candidatos"><div className="search-panel-heading"><div><p className="section-kicker"><SlidersHorizontal size={15} /> Busca refinada</p><h2>Encontre quem você procura</h2></div>{hasFilters && <button className="clear-button" type="button" onClick={clearFilters}><X size={15} /> Limpar filtros</button>}</div><div className="filters-grid"><label className="search-field"><span>Nome ou número</span><div><Search size={18} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Digite o nome ou número" /></div></label><OptionSelect label="Estado" value={state} onChange={setState} options={stateOptions} /><OptionSelect label="Partido" value={party} onChange={setParty} options={partyOptions} /><OptionSelect label="Cargo em disputa" value={office} onChange={setOffice} options={officeOptions} /></div><div className="office-chooser"><span>Ou selecione diretamente o cargo que procura</span><div>{featuredOffices.map((item) => <button key={item} type="button" className={office === item ? "office-chip selected" : "office-chip"} onClick={() => setOffice(item)}>{formatOfficeLabel(item)}</button>)}</div></div></section>
    <section className="colinha-bar"><div><p className="section-kicker"><Bookmark size={14} /> Minha colinha</p><strong>{selectedCandidates.length === 1 ? "1 perfil selecionado" : `${selectedCandidates.length} perfis selecionados`}</strong><span>Use o botão “Adicionar à colinha” em qualquer card e baixe a lista para imprimir.</span></div><div className="colinha-actions"><button type="button" className="secondary-action" onClick={() => setSelectedIds(new Set())} disabled={!selectedCandidates.length}>Limpar</button><button type="button" className="primary-action" onClick={() => exportColinha(selectedCandidates)} disabled={!selectedCandidates.length}><FileDown size={17} /> Baixar PDF</button></div></section>
    <section className="results-section" aria-live="polite"><div className="results-header"><div><p className="section-kicker">Resultados da busca</p><h2>{loadingCandidates ? "Carregando candidaturas…" : `${filteredCandidates.length.toLocaleString("pt-BR")} candidatura${filteredCandidates.length === 1 ? "" : "s"}`}</h2></div>{!loadingCandidates && filteredCandidates.length > 0 && <p>Exibindo {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredCandidates.length)} de {filteredCandidates.length.toLocaleString("pt-BR")}</p>}</div>
      {loadingCandidates && <div className="status-card loading-card"><Loader2 className="spinner" size={24} /><div><strong>Preparando a base eleitoral</strong><span>Isso pode levar alguns segundos na primeira visita.</span></div></div>}
      {loadError && <div className="status-card error-card"><div><strong>Não foi possível carregar a base de candidatos.</strong><span>Atualize a página para tentar novamente.</span></div></div>}
      {!loadingCandidates && !loadError && visibleCandidates.length > 0 && <div className="candidate-grid">{visibleCandidates.map((candidate, index) => <CandidateCard key={candidate.id} candidate={candidate} index={index} selected={selectedIds.has(candidate.id)} onToggle={() => toggleCandidate(candidate.id)} onReport={() => setReportCandidate(candidate)} />)}</div>}
      {!loadingCandidates && !loadError && visibleCandidates.length === 0 && <div className="empty-state"><span>Nenhuma candidatura encontrada</span><p>Revise o nome digitado ou experimente remover algum filtro.</p><button type="button" onClick={clearFilters}>Limpar a busca</button></div>}
      {!loadingCandidates && !loadError && filteredCandidates.length > PAGE_SIZE && <nav className="pagination" aria-label="Paginação dos resultados"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}><ChevronLeft size={19} /></button><span>Página <b>{page}</b> de {totalPages}</span><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}><ChevronRight size={19} /></button></nav>}
    </section>
    <footer className="site-footer"><div><p>Fonte: Dados Abertos e DivulgaCandContas — TSE.</p><span>Base filtrada por situação de julgamento; atualização programada duas vezes ao dia, com preservação da última versão válida.</span><a className="methodology-link" href="/METODOLOGIA.md" target="_blank" rel="noreferrer">Ver metodologia e fontes <ArrowUpRight size={13} /></a></div><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Voltar aos filtros <ArrowUpRight size={18} /></button></footer>
  </section>{reportCandidate && <ReportDialog candidate={reportCandidate} onClose={() => setReportCandidate(null)} />}</main>;
}
