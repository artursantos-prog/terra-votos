# Embed — Buscador de Candidatos

Após publicar este projeto, substitua `https://SEU-SUBDOMINIO.manus.space` pelo endereço público definitivo do buscador e insira o bloco abaixo na página do Terra.

```html
<section class="terra-eleicoes-embed" aria-label="Buscador de candidatos">
  <iframe
    src="https://SEU-SUBDOMINIO.manus.space"
    title="Buscador de candidatos — Eleições no Terra"
    loading="lazy"
    referrerpolicy="strict-origin-when-cross-origin"
    allow="clipboard-read; clipboard-write"
  ></iframe>
</section>

<style>
  .terra-eleicoes-embed {
    width: 100%;
    max-width: 1480px;
    margin: 0 auto;
    overflow: hidden;
    background: #fffdfb;
  }

  .terra-eleicoes-embed iframe {
    display: block;
    width: 100%;
    min-height: 1180px;
    border: 0;
    background: #fffdfb;
  }

  @media (max-width: 760px) {
    .terra-eleicoes-embed iframe {
      min-height: 1380px;
    }
  }
</style>
```

## Observações de integração

O componente já contém a interface, os filtros e a base pública processada. Não é necessário incluir arquivos CSS, JavaScript ou CSV adicionais na página hospedeira. O `iframe` é a opção mais segura para preservar o isolamento de estilos e scripts entre o portal e o buscador.

O buscador carrega um JSON público, reduzido exclusivamente aos campos necessários para o uso editorial: estado, cargo, nome de urna, nome completo, partido, número de urna e situação da candidatura. Os identificadores únicos e demais campos pessoais existentes nos CSVs de origem não são publicados no navegador.

## Fotos

Esta primeira versão foi deliberadamente preparada sem fotos. Quando os arquivos de imagem estiverem disponíveis, cada card poderá receber uma foto sem modificar a estrutura dos filtros ou a integração por `iframe`.

## Publicação

Antes de usar o código acima, publique o projeto pela interface de gerenciamento e use o domínio público disponibilizado após a publicação. O endereço de pré-visualização de desenvolvimento não deve ser incorporado no portal.
