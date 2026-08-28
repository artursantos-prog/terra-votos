# Auditoria final pós-sincronização — 27/08/2026

## Resultado

O ciclo oficial acionado em 27/08/2026 às 09:12:37, no horário de Brasília, persistiu com sucesso o snapshot eleitoral no banco em 09:13:03. O agendador registrou timeout no callback após a execução, mas não houve perda de dados: o estado persistido contém 20.765 candidaturas, 42.717 perfis sociais e fonte oficial gerada em 26/08/2026 às 19:30:44. O responsável confirmou o recebimento do alerta por e-mail.

## Reconciliação de cobertura

O ZIP nacional `consulta_cand_2026.zip`, obtido no navegador diretamente do TSE após o ciclo, contém 20.765 identificadores de candidatura. A comparação somente leitura com a base persistida retornou 20.765 identificadores publicados, **zero ausentes** e **zero adicionais**. Assim, os sete registros que antes aguardavam publicação nos arquivos oficiais foram incorporados pelo novo snapshot.

## Canais validados

| Canal | Evidência |
| --- | --- |
| Página pública | Disponível com 19.610 candidaturas votáveis, busca, filtros, cards, colinha, reportes e comentários. |
| Fora da Disputa | Disponível com 280 candidaturas e vínculo “Ver nova candidatura” quando a mesma pessoa possui uma candidatura vigente oficialmente identificada. |
| Embed principal | Disponível em `/embed`, com os mesmos 19.610 resultados e atualização automática na mesma URL. |
| Embed Fora da Disputa | Disponível em `/embed/fora-da-disputa`, com 280 resultados. |
| Painel do dono | Disponível em `/owner/reports`, protegido por autenticação. |
| GitHub Pages | `data.json` publicado em 27/08/2026 às 12:13:04 UTC, com a sincronização de 09:13:03 (Brasília) e a fonte oficial correspondente. |
| Código-fonte | Branch `source-code` sincronizada com o checkpoint publicado `73ab509` antes deste registro de auditoria. |

## Limite de interpretação

O timeout reportado pelo agendador deve ser tratado como falha do retorno da atividade, não como falha de importação. A confirmação desta auditoria se apoia no estado persistido, nas páginas e embeds efetivamente respondidos, no espelho público do GitHub Pages e no alerta recebido pelo responsável.

## Fontes oficiais

1. [Dados abertos do TSE — candidaturas 2026](https://dadosabertos.tse.jus.br/dataset/candidatos-2026)
2. [DivulgaCandContas](https://divulgacandcontas.tse.jus.br/divulga/#/home)
