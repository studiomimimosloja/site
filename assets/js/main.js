'use strict';
// ── Header scroll ───────────────────────────────
const header = document.getElementById('header');
window.addEventListener('scroll', function() {
  header.classList.toggle('scrolled', window.scrollY > 20);
}, {passive: true});

// ── Menu mobile ────────────────────────────────
const menuToggle = document.getElementById('menu-toggle');
const mobileNav  = document.getElementById('mobile-nav');
let menuOpen = false;

function closeMobileNav() {
  menuOpen = false;
  mobileNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded','false');
}

menuToggle.addEventListener('click', function() {
  menuOpen = !menuOpen;
  mobileNav.classList.toggle('open', menuOpen);
  menuToggle.setAttribute('aria-expanded', String(menuOpen));
});

document.addEventListener('click', function(e) {
  if (menuOpen && !mobileNav.contains(e.target) && !menuToggle.contains(e.target)) closeMobileNav();
});

// ── Reveal on scroll ───────────────────────────
var reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, {threshold: 0.08, rootMargin: '0px 0px -32px 0px'});
  reveals.forEach(function(el) { io.observe(el); });
} else {
  reveals.forEach(function(el) { el.classList.add('visible'); });
}

// ── Catálogo tabs ──────────────────────────────
function showCat(id, btn) {
  document.querySelectorAll('.cat-section').forEach(function(s) {
    s.classList.remove('active');
  });
  document.querySelectorAll('.cat-tab').forEach(function(t) {
    t.classList.remove('active');
    t.setAttribute('aria-selected','false');
  });
  var section = document.getElementById(id);
  if (section) {
    section.classList.add('active');
    // re-trigger reveals inside this section
    section.querySelectorAll('.reveal:not(.visible)').forEach(function(el) {
      el.classList.add('visible');
    });
  }
  if (btn) {
    btn.classList.add('active');
    btn.setAttribute('aria-selected','true');
  }
}

// ── FAQ accordion ──────────────────────────────
function toggleFaq(btn) {
  var item   = btn.closest('.faq-item');
  var answer = item.querySelector('.faq-a');
  var isOpen = btn.classList.contains('open');

  document.querySelectorAll('.faq-q.open').forEach(function(b) {
    b.classList.remove('open');
    b.setAttribute('aria-expanded','false');
    b.closest('.faq-item').querySelector('.faq-a').style.maxHeight = '0';
  });

  if (!isOpen) {
    btn.classList.add('open');
    btn.setAttribute('aria-expanded','true');
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }
}

