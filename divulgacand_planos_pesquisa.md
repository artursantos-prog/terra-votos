# Pesquisa de planos de governo no DivulgaCand

## Verificação inicial — 25/08/2026

A rota nacional indicada pelo responsável carregou a consulta **Regiões Brasileiras** para a Eleição Geral Federal de 2026, com seleção oficial de Brasil, Norte, Nordeste, Centro-Oeste, Sudeste e Sul. A etapa seguinte será abrir cada região, aplicar os filtros de candidatura e identificar o único documento de proposta associado à candidatura quando esse arquivo for disponibilizado pelo DivulgaCand. Nenhum dado de fonte externa será usado nesta pesquisa.

## Evidências de estrutura oficial

Na consulta Brasil, o DivulgaCand registrou 13 candidaturas para Presidente e 13 para Vice-presidente. O detalhe de uma candidatura presidencial apresenta uma seção específica de **Vices / Suplentes**, na qual o vice aparece vinculado ao titular e ao mesmo número de urna. Esse padrão confirma que o buscador deve exibir o vice como parte da chapa, e não como item escolhível separadamente.

O detalhe oficial também expõe uma lista de arquivos. Para a candidatura de exemplo, foi identificado um único arquivo com `codTipo` igual a `5`, correspondente à proposta, e um identificador de documento. O endereço direto no padrão `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/doc/{idArquivo}` é o que deve ser aberto em nova guia, sem redirecionar a pessoa usuária à página do TSE.

## Recuperação e validação no buscador — 25/08/2026

O buscador passou a exibir a **última sincronização bem-sucedida** separadamente da data de geração do arquivo do TSE. Após a recuperação oficial dos detalhes executivos, foram persistidos 56 documentos de proposta e 60 vínculos de chapa. A tela pública apresenta 20.513 candidaturas votadas e o filtro de cargos não exibe Vice-presidente nem Vice-governador. A diferença para o total bruto decorre da retirada dos dois cargos de vice da escolha direta, sem eliminar seus registros oficiais.

Na validação da candidatura presidencial consultada, a resposta oficial anterior do DivulgaCand identificou o arquivo de proposta de tipo `5`, com documento `280017016005`, e o vice de código `280002542549`. Esses dois valores oficiais foram preservados no fallback do banco. Uma tentativa posterior de leitura automática recebeu uma página HTML de bloqueio temporário do próprio DivulgaCand; por isso, a rotina mantém o último documento e vínculo válidos em vez de apagá-los.

Após a persistência do fallback, a validação no navegador confirmou o botão **Abrir documento oficial da proposta** apontando diretamente para o documento `280017016005`, em nova guia. O detalhe também apresentou Geraldo Alckmin como **Vice da chapa** de Lula, enquanto Vice-presidente permanece ausente do filtro e da seleção individual.

Em 25/08/2026, a rota Norte indicada (`https://divulgacandcontas.tse.jus.br/divulga/#/candidato/regiao/NORTE/20322002026`) carregou a estrutura regional oficial com Acre, Amazonas, Amapá, Pará, Rondônia, Roraima e Tocantins. A aplicação usa os detalhes oficiais das candidaturas executivas por UF, que são a origem dos documentos e das chapas preservados no buscador.

Na mesma verificação, a rota Nordeste (`https://divulgacandcontas.tse.jus.br/divulga/#/candidato/regiao/NORDESTE/20322002026`) carregou as UFs Alagoas, Bahia, Ceará, Maranhão, Paraíba, Pernambuco, Piauí, Rio Grande do Norte e Sergipe. As rotas regionais confirmam a cobertura geográfica da fonte; a coleta usa o identificador da candidatura e a UF registrados no snapshot oficial para chegar ao detalhe correspondente.

A rota Centro-Oeste (`https://divulgacandcontas.tse.jus.br/divulga/#/candidato/regiao/CENTROOESTE/20322002026`) também carregou normalmente, com Distrito Federal, Goiás, Mato Grosso do Sul e Mato Grosso. Esse caminho regional é compatível com as UFs utilizadas pela rotina de detalhes oficiais.

A rota Sudeste (`https://divulgacandcontas.tse.jus.br/divulga/#/candidato/regiao/SUDESTE/20322002026`) apresentou Espírito Santo, Minas Gerais, Rio de Janeiro e São Paulo, confirmando mais uma interface regional válida do DivulgaCand para a eleição geral de 2026.

Por fim, a rota Sul (`https://divulgacandcontas.tse.jus.br/divulga/#/candidato/regiao/SUL/20322002026`) carregou Paraná, Rio Grande do Sul e Santa Catarina. As cinco rotas regionais indicadas — Norte, Nordeste, Centro-Oeste, Sudeste e Sul — foram conferidas na fonte oficial em 25/08/2026.
