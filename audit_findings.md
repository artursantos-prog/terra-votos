# Auditoria do buscador eleitoral

## Base de candidaturas

Em 21/08/2026, a consulta ao banco confirmou que a tabela de candidaturas estava vazia. A causa foi a ausência de uma sincronização concluída: o portal do TSE havia bloqueado os downloads automatizados. A base foi restaurada exclusivamente pelo CSV nacional oficial do TSE previamente fornecido pelo usuário, resultando em **20.682 candidaturas** classificadas inicialmente como `em_disputa` porque o campo oficial de situação desse snapshot é `#NE`.

## Validação da busca

A prévia do buscador exibiu a contagem de 20.682 candidaturas, filtros por UF, cargo e partido e os primeiros 200 cards oficiais. Cada card apresentou nome de urna, número, cargo, partido, UF, ação de seleção, detalhes e reporte de erro. Nenhuma fonte externa ao TSE foi usada.

## Ajuste de contagem

A página `Fora da disputa` passou a usar a contagem específica de situações terminais em vez do total geral de candidaturas.

## Colinha

O fluxo de seleção foi validado na prévia: ao selecionar um card, a interface passou a indicar **1 perfil selecionado** e criou um controle individual de remoção na colinha, preservando o nome e o número do candidato escolhido.

## Reporte de erro

A auditoria identificou que a abertura do formulário de reporte dependia de um gatilho de diálogo que não respondeu de forma confiável na prévia. O controle foi substituído por abertura explícita de estado. O formulário preserva as opções obrigatórias de indicar que o candidato não está mais concorrendo ou que alguma informação está errada, sem enviar nenhuma sinalização durante a auditoria.

## Recarga da base

Após uma recarga da prévia, a interface concluiu a consulta e voltou a mostrar 20.682 candidaturas, filtros preenchidos e os primeiros 200 resultados. O estado inicial de carregamento não representa ausência de dados.

## Formulário de reporte pós-correção

Após a correção do controle de abertura, a prévia confirmou a exibição do diálogo de reporte com as duas opções obrigatórias: **“O candidato não está mais concorrendo”** e **“Alguma informação está errada”**. A auditoria não submeteu o formulário, portanto não criou registros nem enviou alertas de teste.

## Detalhes do candidato

A abertura do diálogo de detalhes foi confirmada na página recarregada. Após a resposta da consulta assíncrona, o diálogo exibiu nome, número, cargo, partido, situação oficial e as seções de plano de governo e redes sociais. Para este snapshot, esses dois últimos campos não aparecem porque não houve importação complementar ou de redes sociais concluída; a interface informa isso explicitamente como ausência de registro na base oficial do TSE, sem recorrer a fontes externas.

## Metodologia e sugestões

O widget de metodologia abriu sobre a página de busca, manteve a rota `/`, mencionou o Tribunal Superior Eleitoral/base oficial do TSE e não continha links públicos de arquivo. A inspeção do diálogo ativo de comentários confirmou o título **“Comentário ou sugestão”**, texto explicativo de encaminhamento ao responsável, campo de comentário, campo opcional de e-mail e ação **“Enviar comentário”**. Nenhum formulário foi submetido nessa etapa.

## Painel protegido do dono

A rota `/gestao/reportes` foi acessada sem sessão e exibiu corretamente a barreira de autenticação **“Painel do dono — Entre para acessar os reportes recebidos”**, sem expor dados. A implementação restringe as consultas a usuários com papel `admin`, reúne as tabelas de reportes de candidatos e de comentários recebidos e permite que o dono os marque como verificados ou resolvidos. A suíte automatizada confirmou o bloqueio de usuários comuns, as atualizações pelo administrador e o envio dos alertas de e-mail para reportes e sugestões.

## Resultado consolidado

Foram validados: dados exclusivamente oficiais do TSE, busca e filtros, contagem por categoria, colinha com remoção, diálogo de detalhes, reporte com as duas opções exigidas, comentários e sugestões, widget de metodologia, proteção do painel do dono e alertas da rotina de sincronização. A validação técnica final encerrou com **TypeScript sem erros** e **19 testes Vitest aprovados em 5 arquivos**.