// ── Hero Carousel ──────────────────────────────
(function() {
  var images = [
    "assets/img/hero-14.jpg",
        "assets/img/img-15.jpg",
        "assets/img/img-16.jpg",
        "assets/img/img-17.jpg",
        "assets/img/img-18.jpg"
  ];
  var idx = 0;
  var timer = null;
  var track = document.getElementById('hero-track');
  var dots  = document.getElementById('hero-dots');

  if (!track || !dots || images.length === 0) return;

  images.forEach(function(src, i) {
    var slide = document.createElement('div');
    slide.className = 'slide';
    slide.setAttribute('role','listitem');
    var img = document.createElement('img');
    img.src = src;
    img.alt = 'Portfólio Studio MiMimos — foto ' + (i+1);
    img.loading = i === 0 ? 'eager' : 'lazy';
    slide.appendChild(img);
    track.appendChild(slide);

    var dot = document.createElement('button');
    dot.setAttribute('aria-label', 'Ver foto ' + (i+1));
    dot.setAttribute('role','tab');
    dot.className = i === 0 ? 'active' : '';
    dot.onclick = function() { go(i); };
    dots.appendChild(dot);
  });

  function updateDots() {
    var dts = dots.querySelectorAll('button');
    dts.forEach(function(d, i) {
      d.classList.toggle('active', i === idx);
    });
  }

  function go(n) {
    idx = (n + images.length) % images.length;
    track.style.transform = 'translateX(-' + (idx * 100) + '%)';
    updateDots();
    reset();
  }

  function start() { timer = setInterval(function() { go(idx + 1); }, 4200); }
  function reset() { clearInterval(timer); start(); }

  document.getElementById('hero-prev').onclick = function() { go(idx - 1); };
  document.getElementById('hero-next').onclick = function() { go(idx + 1); };

  // touch support
  var startX = 0;
  track.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; }, {passive:true});
  track.addEventListener('touchend', function(e) {
    var diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) go(diff > 0 ? idx + 1 : idx - 1);
  }, {passive:true});

  start();
})();
  // == SUPABASE CATALOGO LOADER (com variações) ==
  (function() {
    var SUPA_URL = "https://grmulciyoytzqlrdqmcg.supabase.co";
    var SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybXVsY2l5b3l0enFscmRxbWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTAyNzUsImV4cCI6MjA5NTEyNjI3NX0.pbkhq2_nHaCsqo8WbH-9TIaCgWAaWgDW2W5zBK9tl-Y";
    var WPP_NUM = "5585997327204";
    var WPP_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

    var CAT_IDS = {
      "Impress\u00e3o 3D": "cat-3d",
      "Lembrancinhas": "cat-lemb",
      "Mimos Personalizados": "cat-mimos",
      "Presentes & Cestas": "cat-cestas",
      "Empresas & Datas": "cat-empresas"
    };
    var BADGE_CLS = {"Novo":"badge-novo","Personaliz\u00e1vel":"badge-pers","Mais pedido":"badge-hot","Sob consulta":"badge-consul"};

    // Funcao segura para criar elementos sem innerHTML (previne XSS)
    function el(tag, attrs, children) {
      var e = document.createElement(tag);
      if (attrs) Object.keys(attrs).forEach(function(k) {
        if (k === 'className') e.className = attrs[k];
        else if (k === 'textContent') e.textContent = attrs[k];
        else e.setAttribute(k, attrs[k]);
      });
      if (children) children.forEach(function(c) {
        if (typeof c === 'string') e.appendChild(document.createTextNode(c));
        else if (c) e.appendChild(c);
      });
      return e;
    }

    function createWppSvg() {
      var div = document.createElement('span');
      div.innerHTML = WPP_SVG;
      return div.firstChild;
    }

    // ── Gerar preço para um produto ──
    function buildPrice(p) {
      var priceDiv = el('div', {className:'product-price'});
      if (p.preco && p.preco_tipo !== "consulta") {
        if (p.promo && p.promo_preco) {
          priceDiv.appendChild(el('del', {textContent:'R$ ' + p.preco, style:'font-size:.8rem;color:var(--soft)'}));
          priceDiv.appendChild(document.createElement('br'));
        }
        if (p.preco_tipo === "partir") priceDiv.appendChild(el('small', {textContent:'a partir de'}));
        var pf = p.promo && p.promo_preco ? p.promo_preco : p.preco;
        priceDiv.appendChild(document.createTextNode('R$ ' + pf));
      } else {
        priceDiv.appendChild(el('small', {textContent:'a partir de'}));
        priceDiv.appendChild(document.createTextNode('Sob consulta'));
      }
      return priceDiv;
    }

    // ── Card simples (sem variação) ──
    function buildCard(p, catName, i) {
      var article = el('article', {className:'product-card reveal visible'});
      if (i > 0) article.style.transitionDelay = (i * 0.08).toFixed(2) + 's';

      var imgDiv = el('div', {className:'product-img'});
      if (p.foto_url) {
        imgDiv.appendChild(el('img', {src: p.foto_url, alt: p.nome || '', loading:'lazy'}));
      } else {
        imgDiv.appendChild(el('div', {className:'product-img-ph'}, [el('span', {textContent:'foto em breve'})]));
      }
      var bc = BADGE_CLS[p.badge] || "";
      if (bc) imgDiv.appendChild(el('span', {className:'badge ' + bc, textContent: p.badge}));
      if (p.promo && p.promo_texto) {
        var promoSpan = el('span', {className:'badge badge-novo', textContent: p.promo_texto});
        promoSpan.style.top = '44px';
        imgDiv.appendChild(promoSpan);
      }
      article.appendChild(imgDiv);

      var body = el('div', {className:'product-body'});
      body.appendChild(el('div', {className:'product-cat', textContent: catName}));
      body.appendChild(el('h3', {className:'product-name', textContent: p.nome || ''}));
      body.appendChild(el('p', {className:'product-desc', textContent: p.descricao || ''}));

      var foot = el('div', {className:'product-foot'});
      foot.appendChild(buildPrice(p));

      var wMsg = encodeURIComponent(p.whatsapp_msg || "Olá! Vim pelo site da Studio MiMimos e gostaria de saber mais sobre *" + (p.nome||'') + "*. 😊");
      var wLink = "https://wa.me/" + WPP_NUM + "?text=" + wMsg;
      var btnTxt = p.preco_tipo === "consulta" ? "Orçamento" : "Pedir";
      var wppBtn = el('a', {href: wLink, className:'product-wpp', target:'_blank', rel:'noopener noreferrer'}, [createWppSvg(), document.createTextNode(' ' + btnTxt)]);
      foot.appendChild(wppBtn);
      body.appendChild(foot);
      article.appendChild(body);
      return article;
    }

    // ── Card com variações (carrossel + seletor) ──
    function buildGroupCard(variants, catName, i) {
      var article = el('article', {className:'product-card product-card--has-vars reveal visible'});
      if (i > 0) article.style.transitionDelay = (i * 0.08).toFixed(2) + 's';

      // ─ Carrossel de fotos (uma por variação) ─
      var imgDiv = el('div', {className:'product-img product-img--carousel'});
      var track = el('div', {className:'var-carousel-track'});
      var dotsWrap = el('div', {className:'var-carousel-dots'});

      variants.forEach(function(v, vi) {
        var slide = el('div', {className:'var-slide' + (vi === 0 ? ' active' : '')});
        if (v.foto_url) {
          slide.appendChild(el('img', {src: v.foto_url, alt: v.nome || '', loading:'lazy'}));
        } else {
          slide.appendChild(el('div', {className:'product-img-ph'}, [el('span', {textContent:'foto em breve'})]));
        }
        track.appendChild(slide);

        if (variants.length > 1) {
          var dot = el('button', {className:'var-dot' + (vi === 0 ? ' active' : '')});
          dot.setAttribute('aria-label', v.variacao_nome || v.nome || 'Foto ' + (vi+1));
          dot.setAttribute('data-idx', vi);
          dotsWrap.appendChild(dot);
        }
      });

      imgDiv.appendChild(track);
      if (variants.length > 1) imgDiv.appendChild(dotsWrap);

      // Setas do carrossel
      if (variants.length > 1) {
        var prevBtn = el('button', {className:'var-arrow var-arrow--prev', 'aria-label':'Foto anterior'}, [document.createTextNode('\u2039')]);
        var nextBtn = el('button', {className:'var-arrow var-arrow--next', 'aria-label':'Próxima foto'}, [document.createTextNode('\u203A')]);
        imgDiv.appendChild(prevBtn);
        imgDiv.appendChild(nextBtn);
      }

      // Badge do primeiro
      var bc = BADGE_CLS[variants[0].badge] || "";
      if (bc) imgDiv.appendChild(el('span', {className:'badge ' + bc, textContent: variants[0].badge}));

      article.appendChild(imgDiv);

      // ─ Body ─
      var body = el('div', {className:'product-body'});
      body.appendChild(el('div', {className:'product-cat', textContent: catName}));

      // Nome (usa nome base do grupo, tirando o nome da variação)
      var baseName = variants[0].nome || '';
      var nameEl = el('h3', {className:'product-name', textContent: baseName});
      body.appendChild(nameEl);

      // ─ Seletor de variações ─
      if (variants.length > 1) {
        var varSelector = el('div', {className:'var-selector'});
        variants.forEach(function(v, vi) {
          var label = v.variacao_nome || v.nome || 'Opção ' + (vi+1);
          var btn = el('button', {className:'var-btn' + (vi === 0 ? ' active' : ''), textContent: label});
          btn.setAttribute('data-idx', vi);
          varSelector.appendChild(btn);
        });
        body.appendChild(varSelector);
      }

      // Descrição (muda com a variação)
      var descEl = el('p', {className:'product-desc', textContent: variants[0].descricao || ''});
      body.appendChild(descEl);

      // Footer (preço + botão WPP)
      var foot = el('div', {className:'product-foot'});
      var priceWrap = el('div', {className:'var-price-wrap'});
      priceWrap.appendChild(buildPrice(variants[0]));
      foot.appendChild(priceWrap);

      var wMsg0 = encodeURIComponent(variants[0].whatsapp_msg || "Olá! Vim pelo site da Studio MiMimos e gostaria de saber mais sobre *" + (variants[0].nome||'') + "*. 😊");
      var wLink0 = "https://wa.me/" + WPP_NUM + "?text=" + wMsg0;
      var btnTxt0 = variants[0].preco_tipo === "consulta" ? "Orçamento" : "Pedir";
      var wppBtn = el('a', {href: wLink0, className:'product-wpp', target:'_blank', rel:'noopener noreferrer'}, [createWppSvg(), document.createTextNode(' ' + btnTxt0)]);
      foot.appendChild(wppBtn);
      body.appendChild(foot);
      article.appendChild(body);

      // ─ Interatividade: trocar variação ─
      var currentIdx = 0;

      function goTo(idx) {
        if (idx < 0) idx = variants.length - 1;
        if (idx >= variants.length) idx = 0;
        currentIdx = idx;
        var v = variants[idx];

        // Atualizar slides
        track.querySelectorAll('.var-slide').forEach(function(s, si) {
          s.classList.toggle('active', si === idx);
        });

        // Atualizar dots
        dotsWrap.querySelectorAll('.var-dot').forEach(function(d, di) {
          d.classList.toggle('active', di === idx);
        });

        // Atualizar botões de variação
        article.querySelectorAll('.var-btn').forEach(function(b, bi) {
          b.classList.toggle('active', bi === idx);
        });

        // Atualizar nome, descrição, preço, botão WPP
        nameEl.textContent = v.nome || '';
        descEl.textContent = v.descricao || '';

        // Rebuild price
        while (priceWrap.firstChild) priceWrap.removeChild(priceWrap.firstChild);
        priceWrap.appendChild(buildPrice(v));

        // Update WPP link
        var wMsg = encodeURIComponent(v.whatsapp_msg || "Olá! Vim pelo site da Studio MiMimos e gostaria de saber mais sobre *" + (v.nome||'') + "*. 😊");
        wppBtn.href = "https://wa.me/" + WPP_NUM + "?text=" + wMsg;
        var newBtnTxt = v.preco_tipo === "consulta" ? "Orçamento" : "Pedir";
        wppBtn.lastChild.textContent = ' ' + newBtnTxt;
      }

      // Event listeners
      dotsWrap.addEventListener('click', function(e) {
        var dot = e.target.closest('.var-dot');
        if (dot) goTo(parseInt(dot.getAttribute('data-idx')));
      });

      var selectorEl = body.querySelector('.var-selector');
      if (selectorEl) {
        selectorEl.addEventListener('click', function(e) {
          var btn = e.target.closest('.var-btn');
          if (btn) goTo(parseInt(btn.getAttribute('data-idx')));
        });
      }

      if (variants.length > 1) {
        imgDiv.querySelector('.var-arrow--prev').addEventListener('click', function() { goTo(currentIdx - 1); });
        imgDiv.querySelector('.var-arrow--next').addEventListener('click', function() { goTo(currentIdx + 1); });
      }

      // Touch swipe no carrossel
      var touchStartX = 0;
      track.addEventListener('touchstart', function(e) { touchStartX = e.touches[0].clientX; }, {passive:true});
      track.addEventListener('touchend', function(e) {
        var diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) goTo(diff > 0 ? currentIdx + 1 : currentIdx - 1);
      }, {passive:true});

      return article;
    }

    // ── Agrupar produtos: por grupo ou solo ──
    function groupProducts(prods) {
      var grouped = [];
      var grupoMap = {};
      var solos = [];

      prods.forEach(function(p) {
        if (p.grupo) {
          if (!grupoMap[p.grupo]) {
            grupoMap[p.grupo] = [];
          }
          grupoMap[p.grupo].push(p);
        } else {
          solos.push(p);
        }
      });

      // Manter a ordem: usar a posição do primeiro item de cada grupo
      var seen = {};
      prods.forEach(function(p) {
        if (p.grupo) {
          if (!seen[p.grupo]) {
            seen[p.grupo] = true;
            grouped.push({ type: 'group', variants: grupoMap[p.grupo] });
          }
        } else {
          grouped.push({ type: 'solo', product: p });
        }
      });

      return grouped;
    }

    function loadCatalog() {
      fetch(SUPA_URL + "/rest/v1/produtos?select=*&status=eq.Ativo&order=ordem.asc,created_at.desc", {
        headers: { "apikey": SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY }
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data || !data.length) return;
        var cats = {};
        data.forEach(function(p) {
          var c = p.categoria || "Outros";
          if (!cats[c]) cats[c] = [];
          cats[c].push(p);
        });
        Object.keys(CAT_IDS).forEach(function(catName) {
          var secId = CAT_IDS[catName];
          var sec = document.getElementById(secId);
          if (!sec) return;
          var prods = cats[catName];
          if (!prods || !prods.length) return;
          while (sec.firstChild) sec.removeChild(sec.firstChild);

          var items = groupProducts(prods);
          items.forEach(function(item, i) {
            if (item.type === 'group') {
              sec.appendChild(buildGroupCard(item.variants, catName, i));
            } else {
              sec.appendChild(buildCard(item.product, catName, i));
            }
          });
        });
      })
      .catch(function(e) { console.error("Erro ao carregar catalogo:", e); });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", loadCatalog);
    else loadCatalog();
  })();
