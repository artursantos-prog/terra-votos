# Embed — Buscador de Candidatos

Use o endereço público publicado do buscador no bloco abaixo para inseri-lo em uma página do Terra.

```html
<section class="terra-eleicoes-embed" aria-label="Buscador de candidatos">
  <iframe
    src="https://candidatos-lqrmtjns.manus.space"
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
    min-height: 1320px;
    border: 0;
    background: #fffdfb;
  }

  @media (max-width: 760px) {
    .terra-eleicoes-embed iframe {
      min-height: 1480px;
    }
  }
</style>
```

## Observações de integração

O componente já contém a interface, os filtros por **nome ou número, estado, partido e cargo**, os cards com foto, a colinha exportável em PDF e a base pública processada. Não é necessário incluir arquivos CSS, JavaScript ou CSV adicionais na página hospedeira. O `iframe` preserva o isolamento de estilos e scripts entre o portal e o buscador.

O buscador carrega um JSON público, reduzido exclusivamente aos campos necessários para o uso editorial: estado, cargo, nome de urna, nome completo, partido, número de urna, situação da candidatura e uma URL pública de foto. A chave técnica pública da candidatura é mantida apenas para renderização e associação estável dos cards; campos pessoais desnecessários existentes nos CSVs de origem não são publicados no navegador.

## Metodologia e atualização eleitoral

As fotos são carregadas diretamente da rota pública de imagem do DivulgaCandContas, associada ao identificador de cada candidatura. A base é formada pelos arquivos públicos de candidaturas e informações complementares do TSE; o buscador mantém apenas candidaturas com situação de julgamento **Deferido** ou **Aguardando julgamento**. A fonte de dados abertos informa atualização diária. A rotina do projeto é programada para duas verificações diárias, às **09h e 21h (BRT)**. Se o ZIP oficial estiver temporariamente indisponível, a rotina consulta a API pública oficial do DivulgaCandContas; se nenhuma fonte puder ser validada, mantém a última base válida em vez de publicar uma base incompleta. A metodologia completa está em `METODOLOGIA.md`.

### Como a atualização chega ao iframe

O código de embed usa sempre o mesmo domínio publicado, sem apontar para um arquivo JSON com versão fixa. Em uma sincronização bem-sucedida, a aplicação registra e passa a servir um novo snapshot ativo. Assim, **não é necessário trocar o snippet no portal Terra**: novas visitas ao iframe já carregam a versão ativa e iframes que já estiverem abertos consultam a versão ativa a cada cinco minutos — além de refazerem a consulta quando recebem foco. O painel privado registra o histórico de execuções e a hora da última atualização válida.

## Publicação

Use exclusivamente o domínio público publicado. O endereço de pré-visualização de desenvolvimento não deve ser incorporado no portal.
