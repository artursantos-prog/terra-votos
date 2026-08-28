# Auditoria operacional — 25 de agosto de 2026

## Escopo e método

Esta auditoria foi executada após a retomada da plataforma, combinando verificação de tipos, suíte automatizada, consultas de integridade no banco, revisão da versão publicada em desktop e mobile, abertura de diálogos públicos e inspeção do histórico da rotina diária. Nenhum reporte ou comentário fictício foi enviado durante a auditoria, para não contaminar o painel do responsável nem os alertas por e-mail.

## Resultado dos fluxos auditados

| Área | Evidência atual | Resultado |
| --- | --- | --- |
| Tipos e testes | `pnpm check` e 39 testes Vitest concluídos em 12 arquivos, incluindo falha parcial de listagem e preservação de status | Aprovado |
| Base de candidaturas | 20.727 candidaturas; todas com URL de foto oficial; fonte datada de 24/08/2026 19:31:13 | Aprovado |
| Situação e classificação | 20.727 registros reconciliados por UF/cargo no DivulgaCand; 269 candidaturas votadas em situação terminal foram para **Fora da Disputa** | Aprovado |
| Redes sociais | 41.625 perfis persistidos para 14.583 candidaturas, todos com URL HTTP(S) e rótulo não vazio | Aprovado |
| Busca e filtros | Busca por nome retornou o candidato correspondente; filtros e retorno à primeira página foram verificados | Aprovado |
| Paginação | Primeiro conjunto exibiu 1–12; limite de 12 por página preservado | Aprovado |
| Cards | Nome de urna, rótulo **Partido:**, número, cargo, UF, situação legível e foto oficial renderizada | Aprovado |
| Detalhes oficiais | Diálogo de LULA mostrou foto, nome completo, cargo, partido, situação, um documento oficial direto, vice e apenas redes sociais permitidas | Aprovado |
| Colinha | Inclusão e remoção individual atualizam a lista e o contador | Aprovado |
| Fora da disputa | Rota publicada exibiu 269 candidaturas votadas com indeferimento, renúncia, cancelamento ou pedido não conhecido | Aprovado |
| Reportes | Formulário apresenta exclusivamente as opções exigidas: “não está mais concorrendo” e “informação incorreta” | Aprovado |
| Comentários | Formulário público possui campo de mensagem e e-mail opcional | Aprovado |
| Painel do responsável | A rota `/gestao/reportes` exige autenticação; testes confirmam bloqueio de usuário comum e gestão por administrador | Aprovado |
| Metodologia | Widget abre na mesma página publicada, declara uso exclusivo do TSE e informa a rotina diária | Aprovado |
| E-mails | Testes cobrem reporte, sugestão, falha e sucesso de sincronização; o e-mail diário compara snapshots e inclui cada inclusão, alteração e remoção detectada | Aprovado |
| Hora de sincronização | A interface separa a última sincronização bem-sucedida, exibida em 25/08/2026 às 09:55 (Brasília), da data do arquivo TSE | Aprovado |
| Vices | Vice-presidente e vice-governador foram removidos da seleção direta; 223 vínculos oficiais foram persistidos e o detalhe validado mostra o vice junto ao titular | Aprovado |
| Propostas | 205 documentos oficiais diretos do DivulgaCand foram persistidos, com somente um por candidatura; a validação presidencial abriu o documento direto e não a ficha do TSE | Aprovado |
| Colinha para impressão | A seleção exibe ação de impressão; a folha impressa isola a colinha, organiza números por cargo e preserva a identidade editorial | Aprovado |
| Resiliência de fonte | Falhas de arquivo ou detalhe não apagam o último snapshot; a página pode informar uso da base oficial preservada | Aprovado |

## Sincronização oficial

O único job ativo é `election-sync-daily` (`Dd9Cdys2YKfPHTpre9Kpja`), que chama `POST /api/scheduled/election-sync-import` diariamente às 9h no horário de Brasília (`0 0 12 * * *`, UTC). O payload contém exclusivamente os três arquivos oficiais do TSE: candidaturas, informações complementares e redes sociais.[1][2][3]

Em 22/08/2026, a execução agendada retornou HTTP 200 em 24.997 ms, com 20.707 candidaturas e 41.351 perfis sociais processados, 0 planos importados e `emailAlertSent: true`. A indisponibilidade posterior impediu novas rodadas automáticas registradas; por isso, em 25/08 foi feita uma recuperação manual controlada, usando exatamente os três URLs oficiais da rotina. Ela importou 20.727 candidaturas, processou 42.124 linhas de redes sociais, encontrou 0 planos e confirmou `emailAlertSent: true`. A expressão diária foi reaplicada sem alterar fontes ou endpoint, com próxima janela em 25/08/2026 às 9h de Brasília. A rotina continua ativa e não há agenda concorrente de importação.

A rodada automática de 25/08 foi confirmada após a recuperação: HTTP 200, iniciada às `12:12:37Z`, concluída às `12:13:01Z` e duração de 23.958 ms. A próxima execução foi recalculada para 26/08/2026 às 9h de Brasília. Essa execução valida que a rotina não apenas está configurada, mas voltou a processar o endpoint publicado com os três arquivos oficiais.

O acompanhamento de resultados também está ativo nesta mesma conversa, diariamente às 9h30 de Brasília, sem abrir outra conversa. Ele consulta o histórico do job e informa o resultado, os totais e qualquer falha. A próxima execução de importação confirmada permanece em `2026-08-26T12:00:00Z`.

