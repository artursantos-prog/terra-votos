- [x] Mapear o fluxo público de filtros do DivulgaCandContas e seus limites de acesso automatizado.
- [x] Identificar uma fonte pública e reproduzível das fotos vinculada aos candidatos da eleição de 2026.
- [x] Comparar por UF, cargo e identificador a cobertura do portal do TSE com os 28 CSVs principais recebidos.
- [x] Classificar candidatos ausentes, novos, duplicados ou com situação atualizada.
- [x] Atualizar a base pública e os cards do buscador com fotos, sem expor campos pessoais não necessários.
- [x] Validar a versão atualizada em desktop e celular e preparar o relatório de cobertura.

## Registro de investigação

O acesso inicial ao endereço público `https://divulgacandcontas.tse.jus.br/divulga/#/home` retornou uma aplicação sem conteúdo visível no ambiente automatizado, mesmo após nova leitura. A próxima etapa é analisar apenas os recursos públicos que a página referencia e procurar fontes oficiais alternativas que não exijam a manipulação manual da interface.

O acesso posterior ao perfil enviado pelo usuário confirmou o fluxo público de consulta: unidade eleitoral, cargo obrigatório, partido opcional e pesquisa. Também confirmou que o portal informa atualização a cada 60 minutos. O pacote oficial de fotos por UF, publicado no Portal de Dados Abertos do TSE, pôde ser baixado pelo navegador; o download direto via linha de comando recebeu resposta 403 do CDN. A coleta usará o caminho oficial de dados abertos, sem depender da extração visual de cada perfil.

O filtro público foi acionado na abrangência Brasil e confirmou que a seleção de cargo é obrigatória antes da pesquisa; Presidente e Vice-presidente são as opções na abrangência nacional. Esse comportamento confirma a estratégia de associação por UF e cargo, mas a extração de fotos continuará baseada nos arquivos oficiais por UF, cuja nomenclatura já traz o identificador `SQ_CANDIDATO`.

A pesquisa pública por Presidente retornou 13 registros e exibiu a lista nominal, incluindo Zema (NOVO, 30). Esse total coincide com a soma publicada na página inicial do DivulgaCandContas para esse cargo. A comparação em arquivo continuará sendo a verificação abrangente por identificador, porque é mais confiável e escalável que a navegação manual dos filtros.

Os recursos JavaScript públicos do DivulgaCandContas respondem no próprio contexto do navegador, embora bloqueiem requisições diretas de linha de comando. A primeira inspeção confirmou módulos públicos relacionados a “Bem na Foto”, mas não revelou ainda uma URL de imagem por candidato; a investigação seguirá pelos módulos carregados na rota de candidaturas.

O CDN de fotos também bloqueou a leitura via `fetch` a partir do domínio do DivulgaCandContas, o que indica uma restrição de origem. A navegação direta no navegador, por outro lado, baixa os arquivos oficiais normalmente. Para escala, será necessário extrair uma rota de imagem individual do portal ou utilizar a coleção de ZIPs oficiais de fotos por UF por meio do navegador.

O manifesto público da aplicação identificou o módulo de rotas de candidaturas como `829.00d399bdb2b1f6cc.js`. A próxima inspeção será limitada a esse módulo, buscando a rota utilizada no detalhe de candidato e qualquer URL de foto individual. Não haverá extração de dados além dos campos públicos necessários ao buscador.

O módulo de candidatos confirmou que a interface do DivulgaCandContas usa campos de URL pública de foto (`fotoUrlPublicavel` e `urlFotoPublicavel`) nos resultados e detalhes. A próxima etapa é identificar o endpoint público que popula esses campos, para que os cards possam exibir a foto sem manter dezenas de milhares de arquivos no projeto.

O endpoint público de listagem foi identificado no formato `/divulga/rest/v1/candidatura/listar/{ano}/{UF}/{idEleicao}/{codigoCargo}/candidatos`. Ele retorna o identificador `id` compatível com `SQ_CANDIDATO` e os campos `fotoUrl` e `fotoUrlPublicavel`. No primeiro retorno de lista, os campos de foto vieram nulos para registros ainda aguardando julgamento; será necessário consultar o detalhe ou associar as imagens pelo pacote oficial para cobrir as candidaturas divulgadas.

