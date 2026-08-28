# Contingência do Buscador de Candidaturas

## Proteção já ativa

O buscador preserva o último snapshot oficial válido do TSE. Uma falha de obtenção de arquivos ou de detalhes no DivulgaCand não apaga candidaturas, redes sociais, propostas ou vínculos de vice já validados. Quando uma falha for posterior ao último êxito, a interface exibe um aviso discreto de que a busca continua mostrando o último conjunto oficial disponível. O banner principal permanece limitado à informação pública solicitada: atualização diária às 9h.

O pacote estático de contingência é gerado por `scripts/build_cloudflare_fallback.ts` em `/home/ubuntu/webdev-static-assets/buscador-eleitoral-fallback/`. Ele contém somente uma página de busca em modo leitura e `data.json` originado da base persistida do TSE; não consulta fontes alternativas nem aceita alterações públicas.

Em 25/08/2026, o pacote foi regenerado novamente após a sincronização oficial controlada das 15h50 UTC. Ele contém 20.247 candidaturas votadas em disputa, 205 documentos de proposta e 223 vínculos de vice. O pacote permanece apenas como artefato interno até que a frente externa seja reaberta expressamente pelo responsável.

## Publicação externa pendente

Foi tentado o Cloudflare Pages, mas a conta não estava autenticada e o cadastro foi interrompido pela verificação CAPTCHA. Como alternativa, foi tentado GitHub Pages. A integração da conta não possui permissão para criar repositórios e o navegador não está autenticado no GitHub.

Posteriormente, foi criado pelo responsável o repositório público `https://github.com/artursantos-prog/terra-votos`. O pacote do espelho foi preparado e versionado localmente no commit `aeb1a3c`, mas o envio automatizado foi recusado pelo GitHub com HTTP 403: o token da integração não possui permissão de gravação nesse repositório. Para retomar, o responsável pode enviar manualmente os arquivos do pacote ou reautorizar a integração com permissão de conteúdo para esse repositório.

Uma consulta posterior mostrou que a API declara permissões administrativas e de envio para a integração nesse repositório. Ainda assim, o envio Git continuou recebendo HTTP 403 após a configuração explícita da credencial pelo cliente GitHub. Essa divergência aponta para uma limitação do canal de credencial usado no envio, não para uma configuração ausente no repositório criado pelo responsável; novas tentativas idênticas foram suspensas.

Como última alternativa, foi tentada a API oficial de conteúdo do GitHub para criar `index.html` diretamente. Ela também retornou HTTP 403 com a mensagem `Resource not accessible by integration`. Portanto, os dois canais de escrita — Git e API de conteúdo — estão bloqueados pela autorização atual, embora a leitura de permissões indique acesso amplo. Não serão realizadas novas tentativas automáticas até que a integração disponibilize um token de escrita efetivo.

Em nova verificação, a sessão autenticada foi identificada como `artursantos-prog`. A consulta de metadados do repositório informa `viewerPermission: ADMIN` e `viewerCanAdminister: true`, mas a consulta de permissão do colaborador pela API retornou novamente HTTP 403 `Resource not accessible by integration`. Isso confirma uma divergência entre a visibilidade administrativa mostrada nos metadados e a autorização efetiva do token de integração para rotas de conteúdo e permissões. A correção esperada é reautorizar a integração do GitHub, concedendo acesso ao repositório `artursantos-prog/terra-votos` e permissão de leitura e gravação de conteúdo; não é necessário apagar ou recriar o repositório.

Após a reautorização do responsável, o envio da branch `main` com `index.html`, `data.json`, `README.md` e `.nojekyll` foi concluído com sucesso. A API passou a confirmar permissão `admin`, inclusive `push: true`, para a conta proprietária. Contudo, a ativação do GitHub Pages pela API ainda retornou HTTP 403 `Resource not accessible by integration`, o que limita apenas a administração do Pages pelo token atual. Para concluir a publicação, o responsável deve ativar o Pages uma vez na interface do repositório: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main → Folder: /(root) → Save**. Depois dessa configuração manual única, os arquivos já enviados passam a ser publicados e poderão ser atualizados pelo envio autorizado à branch `main`.

