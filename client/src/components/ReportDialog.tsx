import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { getPrimaryReportIssueLabel, type CandidateReportCategory } from "@shared/reporting";
import { Flag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ReportDialogProps = {
  sqCandidate: string;
  candidateName: string;
  candidateCategory: CandidateReportCategory;
};

export default function ReportDialog({ sqCandidate, candidateName, candidateCategory }: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<"nao_esta_concorrendo" | "informacao_incorreta">("nao_esta_concorrendo");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const reportMutation = trpc.reports.create.useMutation({
    onSuccess: () => {
      toast.success("Reporte enviado para análise do responsável.");
      setDescription("");
      setContactEmail("");
      setOpen(false);
    },
    onError: error => toast.error(error.message || "Não foi possível enviar o reporte."),
  });

  function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    reportMutation.mutate({
      sqCandidate,
      candidateName,
      candidateCategory,
      issueType,
      description: description.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={() => setOpen(true)} variant="outline" size="sm" className="gap-2 border-[#ff5a00] text-[#b63f00] hover:bg-[#fff0e7] hover:text-[#b63f00]">
        <Flag className="h-3.5 w-3.5" />
        Reportar erro
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reportar erro</DialogTitle>
          <DialogDescription>
            Sinalize uma informação sobre <strong>{candidateName}</strong>. O reporte será recebido somente pelo painel do dono.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submitReport} className="space-y-5">
          <RadioGroup value={issueType} onValueChange={value => setIssueType(value as typeof issueType)} className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-border p-3">
              <RadioGroupItem value="nao_esta_concorrendo" id={`nao-concorrendo-${sqCandidate}`} className="mt-0.5" />
              <Label htmlFor={`nao-concorrendo-${sqCandidate}`} className="cursor-pointer leading-5">
                {getPrimaryReportIssueLabel(candidateCategory)}
              </Label>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border p-3">
              <RadioGroupItem value="informacao_incorreta" id={`informacao-incorreta-${sqCandidate}`} className="mt-0.5" />
              <Label htmlFor={`informacao-incorreta-${sqCandidate}`} className="cursor-pointer leading-5">
                Alguma informação está errada
              </Label>
            </div>
          </RadioGroup>
          <div className="space-y-2">
            <Label htmlFor={`descricao-${sqCandidate}`}>Descrição</Label>
            <Textarea
              id={`descricao-${sqCandidate}`}
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Descreva o problema, se desejar."
              maxLength={2000}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`email-${sqCandidate}`}>E-mail para contato (opcional)</Label>
            <Input
              id={`email-${sqCandidate}`}
              type="email"
              value={contactEmail}
              onChange={event => setContactEmail(event.target.value)}
              placeholder="voce@exemplo.com"
            />
          </div>
          <Button type="submit" className="w-full" disabled={reportMutation.isPending}>
            {reportMutation.isPending ? "Enviando..." : "Enviar reporte"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
