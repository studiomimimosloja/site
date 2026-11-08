// ══ GERADOR DAS PÁGINAS DE PRODUTO ═══════════════════════════════
// Lê os produtos ativos do painel (Supabase) e gera:
//   produto/<endereco>/index.html   uma página por produto (variações juntas)
//   produto/<endereco>/og.jpg       foto para o link no WhatsApp (precisa do ffmpeg)
//   produto/paginas.json            id do produto -> endereço (usado pela home)
//   sitemap.xml                     home + todas as páginas de produto
//   index.html                      atualiza o bloco FAQPage (dados estruturados)
//   scripts/estado-paginas.json     controle interno (data de atualização de cada página)
//
// Como rodar (na pasta do site):   node scripts/gerar-paginas.mjs
// Só usa a chave pública (anon) do Supabase, a mesma que já está no main.js.
// Nada é publicado: confira na prévia e faça o commit/push depois.

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://studiomimimos.com.br';
const WPP = '5585997327204';
const HOJE = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Fortaleza' }); // AAAA-MM-DD
const VERSAO = HOJE.replace(/-/g, '');
// Mesma política de segurança (CSP) das outras páginas públicas (index.html e 404.html)
const CSP = "default-src 'self'; script-src 'self' https://*.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://grmulciyoytzqlrdqmcg.supabase.co https://*.google-analytics.com https://*.googletagmanager.com; connect-src 'self' https://grmulciyoytzqlrdqmcg.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests";

// Mesma URL e chave pública que o site usa (lidas do main.js, ou da variável de ambiente)
const mainJs = readFileSync(join(RAIZ, 'assets/js/main.js'), 'utf8');
const SUPA_URL = process.env.SUPABASE_URL || (mainJs.match(/SUPA_URL\s*=\s*"([^"]+)"/) || [])[1];
const SUPA_KEY = process.env.SUPABASE_ANON_KEY || (mainJs.match(/SUPA_KEY\s*=\s*"([^"]+)"/) || [])[1];
if (!SUPA_URL || !SUPA_KEY) throw new Error('Não achei SUPA_URL/SUPA_KEY no main.js');
if (/service_role/.test(Buffer.from(SUPA_KEY.split('.')[1] || '', 'base64').toString())) {
  throw new Error('Isso é a chave service_role! Use só a chave anon.');
}

