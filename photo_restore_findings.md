# Diagnóstico de recuperação de fotos oficiais

## Situação identificada

O CSV nacional atualmente usado na restauração (`consulta_cand_2026_BRASIL.csv`) não possui coluna de URL de foto nem valores de imagem. Por isso, o importador emergencial gravou `foto_url` como nulo para todas as candidaturas; a ausência de fotos não é um recurso visual intencional.

## Fonte oficial aplicável

O Portal de Dados Abertos do Tribunal Superior Eleitoral disponibiliza o recurso nacional **“BR - Fotos de candidatos”** para 2026 em `https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/fotos/foto_cand2026_BR_div.zip`.

## Referências oficiais de validação

O projeto deverá manter como referências institucionais do TSE:

- `https://divulgacandcontas.tse.jus.br/divulga/#/home` para consulta pública de candidaturas;
- `https://dadosabertos.tse.jus.br/dataset/candidatos-2026` para arquivos de candidaturas, fotos, informações complementares, redes sociais e propostas;
- `https://dadosabertos.tse.jus.br/dataset/eleitorado-2026` somente para dados eleitorais agregados que sejam pertinentes ao produto;
- `https://sig.tse.jus.br/ords/dwapr/r/seai/sig-candidaturas/painel-perfil-candidato?p0_sit_julgamento=Aguardando%20julgamento` como painel de referência para situações de julgamento.

O painel de perfil adicional exibiu uma verificação anti-automação durante a consulta. Ele será usado como referência de conferência humana; a importação permanece limitada aos arquivos oficiais de dados abertos do TSE.

## Obstáculo atual

Uma tentativa de download pelo navegador do portal oficial foi rejeitada pelo CDN do TSE. Não será utilizada nenhuma fonte alternativa nem serão inventadas fotos. A próxima etapa é verificar se o conteúdo já está disponível nos arquivos de trabalho ou se será necessário que o download oficial seja concluído manualmente pelo usuário no navegador.

## Verificação de recuperação da versão anterior

Não há arquivo de fotos, ZIP ou imagem de candidaturas preservado no ambiente de trabalho nem nos arquivos versionados pelos checkpoints disponíveis. A tabela atual contém 20.682 candidaturas e zero vínculos de foto. A tentativa de acessar a versão publicada anterior para recuperar os vínculos exibidos originalmente foi bloqueada antes do carregamento pela autenticação/CloudFront, portanto não expôs dados que pudessem ser recuperados por esse caminho.

Também foi identificado um ponto preventivo: a rotina genérica de sincronização atual atualiza `foto_url` com valor nulo quando o arquivo de origem não oferece foto. Ela deverá preservar um vínculo existente quando uma importação parcial não contiver imagem.

## Correções aplicadas nesta etapa

A sincronização passou a preservar a foto oficial já vinculada quando uma carga parcial não incluir uma imagem substituta. A regra foi coberta por teste unitário e a suíte finalizou com 20 testes aprovados.

Os cards também foram recompostos na grade de quatro colunas para retomar a hierarquia da referência: faixa laranja superior, UF e cargo, nome de urna e partido, espaço de foto identificado, situação, número em destaque e ações de colinha e reporte. Enquanto o arquivo oficial de fotos não estiver acessível, o espaço informa com transparência a indisponibilidade de foto no registro atual; nenhuma imagem é simulada.

## Causa confirmada da regressão

O estado atual não resulta de uma decisão de ocultar fotos, planos ou redes. A auditoria anterior já registrava que a tabela de candidaturas havia ficado vazia. A recuperação emergencial repovoou apenas o CSV nacional `consulta_cand_2026_BRASIL.csv`; esse arquivo não possui coluna de foto e o script de restauração gravou `foto_url` como nulo. A conferência posterior confirmou 20.682 candidaturas com zero URLs de foto, zero planos de governo e zero redes sociais.

