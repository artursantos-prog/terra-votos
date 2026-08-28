# Verificação de publicação do embed — 25 de agosto de 2026

Após o checkpoint `36b98014`, a prévia local confirmou as rotas `/embed` e `/embed/fora-da-disputa`. A primeira abertura pública de `/embed?version=36b98014` retornou a tela 404 da versão anterior, e a página inicial com o mesmo parâmetro ainda exibiu a colinha anterior, sem o limite de seis escolhas. A propagação pública desta versão ainda não estava concluída no instante da primeira verificação.

Após uma janela adicional de propagação, `https://buscadorv2-pzlzvemq.manus.space/embed?version=36b98014&refresh=2` passou a servir a busca incorporável atual, com a colinha de seis escolhas, as duas vagas de senador, os cargos não votados bloqueados e o rodapé de atualização automática. A rota `https://buscadorv2-pzlzvemq.manus.space/embed/fora-da-disputa?version=36b98014` também foi validada com as candidaturas fora da disputa, filtros, navegação para a busca principal e o mesmo estado de colinha não selecionável.

O embed está publicado e pronto para ser incorporado pelo portal Terra usando os URLs e o script registrados em `embed_portal_terra.md`.

A propagação observada nesta verificação demonstrou que o portal não precisa de mudança própria para receber uma publicação: a mesma URL incorporada passou da versão anterior para a atual após a versão `36b98014` ficar disponível.

Após a sincronização oficial controlada das 15:50:02Z, o embed que já estava aberto renovou suas consultas e recebeu os novos totais às 15:50:20Z. Nenhuma ação no portal Terra foi necessária para essa atualização de dados.

No domínio público, a confirmação posterior de `/embed?sync-proof=20260825-155002` mostrou 20.247 candidaturas em disputa e 1.688 páginas, frente às 20.244 e 1.687 observadas antes da sincronização. A URL incorporável é, portanto, a fonte viva que o portal Terra deve manter no iframe.