A página de detalhe confirmou a URL pública de imagem no formato `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/{idEleicao}/{SQ_CANDIDATO}/{SG_UE}`. A foto de teste foi exibida corretamente para Zema usando `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/20322002026/280002539826/BR`. Essa rota evita downloads e hospedagem local de dezenas de milhares de imagens.

A coleta integral dos endpoints de listagem excedeu o limite de execução de uma única operação no navegador. Uma coleta reduzida para Presidente e Vice-presidente funcionou e gerou 26 registros, confirmando que a comparação precisa ser executada em lotes pequenos e consolidados localmente. Os campos de foto retornados na listagem continuam nulos para esses registros; a URL de imagem do detalhe seguirá como fonte dos cards.

A comparação de totais por cargo encontrou diferenças entre a atualização horária do portal e a extração oficial por arquivo, que é atualizada quatro vezes ao dia. O portal registrou 20.643 pedidos, enquanto o arquivo oficial atual contém 20.639 candidatos; a diferença foi confirmada, por exemplo, na disputa para governador do Pará, onde o portal já mostra WELL MACEDO (`SQ_CANDIDATO` 140002554108) e o CSV oficial ainda não o contém. A base do buscador adotará o arquivo oficial mais recente e registrará essa defasagem transitória de publicação.

O mesmo atraso transitório ocorre para Vice-Governador no Pará: o portal já relaciona SEU ALEX (`SQ_CANDIDATO` 140002554109), enquanto a extração oficial ainda não o traz. A lista também mostra WELL MACEDO como vice em situação de renúncia, o que reforça que o portal pode refletir eventos de candidatura antes do próximo ciclo do arquivo de dados abertos.

A terceira diferença está no cargo de 2º suplente no Pará: o portal mostra 12 registros e o arquivo oficial 11. A comparação direta por identificador confirmou que KINZINHO (`SQ_CANDIDATO` 140002553960, SOLIDARIEDADE, número 777) consta no resultado público atual e ainda não aparece na extração oficial consolidada.

A quarta diferença está entre candidaturas a deputado federal em Roraima: o portal apresenta 106 e o CSV oficial 105. A lista pública atual inclui a candidatura adicional, que será mantida como divergência transitória até a próxima atualização do arquivo oficial. Com isso, os quatro registros adicionais do portal em relação ao CSV foram localizados por cargo e UF: Governador/PA, Vice-Governador/PA, 2º Suplente/PA e Deputado Federal/RR.

A candidatura adicional de Roraima foi identificada como LARISSA MULHERES DA SEGURANÇA (`SQ_CANDIDATO` 230002554110, PSOL, número 5057). Ela está no portal e não consta no CSV oficial baixado nesta verificação. A base do buscador permanece sincronizada com o arquivo oficial mais recente, que também incorporou PAULA CRISTIANE (`SQ_CANDIDATO` 170002554086, AVANTE, número 70231, deputada estadual de Pernambuco) em relação aos arquivos originalmente enviados.

Uma leitura posterior confirmou que SAMUEL CAMARA já aparece no CSV oficial de 2º suplente do Pará; a comparação direta por identificador corrigiu a atribuição da divergência para KINZINHO.

## Evolução solicitada

- [x] Confirmar a regra editorial para a contagem oficial e a elegibilidade das situações de candidatura.
- [x] Consolidar dados oficiais de candidaturas, suplentes e redes sociais em um snapshot público normalizado.
- [x] Completar o vínculo de vices e suplentes aos titulares quando há correspondência única e sinalizar na interface os casos sem relação oficial disponível.
- [x] Criar a seleção persistente de perfis e a exportação da colinha em PDF para impressão.
- [x] Disponibilizar formulário público de apontamento e área privada de revisão com autenticação.
- [x] Configurar e registrar a rotina de atualização duas vezes ao dia com a fonte oficial de dados abertos, preservando o último snapshot válido quando necessário.

## Fontes adicionais

