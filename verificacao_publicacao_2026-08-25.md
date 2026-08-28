# Verificação da publicação — 25 de agosto de 2026

## Situação observada

Após o checkpoint `43d30cdf`, a prévia de desenvolvimento refletia a versão atual. A abertura inicial do domínio público `https://buscadorv2-pzlzvemq.manus.space` exibiu conteúdo anterior, retido no cache da rota sem parâmetros.

A mesma página, aberta com renovação de cache por `?version=43d30cdf`, exibiu a versão atual: banner somente com **“Atualização diária às 9h.”**, cartões sem menção a planos e os controles completos da busca. A implantação foi, portanto, confirmada; a primeira leitura correspondia a conteúdo em cache, não a uma falha de publicação.

O caminho `/_manus_/version.json` não está exposto pela aplicação publicada e retorna a página interna 404, portanto não permite identificar diretamente a versão servida.
