import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import { CHEAT_SHEET_GROUPS, getCheatSheetGroup, getSelectionsInGroup } from "@/lib/cheatSheet";
import { orderElectionOffices } from "@/lib/electionOffices";
import { getElectionSyncDegradationNotice } from "@/lib/electionSyncState";
import { buildCheatSheetShareText, createCheatSheetShareImage, downloadCheatSheetImage } from "@/lib/cheatSheetSharing";
import { trpc } from "@/lib/trpc";
import type { Candidate } from "../../../drizzle/schema";
import { Instagram, MessageCircle, Printer, Search, Share2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AppHeader from "./AppHeader";
import AppFooter from "./AppFooter";
import CandidateCard from "./CandidateCard";
import CandidateDetailsDialog from "./CandidateDetailsDialog";

type CandidateSearchProps = {
  category: "em_disputa" | "fora_da_disputa";
  embedded?: boolean;
};

const copy = {
  em_disputa: {
    eyebrow: "Acompanhamento eleitoral",
    title: "Candidatos em disputa",
    description: "Consulte as candidaturas classificadas como em disputa na última sincronização oficial.",
    empty: "Nenhuma candidatura em disputa foi sincronizada ainda.",
  },
  fora_da_disputa: {
    eyebrow: "Acompanhamento eleitoral",
    title: "Fora da disputa",
    description: "Candidaturas com situação terminal oficial: Indeferido, Renúncia, Cassado, Cancelado, Falecido ou Pedido não conhecido.",
    empty: "Nenhuma candidatura com situação terminal foi sincronizada ainda.",
  },
} as const;

type CandidateWithTicketMembers = Candidate & {
  ticketMembers?: Array<{
    sqCandidate: string;
    ballotName: string;
    office: string;
    partyAcronym: string | null;
  }>;
  replacementCandidate?: {
    sqCandidate: string;
    ballotName: string;
    office: string;
    candidateNumber: string | null;
    partyAcronym: string | null;
  } | null;
};

const TOTAL_CHEAT_SHEET_CAPACITY = CHEAT_SHEET_GROUPS.reduce((total, group) => total + group.capacity, 0);

export default function CandidateSearch({ category, embedded = false }: CandidateSearchProps) {
  const [query, setQuery] = useState("");
  const [uf, setUf] = useState("");
  const [office, setOffice] = useState("");
  const [party, setParty] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCandidates, setSelectedCandidates] = useState<CandidateWithTicketMembers[]>([]);
  const [detailCandidateSq, setDetailCandidateSq] = useState<string | null>(null);
  const [candidatePendingReplacement, setCandidatePendingReplacement] = useState<CandidateWithTicketMembers | null>(null);
  const [candidateToReplaceSq, setCandidateToReplaceSq] = useState<string | null>(null);
  const [isSharingCheatSheet, setIsSharingCheatSheet] = useState(false);
  const text = copy[category];
  const filters = useMemo(() => ({
    category,
    query: query.trim() || undefined,
    uf: uf || undefined,
    office: office || undefined,
    party: party || undefined,
    page,
  }), [category, office, page, party, query, uf]);
  const candidatesQuery = trpc.candidates.list.useQuery(filters, { refetchInterval: embedded ? 60_000 : false });
  const optionsQuery = trpc.candidates.filterOptions.useQuery({ category }, { refetchInterval: embedded ? 60_000 : false });
  const statsQuery = trpc.candidates.stats.useQuery(undefined, { refetchInterval: embedded ? 60_000 : false });
  const categoryTotal = category === "em_disputa" ? statsQuery.data?.emDisputa : statsQuery.data?.foraDaDisputa;
  const syncDegradationNotice = getElectionSyncDegradationNotice(statsQuery.data?.lastSuccessfulSyncAt, statsQuery.data?.lastSyncFailedAt);
  const pendingGroup = candidatePendingReplacement ? getCheatSheetGroup(candidatePendingReplacement.office) : undefined;
  const candidatesPendingReplacement = candidatePendingReplacement ? getSelectionsInGroup(selectedCandidates, candidatePendingReplacement.office) : [];

  useEffect(() => {
    if (!embedded) return;
    const reportHeight = () => window.parent.postMessage({ type: "eleicoes-no-terra:resize", height: document.documentElement.scrollHeight }, "*");
    const observer = new ResizeObserver(reportHeight);
    observer.observe(document.documentElement);
    reportHeight();
    return () => observer.disconnect();
  }, [embedded]);

  function toggleCandidate(candidate: CandidateWithTicketMembers) {
    if (selectedCandidates.some(item => item.sqCandidate === candidate.sqCandidate)) {
      setSelectedCandidates(previous => previous.filter(item => item.sqCandidate !== candidate.sqCandidate));
      return;
    }
    const group = getCheatSheetGroup(candidate.office);
    if (!group) {
      toast.error("Este cargo não recebe voto direto e não pode entrar na colinha.");
      return;
    }
    const selectionsInGroup = getSelectionsInGroup(selectedCandidates, candidate.office);
    if (selectionsInGroup.length < group.capacity) {
      setSelectedCandidates(previous => [...previous, candidate]);
      return;
    }
    setCandidatePendingReplacement(candidate);
    setCandidateToReplaceSq(selectionsInGroup[0]?.sqCandidate ?? null);
  }

  function confirmReplacement() {
    if (!candidatePendingReplacement || !candidateToReplaceSq) return;
    setSelectedCandidates(previous => [
      ...previous.filter(candidate => candidate.sqCandidate !== candidateToReplaceSq),
      candidatePendingReplacement,
    ]);
    toast.success("A colinha foi atualizada com a nova escolha.");
    setCandidatePendingReplacement(null);
    setCandidateToReplaceSq(null);
  }

  async function getCheatSheetImage() {
    return createCheatSheetShareImage(selectedCandidates);
  }

  function openWhatsApp() {
    const text = buildCheatSheetShareText(selectedCandidates, window.location.href);
    const message = encodeURIComponent(text);
    window.location.assign(`whatsapp://send?text=${message}`);
    window.setTimeout(() => {
      if (!document.hidden) window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
    }, 700);
  }

  async function openInstagram() {
    setIsSharingCheatSheet(true);
    try {
      downloadCheatSheetImage(await getCheatSheetImage());
      window.location.assign("instagram://app");
      window.setTimeout(() => {
        if (!document.hidden) window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      }, 700);
      toast.success("A imagem da colinha foi preparada e o Instagram foi aberto.");
    } catch {
      toast.error("Não foi possível preparar a imagem para o Instagram.");
    } finally {
      setIsSharingCheatSheet(false);
    }
  }

  return (
    <>
    <div className="screen-only min-h-screen bg-white text-foreground">
      {embedded ? <header className="border-b border-[#e9e4e0] bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6"><a href="/embed" className="font-editorial text-base font-semibold text-[#1f1d1b]">eleições <span className="text-[#ff5a00]">no Terra</span></a><nav aria-label="Navegação do buscador incorporado" className="flex gap-4 text-xs font-extrabold text-[#625b55]"><a href="/embed" className={category === "em_disputa" ? "text-[#b63f00] underline decoration-[#ff5a00] underline-offset-8" : "hover:text-[#b63f00]"}>Em disputa</a><a href="/embed/fora-da-disputa" className={category === "fora_da_disputa" ? "text-[#b63f00] underline decoration-[#ff5a00] underline-offset-8" : "hover:text-[#b63f00]"}>Fora da disputa</a></nav></div></header> : <AppHeader />}
      <main className={embedded ? "mx-auto max-w-7xl px-4 py-5 sm:px-6 md:py-7" : "container py-5 md:py-7"}>
        <section className="relative overflow-hidden border border-[#eee1d8] bg-[#fff8f3] px-6 py-7 md:px-8">
          <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-[#ff5a00]/15 blur-2xl" />
          <div className="absolute right-0 top-0 h-full w-2/5 bg-[radial-gradient(circle_at_top_right,_rgba(255,90,0,0.34),_transparent_64%)]" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div className="space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#ff5a00]">Eleições 2026</p>
              <h1 className="font-editorial text-3xl font-bold tracking-[-0.045em] text-[#1f1d1b] md:text-4xl">{category === "em_disputa" ? "Buscador de candidatos" : text.title}</h1>
              <p className="max-w-2xl text-sm leading-6 text-[#625b55]">{category === "em_disputa" ? "Conheça as candidaturas registradas e faça sua colinha eleitoral." : text.description}</p>
            </div>
            <div className="relative min-w-32 border-l border-[#ff5a00]/30 pl-5 text-right"><p className="text-3xl font-extrabold tracking-[-0.06em] text-[#ff5a00]">{categoryTotal?.toLocaleString("pt-BR") ?? "—"}</p><p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#746e68]">candidaturas votadas</p><p className="mt-2 max-w-48 text-[10px] leading-4 text-[#746e68]">Atualização diária às 9h.</p></div>
          </div>
        </section>

        {syncDegradationNotice ? <aside className="mt-4 border border-[#edcfbe] bg-[#fff9f4] px-4 py-3 text-sm leading-6 text-[#7a4326]" role="status">{syncDegradationNotice}</aside> : null}

        <section aria-label="Busca e filtros" className="mt-5 border border-[#e9e4e0] bg-white p-4">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#ff5a00]">Busca personalizada</p><h2 className="font-editorial text-xl font-semibold">Encontre quem você procura</h2></div><p className="text-xs text-[#746e68]">{category === "fora_da_disputa" ? "Situações terminais" : "Candidaturas em disputa"}</p></div>
          <div className="grid gap-3 md:grid-cols-[1.45fr_1fr_1fr_1fr]">
            <label className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#746e68]">Buscar</span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718075]" />
                <Input
                  value={query}
                  onChange={event => { setQuery(event.target.value); setPage(1); }}
                  placeholder="Buscar por nome"
                  className="h-11 rounded-none border-[#ded8d3] pl-10 text-[11px] focus-visible:ring-[#ff5a00]/25"
                />
              </div>
            </label>
            <FilterSelect label="Estado" value={uf} onChange={value => { setUf(value); setPage(1); }} options={optionsQuery.data?.ufs ?? []} />
            <FilterSelect label="Cargo" value={office} onChange={value => { setOffice(value); setPage(1); }} options={orderElectionOffices(optionsQuery.data?.offices ?? [])} />
            <FilterSelect label="Partido" value={party} onChange={value => { setParty(value); setPage(1); }} options={optionsQuery.data?.parties ?? []} />
          </div>
        </section>

        <section aria-labelledby="informacoes-eleicao" className="mt-4 border border-[#e9e4e0] bg-[#fffdfa] p-4 md:p-5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#ff5a00]">Eleições 2026</p>
          <h2 id="informacoes-eleicao" className="mt-1 font-editorial text-xl font-semibold">Como funcionam os turnos</h2>
          <p className="mt-2 text-sm leading-6 text-[#625b55]">As eleições são realizadas em 2 turnos, das 8h às 17h em todo o Brasil, seguindo o horário de Brasília (DF).</p>
          <ul className="mt-3 grid gap-3 text-sm leading-6 text-[#4c4641] md:grid-cols-2">
            <li className="border-l-2 border-[#ff5a00] pl-3"><strong>1º turno, em 4 de outubro:</strong> vota-se para presidente e vice-presidente da República, governador e vice-governador, senador, deputado federal e deputado estadual ou distrital.</li>
            <li className="border-l-2 border-[#ff5a00] pl-3"><strong>2º turno, em 26 de outubro:</strong> vota-se, caso haja necessidade, para os cargos do Executivo, como presidente e governador.</li>
          </ul>
        </section>

        <section aria-label="Minha colinha" className="mt-4 border border-[#e9e4e0] bg-[#fffdfa] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#ff5a00]">Minha colinha</p><h2 className="font-editorial text-xl font-semibold">{selectedCandidates.length} de {TOTAL_CHEAT_SHEET_CAPACITY} escolhas preenchidas</h2><p className="mt-1 text-xs leading-5 text-[#746e68]">A colinha respeita as vagas de cada cargo. Ao atingir um limite, escolha qual perfil deseja substituir.</p></div>{selectedCandidates.length ? <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2"><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 text-xs font-extrabold text-[#b63f00] underline underline-offset-4"><Printer className="h-3.5 w-3.5" />Imprimir colinha</button><DropdownMenu><DropdownMenuTrigger asChild><button type="button" disabled={isSharingCheatSheet} className="inline-flex items-center gap-2 text-xs font-extrabold text-[#b63f00] underline underline-offset-4 disabled:opacity-50"><Share2 className="h-3.5 w-3.5" />{isSharingCheatSheet ? "Preparando…" : "Compartilhar"}</button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52 rounded-none border-[#ded8d3] bg-white p-1 text-[#4c4641]"><DropdownMenuItem onSelect={openWhatsApp} className="cursor-pointer gap-2 py-2.5 text-sm font-semibold"><MessageCircle className="h-4 w-4 text-[#25d366]" />WhatsApp</DropdownMenuItem><DropdownMenuItem onSelect={openInstagram} className="cursor-pointer gap-2 py-2.5 text-sm font-semibold"><Instagram className="h-4 w-4 text-[#d9467a]" />Instagram</DropdownMenuItem></DropdownMenuContent></DropdownMenu><button type="button" onClick={() => setSelectedCandidates([])} className="text-xs font-extrabold text-[#b63f00] underline underline-offset-4">Limpar</button></div> : null}</div>
          {selectedCandidates.length ? <p className="mt-3 text-xs leading-5 text-[#746e68]">Escolha WhatsApp para abrir a conversa ou Instagram para abrir o aplicativo com a imagem da colinha já preparada.</p> : null}
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {CHEAT_SHEET_GROUPS.map(group => <div key={group.key} className="border border-[#e8e0da] bg-white px-3 py-2"><p className="text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#746e68]">{group.label}</p><p className="mt-1 text-xs font-semibold text-[#4c4641]">{getSelectionsInGroup(selectedCandidates, group.offices[0]).length} de {group.capacity} {group.capacity === 1 ? "vaga" : "vagas"}</p></div>)}
          </div>
          {selectedCandidates.length ? <div className="mt-3 flex flex-wrap gap-2">{selectedCandidates.map(candidate => <div key={candidate.sqCandidate} className="flex items-center gap-2 border border-[#ded8d3] bg-white px-3 py-2 text-xs"><span className="font-semibold text-[#2d2926]">{candidate.ballotName}</span><span className="font-extrabold text-[#ff5a00]">{candidate.candidateNumber || "—"}</span><button type="button" aria-label={`Remover ${candidate.ballotName} da colinha`} onClick={() => toggleCandidate(candidate)} className="text-[#8a817a] hover:text-[#b63f00]"><X className="h-3.5 w-3.5" /></button></div>)}</div> : <p className="mt-2 text-sm text-[#746e68]">Selecione candidatos nos cards para montar sua colinha.</p>}
        </section>

        <section className="mt-7" aria-live="polite">
          {candidatesQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map(index => <Skeleton key={index} className="h-[300px] rounded-none" />)}
            </div>
          ) : candidatesQuery.isError ? (
            <div className="border border-[#f1d5d3] bg-[#fff8f7] p-5 text-[#9b342d]">Não foi possível carregar as candidaturas agora.</div>
          ) : candidatesQuery.data?.items.length ? (
            <>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#ff5a00]">Resultados da busca</p><h2 className="font-editorial text-xl font-semibold">{candidatesQuery.data.total.toLocaleString("pt-BR")} candidatura(s)</h2></div><p className="text-xs text-[#746e68]">Exibindo {((candidatesQuery.data.page - 1) * candidatesQuery.data.pageSize) + 1}–{Math.min(candidatesQuery.data.page * candidatesQuery.data.pageSize, candidatesQuery.data.total)} de {candidatesQuery.data.total.toLocaleString("pt-BR")}</p></div>
              <div className="grid gap-4 md:grid-cols-4">
                {candidatesQuery.data.items.map(candidate => <CandidateCard key={candidate.id} candidate={candidate} selected={selectedCandidates.some(item => item.sqCandidate === candidate.sqCandidate)} selectionEligible={category === "em_disputa" && Boolean(getCheatSheetGroup(candidate.office))} selectionUnavailableLabel={category === "fora_da_disputa" ? "Fora da disputa" : "Cargo não votado"} onToggleSelection={() => toggleCandidate(candidate)} onOpenDetails={() => setDetailCandidateSq(candidate.sqCandidate)} onOpenReplacement={candidate.replacementCandidate ? () => setDetailCandidateSq(candidate.replacementCandidate!.sqCandidate) : undefined} />)}
              </div>
              {candidatesQuery.data.pageCount > 1 ? <nav aria-label="Paginação de candidaturas" className="mt-6 flex flex-wrap items-center justify-start gap-4 border-t border-[#e9e4e0] pt-5"><button type="button" onClick={() => setPage(candidatesQuery.data!.page - 1)} disabled={candidatesQuery.data.page <= 1} className="border border-[#ded8d3] bg-white px-5 py-2 text-xs font-extrabold text-[#4c4641] transition hover:border-[#ff5a00] hover:text-[#b63f00] disabled:cursor-not-allowed disabled:opacity-40">Anterior</button><p className="text-xs text-[#625b55]">Página <strong>{candidatesQuery.data.page}</strong> de <strong>{candidatesQuery.data.pageCount}</strong></p><button type="button" onClick={() => setPage(candidatesQuery.data!.page + 1)} disabled={candidatesQuery.data.page >= candidatesQuery.data.pageCount} className="border border-[#ded8d3] bg-white px-5 py-2 text-xs font-extrabold text-[#4c4641] transition hover:border-[#ff5a00] hover:text-[#b63f00] disabled:cursor-not-allowed disabled:opacity-40">Próxima</button></nav> : null}
            </>
          ) : (
            <div className="border border-dashed border-[#d8d1ca] bg-[#fcfbfa] px-6 py-12 text-center">
              <p className="font-editorial font-semibold text-[#3d3833]">{text.empty}</p>
              <p className="mt-2 text-sm text-muted-foreground">Os dados serão exibidos quando a sincronização oficial disponibilizar registros para esta área.</p>
            </div>
          )}
        </section>
      </main>
      {embedded ? <footer className="border-t border-[#e9e4e0] px-4 py-5 text-center text-xs text-[#746e68]">Dados oficiais do Tribunal Superior Eleitoral. Esta visualização é atualizada automaticamente após cada sincronização publicada.</footer> : <AppFooter />}
      <CandidateDetailsDialog sqCandidate={detailCandidateSq} open={Boolean(detailCandidateSq)} onOpenChange={open => { if (!open) setDetailCandidateSq(null); }} />
      <AlertDialog open={Boolean(candidatePendingReplacement)} onOpenChange={open => { if (!open) { setCandidatePendingReplacement(null); setCandidateToReplaceSq(null); } }}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-lg rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Limite de {pendingGroup?.label.toLowerCase()} atingido</AlertDialogTitle>
            <AlertDialogDescription>Você já preencheu {pendingGroup?.capacity} {pendingGroup?.capacity === 1 ? "vaga" : "vagas"} para este cargo. Escolha qual perfil deve sair da colinha para incluir <strong>{candidatePendingReplacement?.ballotName}</strong>.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            {candidatesPendingReplacement.map(candidate => <button key={candidate.sqCandidate} type="button" onClick={() => setCandidateToReplaceSq(candidate.sqCandidate)} className={`w-full border px-3 py-3 text-left text-sm transition ${candidateToReplaceSq === candidate.sqCandidate ? "border-[#ff5a00] bg-[#fff0e7] text-[#8f3100]" : "border-[#ded8d3] bg-white text-[#4c4641]"}`}><strong>{candidate.ballotName}</strong><span className="ml-2 text-xs">{candidate.candidateNumber || "—"} · {candidate.partyAcronym || "Partido não informado"}</span></button>)}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter escolhas</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReplacement} disabled={!candidateToReplaceSq}>Substituir na colinha</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    <PrintableCheatSheet candidates={selectedCandidates} />
    </>
  );
}

