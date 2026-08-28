# Política de publicação do código-fonte no GitHub

Este documento estabelece o escopo verificável da branch `source-code` do repositório `artursantos-prog/terra-votos`.

## Objetivo

Manter no GitHub a versão completa e reproduzível do projeto, sem interferir no GitHub Pages da branch `main` e sem expor credenciais, dados privados ou artefatos transitórios.

## Conteúdo obrigatório da branch `source-code`

| Grupo | Itens obrigatórios |
| --- | --- |
| Aplicação | Todos os arquivos rastreados em `client/`, `server/` e `shared/`. |
| Banco | `drizzle/schema.ts`, relações, metadados e todas as migrações SQL. |
| Qualidade | Arquivos `*.test.ts`, configuração Vitest, TypeScript e dependências bloqueadas em `pnpm-lock.yaml`. |
| Operação | Configurações de Vite, Drizzle, Tailwind/Prettier, `.gitignore` e scripts rastreados. |
| Evidências | Documentação de fontes TSE, embeds, contingência, verificações, auditorias e checklist do projeto. |

## Exclusões obrigatórias

| Exclusão | Justificativa |
| --- | --- |
| Segredos e `.env*` | Impede exposição de credenciais de banco, OAuth, e-mail e GitHub. |
| Banco produtivo e conteúdo de reportes | Evita publicar dados de usuários e preserva integridade operacional. |
| Logs, caches, builds e `node_modules` | Não são fonte de verdade; são gerados localmente. |
| ZIPs e downloads transitórios do TSE | O projeto registra as URLs oficiais e os importa no ciclo diário, sem duplicar arquivos externos grandes. |

## Ciclo diário

1. A rotina oficial do TSE executa às 09h, horário de Brasília.
2. O acompanhamento posterior confirma uma execução real, seus totais e o alerta de e-mail.
3. Depois disso, compara o commit local do projeto com `source-code`.
4. Havendo mudança rastreada, publica a branch `source-code`; caso contrário, registra que a versão já está atualizada.
5. Confirma a igualdade entre o commit local e o remoto e preserva a `main` exclusivamente para o GitHub Pages.

> A atualização diária dos dados eleitorais é publicada no `data.json` da branch `main`. A atualização da branch `source-code` preserva o código e sua documentação. Dados eleitorais, segredos e registros administrativos não são inseridos na branch de código.
