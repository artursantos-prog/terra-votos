# Eleições no Terra — documentação integral do projeto

> **Finalidade.** Este documento descreve a versão operacional do Buscador de Candidaturas “Eleições no Terra”. Ele consolida arquitetura, regras editoriais, fontes, automações, integrações, rotas e procedimentos de operação. Nenhum segredo, token, credencial, dado de sessão, reporte privado ou dado pessoal é incluído.

## 1. Visão geral

O projeto é um buscador público de candidaturas para as Eleições 2026, integrado exclusivamente às fontes oficiais do **Tribunal Superior Eleitoral (TSE)**. A experiência pública permite buscar candidaturas, abrir detalhes oficiais, montar e imprimir uma colinha eleitoral, compartilhar essa colinha e enviar reportes ou comentários. Há uma página separada para candidaturas fora da disputa e um painel protegido apenas para o responsável tratar os reportes recebidos.

| Propriedade | Definição |
| --- | --- |
| Nome público | Eleições no Terra |
| Projeto | `buscados-de-numeros-v2` |
| Página principal | `https://buscadorv2-pzlzvemq.manus.space/` |
| Candidaturas fora da disputa | `https://buscadorv2-pzlzvemq.manus.space/fora-da-disputa` |
| Embed principal | `https://buscadorv2-pzlzvemq.manus.space/embed` |
| Embed Fora da Disputa | `https://buscadorv2-pzlzvemq.manus.space/embed/fora-da-disputa` |
| Painel protegido | `https://buscadorv2-pzlzvemq.manus.space/owner/reports` |
| Espelho de contingência | `https://artursantos-prog.github.io/terra-votos/` |
| Repositório | `https://github.com/artursantos-prog/terra-votos` |

## 2. Princípios obrigatórios de dados

Todo dado eleitoral exibido ou persistido vem do TSE. O produto não consulta, importa ou complementa dados eleitorais por sites jornalísticos, redes sociais, enciclopédias, diretórios comerciais ou fontes não oficiais.

As fontes autorizadas para o snapshot são os três arquivos distribuídos pelo TSE:

1. `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip`;
2. `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand_complementar/consulta_cand_complementar_2026.zip`;
3. `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_2026.zip`.

