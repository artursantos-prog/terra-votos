import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ClipboardList, ExternalLink, MessageSquareText, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const issueLabels = {
  nao_esta_concorrendo: "Não está mais concorrendo",
  informacao_incorreta: "Informação incorreta",
} as const;

const statusLabels = {
  pendente: "Pendente",
  verificado: "Verificado",
  resolvido: "Resolvido",
} as const;

export default function OwnerReports() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [pendingDeletion, setPendingDeletion] = useState<{
    kind: "report" | "feedback";
    id: number;
    label: string;
  } | null>(null);
  const reportsQuery = trpc.reports.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const feedbackQuery = trpc.feedback.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const updateStatus = trpc.reports.updateStatus.useMutation({
    onSuccess: () => utils.reports.list.invalidate(),
  });
  const inspectOfficial = trpc.reports.inspectOfficial.useMutation({
    onSuccess: async () => {
      await utils.reports.list.invalidate();
    },
  });
  const deleteReport = trpc.reports.delete.useMutation({
    onSuccess: async () => {
      await utils.reports.list.invalidate();
      setPendingDeletion(null);
    },
  });
  const updateFeedbackStatus = trpc.feedback.updateStatus.useMutation({
    onSuccess: () => utils.feedback.list.invalidate(),
  });
  const deleteFeedback = trpc.feedback.delete.useMutation({
    onSuccess: async () => {
      await utils.feedback.list.invalidate();
      setPendingDeletion(null);
    },
  });

  const confirmDeletion = () => {
    if (!pendingDeletion) return;
    if (pendingDeletion.kind === "report") deleteReport.mutate({ id: pendingDeletion.id });
    else deleteFeedback.mutate({ id: pendingDeletion.id });
  };

  const openOfficialTsePage = (id: number) => {
    const officialTab = window.open("about:blank", "_blank");
    inspectOfficial.mutate({ id }, {
      onSuccess: ({ evidenceUrl }) => {
        if (evidenceUrl) {
          if (officialTab) officialTab.location.replace(evidenceUrl);
          else window.open(evidenceUrl, "_blank", "noopener,noreferrer");
          return;
        }
        officialTab?.close();
        toast.error("Não foi possível localizar a ficha pública do candidato no TSE.");
      },
      onError: () => {
        officialTab?.close();
        toast.error("Não foi possível consultar a ficha oficial do TSE agora.");
      },
    });
  };

  if (loading) {
    return <main className="container py-12"><Skeleton className="h-72 rounded-xl" /></main>;
  }

  if (!user) {
    return (
      <main className="container flex min-h-screen max-w-xl items-center justify-center py-12 text-center">
        <div className="space-y-5 rounded-xl border bg-white p-8 shadow-sm">
          <ShieldCheck className="mx-auto h-8 w-8 text-[#ff5a00]" />
          <h1 className="font-editorial text-2xl font-semibold">Painel do dono</h1>
          <p className="text-muted-foreground">Entre para acessar os reportes recebidos.</p>
          <Button onClick={() => startLogin("/owner/reports")}>Entrar</Button>
        </div>
      </main>
    );
  }

  if (user.role !== "admin") {
    return (
      <main className="container flex min-h-screen max-w-xl items-center justify-center py-12 text-center">
        <div className="space-y-5 rounded-xl border bg-white p-8 shadow-sm">
          <ShieldCheck className="mx-auto h-8 w-8 text-[#ff5a00]" />
          <h1 className="font-editorial text-2xl font-semibold">Acesso restrito</h1>
          <p className="text-muted-foreground">Este painel é exclusivo do dono do buscador.</p>
          <Button asChild variant="outline"><Link href="/">Voltar à busca</Link></Button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="container py-10 md:py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#ff5a00]">Gestão do dono</p>
            <h1 className="font-editorial text-3xl font-bold tracking-[-0.045em] text-[#1f1d1b]">Reportes recebidos</h1>
            <p className="text-[#625b55]">Acompanhe reportes e sugestões. Antes de decidir um reporte eleitoral, consulte a ficha oficial do TSE; somente a situação confirmada nessa fonte pode ser aplicada.</p>
          </div>
          <Button asChild variant="outline"><Link href="/">Ir para a busca</Link></Button>
        </div>

        <div className="overflow-hidden border border-[#e9e4e0] bg-white">
          {reportsQuery.isLoading ? (
            <div className="space-y-3 p-5">{[0, 1, 2].map(index => <Skeleton key={index} className="h-24" />)}</div>
          ) : reportsQuery.data?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-[#faf8f6] text-xs uppercase tracking-[0.08em] text-[#746e68]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Candidato</th>
                    <th className="px-5 py-4 font-semibold">Problema</th>
                    <th className="px-5 py-4 font-semibold">Descrição</th>
                    <th className="px-5 py-4 font-semibold">Evidência oficial</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eee9e5]">
                  {reportsQuery.data.map(report => (
                    <tr key={report.id} className="align-top">
                      <td className="px-5 py-4 font-medium text-[#1f1d1b]">{report.candidateName}</td>
                      <td className="px-5 py-4 text-[#625b55]">{issueLabels[report.issueType]}</td>
                      <td className="max-w-sm px-5 py-4 leading-6 text-muted-foreground">{report.description || "Sem descrição."}</td>
                      <td className="min-w-56 px-5 py-4 text-xs leading-5 text-[#625b55]">
                        {report.officialEvidenceCheckedAt ? (
                          <div className="space-y-1.5">
                            <p><span className="font-semibold text-[#1f1d1b]">Situação TSE:</span> {report.officialEvidenceStatus || "Não informada"}</p>
                            {report.officialEvidenceUrl ? <a href={report.officialEvidenceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#b63f00] underline underline-offset-2">Abrir ficha oficial <ExternalLink className="h-3 w-3" /></a> : null}
                          </div>
                        ) : <span className="text-muted-foreground">Ainda não consultada.</span>}
                      </td>
                      <td className="px-5 py-4"><span className="rounded-full bg-[#fff0e7] px-2.5 py-1 text-xs font-semibold text-[#b63f00]">{statusLabels[report.status]}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => openOfficialTsePage(report.id)} disabled={inspectOfficial.isPending}>Consultar TSE</Button>
                          {report.status !== "resolvido" ? (
                            <Button size="sm" onClick={() => updateStatus.mutate({ id: report.id, status: "resolvido" })} disabled={updateStatus.isPending} className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Resolver</Button>
                          ) : null}
                          <Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setPendingDeletion({ kind: "report", id: report.id, label: `o reporte de ${report.candidateName}` })}><Trash2 className="h-3.5 w-3.5" />Excluir</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <ClipboardList className="h-8 w-8 text-[#ff5a00]" />
              <p className="font-editorial font-semibold text-[#3d3833]">Nenhum reporte recebido.</p>
            </div>
          )}
        </div>

        <section className="mt-8">
          <div className="mb-3"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#ff5a00]">Sugestões</p><h2 className="font-editorial text-2xl font-semibold">Comentários recebidos</h2></div>
          <div className="overflow-hidden border border-[#e9e4e0] bg-white">
            {feedbackQuery.isLoading ? (
              <div className="space-y-3 p-5">{[0, 1].map(index => <Skeleton key={index} className="h-20" />)}</div>
            ) : feedbackQuery.data?.length ? (
              <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#faf8f6] text-xs uppercase tracking-[0.08em] text-[#746e68]"><tr><th className="px-5 py-4 font-semibold">Comentário</th><th className="px-5 py-4 font-semibold">Contato</th><th className="px-5 py-4 font-semibold">Status</th><th className="px-5 py-4 font-semibold">Ações</th></tr></thead><tbody className="divide-y divide-[#eee9e5]">{feedbackQuery.data.map(feedback => <tr key={feedback.id} className="align-top"><td className="max-w-xl px-5 py-4 leading-6 text-[#625b55]">{feedback.message}</td><td className="px-5 py-4 text-muted-foreground">{feedback.contactEmail || "Não informado"}</td><td className="px-5 py-4"><span className="rounded-full bg-[#fff0e7] px-2.5 py-1 text-xs font-semibold text-[#b63f00]">{statusLabels[feedback.status]}</span></td><td className="px-5 py-4"><div className="flex flex-wrap gap-2">{feedback.status !== "resolvido" ? <Button size="sm" onClick={() => updateFeedbackStatus.mutate({ id: feedback.id, status: "resolvido" })} disabled={updateFeedbackStatus.isPending}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Resolver</Button> : null}<Button size="sm" variant="ghost" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setPendingDeletion({ kind: "feedback", id: feedback.id, label: "esta sugestão" })}><Trash2 className="h-3.5 w-3.5" />Excluir</Button></div></td></tr>)}</tbody></table></div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center"><MessageSquareText className="h-8 w-8 text-[#ff5a00]" /><p className="font-editorial font-semibold text-[#3d3833]">Nenhum comentário recebido.</p></div>
            )}
          </div>
        </section>
      </main>
      <AlertDialog open={Boolean(pendingDeletion)} onOpenChange={open => { if (!open) setPendingDeletion(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação remove permanentemente {pendingDeletion?.label ?? "o item"} do painel. Ela não altera qualquer candidatura, status ou dado oficial do TSE.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletion} className="bg-destructive text-white hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
