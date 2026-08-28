# Eleições no Terra — Buscador de Candidaturas 2026

Aplicação eleitoral do Terra para consulta de candidaturas, montagem de colinha, visualização de candidaturas fora da disputa, incorporação por iframe e tratamento administrativo de reportes. A fonte de dados eleitorais é exclusivamente o Tribunal Superior Eleitoral (TSE).

## Repositório e ramificações

O repositório público é [`artursantos-prog/terra-votos`](https://github.com/artursantos-prog/terra-votos).

| Ramificação | Finalidade | Conteúdo |
| --- | --- | --- |
| `main` | Continuidade pública | Espelho estático de contingência servido pelo GitHub Pages. |
| `source-code` | Código completo | Aplicação React, servidor Express/tRPC, esquema e migrações Drizzle, testes, scripts e documentação operacional. |

O código do produto deve ser consultado na branch [`source-code`](https://github.com/artursantos-prog/terra-votos/tree/source-code). A separação preserva a disponibilidade do espelho público: a publicação de código não substitui o `index.html` nem o `data.json` do GitHub Pages.

## Escopo versionado

| Área | Local no repositório | Conteúdo preservado |
| --- | --- | --- |
| Interface pública e painel | `client/src/` | Busca, filtros, cards, detalhes, colinha, impressão, embeds e painel privado de reportes. |
| Servidor e regras eleitorais | `server/` | tRPC, importação oficial do TSE, integração DivulgaCand, e-mail, contingência GitHub e testes. |
| Tipos compartilhados | `shared/` | Contratos de OAuth, tipos e constantes comuns. |
| Banco de dados | `drizzle/` | Esquema, relações, metadados e migrações SQL, inclusive a auditoria de reportes. |
| Configuração de execução | Arquivos na raiz | `package.json`, `pnpm-lock.yaml`, Vite, Vitest, TypeScript, Drizzle, Prettier e `.gitignore`. |
| Documentação e auditorias | Arquivos `*.md` e `*.json` de evidência | Fontes TSE, metodologia, embed, contingência, auditorias de dados/interface e decisões operacionais. |
| Scripts rastreados | `scripts/` | Utilitários de manutenção que fazem parte do histórico técnico do projeto. |

## O que não é versionado

Os itens abaixo são deliberadamente mantidos fora do GitHub; sua ausência é uma proteção, não uma omissão de código.

| Item excluído | Motivo |
| --- | --- |
| Arquivos `.env` e valores de chaves/tokens | Credenciais de banco, OAuth, e-mail e GitHub não podem ser públicos. O código referencia somente nomes de variáveis de ambiente. |
| `node_modules/`, `dist/`, caches e cobertura | Dependências e artefatos reproduzíveis por `pnpm install`, `pnpm build` e `pnpm test`. |
| Logs, arquivos temporários e metadados locais | Podem conter dados operacionais, diagnósticos transitórios ou identificadores de sessão. |
| Dados do banco de produção e mensagens de usuários | Proteção de dados e integridade: o esquema/migrações são versionados, mas conteúdo de usuários não é exportado. |
| ZIPs baixados do TSE e snapshots transitórios | São fontes externas oficiais consumidas no ciclo de sincronização; não são necessários para executar o código e evitam duplicação de dados públicos volumosos. |

## Fontes oficiais e sincronização

A atualização eleitoral é diária às **09h, horário de Brasília**. O importador aceita exclusivamente estes três arquivos oficiais do TSE:

1. `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip`
2. `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand_complementar/consulta_cand_complementar_2026.zip`
3. `https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_2026.zip`

Situações, fotos, documentos de propostas, vices e suplentes são confirmados somente com endpoints oficiais do DivulgaCand. O espelho GitHub Pages é atualizado após uma sincronização bem-sucedida; a aplicação principal e os embeds usam a mesma base publicada.

## Atualização diária da branch `source-code`

Depois de cada sincronização oficial bem-sucedida, o acompanhamento diário verifica a branch `source-code`, confirma que ela aponta para o último commit do projeto e a atualiza quando houver mudança rastreada. A verificação inclui a ausência de arquivos de credenciais e a preservação da branch `main` do GitHub Pages. Assim, código, migrações, testes, configurações e documentação evoluem junto com o projeto sem publicar dados privados ou artefatos transitórios.

## Desenvolvimento local

```bash
git clone --branch source-code https://github.com/artursantos-prog/terra-votos.git
cd terra-votos
pnpm install
pnpm dev
```

Comandos de validação:

```bash
pnpm check
pnpm test
pnpm build
```

As variáveis de ambiente são configuradas no ambiente de implantação. Os nomes utilizados incluem `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `OWNER_OPEN_ID` e `GITHUB_FALLBACK_TOKEN`; nunca inclua seus valores em arquivos versionados.

## Endereços publicados

| Serviço | Endereço |
| --- | --- |
| Buscador principal | https://buscadorv2-pzlzvemq.manus.space |
| Embed | https://buscadorv2-pzlzvemq.manus.space/embed |
| Fora da Disputa | https://buscadorv2-pzlzvemq.manus.space/fora-da-disputa |
| Painel privado | https://buscadorv2-pzlzvemq.manus.space/owner/reports |
| Espelho GitHub Pages | https://artursantos-prog.github.io/terra-votos/ |

## Licença

MIT. Os dados eleitorais exibidos permanecem sujeitos às regras de uso e atualização do TSE.