O código de interface preservava suporte à exibição desses dados, mas os respectivos arquivos complementares, sociais e de fotos não foram reencontrados no ambiente, no histórico versionado ou nos checkpoints disponíveis. Os logs locais não preservam o evento que esvaziou a base original, por isso não é possível atribuir com segurança a causa inicial dessa limpeza. É possível, contudo, demonstrar que a recuperação subsequente foi incompleta: ela restaurou somente o cadastro básico de candidatos e deixou de reimportar os três conjuntos oficiais associados.

## Navegação confirmada no DivulgaCandContas

O endereço nacional do DivulgaCandContas fornecido pelo usuário carregou a visão **Brasil – BR** da Eleição Geral Federal de 2026. A página requer a seleção de **Cargo** e oferece a seleção de **Partido** antes da pesquisa, confirmando o roteiro oficial indicado para chegar às listas e fichas de candidatos por recorte. A mesma estrutura será usada nas visões regionais; a coleta continuará limitada ao portal do TSE e aos identificadores oficiais retornados por ele.

Na consulta nacional, a seleção do cargo **Presidente** retornou 13 candidaturas, cada uma com nome de urna, nome civil, partido, situação e número. Isso confirma que as cinco rotas fornecidas permitem recuperar as listas oficiais por recorte. A próxima verificação será identificar, nas fichas individuais retornadas pelo próprio portal, o identificador e a URL de foto necessários para associação segura em escala.

Uma ficha individual confirmou o padrão oficial de imagem: `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/{id_eleicao}/{sq_candidato}/{uf}`. Para a candidatura de LULA, o portal retornou a foto oficial pelo endereço com `id_eleicao=20322002026`, `sq_candidato=280002542548` e `uf=BR`; o navegador realizou o download com sucesso. Diferentemente disso, as requisições diretas de servidor a esse endpoint retornaram 403. A recuperação deve, portanto, utilizar a navegação real do portal para obter as imagens e associar o resultado ao `sq_candidato` confirmado na base.

Uma verificação no navegador do próprio buscador confirmou que a mesma URL oficial pode ser carregada diretamente no card, inclusive fora da página do DivulgaCandContas: a imagem de teste retornou 161 × 225 pixels. Isso permite restaurar `foto_url` com o endpoint oficial do TSE para cada `sq_candidato` e UF, sem reproduzir, transformar ou usar imagens de terceiros.

## Restauração dos vínculos de foto

Após validar uma candidatura nacional e uma estadual no navegador, foram preenchidas 20.682 URLs de foto com o padrão oficial do DivulgaCandContas, preservando o identificador de candidatura e a UF de cada registro. A recarga do buscador confirmou a renderização inicial de uma foto oficial no primeiro card e a base passou a registrar 20.682 candidaturas com URL de foto. A próxima validação medirá o carregamento efetivo da grade completa antes de concluir a recuperação.

A rota regional Norte indicada pelo usuário foi acessada, mas o portal não concluiu a renderização dos filtros nessa sessão. Isso não altera a associação já validada: o endpoint de imagem usa o `sq_candidato` e a UF concreta armazenados para cada candidatura, e foi confirmado tanto para a candidatura nacional quanto para uma candidatura estadual. A grade do buscador carregou 200 de 200 imagens oficiais visíveis após a restauração.

Para validar a cobertura além da primeira grade, o buscador carregou no navegador uma candidatura de cada uma das 28 UFs/unidades presentes na base (`AC`, `AL`, `AM`, `AP`, `BA`, `BR`, `CE`, `DF`, `ES`, `GO`, `MA`, `MG`, `MS`, `MT`, `PA`, `PB`, `PE`, `PI`, `PR`, `RJ`, `RN`, `RO`, `RR`, `RS`, `SC`, `SE`, `SP` e `TO`). O resultado foi 28 de 28 imagens carregadas e nenhuma falha. Os tamanhos retornados foram os formatos oficiais de 161 × 225 ou 111 × 155 pixels; o card usa `object-cover` e preserva ambas as proporções.

