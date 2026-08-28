# Programação da sincronização eleitoral

| Item | Configuração |
| --- | --- |
| Rotina | `election-sync-daily` |
| Identificador | `Dd9Cdys2YKfPHTpre9Kpja` |
| Endpoint | `POST /api/scheduled/election-sync-import` |
| Expressão de agenda | `0 0 12 * * *` (UTC) |
| Horário local | Diariamente, às 9h (horário de Brasília, UTC−03) |
| Próxima janela calculada | 26/08/2026, 09:00 (Brasília) |
| Candidaturas | `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip` |
| Informações complementares | `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand_complementar/consulta_cand_complementar_2026.zip` |
| Redes sociais | `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_2026.zip` |
| Alertas | Resultado da sincronização enviado por e-mail ao responsável, em sucesso ou falha. |

O identificador deve ser usado para consultar registros de execução, pausar, alterar ou remover a rotina. O payload contém exclusivamente os três arquivos oficiais exigidos pelo handler publicado.

## Verificação de despacho

Foi criada uma rotina temporária para 21/08/2026 às 12h49 (Brasília), com o mesmo endpoint e payload da rotina diária. Após a janela prevista e dois minutos adicionais de processamento, o histórico não registrou execução. A rotina temporária foi removida imediatamente para não manter uma segunda agenda recorrente.

O painel de rotinas confirma que a agenda diária aprovada permanece ativa, com `next_execution_at` em `22/08/2026T12:00:00Z` — 22/08/2026 às 9h de Brasília. A confirmação operacional do alerta de sincronização depende, portanto, da primeira execução diária real; os testes automatizados do handler já cobrem os caminhos de sucesso e falha com alerta por e-mail.

Em 22/08/2026, a primeira execução registrada respondeu HTTP 200 em 24.997 ms, com `imported: 20707`, `socialProfilesImported: 41351`, `governmentPlansImported: 0` e `emailAlertSent: true`. Após uma indisponibilidade da plataforma, a janela seguinte ficou vencida. Em 25/08/2026, uma recuperação manual controlada com os três arquivos oficiais importou `20727` candidaturas, processou `42124` linhas de redes sociais, encontrou `0` planos e confirmou `emailAlertSent: true`. A expressão diária foi reaplicada sem alterar o endpoint ou as fontes, recalculando `next_execution_at` para `2026-08-25T12:00:00Z` — 25/08/2026 às 9h de Brasília.

Em 25/08/2026, a execução automática posterior à recuperação foi registrada com sucesso: iniciada às `12:12:37Z`, concluída às `12:13:01Z`, HTTP 200 e duração de 23.958 ms. A base permaneceu alinhada ao arquivo oficial gerado em 24/08/2026, com 20.727 candidaturas e 41.625 perfis sociais deduplicados. A agenda ficou ativa e avançou para `2026-08-26T12:00:00Z` — 26/08/2026 às 9h de Brasília.

## Agenda única

A programação assistida anterior, que podia iniciar sessões adicionais de sincronização, foi pausada. A única rotina ativa de importação é `election-sync-daily` (`Dd9Cdys2YKfPHTpre9Kpja`), que chama diretamente o endpoint publicado às 9h de Brasília com os três arquivos oficiais do TSE.

## Aviso diário na conversa e preservação de dados

Uma agenda de acompanhamento foi reativada nesta mesma conversa para 9h30 (horário de Brasília), após a janela da rotina oficial. Ela consulta o histórico da única rotina de importação e informa o êxito ou a falha, os totais e o horário registrado, sem criar conversa paralela. A agenda está ativa, não abre uma nova tarefa e tem vigência até 31/12/2026.

O buscador mantém o último snapshot completo e válido de candidaturas, redes sociais, documentos de proposta e vínculos de vice. Se os arquivos do TSE ou os detalhes do DivulgaCand estiverem indisponíveis, a falha é registrada e a base anterior continua disponível; documentos e vínculos já validados não são apagados por uma resposta parcial. A interface diferencia a hora da última sincronização bem-sucedida da data de geração do arquivo oficial e pode indicar uma atualização degradada quando uma falha for mais recente que o último êxito.

## Reconciliação atual de situações

Além dos três ZIPs, cada execução consulta as listas oficiais do DivulgaCand por UF e cargo para recuperar `descricaoSituacao` atual. A reconciliação integral de 25/08 processou as 20.727 candidaturas em menos de 45 segundos no teste manual, com concorrência controlada e abaixo da janela de dois minutos da rotina.

Uma falha de lista em um cargo não invalida as listas bem-sucedidas da mesma UF. Se o novo ZIP ainda trouxer `#NE` ou “Aguardando julgamento”, uma situação específica já confirmada pelo DivulgaCand é preservada até uma nova resposta oficial conseguir substituí-la. Essa proteção evita regressão do status público por indisponibilidade parcial da fonte.

O e-mail de sucesso compara o snapshot anterior com o resultado atual e inclui as candidaturas, redes sociais, documentos de proposta e vínculos de vice incluídos, removidos ou alterados. Não há truncamento deliberado desse detalhamento.

## Execução controlada de validação do embed

Em 25/08/2026 às `15:50:02Z`, foi executada uma sincronização controlada pela mesma lógica da rotina diária, usando exclusivamente os três URLs oficiais acima e sem criar, pausar ou alterar qualquer agenda. O resultado foi bem-sucedido, com `emailAlertSent: true`, 20.732 candidaturas brutas, 42.292 perfis sociais deduplicados, 205 documentos de proposta e 223 vínculos de vice.

Após essa atualização, a URL pública incorporável `https://buscadorv2-pzlzvemq.manus.space/embed` passou de 20.244 para 20.247 candidaturas votadas em disputa e de 1.687 para 1.688 páginas, sem mudança no portal que a incorpora. A confirmação foi feita no domínio público às 15:52Z; o embed renova as consultas de dados a cada 60 segundos.