## Reconciliação do arquivo oficial de redes sociais

O ZIP nacional `rede_social_candidato_2026_BRASIL.csv` foi obtido diretamente do TSE e estava datado de `24/08/2026 19:30:56`. Ele contém 50.656 linhas, das quais 42.124 apontam para URLs HTTP(S). Há 41.795 pares distintos de candidatura + URL quando a comparação considera caixa alta e baixa; como o índice da base considera URLs sem distinção de caixa, o conjunto autoritativo resultou em 41.625 perfis, exatamente o total gravado após a substituição.

Essa comparação revelou que a importação incremental anterior podia manter perfis que o TSE já havia removido. A sincronização foi corrigida para substituir o snapshot inteiro de perfis sociais a cada rodada; assim, nenhuma URL antiga permanece apenas por ter existido em um arquivo anterior. A mesma regra foi aplicada a candidaturas e planos de governo. Aliases verificáveis como `bsky.app`, `kwai-video.com` e `m.me` passam a receber os rótulos Bluesky, Kwai e Facebook, respectivamente. URLs e domínios não reconhecidos continuam exatamente como foram publicados pelo TSE, sem inferência externa.

## Planos, chapas e continuidade

As cinco rotas regionais indicadas — Norte, Nordeste, Centro-Oeste, Sudeste e Sul — foram abertas no DivulgaCand. A busca por detalhe usa somente a UF e o identificador de candidatura presentes no snapshot oficial. Em 25/08, uma resposta temporariamente bloqueada do próprio DivulgaCand não substituiu informações existentes: o sistema manteve propostas e vínculos já confirmados. A base atual contém 20.727 candidaturas, 41.625 perfis sociais, 57 documentos de proposta e 61 vínculos de chapa; dos registros em disputa, 20.513 são diretamente votados após a retirada dos dois cargos de vice da escolha individual.

Foi gerado um espelho estático de contingência a partir desse snapshot. A publicação externa não foi concluída: Cloudflare exigiu autenticação/CAPTCHA e o GitHub recusou o envio automatizado ao repositório criado por ausência de permissão de gravação da integração. Essa pendência não afeta o site atual nem a preservação interna de dados; o procedimento está registrado em `fallback_contingency.md`.

## Atualização conclusiva — situação, planos e interface

A auditoria inicial refletia apenas o campo `#NE` do ZIP de candidaturas, que ainda não trazia as decisões mais recentes. A versão concluída acrescenta a leitura das listas oficiais do DivulgaCand por UF e cargo.[4] A reconciliação cobriu as **20.727 candidaturas**: 14.939 em `#NE`, 172 em **Aguardando julgamento**, 5.329 **Deferido**, 10 **Deferido com recurso**, 236 **Renúncia**, 26 **Indeferido em prazo recursal ou com recurso**, 13 **Indeferido**, um **Pedido não conhecido** e um **Cancelado**.

O buscador principal contém 20.244 candidaturas votadas em disputa. A área **Fora da disputa** contém 269 candidaturas votadas com situação terminal; oito registros terminais adicionais são vices, corretamente preservados apenas como vínculo de seus titulares. “Deferido com recurso” permanece na busca principal. Toda situação iniciada por “Indeferido”, além de renúncia, cancelamento, cassação, falecimento e pedido não conhecido, é direcionada para a área separada.

Os detalhes oficiais foram investigados novamente: o parser passou a reconhecer tanto `codigoTipo` quanto `codTipo` nos arquivos de proposta do DivulgaCand, o que elevou a base para 205 documentos e 223 vínculos de vice. A interface pública não apresenta “Chapa” ou planos nos cards. O diálogo mostra, quando existentes, um único documento oficial do TSE em nova guia, uma seção “Vice” e somente Facebook, Instagram, TikTok, X e YouTube.

## Resiliência e rotina diária

O importador diário preserva uma situação específica já confirmada pelo DivulgaCand quando o novo ZIP ainda registrar apenas `#NE` ou “Aguardando julgamento”. Se a lista de um cargo falhar, as listas bem-sucedidas da mesma UF continuam válidas e os dados anteriores não são rebaixados. A reconciliação integral das listas foi concluída em menos de 45 segundos no teste manual, deixando margem para a janela de dois minutos da rotina.

O e-mail diário ao responsável é gerado após a comparação entre o snapshot anterior e o resultado novo. Ele inclui, sem truncamento deliberado, todas as candidaturas incluídas, removidas ou alteradas e todas as inclusões/remoções de redes, documentos de proposta e vínculos de vice.

## Conclusão

As correções desta rodada concluíram a atualização integral de situações eleitorais pelo DivulgaCand, a classificação correta de candidaturas fora da disputa, a preservação de informação mais específica em falhas parciais e a validação pública de fotos, vices, documento de proposta e redes sociais filtradas. A rotina diária única permanece às 9h de Brasília e o último histórico automático confirmado retornou HTTP 200 em 25/08/2026.

## Referências

[1]: https://dadosabertos.tse.jus.br/dataset/candidatos-2026 "Portal de Dados Abertos do TSE — Candidatos 2026"
[2]: https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip "TSE — Candidaturas 2026"
[3]: https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_2026.zip "TSE — Redes sociais de candidatos 2026"
[4]: https://divulgacandcontas.tse.jus.br/divulga/ "TSE — Divulgação de Candidaturas e Contas Eleitorais"
