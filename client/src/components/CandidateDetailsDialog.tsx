import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { isOfficialTsePhotoPlaceholder } from "@/lib/tsePhoto";
import { candidateStatusExplanation, formatCandidateOfficialStatus } from "@/lib/candidateStatus";
import { getTicketHeading, getTicketMemberRole } from "@/lib/ticketPresentation";
import { ExternalLink, FileText, ImageOff, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

type CandidateDetailsDialogProps = {
  sqCandidate: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const VISIBLE_SOCIAL_NETWORKS = new Set(["X", "Instagram", "Facebook", "TikTok", "YouTube"]);

export default function CandidateDetailsDialog({ sqCandidate, open, onOpenChange }: CandidateDetailsDialogProps) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [open, sqCandidate]);
  const detailQuery = trpc.candidates.details.useQuery(
    { sqCandidate: sqCandidate ?? "" },
    { enabled: open && Boolean(sqCandidate) },
  );
  const detail = detailQuery.data;
  const officialSupplementQuery = trpc.candidates.officialSupplement.useQuery(
    { sqCandidate: sqCandidate ?? "" },
    { enabled: open && Boolean(sqCandidate) },
  );
  const officialSupplement = officialSupplementQuery.data;
  const socialProfiles = (detail?.socialProfiles.length ? detail.socialProfiles : (officialSupplement?.socialProfiles ?? []))
    .filter(profile => VISIBLE_SOCIAL_NETWORKS.has(profile.label));
  const proposalUrl = detail?.governmentPlan?.officialUrl ?? officialSupplement?.governmentProposalUrl ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-4xl overflow-x-hidden overflow-y-auto rounded-none border-[#e9e4e0] p-0">
        <DialogHeader className={detail ? "border-b border-[#eee7e1] px-5 py-4 text-left sm:px-6" : "sr-only"}>
          {detail ? <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#ff5a00]">Informações do candidato</p> : null}
          <DialogTitle className={detail ? "font-editorial text-3xl leading-tight text-[#1f1d1b]" : undefined}>{detail?.candidate.ballotName ?? "Informações da candidatura"}</DialogTitle>
          <DialogDescription className={detail ? "text-sm text-[#746e68]" : undefined}>{detail?.candidate.candidateName ?? "Detalhes oficiais da candidatura selecionada."}</DialogDescription>
        </DialogHeader>
        {detailQuery.isLoading ? (
          <div className="space-y-5 p-6"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-44 w-full" /><Skeleton className="h-28 w-full" /></div>
        ) : detail ? (
          <>
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[160px_minmax(0,1fr)]">
              <div className="mx-auto aspect-[4/5] w-full max-w-[180px] overflow-hidden bg-[#f7f5f3] lg:mx-0">
                {detail.candidate.photoUrl && !imageFailed ? (
                  <img
                    src={detail.candidate.photoUrl}
                    alt={`Foto oficial de ${detail.candidate.ballotName}`}
                    className="h-full w-full object-contain object-center p-1"
                    onLoad={(event) => {
                      const image = event.currentTarget;
                      if (isOfficialTsePhotoPlaceholder(image.naturalWidth, image.naturalHeight)) {
                        setImageFailed(true);
                      }
                    }}
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-[#8a817a]"><ImageOff className="h-7 w-7" /><span className="px-4 text-center text-xs">Foto não disponibilizada na importação oficial.</span></div>
                )}
              </div>
              <div className="min-w-0 space-y-5">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm sm:grid-cols-4">
                  <div><dt className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#8a817a]">Número</dt><dd className="mt-1 text-2xl font-extrabold text-[#ff5a00]">{detail.candidate.candidateNumber || "—"}</dd></div>
                  <div><dt className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#8a817a]">Cargo</dt><dd className="mt-1 font-semibold text-[#2d2926]">{detail.candidate.office}</dd></div>
                  <div><dt className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#8a817a]">Partido</dt><dd className="mt-1 font-semibold text-[#2d2926]">{detail.candidate.partyAcronym || detail.candidate.partyName || "Não informado"}</dd></div>
                  <div><dt className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#8a817a]">Situação</dt><dd className="mt-1 font-semibold text-[#2d2926]">{formatCandidateOfficialStatus(detail.candidate.officialStatus)}{candidateStatusExplanation(detail.candidate.officialStatus) ? <span className="mt-1 block text-xs font-normal leading-5 text-[#746e68]">{candidateStatusExplanation(detail.candidate.officialStatus)}</span> : null}</dd></div>
                </dl>

                <div className="grid gap-4 border-t border-[#eee7e1] pt-4 lg:grid-cols-2">
                  <section className="min-w-0">
                    <h3 className="flex items-center gap-2 font-editorial text-lg font-semibold text-[#1f1d1b]"><FileText className="h-4 w-4 text-[#ff5a00]" />Plano de governo</h3>
                    {proposalUrl ? (
                      <Button asChild variant="outline" className="mt-3 h-auto w-full justify-between whitespace-normal rounded-none border-[#ff5a00] px-3 py-2.5 text-left text-xs leading-5 text-[#b63f00] hover:bg-[#fff0e7] hover:text-[#b63f00]">
                        <a href={proposalUrl} target="_blank" rel="noreferrer"><span>Abrir documento oficial da proposta</span><ExternalLink className="ml-2 h-4 w-4 shrink-0" /></a>
                      </Button>
                    ) : officialSupplementQuery.isLoading ? <p className="mt-2 text-sm leading-5 text-[#746e68]">Consultando a proposta registrada no TSE.</p> : <p className="mt-2 text-sm leading-5 text-[#746e68]">Nenhum documento de proposta foi disponibilizado pelo TSE para esta candidatura.</p>}
                  </section>

                  {detail.ticketMembers.length ? <section className="min-w-0">
                    <h3 className="font-editorial text-lg font-semibold text-[#1f1d1b]">{getTicketHeading(detail.candidate.office)}</h3>
                    <div className="mt-3 space-y-2">
                      {detail.ticketMembers.map(member => <div key={member.sqCandidate} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border border-[#e9e4e0] bg-[#fffdfa] px-3 py-2 text-sm">
                        <p className="font-semibold text-[#2d2926]">{member.ballotName}</p>
                        <span className="text-xs font-semibold text-[#746e68]">{getTicketMemberRole(detail.candidate.office, member.office)}</span>
                        <span className="text-xs text-[#746e68]">{member.partyAcronym ? `Partido: ${member.partyAcronym}` : "Partido não informado"}</span>
                      </div>)}
                    </div>
                  </section> : null}
                </div>

                <section className="border-t border-[#eee7e1] pt-4">
                  <h3 className="flex items-center gap-2 font-editorial text-lg font-semibold text-[#1f1d1b]"><Share2 className="h-4 w-4 text-[#ff5a00]" />Redes sociais</h3>
                  {socialProfiles.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {socialProfiles.map(profile => (
                        <Button asChild variant="outline" size="sm" key={profile.url} className="rounded-none border-[#ded8d3] text-[#3d3833] hover:border-[#ff5a00] hover:bg-[#fff0e7]">
                          <a href={profile.url} target="_blank" rel="noreferrer">{profile.label}<ExternalLink className="ml-2 h-3.5 w-3.5" /></a>
                        </Button>
                      ))}
                    </div>
                  ) : officialSupplementQuery.isLoading ? <p className="mt-2 text-sm leading-6 text-[#746e68]">Consultando redes sociais informadas no TSE.</p> : <p className="mt-2 text-sm leading-6 text-[#746e68]">Nenhuma rede social foi informada para esta candidatura na base oficial do TSE sincronizada.</p>}
                </section>
              </div>
            </div>
          </>
        ) : <div className="p-7 text-center text-sm text-[#746e68]">Não foi possível localizar essa candidatura.</div>}
      </DialogContent>
    </Dialog>
  );
}