function PrintableCheatSheet({ candidates }: { candidates: CandidateWithTicketMembers[] }) {
  const selections = CHEAT_SHEET_GROUPS.map(group => ({
    ...group,
    candidates: getSelectionsInGroup(candidates, group.offices[0]),
  }));
  return (
    <section className="print-only print-colinha" aria-label="Colinha eleitoral para impressão">
      <div className="print-colinha__header"><p>Eleições no Terra</p><h1>Leve a colinha para não errar<br />na hora do voto</h1><span>Preencha os números dos perfis que você selecionou.</span></div>
      <div className="print-colinha__body">
        {selections.map(group => {
          return <article key={group.key} className="print-colinha__office">
            <h2>{group.label}</h2>
            <div className="print-colinha__slots">
              {Array.from({ length: group.capacity }, (_, slotIndex) => {
                const candidate = group.candidates[slotIndex] ?? null;
                const number = candidate?.candidateNumber?.replace(/\D/g, "") ?? "";
                return <div key={slotIndex} className="print-colinha__slot">
                  {group.capacity > 1 ? <h3>{slotIndex + 1}ª vaga</h3> : null}
                  <div className="print-colinha__digits" aria-label={candidate ? `Número de ${candidate.ballotName}: ${candidate.candidateNumber}` : `Espaço para número de ${group.label}`}>
                    {Array.from({ length: group.digits }, (_, index) => <span key={index}>{number[index] ?? ""}</span>)}
                  </div>
                  {candidate ? <div className="print-colinha__candidate"><strong>{candidate.ballotName}</strong><small>{candidate.partyAcronym ? `Partido: ${candidate.partyAcronym}` : "Partido não informado"}</small></div> : <p className="print-colinha__empty">Não selecionado</p>}
                </div>;
              })}
            </div>
          </article>;
        })}
      </div>
      <p className="print-colinha__note">Confira as candidaturas e os números no seu local de votação. Esta colinha é apenas um apoio pessoal.</p>
    </section>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#746e68]">{label}</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-11 w-full rounded-none border border-[#ded8d3] bg-white px-3 text-sm outline-none transition focus:border-[#ff5a00] focus:ring-2 focus:ring-[#ff5a00]/15"
      >
        <option value="">Todos</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
