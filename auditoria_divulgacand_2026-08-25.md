# Conferência aprofundada — DivulgaCand, 25 de agosto de 2026

## Detalhe presidencial consultado

Foi consultado diretamente o detalhe oficial de Luiz Inácio Lula da Silva no endpoint do DivulgaCand para 2026, Brasil, candidatura `280002542548`:

`https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/2026/BR/20322002026/candidato/280002542548`

O retorno oficial expôs a situação textual **Aguardando Julgamento**, campos de redes sociais, membros de vice e a lista de arquivos da candidatura. A resposta confirma que planos e demais documentos precisam ser identificados no conjunto `arquivos` pelo tipo e pela denominação publicada pelo TSE; a interface deve apresentar apenas o primeiro documento classificado como proposta de governo e sempre pelo link direto do arquivo.

Essa primeira evidência não permite inferir a situação de todas as candidaturas: a conferência por situação exige cotejo do snapshot oficial completo com os detalhes atuais do DivulgaCand, sem afirmar alterações que o TSE ainda não tenha publicado.

## Aplicação e validação posterior

A leitura oficial de 211 candidaturas ao Executivo retornou HTTP 200 em todas as consultas. Foram localizadas 35 situações **Deferido**, uma **Deferido com recurso**, duas **Renúncia** e uma **Indeferido em prazo recursal ou com recurso**, além de 172 registros ainda em **Aguardando julgamento**. Essas situações, planos e vínculos foram persistidos diretamente do DivulgaCand; duas renúncias passaram para a área separada de candidaturas fora da disputa.

No detalhe presidencial validado, o plano está disponível exclusivamente em **Informações** por documento direto do TSE, o vice aparece como **Vice** e as redes exibidas são limitadas a Facebook, Instagram, TikTok, X e YouTube.

## Consulta em escala por cargo

A rota nacional do DivulgaCand confirmou a lista oficial de candidaturas por região e exige a seleção de um cargo antes da pesquisa. Essa interface suporta a reconciliação por cargo, mas não divulga todas as situações em uma única tela nacional sem filtro. A continuação da auditoria deve usar as consultas oficiais de listagem por cargo/região ou um endpoint equivalente, preservando o limite operacional da rotina diária.

A inspeção da própria pesquisa oficial identificou o endpoint de listagem por cargo: `https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/listar/2026/BR/20322002026/1/candidatos`. A resposta contém uma coleção `candidatos` com o identificador `id`, a UF da candidatura, o cargo e `descricaoSituacao`. Portanto, essa listagem oficial é adequada para reconciliar situações em escala, sem repetir um detalhe individual para cada candidatura.

## Reconciliação integral por UF e cargo

Em 25 de agosto, a rotina consultou o catálogo de cargos e as listas de candidaturas das 28 unidades disponíveis no DivulgaCand, usando o padrão oficial abaixo para cada UF e código de cargo:

`https://divulgacandcontas.tse.jus.br/divulga/rest/v1/eleicao/listar/municipios/20322002026/{UF}/cargos`

`https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/listar/2026/{UF}/20322002026/{codigoCargo}/candidatos`

A operação reuniu situação atual para as **20.727 candidaturas** do snapshot oficial. A distribuição persistida após a reconciliação foi: 14.939 em `#NE`, 172 em **Aguardando julgamento**, 5.329 **Deferido**, 10 **Deferido com recurso**, 236 **Renúncia**, 26 **Indeferido em prazo recursal ou com recurso**, 13 **Indeferido**, um **Pedido não conhecido** e um **Cancelado**.

As situações terminais foram direcionadas para a categoria `fora_da_disputa`. Isso inclui tanto “Indeferido” quanto a variante “Indeferido em prazo recursal ou com recurso”; “Deferido com recurso” continua em `em_disputa`. A área pública exibiu 269 candidaturas votadas fora da disputa; os oito demais registros terminais são vices e permanecem vinculados aos titulares, sem seleção direta.

## Resiliência da sincronização

A leitura é concorrente, com limite controlado por UF e por cargo, e concluiu a reconciliação de listas em menos de 45 segundos no teste manual. Se uma lista de cargo falhar, as situações dos demais cargos da mesma UF são preservadas e aplicadas. Durante a troca do ZIP diário, se o arquivo ainda trouxer apenas `#NE` ou “Aguardando julgamento”, uma situação específica já obtida do DivulgaCand é mantida até que a lista oficial atual consiga substituí-la. Assim, uma falha parcial não rebaixa a informação oficial mais detalhada já confirmada.
