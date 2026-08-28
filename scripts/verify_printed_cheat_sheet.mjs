import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";

const debugPort = 9227;
const profileDir = "/tmp/eleicoes-print-profile";
const outputPath = "/home/ubuntu/print-previews/colinha-com-dois-senadores.pdf";
const targetUrl = "https://3000-ifx5ghe27on00t1z8h1cm-93446d8d.us3.manus.computer/";

await rm(profileDir, { recursive: true, force: true });
await mkdir("/home/ubuntu/print-previews", { recursive: true });

const chromium = spawn("chromium", [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profileDir}`,
  "about:blank",
], { stdio: "ignore" });

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function getDebugPage() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const pages = await fetch(`http://127.0.0.1:${debugPort}/json`).then(response => response.json());
      const page = pages.find(candidate => candidate.type === "page");
      if (page) return page;
    } catch {
      // Chromium ainda está iniciando.
    }
    await delay(250);
  }
  throw new Error("Não foi possível abrir a sessão de validação de impressão.");
}

const page = await getDebugPage();
const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let requestId = 0;
const pending = new Map();
socket.addEventListener("message", event => {
  const message = JSON.parse(String(event.data));
  const resolver = pending.get(message.id);
  if (!resolver) return;
  pending.delete(message.id);
  if (message.error) resolver.reject(new Error(message.error.message));
  else resolver.resolve(message.result);
});

function send(method, params = {}) {
  requestId += 1;
  const id = requestId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

try {
  await send("Page.enable");
  await send("Page.navigate", { url: targetUrl });
  await delay(3500);

  const selectedNames = await evaluate(`(async () => {
    const officeSelect = Array.from(document.querySelectorAll('select')).find(select => Array.from(select.options).some(option => option.value === 'SENADOR'));
    if (!officeSelect) throw new Error('Filtro de Senado não encontrado.');
    officeSelect.value = 'SENADOR';
    officeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 1000));

    const candidateButtons = () => Array.from(document.querySelectorAll('button')).filter(button => button.textContent?.replace(/\\s+/g, ' ').trim().toLocaleUpperCase() === 'ADICIONAR À COLINHA');
    for (let attempt = 0; attempt < 20 && candidateButtons().length < 2; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    const first = candidateButtons()[0];
    if (!first) throw new Error('Primeira candidatura a senador não encontrada.');
    first.click();
    await new Promise(resolve => setTimeout(resolve, 350));
    const second = candidateButtons()[0];
    if (!second) throw new Error('Segunda candidatura a senador não encontrada.');
    second.click();
    await new Promise(resolve => setTimeout(resolve, 350));

    return Array.from(document.querySelectorAll('.print-colinha__office')).find(office => office.querySelector('h2')?.textContent?.toLocaleUpperCase().includes('SENADOR'))?.textContent;
  })()`);

  const normalizedSenatorSlots = selectedNames?.toLocaleUpperCase();
  if (!normalizedSenatorSlots?.includes("1ª VAGA") || !normalizedSenatorSlots.includes("2ª VAGA") || normalizedSenatorSlots.includes("NÃO SELECIONADO")) {
    throw new Error(`A prévia não registrou duas vagas preenchidas de senador: ${selectedNames ?? "sem conteúdo"}`);
  }

  const pdf = await send("Page.printToPDF", {
    printBackground: true,
    paperWidth: 8.27,
    paperHeight: 11.69,
    marginTop: 0.35,
    marginBottom: 0.35,
    marginLeft: 0.35,
    marginRight: 0.35,
  });
  await writeFile(outputPath, Buffer.from(pdf.data, "base64"));
  console.log(JSON.stringify({ outputPath, senatorSlots: selectedNames }, null, 2));
} finally {
  socket.close();
  chromium.kill("SIGTERM");
}
