import { describe, expect, it } from "vitest";

describe("Resend configuration", () => {
  it("loads the configured owner alert recipient", () => {
    expect(process.env.OWNER_ALERT_EMAIL).toBe("artur.santos@telefonica.com");
  });

  it("authenticates the configured API key with the Resend domains endpoint", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toBeTruthy();

    const response = await fetch("https://api.resend.com/domains", {
      headers: { authorization: `Bearer ${apiKey}` },
    });

    const detail = await response.text();
    const isSendOnlyKey = response.status === 401 && detail.includes("restricted_api_key") && detail.includes("only send emails");
    expect(response.ok || isSendOnlyKey, `Resend domains endpoint returned ${response.status}: ${detail}`).toBe(true);
  }, 15_000);
});
