# Auditoria corretiva da sincronização diária — 10/09/2026

## Conclusão

A rotina diária não estava falhando por ausência de agenda. A agenda única permanece ativa para 09h de Brasília (`0 0 12 * * *`). O problema principal era o tempo de execução do callback: o fluxo importava os três ZIPs e ainda fazia uma varredura adicional por UF e cargo no DivulgaCand, incluindo a combinação `BR/1`. Essa varredura podia receber HTTP 403 e, mesmo quando o processamento continuava, fazia o callback ultrapassar o limite observado pelo agendador.

## Evidências

A consulta atual do agendador mostra quatro execuções consecutivas com status `timeout`: 07/09/2026 12:02:51 UTC, 08/09/2026 12:03:53 UTC, 09/09/2026 12:04:31 UTC e 10/09/2026 12:03:45 UTC. Todas terminaram sem corpo HTTP válido (`http_status: 0`).

O banco, contudo, registra um snapshot concluído em 10/09/2026 12:04:16 UTC, com 20.914 candidaturas, 50.536 perfis sociais, fonte gerada em 10/09/2026 08:31:17 e nenhum erro persistido. Portanto, o callback de 10/09 terminou o trabalho depois ou no limite do timeout do agendador, mas o agendador não recebeu uma resposta 2xx confiável. Isso explica por que um relatório pode apontar “timeout/falha” enquanto o banco mostra uma sincronização concluída.

O relato com HTTP 500 e 403 para `BR/1` é compatível com a antiga varredura adicional de status. A implementação atual de `discoverOfficialStatuses` constrói chamadas para listagens de cargos por UF, incluindo `/candidatura/listar/2026/BR/20322002026/1/candidatos`. Essa etapa era desnecessária para a situação básica porque o ZIP oficial já fornece `DS_SITUACAO_CANDIDATURA`.

## Correção aplicada

O ciclo diário deixou de executar a varredura massiva de status por UF/cargo. A situação principal permanece baseada no campo oficial `DS_SITUACAO_CANDIDATURA` dos ZIPs do TSE. O DivulgaCand continua sendo consultado somente para complementos oficiais de planos, redes e vínculos de chapa, além de situações retornadas pelos detalhes individuais quando disponíveis.

O tratamento de download HTTP 403 continua retornando HTTP 500, registra a falha e envia o alerta de erro. O teste também confirma que o espelho GitHub não é publicado quando o download falha. O processamento de sucesso mantém a publicação do espelho somente depois de gravar o snapshot oficial.

## Validação

`pnpm check` passou. A suíte passou com 19 arquivos e 63 testes. O teste de sucesso confirma que somente os três ZIPs são baixados no ciclo e que o complemento oficial continua sendo importado. O teste de falha confirma HTTP 500, alerta de erro, registro da falha e ausência de publicação do GitHub.

## Limitação remanescente

A execução do agendador ainda deve ser observada no próximo ciclo para confirmar que o callback agora termina dentro do limite. Sem uma nova execução 2xx, não se deve declarar a rotina diária como plenamente recuperada. A página deve continuar usando o último snapshot válido até essa confirmação.
