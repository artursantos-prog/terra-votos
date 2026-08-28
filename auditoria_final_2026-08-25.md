# Verificação final — 25/08/2026

## Filtro de Estado e candidaturas nacionais

O filtro público de Estado foi verificado sem a opção `BR`. A lista de cargos continua oferecendo `PRESIDENTE` e, ao aplicá-lo, a interface manteve disponíveis as 13 candidaturas nacionais, todas identificadas internamente com UF `BR` e acompanhadas de seus respectivos vices oficiais. Assim, `BR` não é apresentado como estado, mas as candidaturas nacionais permanecem pesquisáveis pelo cargo.

## Chapa de Senado

O filtro público não apresenta `1º SUPLENTE` ou `2º SUPLENTE`. A busca por `SENADOR` exibiu titulares acompanhados do bloco `Suplentes`; a auditoria do banco confirmou 654 suplentes distintos associados exclusivamente a senadores.

## Regressão técnica

Os tipos foram validados. A suíte da aplicação, excluindo a consulta externa de e-mail, concluiu com 50 testes aprovados em 15 arquivos. A única verificação não concluída foi a chamada remota ao endpoint de domínios do serviço de e-mail, que atingiu timeout de rede; não houve erro de configuração, de tipos ou de fluxo da aplicação.