async function buscar(caminho) {
  const r = await fetch(`${SUPA_URL}/rest/v1/${caminho}`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` }
  });
  if (!r.ok) throw new Error(`Supabase ${caminho}: ${r.status} ${await r.text()}`);
  return r.json();
}

// ── utilidades ─────────────────────────────────────────────
const esc = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const jsonSeguro = o => JSON.stringify(o, null, 2).replace(/</g, '\\u003c');
const lista = v => { if (typeof v === 'string') { try { v = JSON.parse(v); } catch { v = []; } } return Array.isArray(v) ? v : []; };
const faixas = p => { let f = p.precos_faixa; if (typeof f === 'string') { try { f = JSON.parse(f); } catch { f = null; } } return f; };
const numero = t => { const n = parseFloat(String(t).replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return isNaN(n) ? null : n; };
const fotos = p => [p.foto_url, ...lista(p.fotos_extras)].filter(Boolean);

function textoPuro(desc) {
  return String(desc || '').replace(/\r/g, '').split('\n')
    .map(l => l.trim().replace(/^[*\-•·]\s+/, '')).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}
function cortar(t, max) {
  if (t.length <= max) return t;
  const c = t.slice(0, max - 1);
  return c.slice(0, c.lastIndexOf(' ') > 60 ? c.lastIndexOf(' ') : c.length).replace(/[\s,.;:–-]+$/, '') + '…';
}

// Descrição com o mesmo formato do site (parágrafos, listas e "Rótulo:")
function descricaoHtml(texto) {
  const rot = t => {
    const m = t.match(/^([^:\n]{2,40}):\s*(.*)$/);
    return (m && !/^https?$/i.test(m[1])) ? `<strong>${esc(m[1])}:</strong>${m[2] ? ' ' + esc(m[2]) : ''}` : esc(t);
  };
  let html = '', emLista = false;
  for (const l of String(texto || '').replace(/\r/g, '').split('\n')) {
    const t = l.trim();
    const b = t.match(/^[*\-•·]\s+(.*)$/);
    if (b) { if (!emLista) { html += '<ul class="desc-list">'; emLista = true; } html += `<li>${rot(b[1])}</li>`; continue; }
    if (emLista) { html += '</ul>'; emLista = false; }
    if (t) html += `<p>${rot(t)}</p>`;
  }
  if (emLista) html += '</ul>';
  return html;
}

// Preço igual ao do site
function precoHtml(p) {
  const pf = faixas(p);
  if (pf && pf.ativo && ((pf.faixas && pf.faixas.length) || pf.pedido_minimo)) {
    let h = '';
    if (pf.pedido_minimo) h += `<small class="pp-min">Pedido mínimo: ${esc(pf.pedido_minimo)} un</small>`;
    h += '<div class="pp-faixas">';
    (pf.faixas || []).forEach((f, i) => {
      const rotulo = (i === 0 && pf.pedido_minimo) ? `a partir de ${pf.pedido_minimo} un` : `até ${f.ate} un`;
      h += `<div><span>${esc(rotulo)}</span><strong>R$ ${esc(f.preco)}</strong></div>`;
    });
    if (pf.acima_sob_consulta) {
      const ult = (pf.faixas && pf.faixas.length) ? `acima de ${pf.faixas[pf.faixas.length - 1].ate} un` : 'acima';
      h += `<div><span>${esc(ult)}</span><strong>Sob consulta</strong></div>`;
    }
    return h + '</div>';
  }
  if (p.preco && p.preco_tipo !== 'consulta') {
    let h = '';
    if (p.promo && p.promo_preco) h += `<del>R$ ${esc(p.preco)}</del>`;
    if (p.preco_tipo === 'partir') h += '<small>a partir de</small>';
    return h + `R$ ${esc(p.promo && p.promo_preco ? p.promo_preco : p.preco)}`;
  }
  return '<small>a partir de</small>Sob consulta';
}
// Texto do preço que vai para a cesta (igual ao site)
const precoCesta = p => (p.preco && p.preco_tipo !== 'consulta') ? 'R$ ' + (p.promo && p.promo_preco ? p.promo_preco : p.preco) : 'Sob consulta';
// Menor preço público (para o JSON-LD). null = sob consulta → sem "offers"
function menorPreco(p) {
  const pf = faixas(p);
  if (pf && pf.ativo && pf.faixas && pf.faixas.length) {
    const ns = pf.faixas.map(f => numero(f.preco)).filter(n => n !== null);
    if (ns.length) return Math.min(...ns);
  }
  if (!p.preco || p.preco_tipo === 'consulta') return null;
  return numero(p.promo && p.promo_preco ? p.promo_preco : p.preco);
}

// Nome do grupo sem o nome da variação ("Caixa Milk Luxo" -> "Caixa Milk")
function nomeBase(vs) {
  const limpos = vs.map(v => {
    let n = String(v.nome || '').trim();
    const vn = String(v.variacao_nome || '').trim();
    if (vn) n = n.replace(new RegExp('\\s*[-–—]?\\s*' + vn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'), '').trim();
    return n;
  });
  if (limpos.every(n => n.toLowerCase() === limpos[0].toLowerCase())) return limpos[0];
  const ws = limpos.map(n => n.split(/\s+/));
  const pref = [];
  for (let i = 0; ws.every(w => w[i] && w[i].toLowerCase() === ws[0][i].toLowerCase()); i++) pref.push(ws[0][i]);
  return pref.join(' ').replace(/[\s\-–—]+$/, '') || limpos[0];
}

const WPP_SVG = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
const LISTA_SVG = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z"/><path d="M8 6H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2"/><path d="M9 12h6M9 16h4"/></svg>';

function linkWpp(v, url) {
  const msg = (v.whatsapp_msg && v.whatsapp_msg.trim())
    ? v.whatsapp_msg.trim()
    : `Olá! Vi o produto *${v.nome}* no site do Studio MiMimos e gostaria de um orçamento. 😊\n${url}`;
  return `https://wa.me/${WPP}?text=${encodeURIComponent(msg)}`;
}

// ── imagem de compartilhamento (1200x630) ──────────────────
function temFfmpeg() {
  return spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;
}
function gerarOg(fonte, destino) {
  const filtro = '[0]scale=1200:1200:force_original_aspect_ratio=increase,crop=1200:630,boxblur=24:2,eq=brightness=0.05:saturation=0.8[bg];' +
    '[0]scale=-2:570[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,format=yuvj420p';
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', fonte, '-filter_complex', filtro, '-frames:v', '1', '-q:v', '4', destino], { encoding: 'utf8' });
  return r.status === 0;
}

// ── página de produto ──────────────────────────────────────
function paginaHtml(g, relacionados, badges) {
  const url = `${SITE}/produto/${g.slug}/`;
  const v0 = g.variantes[0];
  const catSlug = slugify(g.categoria);
  const tituloBase = `${g.nome} | Studio MiMimos Fortaleza`;
  const titulo = tituloBase.length <= 60 ? tituloBase : `${g.nome} | Studio MiMimos`;
  const desc = cortar(textoPuro(v0.descricao) || `${g.nome} personalizado sob encomenda no Studio MiMimos, em Fortaleza. Peça seu orçamento pelo WhatsApp.`, 155);
  const ogImg = g.og ? `${url}og.jpg` : `${SITE}/assets/img/og-image.jpg`;
  const todasFotos = [...new Set(g.variantes.flatMap(fotos))];
  const multi = g.variantes.length > 1;

  const precos = g.variantes.map(menorPreco).filter(n => n !== null);
  const produtoLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: g.nome,
    description: textoPuro(v0.descricao) || desc,
    sku: g.variantes.map(v => String(v.id)).join('-'),
    category: [g.categoria, g.subcategoria].filter(Boolean).join(' > '),
    brand: { '@type': 'Brand', name: 'Studio MiMimos' },
    url
  };
  if (todasFotos.length) produtoLd.image = todasFotos;
  // Só entra preço quando o produto tem preço público no painel (nunca inventado)
  if (precos.length) {
    produtoLd.offers = {
      '@type': 'AggregateOffer',
      priceCurrency: 'BRL',
      lowPrice: Math.min(...precos).toFixed(2),
      highPrice: Math.max(...precos).toFixed(2),
      offerCount: precos.length,
      url
    };
  }
  const trilhaLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: g.categoria, item: `${SITE}/#categoria-${catSlug}` },
      { '@type': 'ListItem', position: 3, name: g.nome, item: url }
    ]
  };

  const galeria = (v, i) => {
    const fs = fotos(v);
    const alt = v.nome || g.nome;
    const principal = fs.length
      ? `<img class="pp-foto" src="${esc(fs[0])}" alt="${esc(alt)}" width="1200" height="1200" decoding="async"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}>`
      : '<div class="pp-sem-foto"><span>foto em breve</span></div>';
    const miniaturas = fs.length > 1
      ? `<div class="pp-miniaturas">${fs.map((f, j) => `<button type="button" class="pp-mini${j === 0 ? ' ativo' : ''}" data-src="${esc(f)}" aria-label="Foto ${j + 1} de ${esc(alt)}"><img src="${esc(f)}" alt="" width="120" height="120" loading="lazy" decoding="async"></button>`).join('')}</div>`
      : '';
    const bdg = v.badge && v.badge !== 'Nenhum' && badges[v.badge]
      ? `<span class="badge pp-badge" style="background:${esc(badges[v.badge].cor_fundo)};color:${esc(badges[v.badge].cor_texto)}">${esc(v.badge)}</span>` : '';
    return `<div class="pp-galeria" data-var="${i}"${i ? ' hidden' : ''}><div class="pp-foto-wrap">${bdg}${principal}</div>${miniaturas}</div>`;
  };

  const infoVariante = (v, i) => `
        <div class="pp-var-info" data-var="${i}"${i ? ' hidden' : ''}>
          <div class="pp-preco product-price">${precoHtml(v)}</div>
          <div class="pp-desc product-desc">${descricaoHtml(v.descricao) || '<p>Personalizamos com nome, tema e cores. Chame no WhatsApp para combinar os detalhes.</p>'}</div>
          <div class="pp-acoes">
            <a href="${esc(linkWpp(v, url))}" class="btn btn-wpp" target="_blank" rel="noopener noreferrer" data-produto="${esc(v.nome)}">${WPP_SVG} Pedir orçamento no WhatsApp</a>
            <button type="button" class="wl-add-btn pp-add" data-wl-nome="${esc(v.nome)}" data-wl-preco="${esc(precoCesta(v))}" data-wl-cat="${esc(g.categoria)}" data-wl-texto="+ Adicionar à cesta">+ Adicionar à cesta</button>
          </div>
        </div>`;

  const seletor = multi
    ? `<div class="var-selector pp-seletor" role="group" aria-label="Opções">${g.variantes.map((v, i) => `<button type="button" class="var-btn${i === 0 ? ' active' : ''}" data-var="${i}" aria-pressed="${i === 0}">${esc(v.variacao_nome || v.nome)}</button>`).join('')}</div>`
    : '';

  const rel = relacionados.length ? `
  <section class="pp-relacionados" aria-labelledby="rel-titulo">
    <h2 id="rel-titulo">Veja também</h2>
    <div class="pp-rel-grid">
      ${relacionados.map(r => {
        const f = fotos(r.variantes[0])[0];
        return `<a class="pp-rel" href="/produto/${r.slug}/">
        ${f ? `<img src="${esc(f)}" alt="${esc(r.nome)}" width="1200" height="1200" loading="lazy" decoding="async">` : '<div class="pp-sem-foto"><span>foto em breve</span></div>'}
        <span>${esc(r.nome)}</span>
      </a>`;
      }).join('\n      ')}
    </div>
  </section>` : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${CSP}">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Página gerada por scripts/gerar-paginas.mjs — não edite à mão: edite o produto no painel e rode o script de novo. -->
  <title>${esc(titulo)}</title>
  <meta name="description" content="${esc(desc)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="#2ECFC4">

  <meta property="og:type" content="product">
  <meta property="og:site_name" content="Studio MiMimos">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(g.nome)} | Studio MiMimos">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:image" content="${ogImg}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(g.nome)} — Studio MiMimos">
  <meta property="og:locale" content="pt_BR">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(g.nome)} | Studio MiMimos">
  <meta name="twitter:description" content="${esc(desc)}">
  <meta name="twitter:image" content="${ogImg}">

  <link rel="icon" type="image/png" href="/assets/img/img-1.png">
  <link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Nunito+Sans:wght@300;400;500;600;700&family=Caveat:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/style.css">
  <link rel="stylesheet" href="/assets/css/variations.css?v=${VERSAO}">
  <link rel="stylesheet" href="/assets/css/produto.css?v=${VERSAO}">
  <link rel="stylesheet" href="/assets/css/cookies.css?v=${VERSAO}">

  <script type="application/ld+json">
