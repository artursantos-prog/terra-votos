# Auditoria da execução diária — 11/09/2026

## Conclusão

A rotina diária estava ativa e foi disparada no horário esperado, mas o agendador registrou **timeout**, não uma resposta HTTP 2xx. Apesar disso, há evidência independente de que o processamento principal foi concluído e que os dados foram gravados no banco e publicados no espelho do GitHub.

Portanto, a atualização dos dados ocorreu, mas o mecanismo de confirmação ainda não está operacional de forma confiável. Não é correto afirmar que o alerta do agendador foi entregue com sucesso nesta execução.

## Evidências

| Item | Evidência observada |
|---|---|
| Agenda | `election-sync-daily`, ativa, cron `0 0 12 * * *` UTC, equivalente a 09h de Brasília |
| Execução | Agendada para `2026-09-11T12:05:23Z` e encerrada em `2026-09-11T12:05:53Z` |
| Agendador | `status: timeout`, `http_status: 0`, sem `response_body` |
| Banco | `ultima_sincronizacao_bem_sucedida_em: 2026-09-11 12:05:53` |
| Banco — candidaturas | `20.919` registros importados |
| Banco — redes sociais | `50.718` registros importados |
| Banco — planos | `0` no ciclo consultado |
| Banco — erro | `NULL` em `ultimo_erro` e `ultima_falha_em` |
| Site público | `19.739` candidaturas em disputa e `280` fora da disputa; total `20.019` |
| Site público — fonte | `10/09/2026 16:31:23` |
| GitHub Pages | Commit `4dd3319cfc89324a54b40610b0f5c147c3865fc5` em `2026-09-11T12:05:55Z`, com mensagem `Atualiza dados oficiais do espelho` |
| Código GitHub | Branch `source-code` em `e47a7d603a887db668dd2fd8a5c72865d66553c0` |
| E-mail | Não há evidência de `emailAlertSent: true` no retorno do agendador, porque o callback terminou em timeout antes de devolver corpo de resposta |

## Interpretação

O fluxo gravou o snapshot e atualizou o GitHub, mas o callback demorou além do limite aceito pelo agendador. Assim, o sistema pode ter concluído o trabalho e ainda assim aparecer como falho no painel de execução. A ausência de corpo HTTP impede confirmar pelo agendador se o envio de e-mail terminou.

A agenda continuará tentando diariamente enquanto estiver ativa. Contudo, a garantia operacional completa — resposta 2xx, alerta confirmável e publicação no mesmo ciclo — ainda exige separar o trabalho pesado da confirmação do callback ou reduzir o tempo total das etapas externas de e-mail e GitHub.

## Regra de comunicação

Até a correção desse timeout, nenhuma execução deve ser apresentada como plenamente confirmada apenas porque o banco tem um snapshot. A confirmação completa deve exigir simultaneamente: resposta HTTP 2xx, `emailAlertSent: true`, snapshot persistido e atualização verificável do espelho.

Fonte primária dos dados: arquivos oficiais do Tribunal Superior Eleitoral (TSE). Nenhuma fonte alternativa foi usada.

Data do registro: 11/09/2026.