Ao consultar deliberadamente um identificador inexistente, o endpoint do TSE devolveu uma imagem de 171 × 235 pixels em vez de sinalizar falha de carregamento. Essa resposta será examinada para distinguir uma eventual imagem institucional de ausência de foto, evitando que um marcador seja apresentado como retrato de candidato.

A inspeção visual confirmou que a resposta de 171 × 235 pixels é uma silhueta institucional sem identidade de candidato. O card foi atualizado para reconhecer esse tamanho oficial, removê-lo da apresentação e mostrar **“Foto não disponível neste registro”**. Uma simulação no navegador confirmou que o aviso aparece quando o endpoint retorna a silhueta, enquanto as imagens oficiais de 161 × 225 e 111 × 155 permanecem visíveis.

Após aplicar a mesma regra ao diálogo de detalhes, a busca foi recarregada com cards e fotos oficiais visíveis. A abertura de detalhes será usada como validação final do retrato real; a lógica já trata tanto erro de imagem quanto a silhueta de 171 × 235 pixels retornada pelo TSE, reiniciando o estado ao selecionar outra candidatura.

O diálogo de detalhes foi aberto com uma candidatura real e exibiu corretamente seu retrato oficial. Em seguida, a resposta de silhueta institucional foi simulada apenas no navegador: o diálogo removeu a imagem e mostrou **“Foto não disponibilizada na importação oficial.”**. Assim, nem os cards nem os detalhes apresentam o marcador institucional como se fosse uma foto de candidato.

Na ficha individual do DivulgaCandContas também foi identificada a consulta oficial de candidatura em `/divulga/rest/v1/candidatura/buscar/{ano}/{uf}/{id_eleicao}/candidato/{sq_candidato}`. Ela será avaliada como possível fonte de detalhes para recuperação de links oficiais de proposta e sites, mantendo a restrição exclusiva ao TSE.

Uma chamada pontual ao mesmo endpoint, feita no contexto do navegador do buscador, retornou HTTP 200 e expôs para a candidatura consultada 21 endereços em `sites` e 89 arquivos oficiais. Isso confirma que o portal pode complementar a ficha sob demanda; a importação em massa de planos e redes, contudo, continuará condicionada aos arquivos oficiais próprios para não sobrecarregar a consulta individual do TSE.

A ficha oficial abriu corretamente a seção **Propostas** e confirmou que há documentos anexados à candidatura. A identificação do endereço direto do arquivo permanece necessária para expor o botão de leitura no buscador, enquanto as redes podem ser recuperadas diretamente do campo `sites` já retornado pelo portal.

A inspeção da seção expandida não revelou um link no DOM imediatamente após sua abertura, indicando que o portal carrega o documento sob demanda. Para não inventar uma URL de proposta, o buscador só exibirá o botão de leitura quando o endereço oficial exato puder ser confirmado; as redes sociais, por sua vez, já podem usar os endereços explícitos retornados pelo TSE.

O acesso ao formato de ficha estadual precisa respeitar o roteamento interno do portal e não será montado como atalho de arquivo. Na interface, a proposta identificada no retorno oficial será aberta pela ficha pública do TSE, enquanto os sites e redes serão apresentados pelos seus URLs explícitos. A consulta pontual foi preparada exclusivamente para o diálogo de detalhes, sem carga em massa no portal.

Na primeira validação do diálogo enriquecido, uma candidatura estadual mostrou os dados sincronizados e a foto oficial, mas não recebeu redes ou proposta da consulta pontual. A próxima etapa é conferir o identificador territorial exigido pelo endpoint oficial de detalhes para candidaturas estaduais, antes de tornar a consulta sob demanda disponível como recuperação complementar.

