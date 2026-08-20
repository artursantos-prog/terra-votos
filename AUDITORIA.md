# Auditoria técnica e editorial

## Evidência de propostas de governo

Em 20 de agosto de 2026, foi verificado no Portal de Dados Abertos do TSE que as propostas de governo de 2026 são disponibilizadas em arquivos ZIP por unidade eleitoral. O recurso nacional de Presidência é publicado em `https://cdn.tse.jus.br/estatistica/sead/odsele/proposta_governo/proposta_governo_2026_BR.zip`; o próprio portal também lista um recurso específico de proposta para cada UF.

O buscador não deve exibir um botão para a página genérica do perfil quando não houver um arquivo identificado para a candidatura. A correção usará somente caminhos de PDF encontrados dentro desses pacotes e associados ao identificador público `SQ_CANDIDATO`; se a associação não existir, o botão não será exibido.

## Evidência de URL direta de documento

O endpoint público de detalhe de candidatura do DivulgaCandContas expõe a lista `arquivos`, incluindo `idArquivo`, `url` e `nome`. Na candidatura presidencial de teste `SQ_CANDIDATO` `280002539826`, foi retornado o documento `planogoverno10120.pdf`, com `idArquivo` `280016919931` e diretório oficial `candidaturas/oficial/2026/BR/BR/6257/candidatos/14031/`. A implementação passará a consumir essa referência oficial para gerar o botão de plano somente quando um arquivo de proposta for identificado.

O perfil público da mesma candidatura carrega uma seção específica denominada **Propostas**, confirmando que o arquivo é apresentado na própria página oficial do DivulgaCandContas. A próxima validação é capturar a URL acionada por essa seção para reproduzi-la sem redirecionar o leitor apenas para o perfil genérico.

## Auditoria de vínculos de chapa

Foi executada uma auditoria em 20 de agosto de 2026 contra o endpoint público de detalhe do DivulgaCandContas para todas as 812 candidaturas elegíveis de vice e suplência presentes no snapshot. O retorno confirmou **810 vínculos** por identificador de candidatura do TSE. Duas candidaturas foram mantidas sem associação: `10002533894` (2º suplente), pois o detalhe não retornou vínculo; e `60002553983` (vice-governador), pois o detalhe retornou duas opções oficiais concorrentes. Nenhuma relação é inferida nesses casos.

A listagem pública por cargo não fornece `idCandidatoSuperior` preenchido de forma confiável; por isso, a correção deve usar somente a relação explícita retornada em `vices` pelo endpoint individual de detalhe, com o identificador público de cada pessoa relacionada.

## Validação de abertura do plano

Foi acionado o item **Proposta de Governo** na página oficial do TSE. O portal abre o documento pelo endpoint `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/{idArquivo}`; no teste, a URL foi `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/280016919931`. Esse será o único padrão usado no buscador.

O caminho de PDF formado diretamente a partir do nome interno do ZIP de propostas retornou **404** no CDN do TSE. Portanto, ele não será usado nem será exibido ao público.

Uma coleta executada dentro do próprio domínio do DivulgaCandContas consultou 211 candidaturas a Presidente e Governador. O TSE retornou um arquivo com `codTipo` igual a `5` para 204 delas; sete candidaturas não retornaram proposta nessa consulta. Os 204 links serão montados exclusivamente pelo endpoint público `rest/arquivo/doc/{idArquivo}` confirmado acima.
