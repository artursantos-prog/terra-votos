import { ENV } from "./_core/env";

type OwnerEmail = {
  subject: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    "\"": "&quot;",
  })[character] ?? character);
}

export async function sendOwnerEmail(email: OwnerEmail): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.resendFromEmail || !ENV.ownerAlertEmail) {
    console.warn("[OwnerEmail] Resend is not fully configured.");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${ENV.resendApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: ENV.resendFromEmail,
        to: [ENV.ownerAlertEmail],
        subject: email.subject,
        text: email.text,
        html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${escapeHtml(email.text)}</pre>`,
      }),
    });
    if (!response.ok) {
      console.warn(`[OwnerEmail] Resend email failed with status ${response.status}.`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[OwnerEmail] Unable to send email:", error);
    return false;
  }
}