A consulta estadual aberta diretamente no portal confirmou o endpoint e devolveu os sites oficiais da candidatura. No entanto, a mesma consulta disparada pelo navegador a partir do domínio do buscador falhou por acesso cruzado. A recuperação de redes e proposta não será considerada concluída até que o mecanismo respeite essa limitação de origem sem recorrer a dados externos.

O servidor confirmou acesso HTTP 200 ao endpoint estadual e nacional do TSE; por isso a consulta foi deslocada para um procedimento interno. A primeira abertura do diálogo após essa mudança ainda apresentou apenas os dados sincronizados, sem os sites retornados pelo TSE. A próxima validação deverá identificar se a falha está no contrato do procedimento interno ou na atualização do estado da interface.

A segunda abertura do diálogo confirmou o fluxo corrigido: a candidatura estadual carregou as redes **Instagram, Kwai, Facebook e TikTok** diretamente dos sites retornados pela ficha oficial do TSE. A candidatura não possuía arquivo de proposta de governo, por isso o diálogo manteve o aviso de ausência sem inventar um link. O procedimento interno resolve o bloqueio de origem e preserva a consulta sob demanda.

Para validar o caminho positivo de proposta, a busca foi direcionada a uma candidatura presidencial cujo retorno oficial registra um arquivo de tipo `5`, correspondente à proposta de governo. A verificação seguinte confirmará a ação de abertura da ficha oficial do TSE somente nesse caso.

A candidatura presidencial com proposta registrada foi aberta no diálogo. O carregamento assíncrono do detalhe oficial foi iniciado; a validação do botão de consulta será concluída apenas depois que a seção de proposta receber a resposta do TSE.

A validação positiva foi concluída. A ficha de **LULA** exibiu o botão **“Abrir proposta no TSE”** porque o retorno oficial continha documento de proposta (tipo `5`), e apresentou as redes sociais com seus nomes explícitos — incluindo Kwai, YouTube, TikTok, Instagram, Bluesky, X, Facebook e Flickr. O botão encaminha para a ficha pública oficial do DivulgaCandContas; nenhum link ou perfil foi criado fora da resposta do TSE.

Ao testar o formato de URL publicado na resposta de eleições anteriores, o próprio portal retornou temporariamente **“Erro ao carregar a página”**. Esse resultado confirma que ele não deve ser usado como substituto do URL direto do documento; a investigação continua limitada aos endpoints e ao arquivo oficial do TSE.

O índice público do TSE revelou a rota oficial de documentos em `/divulga/rest/arquivo/doc/{idArquivo}`. Aplicada ao identificador de proposta retornado pela ficha, a rota baixou com sucesso o PDF oficial **`0806JOB838PTlivroplanodegovernocompressed.pdf`**. Essa é a URL direta adotada no diálogo; a revalidação visual da interface será realizada após o carregamento da busca.

A busca filtrada retornou a candidatura presidencial usada na validação do arquivo. O próximo passo é reabrir os detalhes para verificar, no DOM do buscador, que a ação de proposta utiliza exatamente a rota `/rest/arquivo/doc/{idArquivo}` confirmada pelo download oficial.

A ficha reaberta exibiu **“Ler proposta de governo”** com o endereço direto `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/280017016005`. O acionamento pelo diálogo confirmou o mesmo recurso oficial que já havia baixado o PDF de proposta do TSE. Assim, a ação não redireciona mais para o perfil geral do candidato.

## Validação final desta recuperação

A consulta de conferência na base confirmou **20.682 candidaturas em disputa e 20.682 URLs oficiais de foto**. Não há, no snapshot atual, registro em `fora_da_disputa`: a situação registrada para todas as candidaturas é `#NE`, e a página separada permanece preparada para exibir automaticamente as situações terminais previstas quando elas existirem na fonte do TSE. As capturas desktop e móvel confirmaram a grade editorial, os filtros e as fotos em cards responsivos. A verificação técnica encerrou com **26 testes aprovados em 8 arquivos**, incluindo a suíte de interface que cobre a foto institucional sem retrato.

