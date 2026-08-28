import { sendOwnerEmail } from "../server/ownerEmail";

const sent = await sendOwnerEmail({
  subject: "Confirmação da sincronização eleitoral de 26/08 — Buscador de Candidaturas",
  text: [
    "A sincronização oficial do TSE de 26/08/2026 foi concluída e gravada às 09:10 (horário de Brasília).",
    "Foram processadas 20.750 candidaturas e 42.515 perfis sociais.",
    "A página principal, o embed e o espelho de contingência no GitHub foram atualizados com o novo snapshot.",
    "O alerta automático desta execução não chegou porque o retorno da rotina excedeu o limite do agendador após os dados já terem sido publicados.",
    "A rotina foi corrigida para disparar o alerta e a atualização do espelho em paralelo nos próximos ciclos diários.",
  ].join("\n\n"),
});

if (!sent) throw new Error("O envio corretivo do alerta não foi confirmado pelo serviço de e-mail.");
console.log("Alerta corretivo enviado ao responsável.");