O [DivulgaCandContas](https://divulgacandcontas.tse.jus.br/divulga/#/home) fornece o detalhe oficial complementar de cada candidatura, incluindo situação, fotografia, redes sociais e documento de proposta quando existir. A foto é referenciada pelo endpoint oficial individual do TSE. As redes exibidas publicamente são limitadas a **X, Instagram, Facebook, TikTok e YouTube**; a ausência de uma rede não é preenchida artificialmente.

## 3. Arquitetura técnica

O projeto é uma aplicação web full-stack em TypeScript. O frontend é público, responsivo e editorial; o backend oferece procedimentos tipados, persistência e o fluxo de sincronização. O banco armazena metadados eleitorais e administrativos, enquanto arquivos não são gravados localmente como fonte de verdade.

| Camada | Tecnologia | Responsabilidade |
| --- | --- | --- |
| Interface | React 19, Tailwind CSS 4, Lora e Manrope | Busca, cards, colinha, embeds, formulários e painel protegido. |
| Navegação | Wouter | Rotas públicas, embeds e rota protegida do painel. |
| API | Express 4 e tRPC 11 | Contratos tipados para candidatos, reportes, feedback e autenticação. |
| Banco | MySQL/TiDB com Drizzle ORM | Candidaturas, redes, planos, chapas, reportes, feedback e estado da sincronização. |
| Autenticação | Manus OAuth | Acesso exclusivo do responsável ao painel `/owner/reports`. |
| Testes | Vitest | Regras de importação, apresentação, reportes, autenticação e compartilhamento. |
| Hospedagem | Manus | Página principal, API, banco e publicação automática por checkpoint. |

Os principais arquivos de implementação são:

| Arquivo | Conteúdo |
| --- | --- |
| `client/src/components/CandidateSearch.tsx` | Busca, filtros, paginação, colinha e compartilhamento. |
| `client/src/components/CandidateCard.tsx` | Card público, situação, vínculo de chapa e “Ver nova candidatura”. |
| `client/src/components/CandidateDetailsDialog.tsx` | Foto, situação, plano, redes e integrantes de chapa oficiais. |
| `client/src/components/OwnerReports.tsx` | Fluxo visual do painel de reportes. |
| `server/electionSync.ts` | Importação dos ZIPs autorizados, reconciliação e alertas. |
| `server/db.ts` | Consultas, paginação, persistência e vínculos de candidatura. |
| `server/routers.ts` | Procedimentos tRPC públicos e protegidos. |
| `server/githubFallback.ts` | Geração do espelho estático público no GitHub Pages. |
| `shared/officialTseDetails.ts` | Construção das URLs oficiais do DivulgaCand. |
| `drizzle/schema.ts` | Modelo de dados e esquema Drizzle. |

## 4. Recursos públicos

### Busca e filtros

A busca pública possui filtros por nome, UF, cargo e partido. O estado `BR` não aparece como UF, pois não é um estado; candidaturas nacionais continuam acessíveis ao filtrar pelo cargo de Presidente. A paginação mostra até **12 candidaturas por página** e os cards usam uma grade de quatro colunas em telas amplas.

Os cargos seguem a ordem eleitoral definida no produto: Presidente, Governador, Senador, Deputado Federal e Deputado Estadual ou Distrital. Vices e suplentes não são selecionáveis diretamente; eles aparecem vinculados ao titular oficial.

### Detalhe de candidatura

O botão **Informações** abre o detalhe do registro. Quando presentes no TSE, o usuário vê fotografia, situação, proposta de governo, integrantes de chapa e redes sociais permitidas. O botão de proposta abre diretamente o documento oficial do TSE em nova guia, sem encaminhar apenas para a ficha geral.

### Colinha eleitoral

A colinha respeita as vagas votáveis: um Presidente, um Governador, dois Senadores, um Deputado Federal e um Deputado Estadual ou Distrital. Quando a vaga de um cargo já está ocupada, a interface solicita a substituição em vez de permitir uma seleção inconsistente. A colinha pode ser impressa com a identidade visual da página.

O botão único **Compartilhar** contém as opções WhatsApp e Instagram. Em dispositivos compatíveis, o WhatsApp recebe o texto da colinha por deep link, com fallback web. Para Instagram, a imagem da colinha é preparada e baixada, o aplicativo é aberto quando o sistema permite e há fallback seguro para o site. Navegadores não permitem anexar automaticamente uma imagem ao compositor do Instagram; a publicação final permanece uma ação do usuário no aplicativo.

### Fora da Disputa e nova candidatura

A rota `/fora-da-disputa` reúne apenas registros que o TSE classifica em situação terminal, como Indeferido, Renúncia, Cassado, Cancelado, Falecido ou Pedido não conhecido. Quando os identificadores oficiais comprovam que a mesma pessoa possui **uma única candidatura vigente**, o card exibe **Ver nova candidatura**. Esse botão abre o detalhe da candidatura atual, sem inferir relação apenas por igualdade de nome.

Para proteger a privacidade, a relação usa uma chave interna pseudonimizada derivada do identificador oficial presente no arquivo do TSE. O identificador original não é exposto na interface ou nas APIs públicas.

### Reportes e comentários

Cada card oferece **Reportar erro**. Na busca em disputa, o usuário pode apontar que a pessoa não está mais concorrendo ou informar dado incorreto; na rota Fora da Disputa, a alternativa equivalente é “O candidato está concorrendo”. O rodapé tem **Enviar comentário** para críticas e sugestões sobre a página. Ambas as entradas são enviadas ao responsável por e-mail e ficam disponíveis no painel protegido.

## 5. Painel do responsável

O painel é protegido por OAuth e fica em `/owner/reports`. Após a autenticação, o retorno é preservado com segurança para a própria rota. O painel mostra reportes e sugestões; nos reportes, as ações públicas administrativas são:

| Ação | Efeito |
| --- | --- |
| Consultar TSE | Registra a evidência e abre a ficha individual do DivulgaCand em nova guia. |
| Resolver | Marca o item administrativo como resolvido. |
| Excluir | Remove o reporte ou sugestão administrativa, sem alterar qualquer candidatura. |

Excluir um reporte não apaga nem modifica dados eleitorais. A evidência eleitoral vem do TSE e a reconciliação diária continua sendo autoritativa.

## 6. Sincronização diária e alertas

Há uma única rotina oficial de sincronização, programada para **09h no horário de Brasília**. Ela executa a importação a partir dos três ZIPs permitidos, atualiza a situação de candidaturas pelo DivulgaCand quando aplicável, gera o espelho GitHub Pages e aciona o alerta por e-mail ao responsável.

| Item | Configuração |
| --- | --- |
| Tarefa oficial | `Dd9Cdys2YKfPHTpre9Kpja` |
| Endpoint | `POST /api/scheduled/election-sync-import` |
| Cron UTC | `0 0 12 * * *` |
| Horário local | 09h em Brasília |
| Acompanhamento posterior | Uma única rotina, às 09h30 em Brasília, sem concorrência de cron ou processos locais. |

Depois de cada snapshot, o produto mantém o último conjunto oficial funcional em caso de indisponibilidade do TSE ou da plataforma. O aviso público distingue uma falha de atualização de uma ausência de dados.

O e-mail deve detalhar o resultado, inclusões, alterações e remoções verificáveis. Se o callback do agendador exceder o prazo, não se deve declarar sucesso apenas pelo status do agendador: devem ser verificados o estado gravado no banco, a página, o embed, o espelho GitHub e o e-mail.

## 7. GitHub e contingência

O repositório possui duas responsabilidades separadas:

| Branch | Conteúdo | Regra |
| --- | --- | --- |
| `main` | Espelho público estático do GitHub Pages (`index.html` e `data.json`) | Não contém painel, banco, logs, segredos ou código interno. |
| `source-code` | Código completo versionável, migrações, testes e documentação | Atualizada após checkpoints e ciclos oficiais confirmados. |

O espelho público é gerado exclusivamente a partir do snapshot TSE persistido. O portal que incorpora o embed não precisa ser editado após uma sincronização: a URL do iframe continua a mesma e serve o estado mais recente publicado.

Não devem ser versionados: `.env`, tokens, chaves, banco produtivo, reportes, sugestões, logs, builds, caches, ZIPs baixados do TSE e scripts operacionais transitórios.

## 8. Estado auditado em 27/08/2026

O ciclo de 27/08/2026 persistiu o snapshot às 09h13 de Brasília, com arquivo TSE gerado em 26/08/2026 às 19h30. Foram registrados **20.765** registros de candidatura e **42.717** perfis sociais; destes, **19.610** eram candidaturas votáveis na busca e **280** estavam em Fora da Disputa.

A comparação somente leitura entre o CSV nacional oficial e a base persistida retornou **20.765 identificadores em cada lado, zero ausentes e zero adicionais**. Página pública, os dois embeds, painel protegido, GitHub Pages e a branch `source-code` foram verificados. O callback do agendador foi marcado como timeout, mas o snapshot foi persistido e o responsável confirmou o e-mail; essa distinção está documentada em `auditoria_final_2026-08-27.md`.

## 9. Operação segura

Para uma reposição manual excepcional, use sempre o navegador para baixar os três ZIPs oficiais, envie os arquivos ao fluxo autorizado e informe as URLs de upload ao endpoint de importação. Não use fontes alternativas, não alimente o banco manualmente com candidaturas e não use `curl` para baixar os arquivos eleitorais.

Antes de publicar alterações de código, execute:

```bash
pnpm check
pnpm vitest run --exclude server/resend.test.ts
```

Após uma mudança funcional, salve um checkpoint e atualize somente `source-code`. A branch `main` deve continuar dedicada ao GitHub Pages.

## 10. Referências públicas

1. [Dados abertos do TSE — Candidatos 2026](https://dadosabertos.tse.jus.br/dataset/candidatos-2026)
2. [DivulgaCandContas — TSE](https://divulgacandcontas.tse.jus.br/divulga/#/home)
3. [Repositório público do projeto](https://github.com/artursantos-prog/terra-votos)
4. [Espelho público no GitHub Pages](https://artursantos-prog.github.io/terra-votos/)

---

**Última versão auditada:** checkpoint `6b0ede32`, 27/08/2026.
