# Auditoria da rota do painel privado — 26/08/2026

Após adicionar a rota compatível `/owner/reports`, o ambiente de desenvolvimento passou a renderizar corretamente a tela protegida “Painel do dono”, com botão de entrada. A primeira consulta ao mesmo endereço no domínio público ainda retornou a tela 404.

Essa divergência será tratada como falha de publicação ou cache até nova validação no domínio público; o endereço não será informado novamente como funcional antes de uma confirmação pública positiva.

Após a confirmação de implantação, a rota pública foi reaberta com um parâmetro de cache e, depois do carregamento completo, exibiu a tela protegida “Painel do dono” com o botão “Entrar”. O endereço `https://buscadorv2-pzlzvemq.manus.space/owner/reports` está confirmado como acessível; a primeira tela é esperada enquanto não há sessão autenticada.
