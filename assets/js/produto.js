'use strict';
// ══ PÁGINA DE PRODUTO ══════════════════════════════════
// Troca de variação, miniaturas de foto e botão "Adicionar à cesta".
(function() {
  var dados = {};
  try { dados = JSON.parse(document.getElementById('pp-dados').textContent); } catch (e) {}
  if (window.track) track('view_product', { produto: dados.nome || '', categoria: dados.categoria || '' });

  // Variações (Simples / 3D / Luxo...)
  var botoes = document.querySelectorAll('.pp-seletor .var-btn');
  botoes.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var idx = btn.getAttribute('data-var');
      botoes.forEach(function(b) {
        var ativo = b === btn;
        b.classList.toggle('active', ativo);
        b.setAttribute('aria-pressed', ativo ? 'true' : 'false');
      });
      document.querySelectorAll('.pp-galeria, .pp-var-info').forEach(function(bloco) {
        bloco.hidden = bloco.getAttribute('data-var') !== idx;
      });
    });
  });

  // Miniaturas: trocam a foto grande
  document.querySelectorAll('.pp-galeria').forEach(function(gal) {
    var grande = gal.querySelector('.pp-foto');
    gal.querySelectorAll('.pp-mini').forEach(function(mini) {
      mini.addEventListener('click', function() {
        if (grande) grande.src = mini.getAttribute('data-src');
        gal.querySelectorAll('.pp-mini').forEach(function(m) { m.classList.toggle('ativo', m === mini); });
      });
    });
  });

  // Adicionar à cesta (a cesta é a mesma da página inicial)
  document.querySelectorAll('.pp-add').forEach(function(btn) {
    btn.addEventListener('click', function() {
      addToWishlist(btn.getAttribute('data-wl-nome'), btn.getAttribute('data-wl-preco'), btn.getAttribute('data-wl-cat'));
    });
  });
})();