${jsonSeguro(produtoLd)}
  </script>
  <script type="application/ld+json">
${jsonSeguro(trilhaLd)}
  </script>
</head>
<body class="pp-body">

<header class="pp-header">
  <a href="/" class="logo-wrap" aria-label="Studio MiMimos — página inicial">
    <img src="/assets/img/logo-2.png" alt="" width="95" height="120" class="pp-logo">
    <span class="logo-lock">
      <span class="logo-name">Studio <span>MiMimos</span></span>
      <span class="logo-tagline">feitos pra você</span>
    </span>
  </a>
  <nav class="pp-nav" aria-label="Menu">
    <a href="/#catalogo">Catálogo</a>
    <a href="https://wa.me/${WPP}?text=${encodeURIComponent('Olá! Vi o site do Studio MiMimos e gostaria de fazer um orçamento. 😊')}" class="nav-wpp" target="_blank" rel="noopener noreferrer" data-origem="menu">${WPP_SVG} WhatsApp</a>
  </nav>
</header>

<main class="produto-pagina" style="--accent:var(--teal);--accent-d:var(--teal-d)">
  <nav class="pp-trilha" aria-label="Você está em">
    <a href="/">Início</a> <span aria-hidden="true">›</span>
    <a href="/#categoria-${catSlug}">${esc(g.categoria)}</a> <span aria-hidden="true">›</span>
    <span aria-current="page">${esc(g.nome)}</span>
  </nav>

  <article class="pp-produto">
    <div class="pp-col-fotos">
      ${g.variantes.map(galeria).join('\n      ')}
    </div>
    <div class="pp-col-info">
      <p class="eyebrow">${esc([g.categoria, g.subcategoria].filter(Boolean).join(' · '))}</p>
      <h1>${esc(g.nome)}</h1>
      ${seletor}
      ${g.variantes.map(infoVariante).join('')}
      <ul class="pp-garantias">
        <li>Feito sob encomenda, do seu jeito</li>
        <li>Personalizamos nome, tema e cores</li>
        <li>Retirada em Fortaleza ou entrega combinada</li>
      </ul>
      <a href="/#categoria-${catSlug}" class="btn-ghost pp-voltar">‹ Ver mais produtos de ${esc(g.categoria)}</a>
    </div>
  </article>
