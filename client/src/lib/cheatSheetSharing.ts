import { CHEAT_SHEET_GROUPS } from "@/lib/cheatSheet";

export type CheatSheetShareCandidate = {
  office: string;
  ballotName: string;
  candidateNumber: string | null;
  partyAcronym: string | null;
};

function candidatesForOffice(candidates: CheatSheetShareCandidate[], offices: readonly string[]) {
  return candidates.filter(candidate => offices.includes(candidate.office));
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

export function buildCheatSheetShareText(candidates: CheatSheetShareCandidate[], pageUrl?: string) {
  const lines = ["Minha colinha eleitoral — Eleições no Terra"];
  for (const group of CHEAT_SHEET_GROUPS) {
    const selections = candidatesForOffice(candidates, group.offices);
    if (!selections.length) continue;
    lines.push(`${group.label}: ${selections.map(candidate => `${candidate.ballotName} ${candidate.candidateNumber || ""}`.trim()).join(" · ")}`);
  }
  lines.push("Confira as informações oficiais do TSE antes de votar.");
  if (pageUrl) lines.push(pageUrl);
  return lines.join("\n");
}

export async function createCheatSheetShareImage(candidates: CheatSheetShareCandidate[]) {
  if (typeof document === "undefined") throw new Error("Geração de imagem disponível somente no navegador.");

  const width = 1080;
  const rowHeight = 142;
  const groups = CHEAT_SHEET_GROUPS.map(group => ({ ...group, candidates: candidatesForOffice(candidates, group.offices) }));
  const height = 230 + groups.length * rowHeight + 110;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a imagem da colinha.");

  context.fillStyle = "#fffaf6";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#ff5a00";
  context.fillRect(0, 0, width, 34);
  context.fillStyle = "#1f1d1b";
  context.font = "700 32px Georgia, serif";
  context.fillText("eleições", 64, 88);
  context.fillStyle = "#ff5a00";
  context.fillText(" no Terra", 192, 88);
  context.fillStyle = "#1f1d1b";
  context.font = "700 54px Georgia, serif";
  context.fillText("Minha colinha eleitoral", 64, 156);
  context.fillStyle = "#665d57";
  context.font = "400 24px Arial, sans-serif";
  context.fillText("Eleições 2026 · confira os dados oficiais do TSE", 64, 196);

  let y = 244;
  for (const group of groups) {
    context.fillStyle = "#ffffff";
    context.fillRect(64, y, width - 128, rowHeight - 16);
    context.strokeStyle = "#eadfd8";
    context.lineWidth = 2;
    context.strokeRect(64, y, width - 128, rowHeight - 16);
    context.fillStyle = "#ff5a00";
    context.fillRect(64, y, 8, rowHeight - 16);
    context.fillStyle = "#625b55";
    context.font = "700 17px Arial, sans-serif";
    context.fillText(group.label.toUpperCase(), 98, y + 37);
    const details = group.candidates.length
      ? group.candidates.map(candidate => `${truncate(candidate.ballotName, 29)} · ${candidate.candidateNumber || "—"}${candidate.partyAcronym ? ` · ${candidate.partyAcronym}` : ""}`).join("   |   ")
      : "Não selecionado";
    context.fillStyle = group.candidates.length ? "#1f1d1b" : "#827971";
    context.font = group.candidates.length ? "700 28px Arial, sans-serif" : "400 27px Arial, sans-serif";
    context.fillText(truncate(details, 69), 98, y + 86);
    y += rowHeight;
  }

  context.fillStyle = "#665d57";
  context.font = "400 19px Arial, sans-serif";
  context.fillText("Colinha pessoal. Confirme candidatos e números no Buscador de Candidaturas.", 64, height - 48);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(result => result ? resolve(result) : reject(new Error("Não foi possível gerar a imagem da colinha.")), "image/png");
  });
  return new File([blob], "minha-colinha-eleitoral.png", { type: "image/png" });
}

export function downloadCheatSheetImage(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
