# Fontes oficiais do TSE para detalhes de candidatura

O buscador usa exclusivamente os três arquivos oficiais previamente definidos para a sincronização: **Candidatos**, **Informações complementares** e **Redes sociais de candidatos**. Nenhum dado é pesquisado ou carregado de qualquer outra fonte.

| Informação exibida no buscador | Fonte oficial identificada | Uso planejado |
|---|---|---|
| Situação, cargo, nome, partido, UF e número | Candidatos | Busca e classificação entre em disputa e fora da disputa |
| Foto e plano de governo, quando houver campo correspondente | Informações complementares | Card e detalhe do candidato |
| Redes sociais | Redes sociais de candidatos | Detalhe do candidato, com o nome explícito da plataforma |

As importações preservam apenas URLs e metadados extraídos desses três arquivos oficiais do TSE. Nenhum plano, foto ou perfil social será criado manualmente quando não existir registro correspondente na fonte oficial.

## Referência

[1] [TSE — Candidatos 2026](https://dadosabertos.tse.jus.br/dataset/candidatos-2026)

## Ficha individual no DivulgaCand

Para consultas administrativas, o painel abre a página pública individual da candidatura no DivulgaCand, em vez de expor o endpoint técnico usado internamente para leitura de dados. O formato validado pelo TSE para 2026 é:

`https://divulgacandcontas.tse.jus.br/divulga/#/candidato/{REGIÃO}/{UF}/20322002026/{SQ_CANDIDATO}/2026/{UF}`

Para candidaturas nacionais, `REGIÃO` e `UF` são `BR`; para as demais, a região é derivada da UF (por exemplo, `BA` corresponde a `NORDESTE`). A referência nacional validada é a ficha pública do candidato de identificador `280002542548`: `https://divulgacandcontas.tse.jus.br/divulga/#/candidato/BR/BR/20322002026/280002542548/2026/BR`.