${rel}
</main>

<footer class="pp-footer">
  <p><strong>Studio MiMimos</strong> · Lembrancinhas e presentes personalizados em Fortaleza, CE</p>
  <p><a href="https://instagram.com/studiomimimos" target="_blank" rel="noopener noreferrer">@studiomimimos</a> · <a href="https://wa.me/${WPP}" target="_blank" rel="noopener noreferrer">(85) 99732-7204</a> · <button type="button" class="ck-link" data-cookies-prefs>Preferências de cookies</button></p>
</footer>

<div id="wishlist-panel" class="wl-panel" style="display:none">
  <div class="wl-overlay"></div>
  <div class="wl-content">
    <div class="wl-header">
      <h3>Minha lista de pedidos</h3>
      <button class="wl-close" aria-label="Fechar">✕</button>
    </div>
    <div class="wl-body" id="wl-items"></div>
    <div class="wl-footer" id="wl-footer" style="display:none">
      <button class="btn btn-wpp wl-send">${WPP_SVG} Enviar lista pelo WhatsApp</button>
    </div>
  </div>
</div>
<button class="wl-float" id="wl-float" aria-label="Pedir orçamento">
  <span class="wl-float-label">${LISTA_SVG}Pedir Orçamento</span> <span class="wl-float-count" id="wl-count" style="display:none">0</span>
