# Validação de Dados e Fotos — Eleições 2026

## Síntese

O buscador foi atualizado com a versão mais recente do arquivo oficial de candidaturas do TSE disponível durante esta validação. A nova base contém **20.639 candidaturas**, uma a mais do que os **20.638 registros** presentes nos arquivos inicialmente enviados. A inclusão identificada no arquivo oficial é **PAULA CRISTIANE** (`SQ_CANDIDATO` 170002554086), candidata a deputada estadual por Pernambuco, pelo AVANTE, número 70231.

As fotos não são hospedadas no projeto. Cada card carrega a imagem pública correspondente no DivulgaCandContas, pela rota:

```text
https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/20322002026/{SQ_CANDIDATO}/{SG_UE}
```

Essa associação foi verificada visualmente no perfil público de Zema. A rota usa o identificador público da candidatura e a unidade eleitoral, sem exigir CPF ou qualquer outro dado pessoal.

## Cobertura da base

| Cargo | Portal DivulgaCandContas | CSV oficial atual | Diferença |
|---|---:|---:|---:|
| Presidente | 13 | 13 | 0 |
| Vice-presidente | 13 | 13 | 0 |
| Governador | 198 | 197 | +1 |
| Vice-governador | 199 | 198 | +1 |
| Senador | 316 | 316 | 0 |
| 1º suplente | 323 | 323 | 0 |
| 2º suplente | 325 | 324 | +1 |
| Deputado federal | 7.680 | 7.679 | +1 |
| Deputado estadual | 11.149 | 11.149 | 0 |
| Deputado distrital | 427 | 427 | 0 |
| **Total** | **20.643** | **20.639** | **+4** |

As quatro diferenças representam registros já publicados no portal, mas ainda ausentes da extração consolidada de dados abertos. Foram localizadas por identificador e cargo: **WELL MACEDO** (`140002554108`, Governador/PA), **SEU ALEX** (`140002554109`, Vice-governador/PA), **KINZINHO** (`140002553960`, 2º suplente/PA) e **LARISSA MULHERES DA SEGURANÇA** (`230002554110`, Deputado Federal/RR).

> O Portal de Dados Abertos do TSE declara atualização dos arquivos de candidaturas quatro vezes ao dia, enquanto o DivulgaCandContas informa atualização dos dados de candidaturas a cada 60 minutos. A diferença é, portanto, uma defasagem temporal entre duas publicações oficiais, não uma exclusão intencional do buscador. [1] [2]

## Decisão de publicação

O buscador usa o CSV oficial mais recente como fonte de verdade para a lista, pois ele é o formato público mais adequado para consolidar e versionar a base completa. O portal é utilizado para exibir fotos e para monitorar cadastros que podem aparecer antes da próxima atualização do arquivo. Em uma atualização posterior, os quatro registros transitórios devem ser incorporados pelo próprio arquivo oficial e passarão a compor a base sem tratamento manual.

## Referências

[1] [Portal de Dados Abertos do TSE — Candidatos 2026](https://dadosabertos.tse.jus.br/dataset/candidatos-2026)

[2] [DivulgaCandContas — Eleição Geral Federal 2026](https://divulgacandcontas.tse.jus.br/divulga/#/home)
