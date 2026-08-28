import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const feedbackMutation = trpc.feedback.create.useMutation({
    onSuccess: () => {
      toast.success("Comentário enviado para avaliação.");
      setMessage("");
      setContactEmail("");
      setOpen(false);
    },
    onError: error => toast.error(error.message || "Não foi possível enviar o comentário."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={() => setOpen(true)} variant="outline" size="sm" className="rounded-none border-[#ff5a00] text-[#b63f00] hover:bg-[#fff0e7] hover:text-[#b63f00]"><MessageSquarePlus className="mr-2 h-3.5 w-3.5" />Enviar comentário</Button>
      <DialogContent className="rounded-none border-[#e9e4e0] sm:max-w-lg">
        <DialogHeader><DialogTitle className="font-editorial text-2xl">Comentário ou sugestão</DialogTitle><DialogDescription>Compartilhe sugestões sobre o buscador. Sua mensagem será encaminhada ao responsável para avaliação.</DialogDescription></DialogHeader>
        <form onSubmit={event => { event.preventDefault(); feedbackMutation.mutate({ message: message.trim(), contactEmail: contactEmail.trim() || undefined }); }} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="feedback-message">Comentário</Label><Textarea id="feedback-message" required maxLength={2000} value={message} onChange={event => setMessage(event.target.value)} placeholder="Conte o que poderia melhorar no buscador." /></div>
          <div className="space-y-2"><Label htmlFor="feedback-email">E-mail para contato (opcional)</Label><Input id="feedback-email" type="email" value={contactEmail} onChange={event => setContactEmail(event.target.value)} placeholder="voce@exemplo.com" /></div>
          <Button type="submit" className="w-full" disabled={feedbackMutation.isPending}>{feedbackMutation.isPending ? "Enviando..." : "Enviar comentário"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
