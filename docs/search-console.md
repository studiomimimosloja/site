# Google Search Console — passo a passo

O Search Console mostra como o Google enxerga o site: quais páginas estão no Google, por quais buscas as pessoas chegam e se tem algum erro.

## 1. Criar a propriedade (uma vez só)

1. Acesse https://search.google.com/search-console e entre com a conta Google da loja.
2. Clique em **Adicionar propriedade**.
3. Escolha **Domínio** (caixa da esquerda) e digite `studiomimimos.com.br`.
   - Esse tipo cobre tudo de uma vez: com e sem `www`, `http` e `https`.
4. O Google mostra um registro **TXT** (algo como `google-site-verification=abc123...`). Copie.
5. Abra o painel onde o domínio foi registrado (provavelmente o **Registro.br**):
   - Registro.br › seu domínio › **DNS** › **Editar zona** › **Nova entrada**
   - Tipo: `TXT` · Nome: deixe vazio (ou `@`) · Valor: cole o texto do Google
   - Salve. **Não apague** os registros que já existem (são eles que apontam para o GitHub Pages).
6. Volte ao Search Console e clique em **Verificar**. Pode levar de alguns minutos a algumas horas. Se falhar, espere um pouco e tente de novo.

### Alternativa mais rápida (se o DNS der trabalho)

Escolha **Prefixo do URL** com `https://studiomimimos.com.br/`, depois o método **Tag HTML**. O Google mostra uma linha assim:

```html
<meta name="google-site-verification" content="XXXXXXXX" />
```

Me passe só o código que está em `content` e eu troco o `COLE_AQUI_O_CODIGO_DO_SEARCH_CONSOLE` no `index.html`. Depois de publicar, clique em **Verificar**.

## 2. Enviar o sitemap

1. Menu da esquerda › **Sitemaps**.
2. Em "Adicionar um novo sitemap", digite `sitemap.xml` e clique em **Enviar**.
3. O status deve ficar **Concluído**. Ele vai listar a home e, depois da Fase 3, as páginas de produto.

## 3. Pedir para o Google ler a página inicial

1. Na barra de cima (**Inspecionar qualquer URL**), cole `https://studiomimimos.com.br/`.
2. Clique em **Solicitar indexação**.
3. Faça o mesmo com páginas novas importantes (ex.: um produto de Natal), quando existirem.

## 4. Onde ver erros e resultados

| O que você quer saber | Onde fica |
|---|---|
| Quais buscas trazem gente ao site | **Desempenho** › Resultados da pesquisa |
| Páginas que estão (ou não) no Google | **Indexação** › Páginas |
| Problemas no celular / velocidade | **Experiência** › Core Web Vitals |
| Erros nos dados estruturados (produtos, FAQ) | **Melhorias** (aparece depois da Fase 3) |

Os primeiros dados aparecem em 2 a 3 dias. Vale olhar uma vez por semana.