O GitHub Pages foi ativado pelo responsável e a API confirmou o site público em `https://artursantos-prog.github.io/terra-votos/`, construído a partir de `main` e `/(root)`. Após o envio da atualização do snapshot, a primeira leitura do endereço público ainda mostrou a contagem anterior de 20.513 candidaturas. Essa leitura ocorreu durante a propagação do Pages ou por cache do `data.json`.

O gerador do pacote foi ajustado para solicitar `data.json` com parâmetro único de cache e política `no-store` a cada abertura do espelho. Após nova publicação, a API do GitHub confirmou a construção do commit `d52b5a3` como `built`; o arquivo público de dados retornou 20.247 registros e a validação visual do endereço externo passou a exibir **20.247 candidaturas no snapshot**. O espelho de contingência está publicado e operacional como cópia pública de leitura, sem substituir a atualização diária do buscador principal.

## Atualização diária consolidada

Após cada sincronização oficial bem-sucedida da rotina única das 9h de Brasília, o servidor gera novamente o pacote a partir da base TSE persistida e atualiza `index.html` e `data.json` no repositório `artursantos-prog/terra-votos`. A publicação ocorre uma única vez ao fim do ciclo diário, por isso qualquer ajuste manual acumulado até esse horário é incluído na mesma atualização do GitHub Pages. Se a sincronização oficial falhar, o espelho não é regravado e continua mostrando o último snapshot válido; o e-mail diário ao responsável informa se o espelho foi atualizado ou se houve falha específica nessa etapa.

Para retomar, basta disponibilizar uma conta autenticada do Cloudflare ou GitHub com permissão de publicação. No Cloudflare, deve-se criar o projeto Pages `eleicoes-no-terra-fallback` e enviar `index.html` e `data.json` do pacote. No GitHub, deve-se criar um repositório público para o espelho e habilitar GitHub Pages na branch que contém esses dois arquivos.

## Limite de disponibilidade

Um endereço gratuito de Pages ou GitHub Pages oferece uma cópia independente, mas não muda automaticamente o endereço principal. Para failover automático, será necessário registrar ou usar um domínio próprio e configurar DNS/roteamento de saúde em um provedor independente. Até isso ocorrer, o espelho externo funciona como endereço alternativo divulgado ao público em caso de indisponibilidade do site principal.

## Alternativa simples enquanto a publicação externa não é viável

Enquanto não houver uma conta externa com publicação autorizada, a alternativa adotada é operacional: manter a rotina diária exclusiva do TSE, preservar o último snapshot íntegro no próprio buscador, registrar falhas sem apagar o conteúdo e informar o resultado diário nesta conversa. Essa alternativa cobre indisponibilidade temporária do TSE e permite recuperar a base rapidamente quando o site voltar; ela não cria um endereço público alternativo durante uma indisponibilidade total da plataforma. A decisão de criar esse endereço fica documentada e poderá ser retomada sem reconstruir o pacote estático.

## Procedimento futuro de ativação por DNS

Quando houver um domínio próprio e uma conta de hospedagem externa autorizada, o procedimento será: primeiro, publicar o conteúdo de `/home/ubuntu/webdev-static-assets/buscador-eleitoral-fallback/` no provedor externo; segundo, criar o subdomínio de contingência, por exemplo `contingencia.seudominio.com`, como CNAME para o endereço entregue pelo provedor; terceiro, verificar que `index.html` e `data.json` respondem por HTTPS nesse subdomínio; quarto, configurar no DNS/roteador de tráfego um health check do endereço principal e uma regra de failover para encaminhá-lo ao subdomínio de contingência somente quando o principal não responder. Após a recuperação, a reversão consiste em validar o site principal, remover a condição de falha da regra e restaurar o roteamento para a origem principal. Esse teste deve ser realizado primeiro em um subdomínio, nunca diretamente no endereço público principal.
