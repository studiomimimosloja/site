# Google Analytics 4 — como ligar e o que ele mede

## 1. Criar a conta e pegar o ID

1. Acesse https://analytics.google.com com a conta Google da loja.
2. **Começar a medir** › nome da conta: `Studio MiMimos`.
3. Propriedade: `studiomimimos.com.br` · fuso **(GMT-03:00) Fortaleza** · moeda **Real (BRL)**.
4. Plataforma: **Web** › URL `https://studiomimimos.com.br` › nome do fluxo `Site`.
5. Aparece o **ID da métrica**, no formato `G-ABC123XYZ`. Me passe esse ID.
   - Eu troco o `G-XXXXXXXXXX` no arquivo `assets/js/analytics.js`. Enquanto estiver com X, o site não envia nada ao Google.

## 2. Como funciona o aviso de cookies (LGPD)

- Na primeira visita aparece um aviso no canto da tela com **Aceitar** e **Recusar**.
- **Só depois do "Aceitar"** o site carrega o Google Analytics. Quem recusa (ou ignora o aviso) não é medido e nenhum cookie do Google é gravado.
- A escolha fica guardada no navegador da pessoa. No rodapé tem o link **Preferências de cookies** para mudar de ideia.
- Consequência: os números do GA vão mostrar só quem aceitou. É normal ficarem abaixo do número real de visitas.

## 3. Eventos que o site envia

| Evento | Quando acontece | Detalhes enviados |
|---|---|---|
| `whatsapp_click` | clique em qualquer botão de WhatsApp | `origem`: hero, menu, flutuante, sobre, como-funciona, catalogo, faq, cta-final, rodape, cesta, 404 |
| `add_to_quote` | produto adicionado à lista de orçamento | `produto`, `categoria` |
| `quote_sent` | "Enviar lista pelo WhatsApp" | `qtd_itens` |
| `view_product` | clique na foto do produto para ampliar | `produto`, `categoria` |
| `filter_category` | clique numa aba de categoria ou subcategoria | `categoria`, `subcategoria` |
| `instagram_click` | clique em link do Instagram | `origem` |

## 4. Marcar os eventos mais importantes como "eventos-chave"

São os que mostram interesse real de compra: `whatsapp_click` e `quote_sent`.

1. No GA4: **Administrador** (engrenagem, canto inferior esquerdo) › **Exibição de dados** › **Eventos**.
2. Os eventos só aparecem na lista **depois de acontecerem pelo menos uma vez** (até 24 h). Faça um teste: aceite os cookies no site e clique num botão de WhatsApp.
3. Na linha de `whatsapp_click`, ligue a chave **Marcar como evento-chave**. Faça o mesmo em `quote_sent`.

## 5. Ver os detalhes (produto, origem) nos relatórios

O GA guarda os detalhes, mas só mostra nos relatórios depois que eles são registrados (uma vez só):

1. **Administrador** › **Exibição de dados** › **Definições personalizadas** › **Criar dimensão personalizada**.
2. Crie uma para cada, com escopo **Evento**:
   - Nome `Origem` › parâmetro `origem`
   - Nome `Produto` › parâmetro `produto`
   - Nome `Categoria` › parâmetro `categoria`
   - Nome `Subcategoria` › parâmetro `subcategoria`
3. Crie também uma **métrica personalizada**: nome `Itens na cesta` › parâmetro `qtd_itens` › unidade Padrão.

Depois disso, em **Relatórios** › **Engajamento** › **Eventos**, clique num evento para ver, por exemplo, quais produtos mais vão para a cesta.

## 6. Testar se está chegando (DebugView)

1. Abra o site com `?debug_ga=1` no final: `https://studiomimimos.com.br/?debug_ga=1`
2. Aceite os cookies.
3. No GA4: **Administrador** › **Exibição de dados** › **DebugView**.
4. Clique em WhatsApp, adicione um produto à cesta e envie. Os eventos aparecem na linha do tempo em segundos.

Com `?debug_ga=1`, os eventos também aparecem no console do navegador (F12), mesmo sem o GA configurado.