// ══ FORMULÁRIO DE ORÇAMENTO → WHATSAPP ══════════════
var _orcLock = false;
function enviarOrcamento() {
  if (_orcLock) return;
  _orcLock = true;
  setTimeout(function() { _orcLock = false; }, 3000);
  var nome = document.getElementById('orc-nome').value.trim();
  var wpp = document.getElementById('orc-wpp').value.trim();
  var produto = document.getElementById('orc-produto').value;
  var tema = document.getElementById('orc-tema').value.trim();
  var qtd = document.getElementById('orc-qtd').value.trim();
  var data = document.getElementById('orc-data').value;
  var obs = document.getElementById('orc-obs').value.trim();

  if (!nome) { alert('Por favor, informe seu nome.'); document.getElementById('orc-nome').focus(); return; }
  if (!produto) { alert('Por favor, selecione o tipo de produto.'); document.getElementById('orc-produto').focus(); return; }

  var dataFormatada = '';
  if (data) {
    var d = new Date(data + 'T00:00:00');
    dataFormatada = d.toLocaleDateString('pt-BR');
  }

  var msg = 'Olá, Studio MiMimos! Quero fazer um orçamento. 😊\n\n';
  msg += '👤 *Nome:* ' + nome + '\n';
  if (wpp) msg += '📱 *WhatsApp:* ' + wpp + '\n';
  msg += '🎁 *Produto:* ' + produto + '\n';
  if (tema) msg += '🎨 *Tema:* ' + tema + '\n';
  if (qtd) msg += '🔢 *Quantidade:* ' + qtd + '\n';
  if (dataFormatada) msg += '📅 *Data do evento:* ' + dataFormatada + '\n';
  if (obs) msg += '📝 *Observações:* ' + obs + '\n';

  var url = 'https://wa.me/5585997327204?text=' + encodeURIComponent(msg);
  window.open(url, '_blank');
}
