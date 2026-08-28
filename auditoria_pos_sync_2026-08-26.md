# Auditoria pós-sincronização — 26/08/2026

## Página principal publicada

Às 12h52 UTC, a página pública principal foi aberta com parâmetro de cache e concluiu o carregamento com **19.639 candidaturas votadas** e **1.637 páginas**. O total é compatível com a base atual após a exclusão de cargos não votados diretamente — vices e suplentes — da lista pública. O filtro de Estado não mostrou `BR`; o filtro de cargo incluiu Presidência, mantendo as candidaturas nacionais acessíveis pelo cargo.

## Embed, espelho e alerta

O embed público foi validado na rota `/embed` com o mesmo total da página principal: **19.639 candidaturas votadas** e **1.637 páginas**. O arquivo público do espelho GitHub registrou geração em `2026-08-26T12:10:13.375Z` e última sincronização às 09h10 de Brasília, confirmando que recebeu o snapshot do dia.

O histórico do Heartbeat registrou timeout sem corpo de resposta, embora o banco e o commit do GitHub tenham sido concluídos. A causa foi a duração total do callback após o envio de dados. A rotina foi publicada com e-mail e espelho executados em paralelo; como ação corretiva, a confirmação detalhada da sincronização de 26/08 foi enviada com sucesso ao e-mail cadastrado do responsável, sem repetir a importação.

## Página Fora da Disputa

A rota pública `/fora-da-disputa` foi validada em 26/08 com parâmetro de cache e apresentou **241 candidaturas votadas** em situação terminal, distribuídas em 21 páginas. A interface exibiu situações oficiais como `Renúncia`, `Indeferido`, `Indeferido em prazo recursal ou com recurso` e o botão de reporte, preservando a separação entre a lista pública em disputa e a lista de candidaturas fora da disputa.

A rota incorporável `/embed/fora-da-disputa` foi validada com o mesmo total de **241 candidaturas**, as mesmas 21 páginas e o aviso de atualização automática após cada sincronização publicada. Portanto, tanto o embed principal quanto o embed de candidaturas fora da disputa consultam a base publicada corrente, sem cópia editorial separada.

## Integridade do snapshot e atualização automática

O estado persistido informa a última sincronização bem-sucedida em 26/08 às 09h10 de Brasília, sem falha registrada. A importação processou **20.750 candidaturas** e **42.515 perfis sociais** a partir dos arquivos oficiais autorizados do TSE. No banco permanecem **205 documentos oficiais de proposta** e **879 vínculos de chapa**, abrangendo vices e suplentes. As redes visíveis continuam restritas pela interface a X, Instagram, Facebook, TikTok e YouTube; os demais endereços que o TSE eventualmente publica permanecem armazenados como dado de origem, mas não são exibidos.

Há diferença intencional entre o total bruto, o total de candidaturas em disputa e os totais públicos: a lista principal não mostra vices ou suplentes como escolhas diretas, e a lista Fora da Disputa não mostra componentes de chapa isoladamente. A aplicação incorporável consulta lista, filtros e estatísticas pelo mesmo serviço público a cada 60 segundos e comunica novamente a altura do conteúdo ao iframe; ela não usa arquivo estático separado.

## Painel privado de reportes

O painel exclusivo do responsável foi ampliado para consultar a ficha oficial do DivulgaCand antes de qualquer decisão. A consulta registra URL da evidência, situação oficial e horário da verificação. Somente depois dessa etapa o responsável pode aprovar ou recusar um reporte; uma aprovação aplica exclusivamente a situação oficial confirmada ao registro público. O buscador e o embed leem a mesma base, enquanto a sincronização diária seguinte continua sendo a reconciliação autoritativa do TSE. Sugestões editoriais permanecem separadas e não alteram dados eleitorais.