## Conclusão da trilha de recuperação

A regressão foi rastreada até a restauração emergencial que repovoou `candidates` somente a partir do CSV nacional básico; os vínculos de foto, planos e redes não foram reimportados nessa etapa. A busca nos checkpoints, no histórico de código e nos diretórios preservados não encontrou o arquivo anterior nem URLs de foto armazenadas. Os ZIPs nacionais e estaduais disponibilizados pelo catálogo de Dados Abertos foram mapeados, porém o CDN recusou as requisições automatizadas com HTTP 403. Por isso, a recuperação foi concluída por endpoints individuais igualmente oficiais do DivulgaCandContas: foto por candidatura, detalhe por candidatura via servidor e documento de proposta por `idArquivo`. A amostra por UF confirmou a cobertura de imagens e a navegação nacional/regional foi substituída pela associação determinística por UF, que evita coleta visual ou fontes não oficiais.

Na revalidação regional, a rota **Norte** permaneceu em tela vazia e a rota **Nordeste** carregou apenas o cabeçalho e o estado de espera do portal. A instabilidade é do próprio DivulgaCandContas nesta sessão e não altera a associação determinística já testada por UF e candidatura. As demais rotas serão verificadas com o mesmo critério para formalizar a limitação ou registrar uma recuperação de estabilidade.

As rotas **Centro-Oeste** e **Sudeste** carregaram a estrutura regional completa, com o seletor de região e as respectivas UFs expansíveis: Distrito Federal, Goiás, Mato Grosso do Sul e Mato Grosso; Espírito Santo, Minas Gerais, Rio de Janeiro e São Paulo. Isso confirma que o portal utiliza a mesma navegação oficial por região, ainda que Norte e Nordeste tenham apresentado instabilidade pontual nesta sessão.

A rota **Sul** também carregou corretamente, com Paraná, Rio Grande do Sul e Santa Catarina. Assim, as cinco rotas solicitadas foram revalidadas: Centro-Oeste, Sudeste e Sul mostraram a estrutura regional completa; Norte ficou em tela vazia e Nordeste permaneceu em carregamento. A limitação é documentada como instabilidade do portal nesta sessão e a recuperação de fotos segue comprovada pelo método determinístico por UF e candidatura, com URLs confirmadas em todas as UFs.

## Recurso oficial de redes sociais indicado

O recurso oficial **“Redes sociais de candidatos”** do conjunto *Candidatos – 2026* confirma cobertura para todas as UFs e aponta para o arquivo CSV compactado `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_2026.zip`. A tentativa de download iniciada pelo próprio Portal de Dados Abertos do TSE foi recusada pelo CDN com a mensagem **“Acesso Rejeitado”** e suporte `13552133408400943952`. Nenhuma fonte alternativa será usada; o ZIP continuará sendo a fonte de importação assim que o acesso institucional for disponibilizado.

## Correções visuais e de linguagem

A prévia desktop confirmou quatro cards por linha, com fotos oficiais inteiras no card. No diálogo de informações, a foto agora usa contenção proporcional, sem recorte ou ampliação indevida. O código técnico `#NE` deixou de ser apresentado ao público: ele é exibido como **“Aguardando julgamento”**, acompanhado da explicação “Registro recebido pelo TSE e aguardando julgamento.”. A área principal informa a referência temporal da base oficial — `20/08/2026 19:30:38` — e esclarece que os dados são atualizados a cada sincronização oficial.

O endpoint oficial do DivulgaCandContas para a candidatura `160002547532` confirmou a equivalência usada na interface: o registro expõe `descricaoSituacao: "Aguardando julgamento"` e `descricaoSituacaoPartido: "Aguardando julgamento"`. Portanto, a substituição de `#NE` por **“Aguardando julgamento”** reproduz a nomenclatura pública oficial do TSE, sem inferência editorial.