O recurso oficial de redes sociais foi confirmado em `rede_social_candidato_2026.zip`, publicado no conjunto Candidatos 2026 do Portal de Dados Abertos do TSE. O CDN rejeitou o download direto nesta sessão; a integração deve tratar esse caso com retentativas controladas e preservar a última base válida, em vez de remover redes sociais quando a fonte estiver temporariamente indisponível.

O recurso complementar oficial foi confirmado em `consulta_cand_complementar_2026.zip`. Nele, `DS_SITUACAO_JULGAMENTO` contém a situação necessária para aplicar o recorte editorial de candidaturas deferidas ou aguardando julgamento. O CDN também rejeitou o download direto durante esta sessão; a rotina automática preservará o último snapshot válido quando a fonte não responder.

Os arquivos complementares encaminhados não contêm Bahia nem Distrito Federal. A tentativa inicial de complementar esses estados pela API pública do portal falhou devido a uma rota incompleta no contexto carregado; a alternativa será usar a URL pública absoluta do endpoint, sem repetir a mesma chamada relativa.

A consulta pela URL pública absoluta funcionou e exportou 1.861 registros de Bahia e Distrito Federal, com as situações Deferido, Aguardando julgamento e demais estados de candidatura. Esses dados serão usados apenas para completar o filtro editorial dessas duas unidades, sem substituir os arquivos oficiais já disponíveis para os demais estados.

A interface atualizada foi validada no navegador: a lista pública mostra 20.482 candidaturas que atendem ao recorte editorial aplicado; ao filtrar Presidente, as 13 candidaturas titulares exibem a ação de adicionar à colinha. Os cards de suplentes exibem a candidatura principal associada e não podem ser selecionados isoladamente.

No perfil público do DivulgaCandContas, a chamada de detalhe foi identificada no formato `/divulga/rest/v1/candidatura/buscar/{ano}/{UF}/{idEleicao}/candidato/{SQ_CANDIDATO}`. A resposta desse endpoint será verificada para integrar redes sociais oficiais quando o pacote de dados abertos estiver indisponível.

O detalhe público expõe `idCandidatoSuperior` e a lista `vices`, e a listagem pública disponibiliza a mesma chave para cada candidatura. O processamento passará a priorizar essa chave oficial ao vincular vices e suplentes; a aproximação por número, partido e UF permanecerá apenas como último recurso documentado quando a fonte não fornecer a relação.

O detalhe de uma candidatura titular confirma que a lista `vices` inclui `sq_CANDIDATO` e dados de urna do integrante da chapa. Essa é a relação oficial que será priorizada para Presidência e Governo; para Senado, o processamento continuará buscando a composição declarada no perfil do titular para vincular os dois suplentes.

O detalhe público de candidato contém uma lista `arquivos`; planos de governo aparecem com `codTipo` 5 e caminho oficial de arquivo. As rotas de download testadas por aproximação retornaram 404, portanto o buscador só publicará um botão depois de resolver uma URL confirmada pela API ou pelo recurso oficial de proposta de governo do TSE.

No detalhe de uma suplência, o campo numérico de candidato superior pode ser zero, mas a lista `vices` contém o titular oficial completo, incluindo `sq_CANDIDATO`, nome, número, partido e UF. A consolidação deve usar esse objeto retornado pelo perfil do suplente, em vez de inferir a associação apenas por número e partido.

Ao abrir a seção Propostas de uma candidatura presidencial no DivulgaCandContas, o portal confirma a existência de “Proposta de Governo”. O documento individual está associado à candidatura na lista `arquivos` do endpoint de detalhe. Fonte complementar: https://dadosabertos.tse.jus.br/dataset/ba2d7d69-5bf5-4379-8c91-664c11f75a2e/resource/433ac1f4-07dc-44a2-bcbe-c87a2073721a (pacote BR de propostas de governo).

Uma coleta pública complementar de Alagoas, Bahia e Distrito Federal exportou 1.684 situações de candidatura, cobrindo as UFs que não estavam presentes nos CSVs complementares recebidos. Esses registros serão unidos exclusivamente pela chave pública `SQ_CANDIDATO` para permitir que o filtro Deferido/Aguardando julgamento cubra todas as unidades eleitorais.

