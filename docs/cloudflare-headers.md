# Cloudflare na frente do site — cabeçalhos de segurança

O GitHub Pages não deixa configurar cabeçalhos de segurança. O Cloudflare (plano grátis) fica "na frente" do site e acrescenta esses cabeçalhos em cada resposta. O site continua hospedado no GitHub.

Tempo estimado: 30 minutos de trabalho, mais algumas horas de espera pela troca de DNS. O site **não sai do ar** se os passos forem seguidos na ordem.

## 1. Criar a conta e adicionar o domínio

1. Crie a conta em https://dash.cloudflare.com/sign-up
2. **Add a domain** › digite `studiomimimos.com.br` › plano **Free**.
3. O Cloudflare copia os registros de DNS que já existem. **Confira se estes estão na lista** (são os do GitHub Pages):

| Tipo | Nome | Conteúdo |
|---|---|---|
| A | `studiomimimos.com.br` (ou `@`) | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `studiomimimosloja.github.io` |

   - Se algum faltar, adicione. Se existir um TXT do Google (Search Console), **mantenha**.
   - Deixe a nuvem **laranja** (Proxied) ligada nos registros A e CNAME.
4. O Cloudflare mostra **dois nameservers** (ex.: `ana.ns.cloudflare.com`). Anote.

## 2. Trocar os nameservers no Registro.br

1. Entre em https://registro.br › seu domínio › **Alterar servidores DNS**.
2. Troque pelos dois do Cloudflare e salve.
3. Pode levar de minutos até 24 h. O Cloudflare manda e-mail quando ativar ("Active").

Durante a troca o site continua no ar: os dois lados apontam para o mesmo GitHub.

## 3. HTTPS (importante, senão o site entra em loop)

No Cloudflare: **SSL/TLS** › **Overview** › modo **Full** (não use "Flexible").

Depois: **SSL/TLS** › **Edge Certificates**:
- **Always Use HTTPS**: ligado
- **HSTS** › Enable › `max-age` **12 months**, **Include subdomains**: ligado, **Preload**: desligado, **No-Sniff**: ligado.
  (Isso já cria os cabeçalhos `Strict-Transport-Security` e `X-Content-Type-Options`.)

## 4. Regra com os outros cabeçalhos

**Rules** › **Transform Rules** › **Modify Response Header** › **Create rule**

- Nome: `Segurança MiMimos`
- Aplicar a: **All incoming requests**
- Adicione (operação **Set static**), um por linha:

| Cabeçalho | Valor |
|---|---|
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Content-Security-Policy` | `frame-ancestors 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests` |

Salve (**Deploy**).

### Por que não `DENY` e por que a CSP é curta

- **SAMEORIGIN, não DENY:** o painel admin abre o gerador de orçamentos (`orcamento.html`) dentro dele mesmo. Com `DENY` (ou `frame-ancestors 'none'`), a aba Orçamentos para de funcionar. `SAMEORIGIN` bloqueia outros sites e libera o próprio site.
- **CSP curta no cabeçalho:** cada página já tem a sua CSP completa no HTML (`<meta http-equiv="Content-Security-Policy">`). As páginas públicas são rígidas; o admin precisa de regras mais leves. Se a CSP rígida fosse colocada no cabeçalho, ela valeria também para o admin e quebraria os botões do painel. O cabeçalho completa só o que a meta tag não consegue fazer (`frame-ancestors`).

## 5. Conferir

1. Abra https://securityheaders.com e teste `https://studiomimimos.com.br`. Nota esperada: **A**.
2. Abra o site no celular e no computador: home, uma página de produto, o WhatsApp e a cesta.
3. Entre no painel admin e abra a aba **Orçamentos**: o gerador precisa aparecer.

## Se algo der errado

- **Site em loop de redirecionamento:** o SSL está em "Flexible". Mude para **Full**.
- **Aba Orçamentos em branco no admin:** confira se `X-Frame-Options` está `SAMEORIGIN` e a CSP do cabeçalho tem `frame-ancestors 'self'`.
- **Para desligar tudo rápido:** desative a regra do passo 4 (botão ao lado dela). Em último caso, no DNS, clique na nuvem laranja para ficar cinza (o Cloudflare deixa de ficar na frente).
- **Mudei o site e não atualizou:** **Caching** › **Configuration** › **Purge Everything**.

> Observação: o GitHub pode mostrar um aviso de domínio em **Settings › Pages** depois da troca. Com o SSL em **Full**, o site continua funcionando normalmente.
