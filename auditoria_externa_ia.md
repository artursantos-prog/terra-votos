# Roteiro de auditoria independente por outra IA

Use uma segunda IA com capacidade de revisar repositórios e navegar na web, como ChatGPT, Claude ou Gemini, sem fornecer credenciais, dados de banco, tokens ou conteúdo privado de reportes. A auditoria deve usar a branch pública [`source-code`](https://github.com/artursantos-prog/terra-votos/tree/source-code) e as páginas publicadas.

## Prompt sugerido

> Você é uma pessoa revisora independente de software eleitoral. Audite o projeto “Eleições no Terra” com base na branch `source-code` de `https://github.com/artursantos-prog/terra-votos` e nas URLs públicas `https://buscadorv2-pzlzvemq.manus.space`, `https://buscadorv2-pzlzvemq.manus.space/embed`, `https://buscadorv2-pzlzvemq.manus.space/fora-da-disputa`, `https://buscadorv2-pzlzvemq.manus.space/embed/fora-da-disputa` e `https://artursantos-prog.github.io/terra-votos/`. Não peça nem use segredos, banco de produção, e-mails de usuários ou reportes privados. Produza uma tabela com item auditado, evidência observada, resultado (aprovado, atenção ou falhou), risco e recomendação objetiva. Não invente dados nem conclua algo sem evidência.
>
> Verifique, em especial: (1) se a importação usa exclusivamente os três ZIPs oficiais do TSE documentados em `README.md`; (2) se status, fotos, propostas, vices e suplentes usam somente dados oficiais do TSE/DivulgaCand; (3) se a busca pública, Fora da Disputa e os dois embeds usam a mesma base e exibem a atualização; (4) se vices e suplentes não entram como escolhas diretas na colinha e se as capacidades por cargo são respeitadas; (5) se a colinha imprime e compartilha por menu nativo, WhatsApp e imagem apropriada para Instagram; (6) se o painel privado exige autenticação, abre a ficha pública individual correta do DivulgaCand em nova guia e limita os controles visíveis a Consultar TSE, Resolver e Excluir; (7) se excluir um reporte não altera candidatura; (8) se a branch `main` contém somente o GitHub Pages e `source-code` contém código, migrações, testes, configurações e documentação, sem `.env`, chaves, tokens, logs, banco de produção, ZIPs ou reportes; (9) se os testes e a checagem de tipos podem ser executados com `pnpm check` e `pnpm test`; e (10) se a rotina diária mantém atualização oficial, GitHub Pages e branch `source-code` sem criar agendas concorrentes.
>
> Para cada conclusão, cite arquivo, linha, URL pública ou saída de teste que sustente a observação. Ao final, classifique os achados por prioridade: bloqueador, alta, média ou melhoria opcional.

## Material a fornecer à pessoa revisora

| Item | Acesso permitido |
| --- | --- |
| Código | Branch `source-code` pública no GitHub. |
| Ambiente público | URLs do buscador, embed, Fora da Disputa e GitHub Pages. |
| Evidência de qualidade | Saídas de `pnpm check` e `pnpm test` sem segredos. |
| Informações que não devem ser compartilhadas | Tokens, variáveis de ambiente, dados do banco, reportes, e-mails, cookies e logs internos. |

> Uma auditoria externa pode apontar riscos e inconsistências, mas não substitui a fonte oficial do TSE nem deve autorizar alterações manuais de candidatura sem evidência no DivulgaCand.
