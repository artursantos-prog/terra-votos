# Direção de Design — Buscador de Candidatos

## Referência oficial

A imagem fornecida pelo usuário é a **especificação visual definitiva**. O objetivo é traduzir a linguagem do módulo de Eleições no Terra para um buscador de candidatos, sem descaracterizar seus traços essenciais: fundo branco, acento laranja, linhas leves, títulos com serifa forte, detalhes sem serifa e cards horizontais de leitura imediata.

## Princípios de fidelidade

- O cabeçalho preserva a leitura editorial: marca eleitoral à esquerda, regra horizontal suave e assinatura Terra à direita.
- Os filtros ocupam a primeira área funcional, usando a mesma sutileza de bordas, fundos claros e rótulos compactos da referência.
- Cada resultado parte da estrutura de card observada na imagem: nome em tipografia serifada, partido em cinza, número de urna como informação de maior contraste e uma linha de acento laranja.
- A ausência temporária de fotos não será escondida com avatares genéricos; os cards terão composição tipográfica balanceada, preservando espaço para incluir imagens posteriormente sem quebrar o layout.
- A paginação e o contador de resultados são discretos, priorizando a busca e a identificação rápida do candidato.

## Sistema visual

| Elemento | Decisão |
|---|---|
| Movimento | Editorial eleitoral contemporâneo, baseado na referência fornecida |
| Cor de marca | **Laranja Terra** — `#ff5a00` |
| Fundos | Branco quente e nuances muito claras de pêssego |
| Títulos | Lora, serifada, em peso 700 |
| Interface | Manrope, sem serifa, com boa legibilidade em dados |
| Estrutura | Faixa superior editorial + filtros assimétricos + grade fluida de resultados |
| Interação | Respostas rápidas, discretas e informativas; foco visível e microtransições curtas |
| Animação | Entrada suave dos cards em cascata; sem ornamentos que compitam com a informação |

## Marca e voz

**Essência:** Um local direto e confiável para localizar candidaturas e números de urna, dentro da linguagem editorial do Terra.

**Personalidade:** clara, próxima, institucional.

**Tom:** títulos objetivos, sem jargão e com instruções que ajudem o eleitor a encontrar o que procura.

> “Encontre candidaturas, partidos e números de urna.”

> “Filtre por estado, partido ou nome.”

## Decisões de implementação

O protótipo inicial não exibirá fotos, conforme decisão do usuário. A base de dados usará os CSVs enviados, convertidos para um subconjunto público de campos necessários para busca: UF, cargo, nome de urna, nome completo, partido e número de candidatura. Dados sensíveis e campos não necessários não serão incluídos no pacote do navegador.

## Validação de dados e fontes

- A consolidação dos CSVs principais resultou em **20.638 candidaturas** distribuídas por 28 abrangências eleitorais (incluindo Brasil), com opções de filtros para UF, partido e cargo.
- A consulta ao endereço do TSE enviado pelo usuário encontrou uma etapa anti-automação. Ela não é necessária para esta primeira entrega e não será utilizada enquanto as fotos permanecerem fora do escopo.

## Ampliação: colinha e confiança editorial

A colinha é uma extensão própria da linguagem editorial laranja e branca do Terra, com seleção explícita, ordem dos cargos e impressão em PDF. A transparência sobre a última sincronização, o status de candidatura e a origem oficial dos documentos orientam a experiência; nenhuma referência externa de design é utilizada.
