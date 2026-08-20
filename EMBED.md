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

O componente já contém a interface, os filtros, os cards com foto e a base pública processada. Não é necessário incluir arquivos CSS, JavaScript ou CSV adicionais na página hospedeira. O `iframe` é a opção mais segura para preservar o isolamento de estilos e scripts entre o portal e o buscador.

O buscador carrega um JSON público, reduzido exclusivamente aos campos necessários para o uso editorial: estado, cargo, nome de urna, nome completo, partido, número de urna, situação da candidatura e uma URL pública de foto. A chave técnica pública da candidatura é mantida apenas para renderização e associação estável dos cards; campos pessoais desnecessários existentes nos CSVs de origem não são publicados no navegador.

## Fotos e atualização eleitoral

As fotos são carregadas diretamente da rota pública de imagem do DivulgaCandContas, associada ao identificador de cada candidatura. Isso evita armazenar milhares de imagens no projeto e mantém os cards alinhados ao acervo do TSE. A base atual foi consolidada a partir do arquivo oficial mais recente de candidaturas de 20/08/2026. O Portal de Dados Abertos informa atualização quatro vezes por dia; o DivulgaCandContas informa atualização a cada 60 minutos. Em uma checagem pontual, o portal exibiu quatro registros ainda não presentes no arquivo oficial; eles devem ser incorporados automaticamente no próximo ciclo do CSV do TSE.

## Publicação

Antes de usar o código acima, publique o projeto pela interface de gerenciamento e use o domínio público disponibilizado após a publicação. O endereço de pré-visualização de desenvolvimento não deve ser incorporado no portal.
