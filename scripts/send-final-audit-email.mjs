const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL;
const to = process.env.OWNER_ALERT_EMAIL;

if (!apiKey || !from || !to) {
  throw new Error("Resend is not fully configured for the final audit email.");
}

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
  },
  body: JSON.stringify({
    from,
    to: [to],
    subject: "Validação final — Buscador de Candidaturas",
    text: "Este é um teste controlado da auditoria final. Os alertas de reportes, comentários e sincronização eleitoral estão configurados para este endereço.",
  }),
});

const result = await response.text();
console.log(JSON.stringify({ status: response.status, ok: response.ok, result }, null, 2));

if (!response.ok) process.exitCode = 1;
