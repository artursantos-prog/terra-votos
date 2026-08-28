import { describe, expect, it } from "vitest";
import { getSafeOAuthReturnPath } from "./_core/oauth";

describe("getSafeOAuthReturnPath", () => {
  it("preserva uma rota interna do painel após o login", () => {
    expect(getSafeOAuthReturnPath("/owner/reports")).toBe("/owner/reports");
  });

  it("recusa destinos externos ou inválidos", () => {
    expect(getSafeOAuthReturnPath("https://example.com")).toBe("/");
    expect(getSafeOAuthReturnPath("//example.com")).toBe("/");
    expect(getSafeOAuthReturnPath(undefined)).toBe("/");
  });
});
