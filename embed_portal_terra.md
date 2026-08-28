# Embed do Buscador de Candidaturas no portal Terra

## Endereços incorporáveis

| Área | URL a incorporar |
| --- | --- |
| Busca de candidaturas em disputa | `https://buscadorv2-pzlzvemq.manus.space/embed` |
| Candidaturas fora da disputa | `https://buscadorv2-pzlzvemq.manus.space/embed/fora-da-disputa` |

As duas páginas usam a mesma aplicação publicada, a mesma base oficial do TSE e as mesmas regras de apresentação do buscador. Não há uma cópia estática ou uma segunda base de dados no portal Terra.

## Código recomendado

Insira o bloco abaixo no local da página do portal Terra onde o buscador deve aparecer. O script ajusta a altura do iframe quando a busca, os filtros, a colinha ou a paginação alterarem o conteúdo, evitando barras de rolagem internas desnecessárias.

```html
<section aria-label="Buscador de Candidaturas — Eleições no Terra">
  <iframe
    id="eleicoes-no-terra-embed"
    title="Buscador de candidaturas — Eleições no Terra"
    src="https://buscadorv2-pzlzvemq.manus.space/embed"
    loading="lazy"
    referrerpolicy="strict-origin-when-cross-origin"
    style="display:block;width:100%;min-height:900px;border:0;overflow:hidden"
  ></iframe>
</section>

<script>
  (function () {
    var iframe = document.getElementById('eleicoes-no-terra-embed');
    var sourceOrigin = 'https://buscadorv2-pzlzvemq.manus.space';

    window.addEventListener('message', function (event) {
      if (event.origin !== sourceOrigin || !event.data || event.data.type !== 'eleicoes-no-terra:resize') return;
      var height = Number(event.data.height);
      if (!Number.isFinite(height)) return;
      iframe.style.height = Math.max(900, Math.min(height + 16, 12000)) + 'px';
    });
  }());
</script>
```

> Se o portal Terra usar uma política de segurança de conteúdo, inclua `https://buscadorv2-pzlzvemq.manus.space` na diretiva `frame-src`. Não adicione `sandbox` ao iframe: ele impediria a navegação interna, a impressão da colinha e a abertura do documento oficial do TSE em nova guia.

## Atualização automática

O iframe aponta sempre para o domínio publicado do buscador, e não para um arquivo copiado no portal. Dessa forma, qualquer nova versão publicada — incluindo ajustes manuais ou a sincronização diária oficial das 9h — passa a ser a origem do embed automaticamente. Além disso, enquanto estiver aberto, o embed renova suas consultas públicas a cada 60 segundos. Não há trabalho de atualização, upload ou troca de código exigido no portal após a inclusão inicial.

| Evento | Reflexo no embed |
| --- | --- |
| Sincronização diária oficial concluída | A base atualizada é lida na próxima renovação do iframe, em até 60 segundos. |
| Atualização manual de dados publicada | A mesma versão publicada passa a servir o iframe automaticamente. |
| Nova versão visual publicada | O iframe passa a carregar a interface atualizada em uma nova abertura ou renovação de cache. |
| Falha mais recente que o último sucesso | O iframe exibe o aviso discreto de que permanece no último conjunto oficial disponível. |

## Regras editoriais preservadas

O embed mantém o desenho editorial do buscador e as mesmas restrições públicas: dados exclusivamente oficiais do TSE, redes sociais apenas X, Instagram, Facebook, TikTok e YouTube, um documento oficial de proposta por candidatura quando houver registro, vice exibido de forma simplificada, e a área separada para candidaturas fora da disputa.
