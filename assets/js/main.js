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

// ── Hero carousel removido (hero redesenhado) ──;
  // == SUPABASE CATALOGO LOADER (com variações) ==
  (function() {
    var SUPA_URL = "https://grmulciyoytzqlrdqmcg.supabase.co";
    var SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybXVsY2l5b3l0enFscmRxbWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTAyNzUsImV4cCI6MjA5NTEyNjI3NX0.pbkhq2_nHaCsqo8WbH-9TIaCgWAaWgDW2W5zBK9tl-Y";
    var WPP_NUM = "5585997327204";
    var WPP_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

    // ┌─────────────────────────────────────────────────────────────┐
    // │ CATEGORIAS DO CATÁLOGO                                      │
    // │ Vêm do painel admin (tabela "categorias" no Supabase):      │
    // │ nome, ordem, status e subcategorias. Nada fixo aqui.        │
    // │ A lista abaixo só é usada se o Supabase não responder.      │
    // └─────────────────────────────────────────────────────────────┘
    var CAT_RESERVA = ["Lembrancinhas", "Impress\u00e3o 3D"];
    var CAT_IDS = {};   // nome da categoria -> id da seção (preenchido em montarCategorias)
    var CAT_SUBS = {};  // nome da categoria -> [subcategorias na ordem do admin]
    var BADGE_CLS = {}; // será preenchido dinamicamente
    var BADGE_STYLES = {}; // { nome: { cor_texto, cor_fundo } }

    // Fallback para badges antigos caso a tabela não exista ainda
    var BADGE_FALLBACK = {
      "Novo": { cor_fundo: "#fff8ee", cor_texto: "#92400e" },
      "Personalizável": { cor_fundo: "#f3effe", cor_texto: "#6b21a8" },
      "Mais pedido": { cor_fundo: "#fef2f2", cor_texto: "#dc2626" },
      "Sob consulta": { cor_fundo: "#f5f5f2", cor_texto: "#4b5563" }
    };


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

    // ── Descrição formatada: respeita quebras de linha, listas e "Rótulo:" ──
    // Monta com textContent (nunca innerHTML com dado do banco).
    function preencherDesc(box, texto) {
      while (box.firstChild) box.removeChild(box.firstChild);
      var linhas = String(texto || '').replace(/\r/g, '').split('\n');
      var lista = null;
      function rotulado(pai, txt) {
        var m = txt.match(/^([^:\n]{2,40}):\s*(.*)$/);
        if (m && !/^https?$/i.test(m[1])) {
          pai.appendChild(el('strong', {textContent: m[1] + ':'}));
          if (m[2]) pai.appendChild(document.createTextNode(' ' + m[2]));
        } else {
          pai.appendChild(document.createTextNode(txt));
        }
      }
      linhas.forEach(function(l) {
        var t = l.trim();
        if (!t) { lista = null; return; }
        var b = t.match(/^[*\-•·]\s+(.*)$/);
        if (b) {
          if (!lista) { lista = el('ul', {className:'desc-list'}); box.appendChild(lista); }
          var li = el('li'); rotulado(li, b[1]); lista.appendChild(li);
        } else {
          lista = null;
          var par = el('p'); rotulado(par, t); box.appendChild(par);
        }
      });
    }
    function novaDesc(texto) {
      var box = el('div', {className:'product-desc'});
      preencherDesc(box, texto);
      return box;
    }

    // ── "Ver mais" na descrição: só aparece quando o texto foi cortado ──
    var _descObs = ('ResizeObserver' in window) ? new ResizeObserver(function(entries) {
      entries.forEach(function(e) { checarDesc(e.target); });
    }) : null;
    function checarDesc(desc) {
      var btn = desc._verMais;
      if (!btn || desc.classList.contains('open')) return;
      if (!desc.clientHeight) return; // seção escondida: confere quando aparecer
      btn.hidden = desc.scrollHeight <= desc.clientHeight + 2;
      desc.classList.toggle('has-more', !btn.hidden);
    }
    function addVerMais(desc) {
      var btn = el('button', {className:'desc-toggle', type:'button', textContent:'Ver mais'});
      btn.hidden = true;
      btn.addEventListener('click', function(ev) {
        ev.stopPropagation();
        var aberto = desc.classList.toggle('open');
        btn.textContent = aberto ? 'Ver menos' : 'Ver mais';
        btn.setAttribute('aria-expanded', aberto ? 'true' : 'false');
        if (!aberto) checarDesc(desc);
      });
      btn.setAttribute('aria-expanded', 'false');
      desc._verMais = btn;
      desc.parentNode.insertBefore(btn, desc.nextSibling);
      if (_descObs) _descObs.observe(desc);
      requestAnimationFrame(function() { checarDesc(desc); });
      return btn;
    }
    function resetVerMais(desc) {
      if (!desc._verMais) return;
      desc.classList.remove('open');
      desc._verMais.textContent = 'Ver mais';
      desc._verMais.setAttribute('aria-expanded', 'false');
      requestAnimationFrame(function() { checarDesc(desc); });
    }

    function createWppSvg() {
      var div = document.createElement('span');
      div.innerHTML = WPP_SVG;
      return div.firstChild;
    }

    // ── Gerar preço para um produto ──
    function buildPrice(p) {
      var priceDiv = el('div', {className:'product-price'});

      // Preço por faixa de quantidade (se o produto tiver)
      var pf = p.precos_faixa;
      if (typeof pf === "string") { try { pf = JSON.parse(pf); } catch(e) { pf = null; } }
      if (pf && pf.ativo && ((pf.faixas && pf.faixas.length) || pf.pedido_minimo)) {
        if (pf.pedido_minimo) {
          priceDiv.appendChild(el('small', {textContent:'Pedido mínimo: ' + pf.pedido_minimo + ' un', style:'display:block;color:var(--soft);font-size:.72rem;margin-bottom:4px'}));
        }
        var tabela = el('div', {style:'display:flex;flex-direction:column;gap:2px'});
        (pf.faixas || []).forEach(function(f, i) {
          var ant = i === 0 ? (pf.pedido_minimo || 1) : (pf.faixas[i-1].ate + 1);
          var rotulo = (i === 0 && pf.pedido_minimo) ? ('a partir de ' + pf.pedido_minimo + ' un')
                      : ('até ' + f.ate + ' un');
          var linha = el('div', {style:'display:flex;justify-content:space-between;gap:10px;font-size:.82rem'});
          linha.appendChild(el('span', {textContent: rotulo, style:'color:var(--soft)'}));
          linha.appendChild(el('strong', {textContent: 'R$ ' + f.preco}));
          tabela.appendChild(linha);
        });
        if (pf.acima_sob_consulta) {
          var linhaSc = el('div', {style:'display:flex;justify-content:space-between;gap:10px;font-size:.82rem'});
          var ultima = (pf.faixas && pf.faixas.length) ? ('acima de ' + pf.faixas[pf.faixas.length-1].ate + ' un') : 'acima';
          linhaSc.appendChild(el('span', {textContent: ultima, style:'color:var(--soft)'}));
          linhaSc.appendChild(el('strong', {textContent: 'Sob consulta'}));
          tabela.appendChild(linhaSc);
        }
        priceDiv.appendChild(tabela);
        return priceDiv;
      }

      // Preço único (comportamento original)
      if (p.preco && p.preco_tipo !== "consulta") {
        if (p.promo && p.promo_preco) {
          priceDiv.appendChild(el('del', {textContent:'R$ ' + p.preco, style:'font-size:.8rem;color:var(--soft)'}));
          priceDiv.appendChild(document.createElement('br'));
        }
        if (p.preco_tipo === "partir") priceDiv.appendChild(el('small', {textContent:'a partir de'}));
        var pfx = p.promo && p.promo_preco ? p.promo_preco : p.preco;
        priceDiv.appendChild(document.createTextNode('R$ ' + pfx));
      } else {
        priceDiv.appendChild(el('small', {textContent:'a partir de'}));
        priceDiv.appendChild(document.createTextNode('Sob consulta'));
      }
      return priceDiv;
    }

    // ── Lightbox: ampliar foto do produto ──
    var _lbPhotos = [];
    var _lbIdx = 0;
    function lightboxOpen(photos, idx, nome) {
      _lbPhotos = photos || [];
      _lbIdx = idx || 0;
      var box = document.getElementById('lightbox');
      if (!box || !_lbPhotos.length) return;
      lightboxShow();
      box.classList.add('open');
      box.setAttribute('aria-hidden', 'false');
      box.setAttribute('data-nome', nome || '');
      // setas só aparecem se tiver mais de uma foto
      var multi = _lbPhotos.length > 1;
      document.getElementById('lightbox-prev').style.display = multi ? 'flex' : 'none';
      document.getElementById('lightbox-next').style.display = multi ? 'flex' : 'none';
    }
    function lightboxShow() {
      var img = document.getElementById('lightbox-img');
      var cap = document.getElementById('lightbox-caption');
      var box = document.getElementById('lightbox');
      if (!img) return;
      img.src = _lbPhotos[_lbIdx];
      img.alt = (box.getAttribute('data-nome') || '') + ' — foto ' + (_lbIdx + 1);
      if (cap) {
        var nome = box.getAttribute('data-nome') || '';
        cap.textContent = _lbPhotos.length > 1 ? (nome + ' (' + (_lbIdx+1) + '/' + _lbPhotos.length + ')') : nome;
      }
    }
    function lightboxClose() {
      var box = document.getElementById('lightbox');
      if (!box) return;
      box.classList.remove('open');
      box.setAttribute('aria-hidden', 'true');
    }
    function lightboxNav(dir) {
      if (!_lbPhotos.length) return;
      _lbIdx = (_lbIdx + dir + _lbPhotos.length) % _lbPhotos.length;
      lightboxShow();
    }
    // Liga os controles do lightbox uma vez
    (function setupLightbox() {
      var box = document.getElementById('lightbox');
      if (!box) return;
      document.getElementById('lightbox-close').addEventListener('click', lightboxClose);
      document.getElementById('lightbox-prev').addEventListener('click', function(e){ e.stopPropagation(); lightboxNav(-1); });
      document.getElementById('lightbox-next').addEventListener('click', function(e){ e.stopPropagation(); lightboxNav(1); });
      // clicar fora da imagem (no fundo) fecha
      box.addEventListener('click', function(e){ if (e.target === box) lightboxClose(); });
      // ESC fecha, setas navegam
      document.addEventListener('keydown', function(e){
        if (!box.classList.contains('open')) return;
        if (e.key === 'Escape') lightboxClose();
        else if (e.key === 'ArrowLeft') lightboxNav(-1);
        else if (e.key === 'ArrowRight') lightboxNav(1);
      });
    })();

    // ── Helper: pegar todas as fotos de um produto ──
    function getPhotos(p) {
      var photos = [];
      if (p.foto_url) photos.push(p.foto_url);
      var extras = p.fotos_extras || [];
      if (typeof extras === 'string') { try { extras = JSON.parse(extras); } catch(e) { extras = []; } }
      if (extras && extras.length) {
        extras.forEach(function(url) { if (url) photos.push(url); });
      }
      return photos;
    }

    // ── Helper: criar carrossel ou imagem simples ──
    function buildImgArea(photos, altText) {
      var imgDiv = el('div', {className:'product-img'});

      if (!photos.length) {
        imgDiv.appendChild(el('div', {className:'product-img-ph'}, [el('span', {textContent:'foto em breve'})]));
        return { imgDiv: imgDiv, goTo: null };
      }

      if (photos.length === 1) {
        var single = el('img', {src: photos[0], alt: altText || '', loading:'lazy'});
        single.addEventListener('click', function(){ lightboxOpen(photos, 0, altText); });
        imgDiv.appendChild(single);
        return { imgDiv: imgDiv, goTo: null };
      }

      // Carrossel
      imgDiv.classList.add('product-img--carousel');
      var track = el('div', {className:'var-carousel-track'});
      var dotsWrap = el('div', {className:'var-carousel-dots'});
      var currentIdx = 0;

      photos.forEach(function(src, si) {
        var slide = el('div', {className:'var-slide' + (si === 0 ? ' active' : '')});
        var slideImg = el('img', {src: src, alt: (altText || '') + ' — foto ' + (si+1), loading:'lazy'});
        slideImg.addEventListener('click', function(){ lightboxOpen(photos, currentIdx, altText); });
        slide.appendChild(slideImg);
        track.appendChild(slide);

        var dot = el('button', {className:'var-dot' + (si === 0 ? ' active' : '')});
        dot.setAttribute('aria-label', 'Foto ' + (si+1));
        dot.setAttribute('data-idx', si);
        dotsWrap.appendChild(dot);
      });

      imgDiv.appendChild(track);
      imgDiv.appendChild(dotsWrap);

      var prevBtn = el('button', {className:'var-arrow var-arrow--prev', 'aria-label':'Foto anterior'}, [document.createTextNode('\u2039')]);
      var nextBtn = el('button', {className:'var-arrow var-arrow--next', 'aria-label':'Próxima foto'}, [document.createTextNode('\u203A')]);
      imgDiv.appendChild(prevBtn);
      imgDiv.appendChild(nextBtn);

      function goTo(idx) {
        if (idx < 0) idx = photos.length - 1;
        if (idx >= photos.length) idx = 0;
        currentIdx = idx;
        track.querySelectorAll('.var-slide').forEach(function(s, si) { s.classList.toggle('active', si === idx); });
        dotsWrap.querySelectorAll('.var-dot').forEach(function(d, di) { d.classList.toggle('active', di === idx); });
      }

      dotsWrap.addEventListener('click', function(e) {
        var dot = e.target.closest('.var-dot');
        if (dot) goTo(parseInt(dot.getAttribute('data-idx')));
      });
      prevBtn.addEventListener('click', function() { goTo(currentIdx - 1); });
      nextBtn.addEventListener('click', function() { goTo(currentIdx + 1); });

      // Touch swipe
      var touchStartX = 0;
      track.addEventListener('touchstart', function(e) { touchStartX = e.touches[0].clientX; }, {passive:true});
      track.addEventListener('touchend', function(e) {
        var diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) goTo(diff > 0 ? currentIdx + 1 : currentIdx - 1);
      }, {passive:true});

      return { imgDiv: imgDiv, goTo: goTo };
    }

    // ── Card simples (sem variação) ──
    function buildCard(p, catName, i) {
      var article = el('article', {className:'product-card reveal visible'});
      if (i > 0) article.style.transitionDelay = (i * 0.08).toFixed(2) + 's';

      var photos = getPhotos(p);
      var imgArea = buildImgArea(photos, p.nome || '');
      var imgDiv = imgArea.imgDiv;

      var bc = BADGE_CLS[p.badge] || "";
      if (p.badge && p.badge !== "Nenhum") {
        var bs = BADGE_STYLES[p.badge] || BADGE_FALLBACK[p.badge];
        if (bs) {
          var bdgEl = el('span', {className:'badge', textContent: p.badge});
          bdgEl.style.background = bs.cor_fundo;
          bdgEl.style.color = bs.cor_texto;
          imgDiv.appendChild(bdgEl);
        }
      }
      if (p.promo && p.promo_texto) {
        var promoSpan = el('span', {className:'badge badge-novo', textContent: p.promo_texto});
        promoSpan.style.top = '44px';
        imgDiv.appendChild(promoSpan);
      }
      article.appendChild(imgDiv);

      var body = el('div', {className:'product-body'});
      body.appendChild(el('div', {className:'product-cat', textContent: catName}));
      body.appendChild(el('h3', {className:'product-name', textContent: p.nome || ''}));
      var descSimples = novaDesc(p.descricao);
      body.appendChild(descSimples);
      addVerMais(descSimples);

      var foot = el('div', {className:'product-foot'});
      foot.appendChild(buildPrice(p));

      // (Botão verde individual removido — agora há um único botão flutuante
      //  "Pedir Orçamento" que envia a cestinha pro WhatsApp.)

      // Botão Adicionar à lista
      var precoTxt = (p.preco && p.preco_tipo !== "consulta") ? 'R$ ' + (p.promo && p.promo_preco ? p.promo_preco : p.preco) : 'Sob consulta';
      var wlBtn = el('button', {className:'wl-add-btn' + (isInWishlist(p.nome) ? ' wl-added' : ''), textContent: isInWishlist(p.nome) ? '✓ Adicionado' : '+ Adicionar'});
      wlBtn.setAttribute('data-wl-nome', p.nome || '');
      wlBtn.addEventListener('click', function() { addToWishlist(p.nome, precoTxt, catName); });
      foot.appendChild(wlBtn);
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

      var _varFotos = variants.map(function(v){ return v.foto_url; }).filter(Boolean);
      variants.forEach(function(v, vi) {
        var slide = el('div', {className:'var-slide' + (vi === 0 ? ' active' : '')});
        if (v.foto_url) {
          var vImg = el('img', {src: v.foto_url, alt: v.nome || '', loading:'lazy'});
          vImg.addEventListener('click', function(){
            var idx = _varFotos.indexOf(v.foto_url);
            lightboxOpen(_varFotos, idx < 0 ? 0 : idx, v.nome || '');
          });
          slide.appendChild(vImg);
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
      if (variants[0].badge && variants[0].badge !== "Nenhum") {
        var bs2 = BADGE_STYLES[variants[0].badge] || BADGE_FALLBACK[variants[0].badge];
        if (bs2) {
          var bdgEl2 = el('span', {className:'badge', textContent: variants[0].badge});
          bdgEl2.style.background = bs2.cor_fundo;
          bdgEl2.style.color = bs2.cor_texto;
          imgDiv.appendChild(bdgEl2);
        }
      }

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
      var descEl = novaDesc(variants[0].descricao);
      body.appendChild(descEl);
      addVerMais(descEl);

      // Footer (preço + botão WPP)
      var foot = el('div', {className:'product-foot'});
      var priceWrap = el('div', {className:'var-price-wrap'});
      priceWrap.appendChild(buildPrice(variants[0]));
      foot.appendChild(priceWrap);

      // (Botão verde individual removido — usa o botão flutuante "Pedir Orçamento".)
      // Botão Adicionar à lista (adiciona a variação selecionada no momento)
      var precoTxt0 = (variants[0].preco && variants[0].preco_tipo !== "consulta") ? 'R$ ' + (variants[0].promo && variants[0].promo_preco ? variants[0].promo_preco : variants[0].preco) : 'Sob consulta';
      var wlBtn = el('button', {className:'wl-add-btn' + (isInWishlist(variants[0].nome) ? ' wl-added' : ''), textContent: isInWishlist(variants[0].nome) ? '✓ Adicionado' : '+ Adicionar'});
      wlBtn.setAttribute('data-wl-nome', variants[0].nome || '');
      foot.appendChild(wlBtn);
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
        preencherDesc(descEl, v.descricao);
        resetVerMais(descEl);

        // Rebuild price
        while (priceWrap.firstChild) priceWrap.removeChild(priceWrap.firstChild);
        priceWrap.appendChild(buildPrice(v));

        // Atualizar o botão "+ Adicionar" para refletir a variação atual
        wlBtn.setAttribute('data-wl-nome', v.nome || '');
        if (isInWishlist(v.nome)) { wlBtn.classList.add('wl-added'); wlBtn.textContent = '✓ Adicionado'; }
        else { wlBtn.classList.remove('wl-added'); wlBtn.textContent = '+ Adicionar'; }
      }

      // Clique no "+ Adicionar": usa a variação selecionada no momento
      wlBtn.addEventListener('click', function() {
        var v = variants[currentIdx];
        var precoTxt = (v.preco && v.preco_tipo !== "consulta") ? 'R$ ' + (v.promo && v.promo_preco ? v.promo_preco : v.preco) : 'Sob consulta';
        addToWishlist(v.nome, precoTxt, catName);
      });

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


    function initCatalog() {
      // Carregar TUDO em paralelo (não sequencial)
      var badgesReq = fetch(SUPA_URL + "/rest/v1/badges?select=*&status=eq.Ativo&order=ordem.asc", {
        headers: { "apikey": SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY, "Cache-Control": "no-cache" }
      }).then(function(r) { return r.json(); }).catch(function() { return []; });

      var produtosReq = fetch(SUPA_URL + "/rest/v1/produtos?select=*&status=eq.Ativo&order=ordem.asc,created_at.desc", {
        headers: { "apikey": SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY, "Cache-Control": "no-cache" }
      }).then(function(r) { return r.json(); }).catch(function() { return []; });

      var depsReq = fetch(SUPA_URL + "/rest/v1/depoimentos?select=*&status=eq.Ativo&order=created_at.desc&limit=6", {
        headers: { "apikey": SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY, "Cache-Control": "no-cache" }
      }).then(function(r) { return r.json(); }).catch(function() { return []; });

      var catsReq = fetch(SUPA_URL + "/rest/v1/categorias?select=*&status=eq.Ativa&order=ordem.asc,nome.asc", {
        headers: { "apikey": SUPA_KEY, "Authorization": "Bearer " + SUPA_KEY, "Cache-Control": "no-cache" }
      }).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; });

      Promise.all([badgesReq, produtosReq, depsReq, catsReq]).then(function(results) {
        var badgesData = Array.isArray(results[0]) ? results[0] : [];
        var produtosData = Array.isArray(results[1]) ? results[1] : [];
        var depsData = Array.isArray(results[2]) ? results[2] : [];

        // Monta abas, seções, cards e rodapé a partir das categorias do admin
        montarCategorias(Array.isArray(results[3]) ? results[3] : null);

        // guarda os produtos para reordenar quando o cliente trocar a ordenação
        window._catalogoProdutos = produtosData;

        // Processar badges
        if (badgesData.length) {
          badgesData.forEach(function(b) {
            BADGE_STYLES[b.nome] = { cor_fundo: b.cor_fundo, cor_texto: b.cor_texto };
          });
        } else {
          BADGE_STYLES = BADGE_FALLBACK;
        }

        // Renderizar catálogo (na ordem escolhida, padrão = tradicional)
        renderCatalog(ordenarProdutos(produtosData, window._ordemCatalogo || 'tradicional'));
        renderHeroCarousel(produtosData);

        // Renderizar destaques
        // LEMBRETE: desativado a pedido do Math (catálogo pequeno). Para reativar,
        // descomente a linha abaixo e remova o display:none da seção no index.html.
        // renderDestaques(produtosData);

        // Renderizar depoimentos
        renderDepoimentos(depsData);
      });
    }

    // Extrai um número de preço para ordenação. Sob consulta / sem preço => null
    function precoOrdenacao(p) {
      // preço por faixa: usa o menor preço das faixas
      var pf = p.precos_faixa;
      if (typeof pf === "string") { try { pf = JSON.parse(pf); } catch(e) { pf = null; } }
      if (pf && pf.ativo && pf.faixas && pf.faixas.length) {
        var precos = pf.faixas.map(function(f){ return parseFloat(String(f.preco).replace(',', '.')); })
                              .filter(function(n){ return !isNaN(n); });
        if (precos.length) return Math.min.apply(null, precos);
      }
      // sob consulta ou sem preço => null (vai pro fim)
      if (!p.preco || p.preco_tipo === "consulta") return null;
      var v = parseFloat(String(p.preco).replace(/\./g, '').replace(',', '.'));
      return isNaN(v) ? null : v;
    }

    // Ordena a lista de produtos conforme o modo escolhido
    function ordenarProdutos(data, modo) {
      var arr = (data || []).slice();
      function semPrecoVaiProFim(a, b, cmp) {
        var pa = precoOrdenacao(a), pb = precoOrdenacao(b);
        if (pa === null && pb === null) return 0;
        if (pa === null) return 1;   // a sem preço -> fim
        if (pb === null) return -1;  // b sem preço -> fim
        return cmp(pa, pb);
      }
      if (modo === 'preco-asc') {
        arr.sort(function(a, b){ return semPrecoVaiProFim(a, b, function(x, y){ return x - y; }); });
      } else if (modo === 'preco-desc') {
        arr.sort(function(a, b){ return semPrecoVaiProFim(a, b, function(x, y){ return y - x; }); });
      } else if (modo === 'alfabetica') {
        arr.sort(function(a, b){ return String(a.nome||'').localeCompare(String(b.nome||''), 'pt-BR'); });
      } else if (modo === 'novidades') {
        arr.sort(function(a, b){
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
      }
      // 'tradicional' = mantém a ordem que veio do banco (ordem.asc)
      return arr;
    }

    // Troca a ordenação e re-renderiza o catálogo
    function mudarOrdem(modo) {
      window._ordemCatalogo = modo;
      var dados = window._catalogoProdutos || [];
      // qual aba está ativa, pra manter o cliente na mesma categoria
      var ativa = document.querySelector('.cat-section.active');
      renderCatalog(ordenarProdutos(dados, modo));
      if (ativa && ativa.id) {
        var tabBtn = document.querySelector('[aria-controls="' + ativa.id + '"]');
        if (tabBtn) showCat(ativa.id, tabBtn);
      }
    }

    // ── Ícone de traço fino por categoria (pelo nome; padrão = presente) ──
    var ICONES_CAT = {
      presente: '<path d="M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8"/><path d="M2 7h20v5H2z"/><path d="M12 21V7"/><path d="M12 7S10.5 3 8 3a2 2 0 0 0 0 4M12 7s1.5-4 4-4a2 2 0 0 1 0 4"/>',
      camadas: '<path d="M12 2 3 7l9 5 9-5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
      coracao: '<path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5.5 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7 7-7Z"/>',
      cesta: '<path d="M3 10h18l-1.5 9.5a1 1 0 0 1-1 .5H5.5a1 1 0 0 1-1-.5L3 10Z"/><path d="m8 10 2-5M16 10l-2-5"/><path d="M2 10h20"/>',
      predio: '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16"/><path d="M15 9h4a1 1 0 0 1 1 1v11"/><path d="M2 21h20"/><path d="M8 7h2M8 11h2M8 15h2"/>',
      papel: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>'
    };
    function iconeCategoria(nome) {
      var n = (nome || '').toLowerCase();
      var k = 'presente';
      if (n.indexOf('3d') >= 0 || n.indexOf('impress') >= 0) k = 'camadas';
      else if (n.indexOf('mimo') >= 0 || n.indexOf('amor') >= 0) k = 'coracao';
      else if (n.indexOf('cesta') >= 0 || n.indexOf('kit') >= 0) k = 'cesta';
      else if (n.indexOf('empresa') >= 0 || n.indexOf('corporat') >= 0 || n.indexOf('brinde') >= 0) k = 'predio';
      else if (n.indexOf('papel') >= 0 || n.indexOf('convite') >= 0) k = 'papel';
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.4'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
      svg.innerHTML = ICONES_CAT[k]; // conteúdo fixo do próprio código (não vem do banco)
      return svg;
    }

    // Cor de cada categoria (na ordem do admin; repete depois da 5ª)
    var CORES_CAT = ['teal', 'purple', 'amber', 'rose', 'blue'];

    // Monta abas + seções + cards do topo + rodapé a partir da tabela "categorias".
    // rows = null quando o Supabase falha -> usa CAT_RESERVA.
    function montarCategorias(rows) {
      var principais, filhas = {};
      if (rows === null) {
        principais = CAT_RESERVA.map(function(n, i) { return { id: 'r' + i, nome: n }; });
      } else {
        var ativas = {};
        rows.forEach(function(c) { ativas[c.id] = c; });
        principais = rows.filter(function(c) { return !c.parent_id; });
        rows.forEach(function(c) {
          // subcategoria só aparece se a categoria-mãe também estiver ativa
          if (c.parent_id && ativas[c.parent_id]) {
            (filhas[c.parent_id] = filhas[c.parent_id] || []).push(c.nome);
          }
        });
      }

      CAT_IDS = {}; CAT_SUBS = {};
      principais.forEach(function(c) {
        CAT_IDS[c.nome] = 'cat-c' + c.id;
        CAT_SUBS[c.nome] = filhas[c.id] || [];
      });

      var tabs = document.getElementById('cat-tabs');
      var secs = document.getElementById('cat-sections');
      var cards = document.getElementById('hero-cats-inner');
      var rodape = document.getElementById('footer-cats');
      if (tabs) while (tabs.firstChild) tabs.removeChild(tabs.firstChild);
      if (secs) while (secs.firstChild) secs.removeChild(secs.firstChild);
      if (cards) while (cards.firstChild) cards.removeChild(cards.firstChild);
      if (rodape) rodape.querySelectorAll('a').forEach(function(a) { a.remove(); });

      if (!principais.length) {
        if (secs) secs.appendChild(el('div', {className:'cat-empty', textContent:'Em breve novos produtos.'}));
        var hc = document.querySelector('.hero-cats'); if (hc) hc.style.display = 'none';
        return;
      }

      principais.forEach(function(c, i) {
        var secId = CAT_IDS[c.nome];

        var tab = el('button', {className:'cat-tab' + (i === 0 ? ' active' : ''), role:'tab', textContent:c.nome});
        tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        tab.setAttribute('aria-controls', secId);
        var cor = CORES_CAT[i % CORES_CAT.length];
        tab.style.setProperty('--tab-c', 'var(--' + cor + ')');
        tab.addEventListener('click', function() { showCat(secId, tab); });
        if (tabs) tabs.appendChild(tab);

        var sec = el('div', {className:'cat-section' + (i === 0 ? ' active' : ''), id:secId, role:'tabpanel'});
        sec.setAttribute('aria-label', c.nome);
        sec.style.setProperty('--accent', 'var(--' + cor + ')');
        sec.style.setProperty('--accent-l', 'var(--' + cor + '-l)');
        sec.style.setProperty('--accent-d', 'var(--' + cor + '-d)');
        if (secs) secs.appendChild(sec);

        if (cards) {
          var card = el('a', {href:'#catalogo', className:'hero-cat-card'});
          var ic = el('span', {className:'hero-cat-icon'}); ic.appendChild(iconeCategoria(c.nome));
          card.appendChild(ic);
          card.appendChild(el('span', {className:'hero-cat-name', textContent:c.nome}));
          card.addEventListener('click', function() { showCat(secId, tab); });
          cards.appendChild(card);
        }

        if (rodape) {
          var a = el('a', {href:'#catalogo', textContent:c.nome});
          a.addEventListener('click', function() { showCat(secId, tab); });
          rodape.appendChild(a);
        }
      });
    }

    function renderCatalog(data) {
      data = data || [];
      // Cada produto entra na categoria principal + nas extras ("Também aparece em").
      // Dentro de uma mesma categoria o produto aparece UMA vez, com todas as suas subcategorias.
      var cats = {};
      var vistos = {}; // categoria -> { id do produto -> cópia }
      function colocar(p, cat, sub) {
        if (!cat) return;
        vistos[cat] = vistos[cat] || {};
        var copia = vistos[cat][p.id];
        if (!copia) {
          copia = Object.assign({}, p, { categoria: cat, subcategoria: sub || null, _subs: [] });
          vistos[cat][p.id] = copia;
          (cats[cat] = cats[cat] || []).push(copia);
        }
        if (sub && copia._subs.indexOf(sub) < 0) copia._subs.push(sub);
        if (!copia.subcategoria && sub) copia.subcategoria = sub;
      }
      data.forEach(function(p) {
        colocar(p, p.categoria || "Outros", p.subcategoria);
        var extras = p.categorias_extras;
        if (typeof extras === "string") { try { extras = JSON.parse(extras); } catch(e) { extras = []; } }
        (Array.isArray(extras) ? extras : []).forEach(function(x) {
          if (x && x.categoria) colocar(p, x.categoria, x.subcategoria);
        });
      });
      Object.keys(CAT_IDS).forEach(function(catName) {
        var secId = CAT_IDS[catName];
        var sec = document.getElementById(secId);
        if (!sec) return;
        var prods = cats[catName];
        while (sec.firstChild) sec.removeChild(sec.firstChild);
        sec.classList.remove('has-subcats');
        if (!prods || !prods.length) {
          sec.appendChild(el('div', {className:'cat-empty', textContent:'Em breve novos produtos nesta categoria.'}));
          sec.querySelector('.cat-empty').style.cssText = 'text-align:center;padding:40px;color:#999;font-size:.9rem';
          return;
        }

        // Subcategorias cadastradas no admin (na ordem do admin), só as que têm produto
        var subcats = (CAT_SUBS[catName] || []).filter(function(sc) {
          return prods.some(function(p) { return p._subs.indexOf(sc) >= 0; });
        });

        var hasSubcats = subcats.length > 0;
        var items = groupProducts(prods);

        if (hasSubcats) {
          sec.classList.add('has-subcats');
          var filterBar = el('div', {className:'subcat-filter'});
          var allBtn = el('button', {className:'subcat-btn active', textContent:'Todos'});
          allBtn.setAttribute('data-sub', '');
          filterBar.appendChild(allBtn);
          subcats.forEach(function(sc) {
            var btn = el('button', {className:'subcat-btn', textContent: sc});
            btn.setAttribute('data-sub', sc);
            filterBar.appendChild(btn);
          });
          sec.appendChild(filterBar);

          var grid = el('div', {className:'subcat-grid'});
          items.forEach(function(item, i) {
            var card;
            if (item.type === 'group') {
              card = buildGroupCard(item.variants, catName, i);
              var subsG = [];
              item.variants.forEach(function(v) { v._subs.forEach(function(x) { if (subsG.indexOf(x) < 0) subsG.push(x); }); });
              card.setAttribute('data-sub', subsG.join('|'));
            } else {
              card = buildCard(item.product, catName, i);
              card.setAttribute('data-sub', item.product._subs.join('|'));
            }
            grid.appendChild(card);
          });
          sec.appendChild(grid);

          filterBar.addEventListener('click', function(e) {
            var btn = e.target.closest('.subcat-btn');
            if (!btn) return;
            var sub = btn.getAttribute('data-sub');
            filterBar.querySelectorAll('.subcat-btn').forEach(function(b) { b.classList.toggle('active', b === btn); });
            grid.querySelectorAll('.product-card').forEach(function(card) {
              var subsCard = (card.getAttribute('data-sub') || '').split('|');
              card.style.display = (!sub || subsCard.indexOf(sub) >= 0) ? '' : 'none';
            });
          });
        } else {
          items.forEach(function(item, i) {
            if (item.type === 'group') sec.appendChild(buildGroupCard(item.variants, catName, i));
            else sec.appendChild(buildCard(item.product, catName, i));
          });
        }
      });
    }

    function renderHeroCarousel(data) {
      var track = document.getElementById('hero-carousel-track');
      var dotsWrap = document.getElementById('hero-carousel-dots');
      var carousel = document.getElementById('hero-carousel');
      if (!track || !carousel) return;

      // Coleta TODAS as fotos do catálogo (principal + extras de cada produto)
      var comFoto = [];
      (data || []).forEach(function(p) {
        if (p.foto_url) comFoto.push({ foto: p.foto_url, nome: p.nome || '' });
        var extras = p.fotos_extras || [];
        if (typeof extras === "string") { try { extras = JSON.parse(extras); } catch(e) { extras = []; } }
        (extras || []).forEach(function(url) {
          if (url) comFoto.push({ foto: url, nome: p.nome || '' });
        });
      });

      // Embaralha (ordem aleatória a cada visita) — algoritmo Fisher-Yates
      for (var j = comFoto.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = comFoto[j]; comFoto[j] = comFoto[k]; comFoto[k] = tmp;
      }

      // Sem fotos: esconde o carrossel (não deixa espaço quebrado)
      if (!comFoto.length) { carousel.style.display = 'none'; return; }

      track.innerHTML = '';
      dotsWrap.innerHTML = '';
      // Com muitas fotos, esconde os pontinhos (ficaria uma fileira enorme)
      var mostrarDots = comFoto.length <= 8;
      dotsWrap.style.display = mostrarDots ? 'flex' : 'none';
      comFoto.forEach(function(item, i) {
        var slide = document.createElement('div');
        slide.className = 'hero-carousel-slide' + (i === 0 ? ' active' : '');
        var img = document.createElement('img');
        img.src = item.foto;
        img.alt = item.nome;
        img.loading = 'lazy';
        slide.appendChild(img);
        if (item.nome) {
          var cap = document.createElement('div');
          cap.className = 'hcap';
          cap.textContent = item.nome;
          slide.appendChild(cap);
        }
        track.appendChild(slide);

        if (mostrarDots) {
          var dot = document.createElement('span');
          if (i === 0) dot.className = 'active';
          dot.addEventListener('click', function() { goToSlide(i); });
          dotsWrap.appendChild(dot);
        }
      });

      var slides = track.querySelectorAll('.hero-carousel-slide');
      var dots = dotsWrap.querySelectorAll('span');
      var current = 0;
      var timer = null;

      function goToSlide(idx) {
        slides[current].classList.remove('active');
        if (dots[current]) dots[current].classList.remove('active');
        current = (idx + slides.length) % slides.length;
        slides[current].classList.add('active');
        if (dots[current]) dots[current].classList.add('active');
        restart();
      }
      function next() { goToSlide(current + 1); }
      function restart() {
        if (timer) clearInterval(timer);
        timer = setInterval(next, 3500); // troca a cada 3,5s
      }
      if (slides.length > 1) restart();
    }

    function renderDestaques(data) {
      var grid = document.getElementById('destaques-grid');
      if (!grid) return;
      var destaques = (data || []).filter(function(p) { return p.promo || p.badge === 'Novo'; }).slice(0, 4);
      if (!destaques.length) {
        var sec = document.querySelector('.destaques-section');
        if (sec) sec.style.display = 'none';
        return;
      }
      while (grid.firstChild) grid.removeChild(grid.firstChild);
      destaques.forEach(function(p, i) { grid.appendChild(buildCard(p, p.categoria || '', i)); });
    }

    function renderDepoimentos(data) {
      var grid = document.getElementById('dep-grid');
      if (!grid) return;
      while (grid.firstChild) grid.removeChild(grid.firstChild);
      if (!data || !data.length) {
        var emptyMsg = document.createElement('div');
        emptyMsg.textContent = 'Depoimentos em breve.';
        emptyMsg.style.cssText = 'text-align:center;padding:40px;color:#999;font-size:.9rem;grid-column:1/-1';
        grid.appendChild(emptyMsg);
        return;
      }
      var colors = ['av-teal', 'av-purple', 'av-amber'];
      data.forEach(function(d, i) {
        var card = el('div', {className:'testimonial-card reveal visible'});
        if (i > 0) card.style.transitionDelay = (i * 0.08).toFixed(2) + 's';
        card.appendChild(el('div', {className:'testimonial-quote', textContent:'"'}));
        var nota = parseInt(d.nota) || 5;
        var stars = '';
        for (var s = 0; s < nota; s++) stars += String.fromCharCode(9733);
        card.appendChild(el('div', {className:'testimonial-stars', textContent: stars}));
        card.appendChild(el('p', {className:'testimonial-text', textContent: d.texto || ''}));
        var author = el('div', {className:'testimonial-author'});
        var nome = d.ocultar_nome ? (d.nome_cliente ? d.nome_cliente.charAt(0) + '***' : 'Cliente') : (d.nome_cliente || 'Cliente');
        var inicial = (d.nome_cliente || 'C').charAt(0).toUpperCase();
        author.appendChild(el('div', {className:'author-avatar ' + colors[i % 3], textContent: inicial}));
        var info = el('div', {});
        info.appendChild(el('div', {className:'author-name', textContent: nome}));
        if (d.tipo_pedido) info.appendChild(el('div', {className:'author-info', textContent: d.tipo_pedido}));
        author.appendChild(info);
        card.appendChild(author);
        grid.appendChild(card);
      });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initCatalog);
    else initCatalog();
  })();
// ══ LISTA DE DESEJOS (Wishlist) ══════════════════
var wishlist = [];

function addToWishlist(nome, preco, categoria) {
  var exists = wishlist.some(function(item) { return item.nome === nome; });
  if (exists) {
    removeFromWishlist(nome);
    return;
  }
  wishlist.push({ nome: nome, preco: preco || 'Sob consulta', categoria: categoria || '' });
  updateWishlistUI();
  // Feedback visual
  var floatBtn = document.getElementById('wl-float');
  if (floatBtn) { floatBtn.classList.add('wl-pulse'); setTimeout(function() { floatBtn.classList.remove('wl-pulse'); }, 400); }
}

function removeFromWishlist(nome) {
  wishlist = wishlist.filter(function(item) { return item.nome !== nome; });
  updateWishlistUI();
}

function isInWishlist(nome) {
  return wishlist.some(function(item) { return item.nome === nome; });
}

function updateWishlistUI() {
  var count = wishlist.length;
  var floatBtn = document.getElementById('wl-float');
  var countEl = document.getElementById('wl-count');
  var itemsEl = document.getElementById('wl-items');
  var footerEl = document.getElementById('wl-footer');

  // Botão flutuante sempre visível; só a bolinha de contagem aparece com itens
  if (floatBtn) floatBtn.style.display = 'flex';
  if (countEl) {
    countEl.textContent = count;
    countEl.style.display = count > 0 ? 'inline-flex' : 'none';
  }

  // Atualizar botões nos cards
  document.querySelectorAll('.wl-add-btn').forEach(function(btn) {
    var nome = btn.getAttribute('data-wl-nome');
    if (isInWishlist(nome)) {
      btn.classList.add('wl-added');
      btn.textContent = '✓ Adicionado';
    } else {
      btn.classList.remove('wl-added');
      btn.textContent = '+ Adicionar';
    }
  });

  // Painel
  if (!itemsEl) return;
  itemsEl.innerHTML = '';
  if (count === 0) {
    itemsEl.innerHTML = '<p class="wl-empty">Nenhum produto adicionado ainda.<br>Navegue pelo catálogo e clique em "Adicionar" nos produtos que deseja.</p>';
    if (footerEl) footerEl.style.display = 'none';
    return;
  }
  if (footerEl) footerEl.style.display = 'block';

  wishlist.forEach(function(item) {
    var div = document.createElement('div');
    div.className = 'wl-item';
    var info = document.createElement('div');
    info.className = 'wl-item-info';
    var nameEl = document.createElement('div');
    nameEl.className = 'wl-item-name';
    nameEl.textContent = item.nome;
    info.appendChild(nameEl);
    var priceEl = document.createElement('div');
    priceEl.className = 'wl-item-price';
    priceEl.textContent = item.preco;
    info.appendChild(priceEl);
    div.appendChild(info);
    var removeBtn = document.createElement('button');
    removeBtn.className = 'wl-item-remove';
    removeBtn.textContent = '✕';
    removeBtn.setAttribute('aria-label', 'Remover ' + item.nome);
    removeBtn.onclick = function() { removeFromWishlist(item.nome); };
    div.appendChild(removeBtn);
    itemsEl.appendChild(div);
  });
}

function toggleWishlist() {
  var panel = document.getElementById('wishlist-panel');
  if (!panel) return;
  var isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'flex';
  document.body.style.overflow = isOpen ? '' : 'hidden';
}

function enviarLista() {
  if (!wishlist.length) return;
  var msg = 'Olá, Studio MiMimos!\n\nVim pelo site e gostaria de combinar o pedido desses produtos:\n\n';
  wishlist.forEach(function(item, i) {
    msg += '• *' + item.nome + '*';
    if (item.preco && item.preco !== 'Sob consulta') msg += ' — ' + item.preco;
    msg += '\n';
  });
  msg += '\nPode me ajudar com valores, personalização e prazo?';
  var url = 'https://wa.me/5585997327204?text=' + encodeURIComponent(msg);
  window.open(url, '_blank');
}