A interface foi validada com o snapshot ativo de 20.034 candidaturas no recorte editorial atual. O seletor “Cargo em disputa” e os atalhos por cargo filtram a lista; ao selecionar Presidente, o buscador oferece a cada resultado um link para o perfil oficial do TSE, onde a seção Propostas permite ler o plano de governo publicado.

## Publicação e integração solicitadas

- [x] Retirar qualquer referência ao Checa Aí da documentação e do escopo do projeto.
- [x] Exibir no buscador a metodologia, as fontes oficiais e a cadência prevista de atualização.
- [x] Tornar a seleção por cargo mais explícita, com opção de filtrar diretamente o cargo em disputa.
- [x] Incluir links para planos de governo oficialmente publicados pelo TSE quando disponíveis.
- [x] Configurar e verificar a rotina de atualização automática duas vezes ao dia no domínio publicado.
- [x] Atualizar a documentação e preparar o snippet de embed com a URL pública do projeto.

## Decisão de automação

Foi escolhida a atualização automática duas vezes ao dia. A implementação deverá incluir:

- [x] migrar o projeto para uma base com banco de dados, autenticação e tarefas agendadas;
- [x] persistir a última sincronização válida e um histórico de execuções;
- [x] importar somente candidaturas deferidas ou aguardando julgamento;
- [x] registrar falhas de download sem substituir os dados publicados;
- [x] proteger o painel de apontamentos com acesso autenticado.

A rota correta do detalhe individual foi confirmada como `/candidato/{regiao}/{uf}/{idEleicao}/{idCandidato}/{ano}/{sgUe}`. A tentativa inicial não atualizou a tela porque a aplicação preservou o estado da lista; a próxima consulta usará diretamente o endpoint correspondente, evitando depender da transição visual da rota.

Os parâmetros `idCandidato`, `ano`, `idEleicao`, `UF` e `sgUe` são efetivamente usados no módulo de detalhe e nas consultas de prestação de contas. A próxima investigação buscará a chamada de serviço que hidrata o objeto principal de candidato, onde deve estar a `fotoUrl` quando ela estiver publicável.

## Auditoria e correções solicitadas

- [x] Auditar e corrigir os vínculos entre titulares, vices e suplentes somente com relações publicadas em fontes oficiais do TSE.
- [x] Tornar a ação de adicionar candidaturas à colinha inequívoca, funcional e disponível nos perfis elegíveis permitidos pela regra editorial.
- [x] Reescrever o fluxo de apontamento para deixar explícito que ele aceita qualquer erro ou inconsistência de informação do candidato.
- [x] Substituir links genéricos de perfil por links diretos para o plano de governo oficial quando o arquivo estiver publicado pelo TSE.
- [x] Auditar a integridade do snapshot, os filtros, cards, redes sociais, fotos, exportação PDF, área editorial e links externos, sem criar relações não confirmadas.
- [x] Configurar e documentar a atualização automática e como o embed passa a refletir o mesmo snapshot publicado, sem simular uma execução não observada.

## Verificações finais de auditoria

- [x] Verificar a proteção da área `/revisao` e documentar a limitação de auditoria autenticada imposta pelo CAPTCHA externo, sem simular sessão administrativa.
- [x] Testar uma amostra de links externos publicados nos cards, incluindo redes sociais oficiais, e registrar os destinos verificados.
- [x] Documentar que a validação do conteúdo autenticado de `/revisao` foi bloqueada por CAPTCHA externo, preservando o acesso protegido sem simular uma sessão administrativa.

## Contingência operacional de atualização

- [ ] Criar uma rota autenticada de importação de arquivos oficiais já obtidos pelo navegador, sem aceitar fontes não autorizadas.
- [ ] Configurar uma tarefa de contingência com navegador para baixar os três arquivos oficiais do TSE e encaminhá-los à rota segura.
- [ ] Executar uma importação ponta a ponta, verificar o novo snapshot e confirmar a propagação ao iframe.

A navegação foi solicitada explicitamente pela rota interna de detalhe para o candidato de teste. A leitura seguinte verificará se a interface a processou e quais recursos públicos foram requisitados, sem alterar dados ou submeter qualquer formulário externo.