</button>

<script type="application/json" id="pp-dados">${JSON.stringify({ nome: g.nome, categoria: g.categoria }).replace(/</g, '\\u003c')}</script>
<script src="/assets/js/analytics.js?v=${VERSAO}"></script>
<script src="/assets/js/cesta.js?v=${VERSAO}"></script>
<script src="/assets/js/produto.js?v=${VERSAO}"></script>
</body>
</html>
`;
}

// ── FAQPage na home (lido das perguntas que já estão no index.html) ──
function atualizarFaqHome() {
  const caminho = join(RAIZ, 'index.html');
  let html = readFileSync(caminho, 'utf8');
  const nl = html.includes('\r\n') ? '\r\n' : '\n';
  const limpa = t => t.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  const perguntas = [...html.matchAll(/<button class="faq-q"[^>]*>([\s\S]*?)<span class="faq-icon"[\s\S]*?<div class="faq-a-inner">([\s\S]*?)<\/div>/g)]
    .map(m => ({ '@type': 'Question', name: limpa(m[1]), acceptedAnswer: { '@type': 'Answer', text: limpa(m[2]) } }));
  if (!perguntas.length) { console.warn('! Nenhuma pergunta de FAQ encontrada no index.html'); return; }
  const bloco = `<!-- FAQ-JSONLD:INICIO (gerado por scripts/gerar-paginas.mjs a partir do FAQ desta página) -->${nl}` +
    `  <script type="application/ld+json">${nl}${jsonSeguro({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: perguntas }).replace(/\n/g, nl)}${nl}  </script>${nl}` +
    `  <!-- FAQ-JSONLD:FIM -->`;
  const re = /<!-- FAQ-JSONLD:INICIO[\s\S]*?<!-- FAQ-JSONLD:FIM -->/;
  if (!re.test(html)) { console.warn('! Marcadores FAQ-JSONLD não encontrados no index.html'); return; }
  const novo = html.replace(re, bloco);
  if (novo !== html) { writeFileSync(caminho, novo); console.log(`✓ FAQPage da home atualizado (${perguntas.length} perguntas)`); }
  else console.log(`· FAQPage da home sem mudanças (${perguntas.length} perguntas)`);
}

// ── principal ─────────────────────────────────────────────
async function main() {
  const [produtos, categorias, badgesArr] = await Promise.all([
    buscar('produtos?select=*&status=eq.Ativo&order=ordem.asc,created_at.desc'),
    buscar('categorias?select=*&status=eq.Ativa&order=ordem.asc,nome.asc'),
    buscar('badges?select=*&status=eq.Ativo').catch(() => [])
  ]);
  const badges = Object.fromEntries(badgesArr.map(b => [b.nome, b]));
  const catsAtivas = new Set(categorias.filter(c => !c.parent_id).map(c => c.nome));

  // Agrupa as variações (mesmo campo "grupo" que o site usa)
  const grupos = [], porGrupo = {};
  for (const p of produtos) {
    if (!catsAtivas.has(p.categoria)) continue; // categoria desativada: não aparece no site
    if (p.grupo) {
      if (!porGrupo[p.grupo]) { porGrupo[p.grupo] = { variantes: [] }; grupos.push(porGrupo[p.grupo]); }
      porGrupo[p.grupo].variantes.push(p);
    } else grupos.push({ variantes: [p] });
  }

  // Endereço (slug) de cada página — único
  const usados = new Set();
  for (const g of grupos) {
    const v0 = g.variantes[0];
    g.nome = nomeBase(g.variantes);
    g.categoria = v0.categoria;
    g.subcategoria = v0.subcategoria || null;
    let s = slugify(g.nome) || `produto-${v0.id}`;
    if (usados.has(s)) {
      let n = 2; while (usados.has(`${s}-${n}`)) n++;
      console.warn(`! Endereço repetido "${s}" (${g.nome}) — usando "${s}-${n}". Vale renomear o grupo no painel.`);
      s = `${s}-${n}`;
    }
    usados.add(s);
    g.slug = s;
  }

  const caminhoEstado = join(RAIZ, 'scripts/estado-paginas.json');
  const estado = existsSync(caminhoEstado) ? JSON.parse(readFileSync(caminhoEstado, 'utf8')) : {};
  const novoEstado = {};
  const ffmpeg = temFfmpeg();
  if (!ffmpeg) console.warn('! ffmpeg não encontrado: os links no WhatsApp vão usar a imagem geral do site.');

  const dirProdutos = join(RAIZ, 'produto');
  mkdirSync(dirProdutos, { recursive: true });
  const paginas = {};
  let criadas = 0, alteradas = 0;

  for (const g of grupos) {
    const dir = join(dirProdutos, g.slug);
    mkdirSync(dir, { recursive: true });

    // Foto do link no WhatsApp: refaz só se a foto principal mudou
    const fonteOg = fotos(g.variantes[0])[0] || null;
    const ogArq = join(dir, 'og.jpg');
    g.og = false;
    if (fonteOg && ffmpeg) {
      if (estado[g.slug]?.ogFonte === fonteOg && existsSync(ogArq)) g.og = true;
      else g.og = gerarOg(fonteOg, ogArq);
      if (!g.og) console.warn(`! Não consegui gerar a imagem de ${g.nome}`);
    }

    // "Veja também": mesma subcategoria primeiro, depois mesma categoria
    const mesmaCat = grupos.filter(o => o !== g && o.categoria === g.categoria);
    const relacionados = [
      ...mesmaCat.filter(o => g.subcategoria && o.subcategoria === g.subcategoria),
      ...mesmaCat.filter(o => !(g.subcategoria && o.subcategoria === g.subcategoria))
    ].slice(0, 4);

    const html = paginaHtml(g, relacionados, badges);
    const hash = createHash('sha1').update(html.replace(/\?v=\d+/g, '')).digest('hex').slice(0, 12);
    const anterior = estado[g.slug];
    const lastmod = anterior && anterior.hash === hash ? anterior.lastmod : HOJE;
    if (!anterior) criadas++; else if (anterior.hash !== hash) alteradas++;
    if (!anterior || anterior.hash !== hash || !existsSync(join(dir, 'index.html'))) writeFileSync(join(dir, 'index.html'), html);

    novoEstado[g.slug] = { nome: g.nome, ids: g.variantes.map(v => v.id), hash, lastmod, ogFonte: g.og ? fonteOg : null };
    for (const v of g.variantes) paginas[String(v.id)] = g.slug;
  }

  // Remove páginas de produtos que saíram do site (só as que este script criou)
  let removidas = 0;
  for (const slug of Object.keys(estado)) {
    if (!novoEstado[slug] && existsSync(join(dirProdutos, slug))) {
      rmSync(join(dirProdutos, slug), { recursive: true, force: true });
      removidas++;
      console.log(`- removida: /produto/${slug}/ (${estado[slug].nome})`);
    }
  }
  // Pastas soltas que não são do script ficam como estão, mas avisa
  for (const d of readdirSync(dirProdutos, { withFileTypes: true })) {
    if (d.isDirectory() && !novoEstado[d.name] && !estado[d.name]) console.warn(`! Pasta desconhecida em produto/: ${d.name} (não mexi)`);
  }

  writeFileSync(join(dirProdutos, 'paginas.json'), JSON.stringify(paginas, null, 2) + '\n');
  writeFileSync(caminhoEstado, JSON.stringify(novoEstado, null, 2) + '\n');

  // Sitemap: home + páginas de produto
  const lmHome = Object.values(novoEstado).map(e => e.lastmod).sort().pop() || HOJE;
  const urls = [`  <url>\n    <loc>${SITE}/</loc>\n    <lastmod>${lmHome}</lastmod>\n  </url>`,
    ...Object.entries(novoEstado).map(([slug, e]) => `  <url>\n    <loc>${SITE}/produto/${slug}/</loc>\n    <lastmod>${e.lastmod}</lastmod>\n  </url>`)];
  writeFileSync(join(RAIZ, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Gerado por scripts/gerar-paginas.mjs -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

  atualizarFaqHome();

  console.log(`✓ ${grupos.length} páginas de produto (${criadas} novas, ${alteradas} alteradas, ${removidas} removidas)`);
  console.log(`✓ sitemap.xml com ${urls.length} endereços`);
  console.log('Confira na prévia e, se estiver tudo certo, faça o commit e publique.');
}

main().catch(e => { console.error('✗ Erro:', e.message); process.exit(1); });
