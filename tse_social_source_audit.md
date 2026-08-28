# Verificação do arquivo oficial de redes sociais do TSE

Em 21/08/2026, o Portal de Dados Abertos do Tribunal Superior Eleitoral confirmou o recurso **“Redes sociais de candidatos”** para todas as UFs da eleição de 2026. O portal informa o seguinte endereço oficial do recurso:

`https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/rede_social_candidato_2026.zip`

O portal identifica o formato como CSV e informa que os metadados foram atualizados em 22/07/2026. A tentativa de abrir o recurso a partir do botão público do portal não alterou a página nem iniciou um download no navegador.

## Resultado da obtenção e da importação

O endereço direto foi obtido por requisição do servidor em 21/08/2026, com resposta `application/zip` válida de 2.302.775 bytes. O ZIP contém 30 itens, incluindo o CSV nacional `rede_social_candidato_2026_BRASIL.csv` e os arquivos por UF. O CSV nacional foi gerado pelo TSE em `21/08/2026 08:30:07` e contém 49.437 linhas.

Foram aceitos 40.906 perfis que possuíam URL HTTP(S) explícita no arquivo oficial. Após a deduplicação pela combinação candidatura + URL, a base persistiu 40.452 perfis associados a 14.410 candidaturas. Os rótulos das plataformas conhecidas são exibidos explicitamente, incluindo Instagram, Facebook, TikTok, YouTube, X, Threads, LinkedIn, Kwai e WhatsApp. Nenhum perfil foi criado fora da base oficial do TSE.

Fonte: https://dadosabertos.tse.jus.br/dataset/candidatos-2026/resource/7c480cbf-7415-4237-8db7-8c8167542da9
