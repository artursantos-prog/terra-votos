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

## Verificação de fluxos públicos

Foram validados no navegador os filtros por cargo, a seleção de candidatura na colinha, a persistência local da seleção e a exportação de um PDF. O PDF gerado continha a candidatura selecionada, número de urna, partido e UF. O botão de reporte abre a janela **“Reportar erro ou inconsistência”** e enumera os campos que podem ser apontados para revisão. A área `/revisao` exige autenticação antes de expor o painel privado.

O card presidencial foi testado com a URL `rest/arquivo/doc/280017113380`; a ação baixou um PDF do TSE, confirmando que o botão abre o documento, e não apenas o perfil do candidato. O iframe passou a consultar o snapshot ativo a cada cinco minutos e ao receber foco, de modo que o mesmo snippet de embed passa a refletir a nova base após uma sincronização publicada.

## Amostra de destinos externos e limitação de painel

Foram testadas duas URLs de redes sociais declaradas no arquivo oficial do TSE. A referência do Instagram de **Beatriz Cameli** foi encaminhada ao domínio `instagram.com` e à sua tela de acesso, comportamento esperado para conteúdo restrito pela plataforma. A URL de Facebook declarada para a candidatura de **Bira Vasconcelos** redirecionou para um perfil público no domínio `facebook.com`. Os links permaneceram URLs declaradas pelo TSE; a auditoria confirma o destino técnico, não autentica nem avalia a titularidade de conteúdos hospedados pelas plataformas.

O endereço `/revisao` foi verificado como protegido: sem sessão, ele mostra apenas a entrada de autenticação e não expõe a fila editorial. A inspeção do conteúdo autenticado não foi executada porque o provedor de identidade solicitou um CAPTCHA externo. Nenhuma credencial foi simulada e nenhum dado foi criado ou alterado para contornar essa proteção.

## Atualização recorrente e embed

A tarefa recorrente ativa `eleicoes-2026-sync-v2` está configurada para `0 0 0,12 * * *` (UTC), equivalente a **09h e 21h BRT**, e chama `POST /api/scheduled/election-sync`. A configuração persistida do projeto aponta para o mesmo identificador da tarefa. O endpoint está registrado antes das rotas tRPC e do servidor de arquivos estáticos; chamadas sem a credencial do agendador recebem `403`, como esperado. A última sincronização válida registrada permanece como snapshot ativo, portanto uma falha não substitui a base pública.

Após a revisão final da configuração, a tarefa assistida `Sincronização eleitoral assistida` foi confirmada como **ativa**, em modo **full_auto**, com cron `0 0 0,12 * * *` e playbook restrito aos três arquivos oficiais do TSE. Ela cria uma execução isolada a cada ciclo, usa o navegador para contornar bloqueios pontuais ao CDN no servidor e publica somente uma importação cujo endpoint responda com sucesso.

A tentativa de observar uma execução de intervalo curto não gerou um evento de histórico dentro desta sessão, embora a tarefa regular esteja ativa e corretamente vinculada. Não foi simulada uma credencial de cron nem forçado um resultado. A próxima janela regular deve ser acompanhada pelo painel de tarefas do projeto; o histórico de sincronizações do painel editorial e `election_sync_runs` indicam o sucesso ou a falha. Quando houver sucesso, a URL pública do iframe não muda: novas visitas usam o snapshot ativo e iframes abertos o consultam em até cinco minutos.

## Importação oficial ponta a ponta

Em 20 de agosto de 2026, os três ZIPs oficiais de candidaturas, julgamento complementar e redes sociais foram obtidos pelo navegador, enviados ao armazenamento temporário confiável e processados pela rota de importação segura. A execução foi concluída com **20.481 candidaturas elegíveis** e **14.261 perfis com rede social declarada**. O snapshot resultante foi registrado como ativo no banco. A coleta confirmou uma correção necessária no parser: o arquivo de redes possui a coluna ordinal `NR_ORDEM_REDE_SOCIAL` antes de `DS_URL`; a implementação passou a selecionar explicitamente `DS_URL`, em vez de deduzir a primeira coluna que menciona rede social.

Na verificação posterior, a navegação direta ao domínio publicado redirecionou para autenticação Manus. Essa condição será tratada como bloqueio de acesso público, pois um embed não pode depender de sessão do editor.

Na tentativa de alterar essa visibilidade pela conta proprietária, o fluxo chegou ao provedor Google, mas a autenticação recusou a senha da conta. Essa etapa é controlada pelo provedor e pela plataforma de publicação; não foram feitas tentativas adicionais de senha nem qualquer contorno de segurança. Até a regularização da vinculação, o código e o snapshot permanecem publicados, mas o domínio continua protegido antes de o aplicativo receber a requisição.

## Auditoria da primeira execução da rotina diária

Em 26 de agosto de 2026, foi consultado o identificador fornecido no playbook, `Dd9Cdys2YKfPHTpre9Kpja`. A plataforma retornou `permission_denied`, informando que essa tarefa não pertence a este projeto; portanto, não foi possível tratá-la como evidência da rotina do buscador. A listagem do projeto identificou uma única tarefa Heartbeat ativa: `eleicoes-2026-sync-v2`, identificador `EQQoib72nk2GnK2bjtTp7t`, com chamada `POST /api/scheduled/election-sync` em `0 0 0,12 * * *` (UTC).

A execução mais recente dessa tarefa ocorreu às **2026-08-25 00:05:51 UTC** e terminou às **2026-08-25 00:05:52 UTC** com falha HTTP `404`. As duas execuções anteriores também retornaram `404`; as falhas de 22 de agosto retornaram `500` com evidência de bloqueio `HTTP 403` pela API pública do TSE. A consulta filtrada por execuções bem-sucedidas retornou **zero registros**. Por isso, não há resposta de sucesso que permita confirmar `emailAlertSent: true`, nem há totais importados atribuíveis a essa rotina diária.

Como verificação de preservação, a configuração continua apontando para o snapshot ativo `300001`, cuja última publicação bem-sucedida registrada foi em **2026-08-20 17:31:18**. Esse snapshot anterior contém 20.639 candidaturas processadas, 20.481 candidaturas elegíveis e 14.261 perfis com rede social declarada. Esses números descrevem a última base válida, não uma importação da execução diária falha. Nenhuma fonte, dado publicado, rotina diária ou agenda concorrente foi alterada durante esta auditoria.
