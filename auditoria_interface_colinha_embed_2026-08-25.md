# Auditoria de interface, colinha e incorporação — 25 de agosto de 2026

## Evidências verificadas no navegador

Na busca de presidência, a colinha apresentou capacidade total de seis escolhas: uma para presidente, uma para governador, duas para senador, uma para deputado federal e uma para deputado estadual ou distrital. Após selecionar **Escritor Augusto Cury**, a tentativa de selecionar **Clariana Barao** abriu um diálogo de confirmação informando que a vaga de presidente já estava preenchida. A confirmação substituiu o primeiro nome pelo segundo e a contagem permaneceu em uma de uma vaga.

O diálogo de informações de Clariana Barao foi aberto após a atualização visual. Ele manteve, sem rolagem horizontal, foto, número, cargo, partido e situação no mesmo quadro, com o documento direto do TSE e o bloco de vice reduzido a **Fabiana Torquato**, **Vice** e **Partido: DC**. O documento de proposta continuou apontando diretamente para o arquivo oficial do DivulgaCand.

As novas rotas `/embed` e `/embed/fora-da-disputa` foram carregadas na prévia e usam as mesmas consultas públicas da busca principal. Nelas, a atualização dos dados é refeita a cada 60 segundos e cada redimensionamento da página envia a altura ao contêiner, evitando barras de rolagem do iframe quando o script de integração é utilizado.

## Auditoria de dados e regressão

| Verificação | Resultado |
| --- | ---: |
| Candidaturas em disputa | 20.450 |
| Candidaturas fora da disputa | 277 |
| Perfis sociais oficiais persistidos | 41.625 |
| Documentos de proposta oficiais | 205 |
| Vínculos oficiais de vice | 223 |
| Testes automatizados | 46 aprovados em 14 arquivos |

O banco confirmou que os status oficiais incluem 5.329 candidaturas **Deferidas**, 236 **Renúncias**, 39 indeferimentos em diferentes redações, um **Pedido não conhecido** e um **Cancelado**. A categoria pública manteve 20.450 candidaturas em disputa e 277 fora da disputa. A colinha passou a bloquear tanto cargos sem voto direto quanto candidaturas da área Fora da Disputa.

## Responsividade e impressão

As rotas principal e incorporável foram inspecionadas em viewport móvel de 375 × 812 pixels. Os filtros, o resumo da colinha e a navegação do embed se mantiveram dentro da largura visível, sem rolagem horizontal. A estrutura de impressão passou a criar um bloco por vaga em cada cargo; no grupo de Senado, duas colunas independentes são previstas e identificadas como **1ª vaga** e **2ª vaga**, cada uma com os três dígitos e o nome da candidatura selecionada.

## Reportes e comentários

O formulário público de reporte foi reaberto durante esta auditoria. Ele continua limitado às duas classificações exigidas: **O candidato não está mais concorrendo** e **Alguma informação está errada**, com campos opcionais de descrição e e-mail de contato. A suíte de regressão cobre a persistência e o alerta ao responsável tanto para reportes quanto para comentários e sugestões; nenhum envio novo foi feito durante a verificação.

O diálogo de **Comentário ou sugestão** também foi aberto sem envio. Ele mantém mensagem e e-mail de contato opcional, e informa ao público que o conteúdo será encaminhado ao responsável para avaliação. As duas rotas públicas de incorporação foram revalidadas após a propagação do checkpoint `36b98014`: `/embed` carregou a busca com seis escolhas e `/embed/fora-da-disputa` carregou a lista separada de situações terminais, ambas com filtros, cards, links de navegação e aviso de atualização automática.

## Evidências finais: impressão e atualização do embed

Uma prévia PDF real da colinha foi gerada a partir da página pública após a mudança. O documento ocupou uma única página e exibiu, sem sobreposição, os campos de quatro dígitos para deputado federal, cinco para deputado estadual ou distrital, os dois grupos independentes de três dígitos para **1ª vaga** e **2ª vaga** de senador, e os campos de duas posições para governador e presidente.

A atualização automática do embed foi comprovada pela própria publicação do checkpoint `36b98014`: inicialmente o domínio público ainda entregava a versão anterior; após a propagação, sem qualquer mudança no código do portal, a mesma URL `/embed` passou a renderizar a colinha atual de seis escolhas, o bloqueio de cargos não votados e o rodapé de atualização automática. A rota `/embed/fora-da-disputa` também passou a refletir a versão publicada no mesmo domínio.

Para a evidência preenchida, uma sessão isolada selecionou duas candidaturas reais de Senado apenas no estado local da interface: **Acácio Favacho (MDB), 151**, na 1ª vaga, e **Acir Gurgacz (PDT), 123**, na 2ª vaga. A prévia PDF resultante ocupou uma única página, apresentou ambos os números e partidos em seus blocos separados, e não exibiu sobreposição ou quebra de conteúdo.

Com o embed aberto na prévia, a renovação automática foi observada no registro de rede. Às `15:44:17Z`, 65 segundos após sua abertura, a página fez uma nova chamada pública em lote para `candidates.list`, `candidates.filterOptions` e `candidates.stats`, com resposta HTTP 200. Assim, a mesma URL incorporada atualiza suas consultas sem ação no portal; quando a sincronização oficial ou uma edição manual altera a base publicada, a próxima renovação lê o estado atual.

### Prova ponta a ponta com atualização oficial

Uma sincronização controlada foi executada em `25/08/2026 às 15:50:02Z` pela mesma lógica da rotina diária e exclusivamente com os três ZIPs oficiais do TSE. A execução foi bem-sucedida, enviou o alerta ao responsável e persistiu 20.732 candidaturas brutas, 42.292 perfis sociais, 205 documentos de proposta e 223 vínculos de vice. A separação pública passou a 20.454 candidaturas em disputa e 278 fora da disputa.

Sem recarregar, editar ou trocar o código do portal, o embed aberto renovou sua consulta às `15:50:20Z`, recebeu HTTP 200 e refletiu os novos totais públicos: 20.247 candidaturas votadas em disputa, 270 fora da disputa e 20.517 no total votado. Essa diferença entre a base bruta e o total votado decorre da exclusão de vices e outros cargos sem voto direto da lista pública. A evidência confirma que a mesma URL incorporada reflete uma atualização real de dados em até o ciclo de renovação de 60 segundos.

A confirmação final também foi realizada no domínio público que o portal Terra incorpora: `https://buscadorv2-pzlzvemq.manus.space/embed`. Após a sincronização controlada, essa URL exibiu 20.247 candidaturas em disputa, paginação de 1.688 páginas, colinha de seis escolhas e o rodapé de atualização automática. Antes da sincronização, a mesma rota pública mostrava 20.244 candidaturas e 1.687 páginas. Não houve nenhuma edição, republicação ou intervenção no portal Terra entre as duas leituras.
