import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import { useState } from "react";

export default function MethodologyDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button type="button" onClick={() => setOpen(true)} className="font-bold text-[#b63f00] underline underline-offset-4">Ver metodologia e fontes</button>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-none border-[#e9e4e0]">
        <DialogHeader><DialogTitle className="flex items-center gap-2 font-editorial text-3xl"><FileText className="h-5 w-5 text-[#ff5a00]" />Metodologia e fontes</DialogTitle><DialogDescription>Como o buscador organiza as informações oficiais.</DialogDescription></DialogHeader>
        <div className="space-y-5 text-sm leading-7 text-[#4c4641]">
          <p>O buscador utiliza exclusivamente a base de dados oficial do Tribunal Superior Eleitoral (TSE). Nenhuma informação de candidatura, perfil social, foto ou plano de governo é obtida de outras fontes.</p>
          <p>Na sincronização, uma candidatura vai para <strong>Fora da disputa</strong> apenas quando a situação oficial é Indeferido, Renúncia, Cassado, Cancelado, Falecido ou Pedido não conhecido. Os demais registros permanecem na busca principal.</p>
          <p>Planos de governo e redes sociais só aparecem quando houver registro correspondente na base oficial do TSE sincronizada pelo buscador.</p>
          <p>A atualização diária está ativa às <strong>9h, no horário de Brasília</strong>. Após cada execução, o responsável recebe um alerta por e-mail com o resultado.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
