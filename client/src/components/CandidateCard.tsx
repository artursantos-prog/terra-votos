import type { Candidate } from "../../../drizzle/schema";
import { ArrowUpRight, BookmarkPlus, Check, ImageOff, Info } from "lucide-react";
import { useState } from "react";
import { isOfficialTsePhotoPlaceholder } from "@/lib/tsePhoto";
import { formatCandidateOfficialStatus } from "@/lib/candidateStatus";
import { formatCandidateParty, getCandidateDisplayName } from "@/lib/candidatePresentation";
import { getTicketHeading } from "@/lib/ticketPresentation";
import ReportDialog from "./ReportDialog";

type CandidateCardProps = {
  candidate: Candidate & {
    ticketMembers?: Array<{ ballotName: string; office: string; partyAcronym: string | null }>;
    replacementCandidate?: { sqCandidate: string; ballotName: string; office: string; candidateNumber: string | null; partyAcronym: string | null } | null;
  };
  selected: boolean;
  selectionEligible?: boolean;
  selectionUnavailableLabel?: string;
  onToggleSelection: () => void;
  onOpenDetails: () => void;
  onOpenReplacement?: () => void;
};

/** O endpoint oficial do TSE usa esta silhueta institucional quando não há retrato cadastrado. */
export default function CandidateCard({ candidate, selected, selectionEligible = true, selectionUnavailableLabel = "Cargo não votado", onToggleSelection, onOpenDetails, onOpenReplacement }: CandidateCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasPhoto = Boolean(candidate.photoUrl && !imageFailed);
  const displayName = getCandidateDisplayName(candidate.ballotName, candidate.candidateName);

  return (
    <article className="group flex min-h-[430px] flex-col border border-[#e7e1dc] bg-white p-4 transition-shadow duration-200 hover:shadow-[0_12px_28px_rgba(44,31,20,0.09)]">
      <div className="h-1 w-full bg-[#ff5a00]" />

      <div className="mt-4 flex items-center justify-between gap-3 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#746e68]">
        <span>{candidate.uf ? `UF / ${candidate.uf}` : "UF não informada"}</span>
        <span className="text-right">{candidate.office}</span>
      </div>

      <div className="relative mt-4 min-h-[152px] pr-[104px]">
        <div>
          <h2 className="font-editorial text-[23px] font-semibold uppercase leading-[0.95] tracking-[-0.035em] text-[#211f1d]">
            {displayName}
          </h2>
          <p className="mt-3 text-sm font-bold uppercase tracking-[-0.015em] text-[#625b55]">
            {formatCandidateParty(candidate.partyAcronym, candidate.partyName)}
          </p>
        </div>

        <div className="absolute right-0 top-0 w-[92px] border border-[#ded8d3] bg-[#faf8f6]">
          <p className="border-b border-[#ded8d3] py-0.5 text-center text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#a09891]">Foto</p>
          <div className="aspect-[3/4] overflow-hidden bg-[#f4f1ee]">
            {hasPhoto ? (
              <img
                src={candidate.photoUrl ?? ""}
                alt={`Foto oficial de ${displayName}`}
                className="h-full w-full object-contain object-center"
                onLoad={(event) => {
                  const image = event.currentTarget;
                  if (isOfficialTsePhotoPlaceholder(image.naturalWidth, image.naturalHeight)) {
                    setImageFailed(true);
                  }
                }}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1.5 px-2 text-center text-[#8a817a]">
                <ImageOff className="h-5 w-5" aria-hidden="true" />
                <span className="text-[8px] leading-tight">Foto não disponível neste registro</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {candidate.ticketMembers?.length ? (
        <div className="min-h-[40px] border-b border-[#eee9e5] pb-4 text-[11px] leading-4 text-[#786f68]">
          <p><strong className="font-extrabold text-[#4c4641]">{getTicketHeading(candidate.office)}:</strong> {candidate.ticketMembers.map(member => member.ballotName).join(" · ")}</p>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-b border-[#eee9e5] py-3">
        <span className={candidate.category === "fora_da_disputa" ? "text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#b63f00]" : "text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#9a5a2b]"}>
          {formatCandidateOfficialStatus(candidate.officialStatus)}
        </span>
        <button
          type="button"
          onClick={onOpenDetails}
          className="inline-flex min-h-7 items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#6a615b] transition hover:text-[#b63f00]"
        >
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          Informações
        </button>
      </div>

      {candidate.replacementCandidate && onOpenReplacement ? <button type="button" onClick={onOpenReplacement} className="flex items-center justify-between gap-2 border-b border-[#eee9e5] py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.03em] text-[#b63f00] transition hover:text-[#8f3100]"><span>Ver nova candidatura</span><ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></button> : null}

      <div className="flex items-end justify-between gap-3 border-b border-[#eee9e5] py-4">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#8a817a]">Número</p>
          <p className="mt-0.5 font-editorial text-4xl font-bold leading-none tracking-[-0.06em] text-[#ff5a00]">{candidate.candidateNumber || "—"}</p>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
        <button
          type="button"
          onClick={onToggleSelection}
          disabled={!selectionEligible}
          title={!selectionEligible ? "Este cargo não recebe voto direto." : undefined}
          className={`flex min-h-9 items-center justify-center gap-1.5 border px-2 text-[9px] font-extrabold uppercase tracking-[0.02em] transition ${selected ? "border-[#2d6a4f] bg-[#eaf5ee] text-[#1c553d]" : selectionEligible ? "border-[#ff5a00] text-[#b63f00] hover:bg-[#fff0e7]" : "cursor-not-allowed border-[#ded8d3] bg-[#f6f3f1] text-[#918882]"}`}
        >
          {selected ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />}
          {selected ? "Na colinha" : selectionEligible ? "Adicionar à colinha" : selectionUnavailableLabel}
        </button>
        <ReportDialog sqCandidate={candidate.sqCandidate} candidateName={candidate.candidateName} candidateCategory={candidate.category} />
      </div>
    </article>
  );
}
