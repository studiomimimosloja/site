'use strict';
// ══ GOOGLE ANALYTICS 4 + BANNER DE COOKIES (LGPD) ══════════════
// - Consent Mode v2: tudo começa "denied".
// - O gtag.js só é baixado DEPOIS que a pessoa clica em "Aceitar".
//   Sem aceite, nenhum cookie do Google é gravado.
// - track(evento, params) nunca quebra o site (bloqueador de anúncio,
//   GA fora do ar ou ID ainda não configurado).
// - Para testar no DebugView do GA4: abra o site com ?debug_ga=1
(function() {
  var GA_ID = 'G-XXXXXXXXXX'; // ← COLE_AQUI_O_ID_DO_GA4 (Admin › Fluxos de dados › Web)
  var CHAVE = 'mimimos-cookies'; // localStorage: 'aceito' | 'recusado'
  var configurado = /^G-[A-Z0-9]{6,}$/.test(GA_ID) && GA_ID !== 'G-XXXXXXXXXX';
  var debug = /[?&]debug_ga=1/.test(location.search);
  var carregado = false;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  });

  function lerEscolha() {
    try { return localStorage.getItem(CHAVE); } catch (e) { return null; }
  }
  function salvarEscolha(v) {
    try { localStorage.setItem(CHAVE, v); } catch (e) {}
  }

  // Apaga os cookies _ga* (quando a pessoa aceita e depois recusa)
  function apagarCookiesGA() {
    try {
      var dominio = location.hostname.replace(/^www\./, '');
      document.cookie.split(';').forEach(function(c) {
        var nome = c.split('=')[0].trim();
        if (nome.indexOf('_ga') !== 0) return;
        var exp = '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        document.cookie = nome + exp;
        document.cookie = nome + exp + '; domain=.' + dominio;
      });
    } catch (e) {}
  }

  function carregarGA() {
    if (carregado || !configurado) return;
    carregado = true;
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('js', new Date());
    gtag('config', GA_ID, debug ? { debug_mode: true } : {});
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  // Dispara um evento. Sem aceite (ou sem GA), simplesmente não envia nada.
  window.track = function(evento, params) {
    try {
      if (debug) console.log('[GA]', evento, params || {});
      if (!carregado) return;
      gtag('event', evento, params || {});
    } catch (e) {}
  };

  // ── Cliques em WhatsApp e Instagram (qualquer link da página) ──
  // "origem" vem do data-origem do link ou da seção onde ele está.
  var ORIGENS = [
    ['.float-wpp', 'flutuante'],
    ['header, .mobile-nav', 'menu'],
    ['.hero-v2', 'hero'],
    ['#sobre', 'sobre'],
    ['#como-funciona', 'como-funciona'],
    ['#catalogo', 'catalogo'],
    ['#faq', 'faq'],
    ['.cta-final', 'cta-final'],
    ['footer', 'rodape'],
    ['.produto-pagina', 'pagina-produto']
  ];
  function origemDe(a) {
    var marcado = a.closest('[data-origem]');
    if (marcado) return marcado.getAttribute('data-origem');
    for (var i = 0; i < ORIGENS.length; i++) {
      if (a.closest(ORIGENS[i][0])) return ORIGENS[i][1];
    }
    return 'outro';
  }
  document.addEventListener('click', function(e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('wa.me/') >= 0) {
      var p = { origem: origemDe(a) };
      var prod = a.getAttribute('data-produto');
      if (prod) p.produto = prod;
      window.track('whatsapp_click', p);
    } else if (href.indexOf('instagram.com/') >= 0) {
      window.track('instagram_click', { origem: origemDe(a) });
    }
  }, true);

  // ── Banner de cookies ──
  function fecharBanner(banner) {
    banner.classList.remove('ck-aberto');
    setTimeout(function() { banner.hidden = true; }, 250);
  }
  function mostrarBanner() {
    var banner = document.getElementById('ck-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'ck-banner';
      banner.className = 'ck-banner';
      banner.setAttribute('role', 'region');
      banner.setAttribute('aria-label', 'Aviso de cookies');
      var txt = document.createElement('p');
      txt.className = 'ck-texto';
      txt.textContent = 'Usamos cookies do Google Analytics só para entender quais mimos vocês mais procuram. Nada de anúncio. Tudo bem?';
      var botoes = document.createElement('div');
      botoes.className = 'ck-botoes';
      var recusar = document.createElement('button');
      recusar.type = 'button';
      recusar.className = 'ck-btn ck-btn--recusar';
      recusar.textContent = 'Recusar';
      var aceitar = document.createElement('button');
      aceitar.type = 'button';
      aceitar.className = 'ck-btn ck-btn--aceitar';
      aceitar.textContent = 'Aceitar';
      botoes.appendChild(recusar);
      botoes.appendChild(aceitar);
      banner.appendChild(txt);
      banner.appendChild(botoes);
      document.body.appendChild(banner);
      aceitar.addEventListener('click', function() {
        salvarEscolha('aceito');
        carregarGA();
        fecharBanner(banner);
      });
      recusar.addEventListener('click', function() {
        var jaTinhaAceitado = lerEscolha() === 'aceito';
        salvarEscolha('recusado');
        apagarCookiesGA();
        fecharBanner(banner);
        // Se mudou de ideia depois de aceitar, recarrega para o GA parar de vez.
        if (jaTinhaAceitado && carregado) location.reload();
      });
    }
    banner.hidden = false;
    requestAnimationFrame(function() { banner.classList.add('ck-aberto'); });
  }

  function iniciar() {
    var escolha = lerEscolha();
    if (escolha === 'aceito') carregarGA();
    else if (escolha !== 'recusado') mostrarBanner();
    // Link "Preferências de cookies" no rodapé reabre o banner
    document.querySelectorAll('[data-cookies-prefs]').forEach(function(b) {
      b.addEventListener('click', function(e) { e.preventDefault(); mostrarBanner(); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
