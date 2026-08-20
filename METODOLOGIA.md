# Metodologia do Buscador de Candidatos

## Objetivo editorial

O buscador permite localizar candidaturas e números de urna nas eleições gerais de 2026. Para reduzir o risco de exibir uma candidatura com situação incompatível com a experiência editorial, a lista pública inclui apenas registros cuja **situação de julgamento** seja **Deferido** ou **Aguardando julgamento**. Os demais estados — como renúncia, indeferimento ou pedido não conhecido — não entram nos resultados.

> O número exibido no buscador representa o recorte de candidaturas elegíveis para consulta segundo essa regra. Ele não deve ser confundido com o total amplo de pedidos de registro divulgado em uma data específica.

| Etapa | Fonte e procedimento | Publicação no buscador |
|---|---|---|
| Candidaturas | Arquivo público de candidatos do TSE | Nome de urna, número, partido, UF, cargo e identificador técnico público. |
| Situação de julgamento | Arquivo de informações complementares do TSE | Mantém apenas **Deferido** e **Aguardando julgamento**. |
| Fotos | Rota pública do DivulgaCandContas por identificador da candidatura | Exibidas diretamente, sem hospedar cópias das imagens. |
| Redes sociais | Arquivo oficial de redes sociais do TSE, quando disponível | Exibe apenas URLs declaradas na fonte oficial. |
| Planos de governo | Recursos de proposta de governo do TSE, quando publicados | Exibe link apenas quando existe documento oficial associado à candidatura. |

## Atualização e continuidade

O conjunto **Candidatos — 2026** do Portal de Dados Abertos do TSE informa frequência de atualização de **quatro vezes ao dia**. O projeto realiza duas verificações diárias, às **09h e 21h (horário de Brasília)**. Cada execução cria um registro interno de resultado; somente uma consolidação completa e validada substitui o snapshot público anterior. Se o ZIP público do TSE ou seu CDN não responder, a rotina utiliza a API pública do DivulgaCandContas como fonte oficial de contingência, preservando redes sociais e documentos já confirmados. Se nenhuma fonte puder ser validada, a aplicação mantém o último snapshot válido e registra a falha para revisão privada.

Essa regra impede que uma indisponibilidade temporária da fonte apague candidaturas, fotos ou vínculos já publicados. Como os dados eleitorais são dinâmicos, uma alteração pode aparecer primeiro no DivulgaCandContas e apenas depois no próximo pacote de dados abertos; a data e o horário da última sincronização devem ser considerados ao interpretar os resultados. O embed mantém a URL publicada do buscador: novas visitas recebem o snapshot ativo e iframes que já estiverem abertos verificam a versão ativa a cada cinco minutos ou quando recebem foco, sem troca de snippet no portal Terra.

## Transparência, privacidade e revisão

O pacote público é minimizado: não expõe CPF, endereço, dados de contato ou outros campos pessoais não necessários à consulta eleitoral. A chave pública da candidatura é usada apenas para associação estável de foto, documento e apontamentos. Visitantes podem enviar uma correção contextualizada; o conteúdo chega à área privada de revisão e não altera automaticamente a base.

## Referências

[1] [Portal de Dados Abertos do TSE — Candidatos 2026](https://dadosabertos.tse.jus.br/dataset/candidatos-2026)

[2] [Portal de Dados Abertos do TSE — BR Proposta de governo](https://dadosabertos.tse.jus.br/dataset/ba2d7d69-5bf5-4379-8c91-664c11f75a2e/resource/433ac1f4-07dc-44a2-bcbe-c87a2073721a)

[3] [DivulgaCandContas — TSE](https://divulgacandcontas.tse.jus.br/)
