# Páginas de produto — como atualizar

Cada produto ativo do painel tem uma página própria, por exemplo
`https://studiomimimos.com.br/produto/caixa-milk/`. As variações (Simples, 3D, Luxo) ficam juntas na mesma página.

## Quando atualizar

As páginas **não se atualizam sozinhas**. Depois de criar, editar, ocultar ou trocar a foto de um produto no painel, peça ao Claude: **"atualiza as páginas dos produtos"**.

Se esquecer, nada quebra: o produto continua aparecendo na página inicial. Só a página própria dele fica desatualizada (ou ainda não existe) até a próxima atualização.

## O que o programa faz

Comando, rodado na pasta do site: `node scripts/gerar-paginas.mjs`

1. Lê os produtos ativos do painel (só leitura, com a chave pública).
2. Cria ou atualiza `produto/<endereço>/index.html` e a foto do link no WhatsApp (`og.jpg`, precisa do ffmpeg).
3. Apaga as páginas de produtos que saíram do site.
4. Atualiza o `sitemap.xml`, o `produto/paginas.json` (usado pela home para os links "Ver detalhes") e o bloco de perguntas frequentes (FAQPage) no `index.html`.

Depois é só conferir na prévia e publicar.

## Cuidados

- **Endereço = nome do produto.** "Caixa Milk Luxo", "Caixa Milk 3D" e "Caixa Milk Simples" (mesmo grupo) viram `/produto/caixa-milk/`. Renomear um produto publicado muda o endereço, e o link antigo passa a cair na página "Ops! Esse mimo se perdeu no caminho". Renomeie só quando precisar.
- **Preço nos dados para o Google:** só entra quando o produto tem preço no painel. "Sob consulta" fica sem preço. Nada é inventado.
- **Não edite os arquivos de `produto/` à mão.** Eles são refeitos toda vez que o programa roda.

## Como testar os dados estruturados

- Teste de pesquisa aprimorada do Google: https://search.google.com/test/rich-results (cole o endereço de uma página de produto, depois de publicada)
- Validador do schema.org: https://validator.schema.org (aceita endereço ou o código da página)
