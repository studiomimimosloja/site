'use strict';
// ══ CESTA DE ORÇAMENTO (lista de desejos) ══════════════
// Usada na página inicial e nas páginas de produto. A lista fica guardada
// no navegador (sessionStorage) para não sumir ao trocar de página.
var CESTA_CHAVE = 'mimimos-cesta';
var wishlist = (function() {
  try {
    var salvo = JSON.parse(sessionStorage.getItem(CESTA_CHAVE) || '[]');
    return Array.isArray(salvo) ? salvo : [];
  } catch (e) { return []; }
})();

function salvarCesta() {
  try { sessionStorage.setItem(CESTA_CHAVE, JSON.stringify(wishlist)); } catch (e) {}
}

function addToWishlist(nome, preco, categoria) {
  var exists = wishlist.some(function(item) { return item.nome === nome; });
  if (exists) {
    removeFromWishlist(nome);
    return;
  }
  wishlist.push({ nome: nome, preco: preco || 'Sob consulta', categoria: categoria || '' });
  if (window.track) track('add_to_quote', { produto: nome, categoria: categoria || '' });
  salvarCesta();
  updateWishlistUI();
  // Feedback visual
  var floatBtn = document.getElementById('wl-float');
  if (floatBtn) { floatBtn.classList.add('wl-pulse'); setTimeout(function() { floatBtn.classList.remove('wl-pulse'); }, 400); }
}

function removeFromWishlist(nome) {
  wishlist = wishlist.filter(function(item) { return item.nome !== nome; });
  salvarCesta();
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
      btn.textContent = btn.getAttribute('data-wl-texto') || '+ Adicionar';
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
  if (window.track) {
    track('quote_sent', { qtd_itens: wishlist.length });
    track('whatsapp_click', { origem: 'cesta' });
  }
  window.open(url, '_blank');
}

// Liga os botões do painel (sem onclick no HTML)
(function() {
  function ligar() {
    var bind = function(sel, fn) {
      document.querySelectorAll(sel).forEach(function(b) { b.addEventListener('click', fn); });
    };
    bind('#wl-float', toggleWishlist);
    bind('#wishlist-panel .wl-overlay', toggleWishlist);
    bind('#wishlist-panel .wl-close', toggleWishlist);
    bind('#wishlist-panel .wl-send', enviarLista);
    updateWishlistUI();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ligar);
  else ligar();
})();
