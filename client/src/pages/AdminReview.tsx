import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Clock3, Database, ExternalLink, MessageSquareWarning, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

function formatDate(value: Date | string | null) {
  return value ? new Date(value).toLocaleString("pt-BR") : "—";
}

export default function AdminReview() {
  const [location] = useLocation();
  const [notes, setNotes] = useState<Record<number, string>>({});
  const status = trpc.admin.status.useQuery();
  const utils = trpc.useUtils();
  const review = trpc.admin.reviewReport.useMutation({ onSuccess: () => { toast.success("Apontamento atualizado."); utils.admin.status.invalidate(); } });
  const sync = trpc.admin.syncNow.useMutation({ onSuccess: () => { toast.success("Sincronização concluída."); utils.admin.status.invalidate(); }, onError: () => toast.error("A fonte oficial não respondeu. A base publicada foi preservada.") });
  const reportsView = location.includes("apontamentos");

  return <DashboardLayout><div className="admin-shell">
    <header className="admin-header"><div><p className="section-kicker">Área privada</p><h1>{reportsView ? "Apontamentos recebidos" : "Sincronização eleitoral"}</h1><p>Somente pessoas autenticadas com acesso editorial podem revisar estes dados.</p></div><Link href="/" className="admin-back">Ver buscador <ExternalLink size={15} /></Link></header>
    <nav className="admin-tabs"><Link href="/revisao" className={!reportsView ? "active" : ""}><Database size={16} /> Sincronizações</Link><Link href="/revisao/apontamentos" className={reportsView ? "active" : ""}><MessageSquareWarning size={16} /> Apontamentos</Link></nav>
    {status.isLoading && <div className="admin-loading"><RefreshCw className="spinner" size={20} /> Carregando área de revisão…</div>}
    {!status.isLoading && !reportsView && <section className="admin-grid"><div className="admin-card admin-highlight"><div><p>Atualização automática</p><h2>Duas vezes ao dia</h2><span>O sistema preserva a última base válida se a fonte oficial estiver indisponível.</span></div><button type="button" onClick={() => sync.mutate()} disabled={sync.isPending}>{sync.isPending ? "Sincronizando…" : <><RefreshCw size={16} /> Atualizar agora</>}</button></div><div className="admin-card"><h2>Histórico recente</h2><div className="sync-list">{status.data?.runs.length ? status.data.runs.map((run) => <div className="sync-row" key={run.id}><span className={run.status === "succeeded" ? "sync-status success" : run.status === "failed" ? "sync-status failed" : "sync-status"}>{run.status === "succeeded" ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}{run.status === "succeeded" ? "Concluída" : run.status === "failed" ? "Falhou" : "Em andamento"}</span><div><strong>{run.eligibleCount.toLocaleString("pt-BR")} candidaturas aptas</strong><small>{formatDate(run.completedAt ?? run.createdAt)}</small></div></div>) : <p className="admin-empty">A primeira sincronização automática será registrada aqui após a publicação.</p>}</div></div></section>}
    {!status.isLoading && reportsView && <section className="admin-card reports-card"><div className="admin-card-heading"><div><h2>Fila de revisão</h2><p>Os contatos são opcionais e devem ser usados apenas para retorno sobre o apontamento.</p></div><strong>{status.data?.reports.length ?? 0}</strong></div>{status.data?.reports.length ? <div className="report-list">{status.data.reports.map((report) => <article className="admin-report" key={report.id}><div className="admin-report-main"><p className="report-tag">{report.category}</p><h3>{report.candidateName} <span>{report.candidateNumber ? `· ${report.candidateNumber}` : ""}</span></h3><p className="report-meta">{report.candidateOffice} · {report.candidateUf} · recebido em {formatDate(report.createdAt)}</p><blockquote>{report.message}</blockquote>{report.contactEmail && <small>Contato informado: {report.contactEmail}</small>}</div><div className="report-review"><select value={report.status} onChange={(event) => review.mutate({ id: report.id, status: event.target.value as "new" | "in_review" | "resolved", reviewNote: notes[report.id] ?? report.reviewNote ?? "" })}><option value="new">Novo</option><option value="in_review">Em revisão</option><option value="resolved">Resolvido</option></select><textarea value={notes[report.id] ?? report.reviewNote ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [report.id]: event.target.value }))} placeholder="Nota interna da revisão" /><button type="button" onClick={() => review.mutate({ id: report.id, status: report.status, reviewNote: notes[report.id] ?? report.reviewNote ?? "" })}>Salvar nota</button></div></article>)}</div> : <p className="admin-empty">Ainda não há apontamentos recebidos.</p>}</section>}
  </div></DashboardLayout>;
}
