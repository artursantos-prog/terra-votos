# Validação de paginação — 21 de agosto de 2026

A busca principal foi verificada no navegador com dados oficiais já carregados. A primeira página mostrou o intervalo **1–10 de 20.682** e exatamente dez cards de candidatura. Ao acionar **Próxima**, a interface passou para a página **2 de 2.069**, mostrou o intervalo **11–20 de 20.682** e exibiu um novo conjunto de exatamente dez candidaturas.

Os controles **Anterior** e **Próxima** permanecem disponíveis, e a alteração de filtros reinicia a navegação na primeira página. A regra é aplicada no servidor com tamanho de página fixo de 10, portanto também vale para a página **Fora da Disputa**.

Também foi validada a alteração de busca enquanto a interface estava na página 2: ao pesquisar por **ABDIAS**, a listagem retornou automaticamente à primeira página e mostrou o intervalo **1–3 de 3**, sem manter uma página inválida do resultado anterior.
