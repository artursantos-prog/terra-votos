# Auditoria de cobertura da base oficial do TSE — 26/08/2026

## Escopo e fontes

Esta auditoria foi executada exclusivamente com fontes do Tribunal Superior Eleitoral. Foram comparados os identificadores da base publicada com as listagens oficiais do DivulgaCand por UF e cargo, sem importar dados de nenhuma fonte alternativa. Para a reposição autorizada, foram usados somente os três arquivos permitidos: `consulta_cand_2026.zip`, `consulta_cand_complementar_2026.zip` e `rede_social_candidato_2026.zip`, todos obtidos no navegador.

| Evidência | Resultado |
| --- | --- |
| Consulta inicial às listagens oficiais do DivulgaCand | 20.761 registros, sem falhas de endpoint |
| Snapshot publicado antes da correção | 20.750 registros |
| Divergências iniciais | 11 registros na fonte oficial e ausentes da base publicada |
| Snapshot contido no ZIP oficial auditado | 20.754 registros, com geração em 26/08/2026 às 08:30:48 |
| Registros incorporados pela reposição autorizada | 4 registros, incluindo a nova candidatura ao Senado pelo RJ e sua chapa vigente |
| Registros ainda somente na listagem em tempo real | 7 registros, que não estavam no ZIP oficial vigente e serão processados quando constarem nos três arquivos autorizados |

## Caso relatado: Rio de Janeiro

O identificador `190002554290` foi confirmado no DivulgaCand como a candidatura de **Cleber Ribeiro Afonso**, nome de urna **Comandante Ribeiro Afonso**, ao cargo de **Senador** pelo Rio de Janeiro, número **350**, partido **Democrata**, situação **Aguardando julgamento** e totalização **Concorrendo**. A candidatura estava presente no CSV nacional distribuído pelo TSE, mas ausente do snapshot que estava publicado.

A reposição oficial incorporou a candidatura. A validação no domínio público confirmou a busca por “Comandante Ribeiro Afonso”, com foto oficial, número, partido, situação e os suplentes vigentes **Alexandre Cardoso** e **Marli Martins**. As duas relações históricas de suplentes com situação oficial de renúncia foram removidas do vínculo da chapa e a aplicação passou a impedir que integrantes fora da disputa sejam exibidos como membros vigentes.

## Limite de consistência atual

As listagens do DivulgaCand, consultadas em tempo real, continuam apresentando sete novos registros que ainda não constavam no ZIP oficial vigente no momento da auditoria. Eles não foram inseridos manualmente: a regra do projeto exige que a importação ocorra apenas pelos três ZIPs oficiais. O ciclo diário continuará a reconciliá-los quando o TSE atualizar os arquivos autorizados.

## Referências oficiais

1. [Ficha oficial de Comandante Ribeiro Afonso no DivulgaCand](https://divulgacandcontas.tse.jus.br/divulga/#/candidato/SUDESTE/RJ/20322002026/190002554290/2026/RJ)
2. [Detalhe oficial da candidatura no DivulgaCand](https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/2026/RJ/20322002026/candidato/190002554290)
3. [Listagem oficial do Senado no Rio de Janeiro](https://divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/listar/2026/RJ/20322002026/5/candidatos)
