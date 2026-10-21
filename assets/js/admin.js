var sessionToken = "";
try { sessionToken = sessionStorage.getItem("mm_token") || ""; } catch(e) {}
var SUPA_URL = "https://grmulciyoytzqlrdqmcg.supabase.co";
var SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybXVsY2l5b3l0enFscmRxbWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NTAyNzUsImV4cCI6MjA5NTEyNjI3NX0.pbkhq2_nHaCsqo8WbH-9TIaCgWAaWgDW2W5zBK9tl-Y";
var produtos = [];
var fotoB64 = "";

// -- Supabase REST helpers --
function supa(method, path, body) {
  var opts = {
    method: method,
    headers: {
      "apikey": SUPA_KEY,
      "Authorization": "Bearer " + (sessionToken || SUPA_KEY),
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "return=representation" : (method === "PATCH" ? "return=representation" : "")
    }
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(SUPA_URL + "/rest/v1/" + path, opts).then(function(r) {
    if (!r.ok) return r.text().then(function(t){ throw new Error(t); });
    var ct = r.headers.get("content-type") || "";
    if (ct.indexOf("json") >= 0) return r.json();
    return r.text();
  });
}

function loadAll() {
  document.getElementById("loading").classList.add("sh");
  supa("GET", "produtos?select=*&order=ordem.asc,created_at.desc").then(function(data) {
    produtos = data || [];
    render();
    stats();
    document.getElementById("loading").classList.remove("sh");
  }).catch(function(e) {
    console.error(e);
    toast("Erro ao carregar: " + e.message, "err");
    document.getElementById("loading").classList.remove("sh");
  });
}

// -- Login --
document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("lbtn").addEventListener("click", doLogin);
  // Auto-restore session with validation
  if (sessionToken) {
    fetch(SUPA_URL + "/auth/v1/user", {
      headers: { "apikey": SUPA_KEY, "Authorization": "Bearer " + sessionToken }
    }).then(function(r) {
      if (r.ok) {
        document.getElementById("LS").style.display = "none";
        document.getElementById("AS").style.display = "block";
        loadAll();
      } else {
        sessionToken = "";
        try { sessionStorage.removeItem("mm_token"); } catch(e) {}
      }
    }).catch(function() {
      sessionToken = "";
      try { sessionStorage.removeItem("mm_token"); } catch(e) {}
    });
  }
  document.getElementById("lp").addEventListener("keydown", function(e) { if (e.key === "Enter") doLogin(); });
  document.getElementById("le").addEventListener("keydown", function(e) { if (e.key === "Enter") document.getElementById("lp").focus(); });
});
function doLogin() {
  var email = document.getElementById("le").value.trim();
  var pass = document.getElementById("lp").value;
  if (!email || !pass) { showLoginError("Preencha e-mail e senha."); return; }
  var btn = document.getElementById("lbtn");
  btn.textContent = "Entrando...";
  btn.disabled = true;
  fetch(SUPA_URL + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { "apikey": SUPA_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: email, password: pass })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.access_token) {
      sessionToken = data.access_token;
      try { sessionStorage.setItem("mm_token", sessionToken); } catch(e) {}
      document.getElementById("LS").style.display = "none";
      document.getElementById("AS").style.display = "block";
      loadAll();
    } else {
      showLoginError(data.error_description || data.msg || "Credenciais inválidas.");
    }
  })
  .catch(function(e) { showLoginError("Erro de conexão: " + e.message); })
  .finally(function() { btn.textContent = "Entrar no painel"; btn.disabled = false; });
}

function showLoginError(msg) {
  var el = document.getElementById("lerr");
  el.textContent = msg;
  el.style.display = "block";
  document.getElementById("lp").value = "";
  document.getElementById("lp").focus();
}
function logout() {
  if (sessionToken) {
    fetch(SUPA_URL + "/auth/v1/logout", {
      method: "POST",
      headers: { "apikey": SUPA_KEY, "Authorization": "Bearer " + sessionToken }
    }).catch(function(){});
  }
  sessionToken = "";
  try { sessionStorage.removeItem("mm_token"); } catch(e) {}
  document.getElementById("LS").style.display = "flex";
  document.getElementById("AS").style.display = "none";
}

function showP(id, btn) {
  document.querySelectorAll("[id^=panel-]").forEach(function(p){p.style.display="none"});
  document.querySelectorAll(".ni").forEach(function(n){n.classList.remove("act")});
  var el = document.getElementById("panel-" + id);
  if (el) el.style.display = "block";
  if (btn) btn.classList.add("act");
  if (id === "orc") {
    var fr = document.getElementById("orc-frame");
    if (fr && !fr.getAttribute("src")) fr.setAttribute("src", "orcamento.html");
  }
}

function stats() {
  document.getElementById("s-t").textContent = produtos.length;
  document.getElementById("s-a").textContent = produtos.filter(function(p){return p.status==="Ativo"}).length;
  document.getElementById("s-p").textContent = produtos.filter(function(p){return p.promo}).length;
  document.getElementById("s-o").textContent = produtos.filter(function(p){return p.status==="Oculto"}).length;
  document.getElementById("pcnt").textContent = "(" + produtos.length + ")";
}

var BC = {"Novo":"bp-n","Personaliz\u00e1vel":"bp-p","Mais pedido":"bp-h","Sob consulta":"bp-c"};
function precoLbl(p) {
  if (p.preco_tipo === "consulta") return "Sob consulta";
  if (p.preco_tipo === "partir") return "A partir de R$ " + p.preco;
  return p.preco ? "R$ " + p.preco : "\u2014";
}

function chipExtras(p) {
  var x = lerExtrasProduto(p);
  if (!x.length) return '';
  var nomes = x.map(function(e){ return e.categoria + (e.subcategoria ? ' › ' + e.subcategoria : ''); }).join(', ');
  return ' <span title="Também aparece em: ' + esc(nomes) + '" style="display:inline-block;padding:1px 7px;border-radius:100px;background:var(--tl,#e4f8f6);color:var(--t,#1b9c93);font-size:.68rem;font-weight:700;cursor:help">+' + x.length + '</span>';
}

function alertaCat(p) {
  if (!(genericData.cats||[]).length) return '';
  var existe = catsPrincipais().some(function(c){ return c.nome === p.categoria; });
  if (!existe) return ' <span style="color:#dc2626;font-weight:700" title="Essa categoria não existe no painel — o produto não aparece no site">⚠ categoria inexistente</span>';
  if (p.subcategoria && !subcatsDe(p.categoria).some(function(c){ return c.nome === p.subcategoria; }))
    return ' <span style="color:#b9740f;font-weight:700" title="Subcategoria não cadastrada — o produto só aparece em Todos">⚠ subcategoria não cadastrada</span>';
  return '';
}

function render() {
  var q = (document.getElementById("q").value || "").toLowerCase();
  var cat = document.getElementById("fc").value;
  var st = document.getElementById("fst").value;
  var list = produtos.filter(function(p) {
    return (!q || p.nome.toLowerCase().indexOf(q) >= 0 || (p.categoria||"").toLowerCase().indexOf(q) >= 0)
      && (!cat || p.categoria === cat)
      && (!st || p.status === st);
  });
  var tb = document.getElementById("tbody");
  if (!list.length) { tb.innerHTML = '<tr><td colspan="5"><div class="es"><span>&#128270;</span>Nenhum produto encontrado</div></td></tr>'; return; }
  tb.innerHTML = list.map(function(p) {
    var foto = p.foto_url ? '<img class="pt" src="' + esc(p.foto_url) + '" loading="lazy">' : '<div class="ptp">&#127873;</div>';
    var varLabel = p.grupo ? '<div style="font-size:.65rem;color:var(--t);font-weight:600;margin-top:1px">&#128279; ' + esc(p.grupo) + (p.variacao_nome ? ' · ' + esc(p.variacao_nome) : '') + '</div>' : '';
    var bc = BC[p.badge] || "";
    var bdg = bc ? '<span class="bp ' + bc + '">' + esc(p.badge) + '</span>' : '<span style="color:var(--sf)">\u2014</span>';
    var stc = p.status === "Ativo" ? "sp-a" : p.status === "Oculto" ? "sp-o" : "sp-e";
    var dc = p.status === "Ativo" ? "sd-a" : p.status === "Oculto" ? "sd-o" : "sd-e";
    var prm = p.promo && p.promo_preco ? '<div style="font-size:.7rem;color:var(--a);font-weight:600">&#127991; R$ ' + esc(p.promo_preco) + '</div>' : '';
    return '<tr><td><div class="pi">' + foto + '<div><div class="pn">' + esc(p.nome) + '</div><div class="pc">' + esc(p.categoria||"") + (p.subcategoria ? ' › ' + esc(p.subcategoria) : '') + alertaCat(p) + chipExtras(p) + '</div>' + varLabel + '</div></div></td>'
      + '<td>' + precoLbl(p) + prm + '</td><td>' + bdg + '</td>'
      + '<td><span class="sp ' + stc + '"><span class="sd ' + dc + '"></span>' + p.status + '</span></td>'
      + '<td><div class="ac">'
      + '<button class="ab ab-e" onclick="editP(' + p.id + ')" title="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>'
      + '<button class="ab ab-h" onclick="toggleH(' + p.id + ')" title="Ocultar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg></button>'
      + '<button class="ab ab-p" onclick="togglePr(' + p.id + ')" title="Promo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></button>'
      + '<button class="ab ab-d" onclick="delP(' + p.id + ')" title="Excluir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>'
      + '</div></td></tr>';
  }).join("");
}

// -- Modal --
function openM() {
  fotoB64 = ""; fotoFile = null;
  document.getElementById("fprev").style.display = "none";
  document.getElementById("fui").style.display = "block";
  ["fn","fcat","fsubcat","fbdg","fpr","fpt","fd","fwpp","fsts","ford","fpp","fptx","fgrupo","fvar"].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = "";
  });
  setCategoriaProduto("", "");
  setExtrasProduto(null);
  document.getElementById("fbdg").value = "Nenhum";
  document.getElementById("fpt").value = "fixo";
  document.getElementById("fsts").value = "Ativo";
  document.getElementById("ford").value = "0";
  document.getElementById("fpc").checked = false;
  document.getElementById("pflds").classList.remove("sh");
  document.getElementById("eid").value = "";
  carregarPrecosFaixa(null);
  extraFotos = [];
  renderExtraFotos();
  document.getElementById("mt").textContent = "Novo produto";
  document.getElementById("mo").classList.add("op");
}

function editP(id) {
  fotoFile = null;
  var p = produtos.find(function(x){return x.id===id});
  if (!p) return;
  fotoB64 = p.foto_url || "";
  if (fotoB64) {
    document.getElementById("fprev").src = fotoB64;
    document.getElementById("fprev").style.display = "block";
    document.getElementById("fui").style.display = "none";
  } else {
    document.getElementById("fprev").style.display = "none";
    document.getElementById("fui").style.display = "block";
  }
  document.getElementById("fn").value = p.nome || "";
  setCategoriaProduto(p.categoria || "", p.subcategoria || "");
  setExtrasProduto(p);
  document.getElementById("fbdg").value = p.badge || "Nenhum";
  document.getElementById("fpr").value = p.preco || "";
  document.getElementById("fpt").value = p.preco_tipo || "fixo";
  carregarPrecosFaixa(p);
  document.getElementById("fd").value = p.descricao || "";
  document.getElementById("fwpp").value = p.whatsapp_msg || "";
  document.getElementById("fsts").value = p.status || "Ativo";
  document.getElementById("ford").value = p.ordem || 0;
  document.getElementById("fgrupo").value = p.grupo || "";
  document.getElementById("fvar").value = p.variacao_nome || "";
  document.getElementById("fpc").checked = p.promo || false;
  document.getElementById("fpp").value = p.promo_preco || "";
  document.getElementById("fptx").value = p.promo_texto || "";
  if (p.promo) document.getElementById("pflds").classList.add("sh");
  else document.getElementById("pflds").classList.remove("sh");
  // Carregar fotos extras
  extraFotos = [];
  var extras = p.fotos_extras || [];
  if (typeof extras === 'string') { try { extras = JSON.parse(extras); } catch(e) { extras = []; } }
  extras.forEach(function(url) { extraFotos.push({ url: url, file: null, isNew: false }); });
  renderExtraFotos();
  document.getElementById("eid").value = id;
  document.getElementById("mt").textContent = "Editar produto";
  document.getElementById("mo").classList.add("op");
}

function closeM() { document.getElementById("mo").classList.remove("op"); }

var fotoFile = null;
var extraFotos = []; // [{url:'...', file: File|null, isNew: bool}]
var extraUploadQueue = [];

// ── FOTOS LEVES ──
// Toda foto é reduzida (lado maior até 1200px) e convertida para WebP antes de subir,
// com cache longo no navegador. Uma foto de 2 MB vira algo perto de 100 KB.
var FOTO_LADO_MAX = 1200, FOTO_QUALIDADE = 0.82;

function otimizarFoto(blob) {
  return createImageBitmap(blob).then(function(bmp) {
    var esc = Math.min(1, FOTO_LADO_MAX / Math.max(bmp.width, bmp.height));
    var c = document.createElement("canvas");
    c.width = Math.round(bmp.width * esc);
    c.height = Math.round(bmp.height * esc);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise(function(res, rej) {
      c.toBlob(function(b) { b ? res(b) : rej(new Error("Não consegui converter a foto.")); }, "image/webp", FOTO_QUALIDADE);
    });
  });
}

function subirFoto(blob, prefixo) {
  return otimizarFoto(blob).then(function(leve) {
    var nome = prefixo + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6) + ".webp";
    return fetch(SUPA_URL + "/storage/v1/object/produtos/" + nome, {
      method: "POST",
      headers: {
        "apikey": SUPA_KEY,
        "Authorization": "Bearer " + (sessionToken || SUPA_KEY),
        "Content-Type": "image/webp",
        "cache-control": "max-age=31536000",
        "x-upsert": "true"
      },
      body: leve
    }).then(function(r) {
      if (!r.ok) return r.text().then(function(t){ throw new Error(t); });
      return SUPA_URL + "/storage/v1/object/public/produtos/" + nome;
    });
  });
}

// Foto que ainda não foi otimizada: base64 dentro do produto, ou arquivo do bucket que não é .webp
function fotoPesada(u) {
  if (!u || typeof u !== "string") return false;
  if (u.indexOf("data:") === 0) return true;
  return u.indexOf("/storage/v1/object/public/produtos/") > 0 && !/\.webp(\?|$)/i.test(u);
}

// Converte as fotos já cadastradas, produto por produto (aba Config)
function otimizarFotosExistentes() {
  var btn = document.getElementById("otm-btn");
  var info = document.getElementById("otm-info");
  var lista = produtos.filter(function(p) {
    var ex = p.fotos_extras || [];
    if (typeof ex === "string") { try { ex = JSON.parse(ex); } catch(e) { ex = []; } }
    return fotoPesada(p.foto_url) || ex.some(fotoPesada);
  });
  if (!lista.length) { info.textContent = "Todas as fotos já estão otimizadas."; return; }
  if (!confirm("Otimizar as fotos de " + lista.length + " produto(s)? Leva alguns minutos. Não feche esta página até terminar.")) return;
  btn.disabled = true;
  var feitos = 0, erros = 0;
  var trocar = function(u) {
    if (!fotoPesada(u)) return Promise.resolve(u);
    return fetch(u).then(function(r) { return r.blob(); }).then(function(b) { return subirFoto(b, "otm"); });
  };
  lista.reduce(function(fila, p) {
    return fila.then(function() {
      info.textContent = "Otimizando " + (feitos + erros + 1) + " de " + lista.length + ": " + (p.nome || "");
      var ex = p.fotos_extras || [];
      if (typeof ex === "string") { try { ex = JSON.parse(ex); } catch(e) { ex = []; } }
      return Promise.all([trocar(p.foto_url)].concat(ex.map(trocar))).then(function(urls) {
        return supa("PATCH", "produtos?id=eq." + p.id, { foto_url: urls[0], fotos_extras: urls.slice(1) });
      }).then(function() { feitos++; }).catch(function(e) { erros++; console.error("Foto de " + p.nome, e); });
    });
  }, Promise.resolve()).then(function() {
    btn.disabled = false;
    info.textContent = "Pronto: " + feitos + " produto(s) otimizado(s)" + (erros ? ", " + erros + " com erro (tente de novo)." : ".");
    toast("Fotos otimizadas!", "ok");
    loadAll();
  });
}

function handleF(input) {
  var file = input.files[0];
  if (!file) return;
  if (file.size > 20*1024*1024) { toast("Foto muito grande (max 20MB)","err"); return; }
  fotoFile = file;
  var reader = new FileReader();
  reader.onload = function(e) {
    fotoB64 = e.target.result;
    document.getElementById("fprev").src = fotoB64;
    document.getElementById("fprev").style.display = "block";
    document.getElementById("fui").style.display = "none";
  };
  reader.readAsDataURL(file);
}

function uploadFoto() {
  return new Promise(function(resolve, reject) {
    if (fotoFile) { subirFoto(fotoFile, "prod").then(resolve, reject); return; }
    // foto antiga guardada como base64 dentro do produto: vira arquivo leve ao salvar
    if (fotoB64 && fotoB64.indexOf("data:") === 0) {
      fetch(fotoB64).then(function(r) { return r.blob(); }).then(function(b) { return subirFoto(b, "prod"); }).then(resolve, reject);
      return;
    }
    resolve(fotoB64 || "");
  });
}

// ── FOTOS EXTRAS (carrossel) ──
function handleExtraFoto(input) {
  var files = input.files;
  if (!files || !files.length) return;
  var allowed = ['image/jpeg','image/png','image/webp'];
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    if (f.size > 20*1024*1024) { toast("Foto '" + f.name + "' muito grande (max 20MB)","err"); continue; }
    if (allowed.indexOf(f.type) < 0) { toast("Formato inválido: " + f.name,"err"); continue; }
    (function(file) {
      var reader = new FileReader();
      reader.onload = function(e) {
        extraFotos.push({ url: e.target.result, file: file, isNew: true });
        renderExtraFotos();
      };
      reader.readAsDataURL(file);
    })(f);
  }
  input.value = "";
}

function renderExtraFotos() {
  var grid = document.getElementById("fotos-extras-grid");
  if (!grid) return;
  grid.innerHTML = "";
  extraFotos.forEach(function(foto, idx) {
    var div = document.createElement("div");
    div.style.cssText = "position:relative;width:72px;height:72px;border-radius:8px;overflow:hidden;border:1.5px solid var(--ln);";
    var img = document.createElement("img");
    img.src = foto.url;
    img.alt = "Extra " + (idx+1);
    img.style.cssText = "width:100%;height:100%;object-fit:cover;";
    div.appendChild(img);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "×";
    btn.style.cssText = "position:absolute;top:2px;right:2px;width:20px;height:20px;border-radius:50%;border:none;background:rgba(220,38,38,.85);color:#fff;font-size:14px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;";
    btn.onclick = function() { removeExtraFoto(idx); };
    div.appendChild(btn);
    grid.appendChild(div);
  });
}

function removeExtraFoto(idx) {
  extraFotos.splice(idx, 1);
  renderExtraFotos();
}

function uploadExtraFotos() {
  var toUpload = extraFotos.filter(function(f) { return f.isNew && f.file; });
  if (!toUpload.length) {
    return Promise.resolve(extraFotos.map(function(f) { return f.url; }));
  }
  var promises = extraFotos.map(function(foto) {
    if (!foto.isNew || !foto.file) return Promise.resolve(foto.url);
    return subirFoto(foto.file, "extra");
  });
  return Promise.all(promises);
}

function saveP() {
  var nome = document.getElementById("fn").value.trim();
  var cat = document.getElementById("fcat").value;
  var desc = document.getElementById("fd").value.trim();
  if (!nome || !cat || !desc) { toast("Preencha nome, categoria e descricao.","err"); return; }
  var editId = document.getElementById("eid").value;
  var promo = document.getElementById("fpc").checked;
  var svBtn = document.querySelector(".bsv");
  svBtn.textContent = "Salvando...";
  svBtn.disabled = true;
  Promise.all([uploadFoto(), uploadExtraFotos()]).then(function(results) {
    var fotoUrl = results[0];
    var extrasUrls = results[1] || [];
    var obj = {
      nome: nome,
      categoria: cat,
      subcategoria: document.getElementById("fsubcat").value.trim() || null,
      categorias_extras: coletarExtras(),
      descricao: desc,
      preco: document.getElementById("fpr").value.trim(),
      preco_tipo: document.getElementById("fpt").value,
      badge: document.getElementById("fbdg").value,
      whatsapp_msg: document.getElementById("fwpp").value.trim(),
      foto_url: fotoUrl,
      fotos_extras: extrasUrls,
      status: document.getElementById("fsts").value,
      ordem: parseInt(document.getElementById("ford").value) || 0,
      grupo: document.getElementById("fgrupo").value.trim() || null,
      variacao_nome: document.getElementById("fvar").value.trim() || null,
      promo: promo,
      promo_preco: promo ? document.getElementById("fpp").value.trim() : "",
      promo_texto: promo ? document.getElementById("fptx").value.trim() : "",
      precos_faixa: montarPrecosFaixa()
    };
    if (editId) {
      return supa("PATCH", "produtos?id=eq." + editId, obj).then(function() {
        toast("Produto atualizado!","ok"); closeM(); loadAll();
      });
    } else {
      return supa("POST", "produtos", obj).then(function() {
        toast("Produto adicionado!","ok"); closeM(); loadAll();
      });
    }
  }).catch(function(e) {
    toast("Erro: " + e.message,"err");
  }).finally(function() {
    svBtn.textContent = "Salvar";
    svBtn.disabled = false;
    fotoFile = null;
  });
}

function delP(id) {
  if (!confirm("Excluir este produto?")) return;
  supa("DELETE", "produtos?id=eq." + id).then(function() {
    toast("Excluido.","ok"); loadAll();
  }).catch(function(e) { toast("Erro: " + e.message,"err"); });
}

function toggleH(id) {
  var p = produtos.find(function(x){return x.id===id});
  if (!p) return;
  var ns = p.status === "Oculto" ? "Ativo" : "Oculto";
  supa("PATCH", "produtos?id=eq." + id, {status: ns}).then(function() {
    toast(ns === "Oculto" ? "Produto ocultado." : "Produto ativo!","ok"); loadAll();
  }).catch(function(e) { toast("Erro: " + e.message,"err"); });
}

function togglePr(id) {
  var p = produtos.find(function(x){return x.id===id});
  if (!p) return;
  if (!p.promo) {
    var pp = prompt("Preco promocional (Ex: 24,90):", "");
    if (pp === null) return;
    var tx = prompt("Texto da oferta:", "");
    if (tx === null) return;
    supa("PATCH", "produtos?id=eq." + id, {promo:true, promo_preco:pp, promo_texto:tx}).then(function() {
      toast("Promocao ativada!","ok"); loadAll();
    });
  } else {
    supa("PATCH", "produtos?id=eq." + id, {promo:false, promo_preco:"", promo_texto:""}).then(function() {
      toast("Promocao removida.","ok"); loadAll();
    });
  }
}

// -- Toast --
var tt;
function toast(msg, type) {
  var t = document.getElementById("toast");
  document.getElementById("tmsg").textContent = msg;
  t.className = "toast " + (type||"ok") + " show";
  clearTimeout(tt);
  tt = setTimeout(function(){t.classList.remove("show")}, 3000);
}
// ════════════════════════════════════════════════════
// CRUD GENÉRICO PARA NOVAS TABELAS
// ════════════════════════════════════════════════════

var genericData = { cats: [], deps: [], gal: [], faqs: [], banners: [], badges: [] };
var currentSection = "";
var currentEditId = "";
var genFotoFile = null;
var genFotoB64 = "";
var genPrintFile = null;
var genPrintB64 = "";

var TABLES = {
  cats: { table: "categorias", label: "Categoria", order: "ordem.asc" },
  deps: { table: "depoimentos", label: "Depoimento", order: "created_at.desc" },
  gal:  { table: "galeria", label: "Foto", order: "ordem.asc,created_at.desc" },
  faqs: { table: "faq", label: "Pergunta", order: "ordem.asc" },
  banners: { table: "banners", label: "Banner", order: "ordem.asc" },
  badges: { table: "badges", label: "Badge", order: "ordem.asc" }
};

function loadGeneric(section) {
  var cfg = TABLES[section];
  if (!cfg) return;
  supa("GET", cfg.table + "?select=*&order=" + cfg.order).then(function(data) {
    genericData[section] = data || [];
    renderGeneric(section);
    var cnt = document.getElementById(section + "-cnt");
    if (cnt) cnt.textContent = "(" + (data||[]).length + ")";
    if (section === "badges") refreshBadgeDropdown();
    if (section === "cats") { refreshCatDropdowns(); renderExtras(); if (typeof render === "function" && produtos.length) render(); }
  }).catch(function(e) { toast("Erro ao carregar " + cfg.label + ": " + e.message, "err"); });
}

function refreshBadgeDropdown() {
  var sel = document.getElementById("fbdg");
  if (!sel) return;
  var current = sel.value;
  sel.innerHTML = '<option value="Nenhum">Nenhum</option>';
  var badges = (genericData.badges || []).filter(function(b) { return b.status === 'Ativo'; });
  badges.forEach(function(b) {
    var opt = document.createElement('option');
    opt.value = b.nome;
    opt.textContent = b.nome;
    sel.appendChild(opt);
  });
  sel.value = current || 'Nenhum';
}

function loadAllSections() {
  loadAll();
  Object.keys(TABLES).forEach(function(s) { loadGeneric(s); });
}

// Override loadAll call in doLogin
var origLoadAll = loadAll;
loadAll = function() {
  origLoadAll();
  Object.keys(TABLES).forEach(function(s) { loadGeneric(s); });
};

// ── RENDER ──
function renderGeneric(section) {
  var data = genericData[section] || [];
  if (section === "cats") data = categoriasEmArvore(data);
  var tb = document.getElementById(section + "-tbody");
  if (!tb) return;

  if (!data.length) {
    tb.innerHTML = '<tr><td colspan="6"><div class="es"><span>📭</span>Nenhum item cadastrado</div></td></tr>';
    return;
  }

  var rows = data.map(function(item) {
    var stc = item.status === "Ativo" || item.status === "Ativa" ? "sp-a" : "sp-o";
    var dc = item.status === "Ativo" || item.status === "Ativa" ? "sd-a" : "sd-o";
    var st = '<span class="sp ' + stc + '"><span class="sd ' + dc + '"></span>' + item.status + '</span>';
    var actions = '<div class="ac">'
      + '<button class="ab ab-e" onclick="editGeneric(\'' + section + '\',' + item.id + ')" title="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>'
      + '<button class="ab ab-d" onclick="delGeneric(\'' + section + '\',' + item.id + ')" title="Excluir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>'
      + '</div>';

    if (section === "cats") {
      var nomeCel = item.parent_id
        ? '<span style="color:var(--sf);margin:0 6px 0 14px">↳</span>' + esc(item.nome) + ' <span style="font-size:.7rem;color:var(--sf)">subcategoria</span>'
        : '<strong>' + esc(item.nome) + '</strong>';
      return '<tr><td>' + nomeCel + '</td><td>' + esc(item.descricao||'—') + '</td><td>' + (item.ordem||0) + '</td><td>' + st + '</td><td>' + actions + '</td></tr>';
    }
    if (section === "deps") {
      var stars = '★'.repeat(item.nota||5) + '☆'.repeat(5-(item.nota||5));
      var txt = esc((item.texto||'').substring(0,60)) + (item.texto && item.texto.length > 60 ? '...' : '');
      return '<tr><td><strong>' + esc(item.ocultar_nome ? 'Cliente anônimo' : item.nome_cliente) + '</strong></td><td style="max-width:200px">' + txt + '</td><td style="color:var(--a)">' + stars + '</td><td>' + esc(item.categoria||'—') + '</td><td>' + st + '</td><td>' + actions + '</td></tr>';
    }
    if (section === "gal") {
      var foto = item.foto_url ? '<img class="pt" src="' + esc(item.foto_url) + '" loading="lazy">' : '<div class="ptp">🖼️</div>';
      return '<tr><td>' + foto + '</td><td>' + esc(item.tema||'—') + '</td><td>' + esc(item.categoria||'—') + '</td><td>' + st + '</td><td>' + actions + '</td></tr>';
    }
    if (section === "faqs") {
      var perg = esc((item.pergunta||'').substring(0,50)) + (item.pergunta && item.pergunta.length > 50 ? '...' : '');
      return '<tr><td><strong>' + perg + '</strong></td><td>' + esc(item.categoria||'—') + '</td><td>' + (item.ordem||0) + '</td><td>' + st + '</td><td>' + actions + '</td></tr>';
    }
    if (section === "banners") {
      return '<tr><td><strong>' + esc(item.titulo||'—') + '</strong></td><td>' + esc(item.texto_botao||'—') + '</td><td>' + (item.ordem||0) + '</td><td>' + st + '</td><td>' + actions + '</td></tr>';
    }
    if (section === "badges") {
      var preview = '<span style="display:inline-block;padding:3px 10px;border-radius:100px;font-size:.72rem;font-weight:600;background:' + esc(item.cor_fundo||'#eee') + ';color:' + esc(item.cor_texto||'#333') + '">' + esc(item.nome) + '</span>';
      var cores = '<span style="display:inline-flex;align-items:center;gap:6px"><span style="width:16px;height:16px;border-radius:4px;display:inline-block;border:1px solid var(--ln);background:' + esc(item.cor_fundo||'') + '" title="Fundo"></span><span style="width:16px;height:16px;border-radius:4px;display:inline-block;border:1px solid var(--ln);background:' + esc(item.cor_texto||'') + '" title="Texto"></span></span>';
      return '<tr><td>' + preview + '</td><td><strong>' + esc(item.nome) + '</strong></td><td>' + cores + '</td><td>' + (item.ordem||0) + '</td><td>' + st + '</td><td>' + actions + '</td></tr>';
    }
    return '';
  });
  tb.innerHTML = rows.join('');
}

function esc(s) { 
  var d = document.createElement('div'); 
  d.textContent = s || ''; 
  return d.innerHTML; 
}

// ── MODAL FORMS ──
var FORM_FIELDS = {
  cats: [
    { id: 'g-nome', label: 'Nome da categoria *', type: 'text', field: 'nome', required: true },
    { id: 'g-desc', label: 'Descrição curta', type: 'textarea', field: 'descricao' },
    { id: 'g-pai', label: 'É subcategoria de', type: 'select', field: 'parent_id', optsFn: opcoesCategoriaPai },
    { id: 'g-ordem', label: 'Ordem', type: 'number', field: 'ordem', def: '0' },
    { id: 'g-status', label: 'Status', type: 'select', field: 'status', opts: ['Ativa','Oculta'], def: 'Ativa' }
  ],
  deps: [
    { id: 'g-nome', label: 'Nome do cliente *', type: 'text', field: 'nome_cliente', required: true },
    { id: 'g-texto', label: 'Texto do depoimento *', type: 'textarea', field: 'texto', required: true },
    { id: 'g-nota', label: 'Nota (1-5)', type: 'select', field: 'nota', opts: ['5','4','3','2','1'], def: '5' },
    { id: 'g-cat', label: 'Categoria', type: 'select', field: 'categoria', opts: ['','Aniversários','Presentes','Empresas','Impressão 3D','Datas Comemorativas'] },
    { id: 'g-tipo', label: 'Tipo de pedido', type: 'text', field: 'tipo_pedido' },
    { id: 'g-ocultar', label: 'Ocultar nome do cliente', type: 'checkbox', field: 'ocultar_nome' },
    { id: 'g-destaque', label: 'Destaque na home', type: 'checkbox', field: 'destaque' },
    { id: 'g-status', label: 'Status', type: 'select', field: 'status', opts: ['Ativo','Oculto'], def: 'Ativo' }
  ],
  gal: [
    { id: 'g-foto', label: 'Foto do trabalho *', type: 'file', field: 'foto_url' },
    { id: 'g-tema', label: 'Tema', type: 'text', field: 'tema' },
    { id: 'g-tipo', label: 'Tipo de produto', type: 'text', field: 'tipo_produto' },
    { id: 'g-cat', label: 'Categoria', type: 'select', field: 'categoria', opts: ['','Lembrancinhas','Impressão 3D','Mimos','Presentes','Empresas'] },
    { id: 'g-desc', label: 'Descrição curta', type: 'textarea', field: 'descricao' },
    { id: 'g-destaque', label: 'Destaque na home', type: 'checkbox', field: 'destaque' },
    { id: 'g-ordem', label: 'Ordem', type: 'number', field: 'ordem', def: '0' },
    { id: 'g-status', label: 'Status', type: 'select', field: 'status', opts: ['Ativo','Oculto'], def: 'Ativo' }
  ],
  faqs: [
    { id: 'g-perg', label: 'Pergunta *', type: 'text', field: 'pergunta', required: true },
    { id: 'g-resp', label: 'Resposta *', type: 'textarea', field: 'resposta', required: true },
    { id: 'g-cat', label: 'Categoria', type: 'select', field: 'categoria', opts: ['','Geral','Produtos','Entrega','Pagamento','Prazos'] },
    { id: 'g-ordem', label: 'Ordem', type: 'number', field: 'ordem', def: '0' },
    { id: 'g-status', label: 'Status', type: 'select', field: 'status', opts: ['Ativo','Oculto'], def: 'Ativo' }
  ],
  banners: [
    { id: 'g-titulo', label: 'Título', type: 'text', field: 'titulo' },
    { id: 'g-sub', label: 'Subtítulo', type: 'text', field: 'subtitulo' },
    { id: 'g-foto', label: 'Imagem', type: 'file', field: 'imagem_url' },
    { id: 'g-btntxt', label: 'Texto do botão', type: 'text', field: 'texto_botao', def: 'Fazer orçamento' },
    { id: 'g-btnlink', label: 'Link do botão', type: 'text', field: 'link_botao' },
    { id: 'g-ordem', label: 'Ordem', type: 'number', field: 'ordem', def: '0' },
    { id: 'g-status', label: 'Status', type: 'select', field: 'status', opts: ['Ativo','Oculto'], def: 'Ativo' }
  ],
  badges: [
    { id: 'g-nome', label: 'Nome do badge *', type: 'text', field: 'nome', required: true },
    { id: 'g-corfundo', label: 'Cor de fundo', type: 'color', field: 'cor_fundo', def: '#fff8ee' },
    { id: 'g-cortexto', label: 'Cor do texto', type: 'color', field: 'cor_texto', def: '#92400e' },
    { id: 'g-ordem', label: 'Ordem', type: 'number', field: 'ordem', def: '0' },
    { id: 'g-status', label: 'Status', type: 'select', field: 'status', opts: ['Ativo','Oculto'], def: 'Ativo' }
  ]
};

// ════════════════════════════════════════════════════
// CATEGORIAS E SUBCATEGORIAS (fonte única: tabela "categorias")
// ════════════════════════════════════════════════════
function catsPrincipais() {
  return (genericData.cats||[]).filter(function(c){ return !c.parent_id; })
    .sort(function(a,b){ return (a.ordem||0)-(b.ordem||0) || (a.nome||'').localeCompare(b.nome||''); });
}
function subcatsDe(nomeCat) {
  var mae = catsPrincipais().find(function(c){ return c.nome === nomeCat; });
  if (!mae) return [];
  return (genericData.cats||[]).filter(function(c){ return c.parent_id == mae.id; })
    .sort(function(a,b){ return (a.ordem||0)-(b.ordem||0) || (a.nome||'').localeCompare(b.nome||''); });
}
function categoriasEmArvore(lista) {
  var out = [];
  var maes = lista.filter(function(c){ return !c.parent_id; });
  maes.forEach(function(m) {
    out.push(m);
    lista.filter(function(c){ return c.parent_id == m.id; }).forEach(function(f){ out.push(f); });
  });
  lista.forEach(function(c){ if (out.indexOf(c) < 0) out.push(c); }); // órfãs (segurança)
  return out;
}
function opcoesCategoriaPai(item) {
  var opts = [{ v: '', l: '— Nenhuma (categoria principal)' }];
  // categoria que já tem subcategorias não pode virar subcategoria (só 2 níveis)
  var temFilhas = item && (genericData.cats||[]).some(function(c){ return c.parent_id == item.id; });
  if (temFilhas) return opts;
  catsPrincipais().forEach(function(c) {
    if (!item || c.id != item.id) opts.push({ v: c.id, l: c.nome });
  });
  return opts;
}
function preencherSelect(sel, opcoes, valor, extraSeFaltar) {
  if (!sel) return;
  while (sel.options.length > 1) sel.remove(1);
  opcoes.forEach(function(n) {
    var o = document.createElement('option'); o.value = n; o.textContent = n; sel.appendChild(o);
  });
  if (valor && opcoes.indexOf(valor) < 0 && extraSeFaltar) {
    var o2 = document.createElement('option'); o2.value = valor; o2.textContent = valor + ' ' + extraSeFaltar; sel.appendChild(o2);
  }
  sel.value = valor || '';
}
function refreshCatDropdowns() {
  var nomes = catsPrincipais().map(function(c){ return c.nome; });
  var fc = document.getElementById('fc');
  preencherSelect(fc, nomes, fc ? fc.value : '', null);
  var fcat = document.getElementById('fcat');
  var atual = fcat ? fcat.value : '';
  preencherSelect(fcat, nomes, atual, '(não existe mais)');
  atualizarSubcats(document.getElementById('fsubcat') ? document.getElementById('fsubcat').value : '');
}
function atualizarSubcats(valor) {
  var cat = (document.getElementById('fcat')||{}).value || '';
  var nomes = subcatsDe(cat).map(function(c){ return c.nome; });
  preencherSelect(document.getElementById('fsubcat'), nomes, valor, '(não cadastrada)');
}
function setCategoriaProduto(cat, sub) {
  var nomes = catsPrincipais().map(function(c){ return c.nome; });
  preencherSelect(document.getElementById('fcat'), nomes, cat, '(não existe mais)');
  atualizarSubcats(sub);
}
// ── "Também aparece em": categorias/subcategorias extras do produto ──
var _extrasSel = [];  // [{categoria, subcategoria}]
function chaveExtra(c, sub) { return c + '||' + (sub || ''); }
function lerExtrasProduto(p) {
  var x = p && p.categorias_extras;
  if (typeof x === 'string') { try { x = JSON.parse(x); } catch(e) { x = []; } }
  return Array.isArray(x) ? x.filter(function(e){ return e && e.categoria; }) : [];
}
function renderExtras() {
  var box = document.getElementById('fextras');
  if (!box) return;
  // guarda o que está marcado agora antes de redesenhar
  box.querySelectorAll('input[type=checkbox]:not(:disabled)').forEach(function(cb) {
    var k = cb.value, i = _extrasSel.findIndex(function(e){ return chaveExtra(e.categoria, e.subcategoria) === k; });
    if (cb.checked && i < 0) { var pr = k.split('||'); _extrasSel.push({ categoria: pr[0], subcategoria: pr[1] || null }); }
    if (!cb.checked && i >= 0) _extrasSel.splice(i, 1);
  });
  var principal = chaveExtra((document.getElementById('fcat')||{}).value || '', (document.getElementById('fsubcat')||{}).value || '');
  while (box.firstChild) box.removeChild(box.firstChild);
  var maes = catsPrincipais();
  if (!maes.length) { box.textContent = 'Cadastre categorias na aba Categorias.'; return; }
  function opcao(cat, sub, rotulo, ehSub) {
    var k = chaveExtra(cat, sub);
    var lab = document.createElement('label');
    lab.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:100px;font-size:.8rem;cursor:pointer;border:1px solid var(--ln);background:#fff;' + (ehSub ? 'margin-left:4px;' : 'font-weight:600;');
    var cb = document.createElement('input');
    cb.type = 'checkbox'; cb.value = k; cb.style.cssText = 'width:15px;height:15px;accent-color:var(--t)';
    var ehPrincipal = (k === principal);
    cb.checked = ehPrincipal || _extrasSel.some(function(e){ return chaveExtra(e.categoria, e.subcategoria) === k; });
    cb.disabled = ehPrincipal;
    lab.title = ehPrincipal ? 'Categoria principal do produto' : '';
    if (ehPrincipal) lab.style.opacity = '.55';
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(rotulo));
    box.appendChild(lab);
  }
  maes.forEach(function(m) {
    opcao(m.nome, '', m.nome, false);
    subcatsDe(m.nome).forEach(function(sc) { opcao(m.nome, sc.nome, '↳ ' + sc.nome, true); });
    var br = document.createElement('div'); br.style.cssText = 'flex-basis:100%;height:0'; box.appendChild(br);
  });
}
function setExtrasProduto(p) { _extrasSel = lerExtrasProduto(p).map(function(e){ return { categoria: e.categoria, subcategoria: e.subcategoria || null }; }); var box = document.getElementById('fextras'); if (box) while (box.firstChild) box.removeChild(box.firstChild); renderExtras(); }
function coletarExtras() {
  renderExtras(); // sincroniza _extrasSel com a tela
  var principal = chaveExtra((document.getElementById('fcat')||{}).value || '', (document.getElementById('fsubcat')||{}).value || '');
  return _extrasSel.filter(function(e){ return chaveExtra(e.categoria, e.subcategoria) !== principal; });
}
// Atualiza "categorias_extras" de todos os produtos com uma função de troca (uso: renomear/excluir categoria)
function ajustarExtrasProdutos(fn) {
  var reqs = [];
  produtos.forEach(function(p) {
    var antes = lerExtrasProduto(p);
    if (!antes.length) return;
    var depois = [];
    antes.forEach(function(e) { var r = fn({ categoria: e.categoria, subcategoria: e.subcategoria || null }); if (r) depois.push(r); });
    if (JSON.stringify(antes) !== JSON.stringify(depois))
      reqs.push(supa("PATCH", "produtos?id=eq." + p.id, { categorias_extras: depois }));
  });
  return Promise.all(reqs);
}

// Renomeou/moveu uma categoria? Atualiza os produtos que usam ela.
function propagarCategoria(antes, depois) {
  var enc = encodeURIComponent;
  var cats = genericData.cats || [];
  var paiAntes = antes.parent_id ? cats.find(function(c){ return c.id == antes.parent_id; }) : null;
  var paiDepois = depois.parent_id ? cats.find(function(c){ return c.id == depois.parent_id; }) : null;
  var reqs = [];
  if (!paiAntes && !paiDepois && antes.nome !== depois.nome) {
    // categoria principal renomeada
    reqs.push(supa("PATCH", "produtos?categoria=eq." + enc(antes.nome), { categoria: depois.nome }));
  } else if (paiAntes && paiDepois && (antes.nome !== depois.nome || paiAntes.id !== paiDepois.id)) {
    // subcategoria renomeada e/ou movida para outra categoria
    reqs.push(supa("PATCH", "produtos?categoria=eq." + enc(paiAntes.nome) + "&subcategoria=eq." + enc(antes.nome),
      { categoria: paiDepois.nome, subcategoria: depois.nome }));
  }
  if (!paiAntes && !paiDepois && antes.nome !== depois.nome) {
    reqs.push(ajustarExtrasProdutos(function(e){ if (e.categoria === antes.nome) e.categoria = depois.nome; return e; }));
  } else if (paiAntes && paiDepois && (antes.nome !== depois.nome || paiAntes.id !== paiDepois.id)) {
    reqs.push(ajustarExtrasProdutos(function(e){
      if (e.categoria === paiAntes.nome && e.subcategoria === antes.nome) { e.categoria = paiDepois.nome; e.subcategoria = depois.nome; }
      return e;
    }));
  }
  if (!reqs.length) return Promise.resolve();
  return Promise.all(reqs).then(function() { if (typeof loadAll === "function") loadAll(); });
}

function openModal(section, editId) {
  currentSection = section;
  currentEditId = editId || "";
  genFotoFile = null;
  genFotoB64 = "";
  genPrintFile = null;
  genPrintB64 = "";

  var cfg = TABLES[section];
  var fields = FORM_FIELDS[section];
  if (!fields) return;

  var item = editId ? (genericData[section]||[]).find(function(x){return x.id==editId}) : null;
  document.getElementById("mt-gen").textContent = (item ? "Editar " : "Novo ") + cfg.label;

  var html = '<div class="fg">';
  fields.forEach(function(f) {
    var val = item ? (item[f.field] || '') : (f.def || '');
    var fw = (f.type === 'textarea' || f.type === 'file') ? ' fw' : '';
    html += '<div class="fi' + fw + '"><label class="fl">' + f.label + '</label>';

    if (f.type === 'text') {
      html += '<input class="fx" id="' + f.id + '" value="' + esc(val+'') + '">';
    } else if (f.type === 'number') {
      html += '<input class="fx" id="' + f.id + '" type="number" value="' + (val||0) + '">';
    } else if (f.type === 'textarea') {
      html += '<textarea class="fx ft" id="' + f.id + '">' + esc(val+'') + '</textarea>';
    } else if (f.type === 'select') {
      html += '<select class="fx" id="' + f.id + '">';
      var opcoes = f.optsFn ? f.optsFn(item) : (f.opts||[]);
      opcoes.forEach(function(o) {
        var ov = (o && typeof o === 'object') ? o.v : o;
        var ol = (o && typeof o === 'object') ? o.l : o;
        var sel = (val+'' === ov+'') ? ' selected' : '';
        html += '<option value="' + esc(ov+'') + '"' + sel + '>' + esc(ol||'Selecione...') + '</option>';
      });
      html += '</select>';
    } else if (f.type === 'checkbox') {
      var chk = val ? ' checked' : '';
      html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" id="' + f.id + '"' + chk + ' style="width:18px;height:18px;accent-color:var(--t)"> Sim</label>';
    } else if (f.type === 'color') {
      html += '<div style="display:flex;align-items:center;gap:10px"><input type="color" id="' + f.id + '" value="' + esc(val+'') + '" style="width:48px;height:36px;border:1.5px solid var(--ln);border-radius:8px;cursor:pointer;padding:2px"><input type="text" id="' + f.id + '-hex" class="fx" value="' + esc(val+'') + '" style="width:100px;font-size:.8rem" oninput="document.getElementById(\'' + f.id + '\').value=this.value" onchange="document.getElementById(\'' + f.id + '\').value=this.value"><span class="bp" id="' + f.id + '-preview" style="background:' + esc(val+'') + ';color:' + (f.field === 'cor_fundo' ? '#333' : '#fff') + '">Preview</span></div>';
    } else if (f.type === 'file') {
      var prevSrc = val ? val : '';
      html += '<div class="fu" onclick="document.getElementById(\'' + f.id + '-inp\').click()">';
      html += '<img id="' + f.id + '-prev" src="' + prevSrc + '" style="' + (prevSrc ? 'display:block;' : 'display:none;') + 'width:100%;max-height:120px;object-fit:cover;border-radius:8px;margin-bottom:6px">';
      html += '<div id="' + f.id + '-ui" style="' + (prevSrc ? 'display:none' : '') + '"><div style="font-size:1.5rem;margin-bottom:6px">📷</div><p style="font-size:.8rem;color:var(--sf)">Clique para selecionar</p></div>';
      html += '<input type="file" id="' + f.id + '-inp" accept="image/jpeg,image/png,image/webp" onchange="handleGenFile(this,\'' + f.id + '\')" style="display:none">';
      html += '</div>';
    }
    html += '</div>';
  });
  html += '</div>';

  document.getElementById("mb-gen").innerHTML = html;
  document.getElementById("mo-gen").classList.add("op");
}

function closeGenModal() {
  document.getElementById("mo-gen").classList.remove("op");
}

function handleGenFile(input, fieldId) {
  var file = input.files[0];
  if (!file) return;
  if (file.size > 20*1024*1024) { toast("Foto muito grande (max 20MB)","err"); return; }
  var allowed = ['image/jpeg','image/png','image/webp'];
  if (allowed.indexOf(file.type) < 0) { toast("Formato inválido. Use JPG, PNG ou WEBP.","err"); return; }
  genFotoFile = file;
  var reader = new FileReader();
  reader.onload = function(e) {
    genFotoB64 = e.target.result;
    var prev = document.getElementById(fieldId + '-prev');
    var ui = document.getElementById(fieldId + '-ui');
    if (prev) { prev.src = genFotoB64; prev.style.display = 'block'; }
    if (ui) ui.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function uploadGenFoto(folder) {
  return new Promise(function(resolve, reject) {
    if (!genFotoFile) { resolve(genFotoB64 || ""); return; }
    subirFoto(genFotoFile, folder).then(resolve, reject);
  });
}

var _saveLock = false;
function saveGeneric() {
  if (_saveLock) return;
  _saveLock = true;
  setTimeout(function() { _saveLock = false; }, 2000);
  var cfg = TABLES[currentSection];
  var fields = FORM_FIELDS[currentSection];
  if (!cfg || !fields) return;

  var obj = {};
  var hasError = false;

  fields.forEach(function(f) {
    if (f.type === 'file') return; // handled separately
    var el = document.getElementById(f.id);
    if (!el) return;
    var val;
    if (f.type === 'checkbox') val = el.checked;
    else if (f.type === 'number') val = parseInt(el.value) || 0;
    else if (f.type === 'color') val = (el.value || '').trim();
    else val = (el.value || '').trim();

    if (f.required && !val) { toast("Preencha: " + f.label.replace(' *',''), "err"); hasError = true; }
    obj[f.field] = val;
  });

  if (hasError) return;

  var antes = null;
  if (currentSection === "cats") {
    obj.parent_id = obj.parent_id ? parseInt(obj.parent_id) : null;
    antes = currentEditId ? (genericData.cats||[]).find(function(x){ return x.id == currentEditId; }) : null;
    var dup = (genericData.cats||[]).some(function(x){
      return x.id != currentEditId && (x.parent_id||null) === obj.parent_id && (x.nome||'').toLowerCase() === (obj.nome||'').toLowerCase();
    });
    if (dup) { toast("Já existe uma categoria com esse nome nesse nível.", "err"); return; }
  }

  var svBtn = document.getElementById("gen-save");
  svBtn.textContent = "Salvando...";
  svBtn.disabled = true;

  // Check if there's a file field
  var hasFile = fields.some(function(f){ return f.type === 'file'; });
  var fileField = fields.find(function(f){ return f.type === 'file'; });

  var uploadPromise = hasFile && genFotoFile ? uploadGenFoto(cfg.table) : Promise.resolve(genFotoB64 || "");

  uploadPromise.then(function(url) {
    if (fileField && url) obj[fileField.field] = url;
    if (fileField && !url && !currentEditId) {
      // For galeria, foto is required
      if (currentSection === 'gal') { toast("Selecione uma foto.", "err"); return Promise.reject("no foto"); }
    }

    if (currentEditId) {
      return supa("PATCH", cfg.table + "?id=eq." + currentEditId, obj).then(function() {
        if (currentSection === "cats" && antes) return propagarCategoria(antes, obj);
      }).then(function() {
        toast(cfg.label + " atualizado!", "ok");
        closeGenModal();
        loadGeneric(currentSection);
      });
    } else {
      return supa("POST", cfg.table, obj).then(function() {
        toast(cfg.label + " adicionado!", "ok");
        closeGenModal();
        loadGeneric(currentSection);
      });
    }
  }).catch(function(e) {
    if (e !== "no foto") toast("Erro: " + (e.message||e), "err");
  }).finally(function() {
    svBtn.textContent = "Salvar";
    svBtn.disabled = false;
    genFotoFile = null;
  });
}

function editGeneric(section, id) {
  openModal(section, id);
}

function delGeneric(section, id) {
  var cfg = TABLES[section];
  if (section === "cats") {
    var c = (genericData.cats||[]).find(function(x){ return x.id == id; });
    if (!c) return;
    var filhas = (genericData.cats||[]).filter(function(x){ return x.parent_id == id; });
    if (filhas.length) { toast("Essa categoria tem subcategorias. Exclua ou mova as subcategorias primeiro.", "err"); return; }
    var pai = c.parent_id ? (genericData.cats||[]).find(function(x){ return x.id == c.parent_id; }) : null;
    var usados = produtos.filter(function(p){
      return pai ? (p.categoria === pai.nome && p.subcategoria === c.nome) : p.categoria === c.nome;
    }).length;
    var emExtras = produtos.filter(function(p){
      return lerExtrasProduto(p).some(function(e){ return pai ? (e.categoria === pai.nome && e.subcategoria === c.nome) : e.categoria === c.nome; });
    }).length;
    var msg = "Excluir \"" + c.nome + "\"?";
    if (usados) msg += "\n\n" + usados + " produto(s) usam essa " + (pai ? "subcategoria" : "categoria") + (pai ? " e ficarão sem subcategoria." : " e vão SUMIR do site até você trocar a categoria deles.");
    if (emExtras) msg += "\n\nTambém será retirada do campo \"Também aparece em\" de " + emExtras + " produto(s).";
    if (!confirm(msg)) return;
    supa("DELETE", cfg.table + "?id=eq." + id).then(function() {
      if (emExtras) return ajustarExtrasProdutos(function(e){
        if (pai ? (e.categoria === pai.nome && e.subcategoria === c.nome) : e.categoria === c.nome) return null;
        return e;
      });
    }).then(function() {
      // subcategoria excluída: tira ela dos produtos que usavam
      if (pai && usados) return supa("PATCH", "produtos?categoria=eq." + encodeURIComponent(pai.nome) + "&subcategoria=eq." + encodeURIComponent(c.nome), { subcategoria: null }).then(function(){ loadAll(); });
    }).then(function() {
      toast("Excluído.", "ok");
      loadGeneric(section);
    }).catch(function(e) { toast("Erro: " + e.message, "err"); });
    return;
  }
  if (!confirm("Excluir este " + cfg.label.toLowerCase() + "?")) return;
  supa("DELETE", cfg.table + "?id=eq." + id).then(function() {
    toast("Excluído.", "ok");
    loadGeneric(section);
  }).catch(function(e) { toast("Erro: " + e.message, "err"); });
}

// ════════════════════════════════════════════════════
// CALENDÁRIO COMERCIAL — datas quentes (enxuto)
// ════════════════════════════════════════════════════

TABLES['cal'] = { table: "calendario", label: "Data comemorativa", order: "id.asc" };

FORM_FIELDS['cal'] = [
  { id: 'g-nome', label: 'Nome da data *', type: 'text', field: 'nome', required: true },
  { id: 'g-data', label: 'Data (dia/mês, ex: 12/06) *', type: 'text', field: 'data_evento', required: true },
  { id: 'g-regra', label: 'A data muda todo ano?', type: 'select', field: 'regra_data', opts: [
    { v: '', l: 'Não, é data fixa' },
    { v: 'dom:05:2', l: '2º domingo de maio (Dia das Mães)' },
    { v: 'dom:08:2', l: '2º domingo de agosto (Dia dos Pais)' },
    { v: 'pascoa:0', l: 'Páscoa' },
    { v: 'bf', l: 'Black Friday' }
  ] },
  { id: 'g-potencial', label: 'Potencial de venda', type: 'select', field: 'potencial', opts: ['Baixo','Médio','Alto','Muito alto'], def: 'Médio' },
  { id: 'g-linha', label: 'Linha de produto', type: 'select', field: 'linha_produto', opts: [
    { v: '', l: 'Não definida' }, 'Papelaria', 'Impressão 3D', 'Acrílico', 'Caneca', 'Kit', 'Corporativo', 'Várias'
  ] },
  { id: 'g-produtos', label: 'Ideias de produto ou kit', type: 'textarea', field: 'produtos_sugeridos' },
  { id: 'g-dplan', label: 'Começar a preparar (dias antes)', type: 'number', field: 'dias_planejamento', def: '45' },
  { id: 'g-ddiv', label: 'Começar a divulgar (dias antes)', type: 'number', field: 'dias_divulgacao', def: '30' },
  { id: 'g-denc', label: 'Encerrar pedidos (dias antes)', type: 'number', field: 'dias_encerrar_pedidos', def: '7' },
  { id: 'g-wpp', label: 'Mensagem de WhatsApp (opcional)', type: 'textarea', field: 'msg_whatsapp' },
  { id: 'g-obs', label: 'Observações', type: 'textarea', field: 'observacoes' }
];

var calView = 'next';
var CAL_DIAS_SEM = ['dom','seg','ter','qua','qui','sex','sáb'];

// ── Cálculo de datas ──
function calPascoa(ano) {
  var a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  var d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  var g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  var i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  var m = Math.floor((a + 11 * h + 22 * l) / 451);
  var mes = Math.floor((h + l - 7 * m + 114) / 31);
  var dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function calNesimoDomingo(ano, mes, n) {
  var primeiro = (7 - new Date(ano, mes - 1, 1).getDay()) % 7 + 1;
  return new Date(ano, mes - 1, primeiro + (n - 1) * 7);
}

function calBlackFriday(ano) {
  var primeiraQuinta = (4 - new Date(ano, 10, 1).getDay() + 7) % 7 + 1;
  return new Date(ano, 10, primeiraQuinta + 21 + 1);
}

function calDataNoAno(item, ano) {
  var r = (item.regra_data || '').split(':');
  if (r[0] === 'pascoa') { var p = calPascoa(ano); return new Date(ano, p.getMonth(), p.getDate() + (parseInt(r[1]) || 0)); }
  if (r[0] === 'dom') return calNesimoDomingo(ano, parseInt(r[1]), parseInt(r[2]));
  if (r[0] === 'bf') return calBlackFriday(ano);
  var m = (item.data_evento || '').trim().match(/^(\d{1,2})\/(\d{1,2})/);
  if (m) return new Date(ano, parseInt(m[2]) - 1, parseInt(m[1]));
  return null;
}

function calHoje() {
  var n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

function calProxima(item, hoje) {
  var d = calDataNoAno(item, hoje.getFullYear());
  if (d && d < hoje) d = calDataNoAno(item, hoje.getFullYear() + 1);
  return d;
}

function calSoma(d, dias) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dias); }
function calDiasEntre(a, b) { return Math.round((b - a) / 86400000); }
function calFmt(d) { return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2); }

function calPrazos(item, data, hoje) {
  var prep = calSoma(data, -(parseInt(item.dias_planejamento) || 0));
  var div = calSoma(data, -(parseInt(item.dias_divulgacao) || 0));
  var enc = calSoma(data, -(parseInt(item.dias_encerrar_pedidos) || 0));
  var etapa = hoje >= enc ? 'enc' : hoje >= div ? 'div' : hoje >= prep ? 'prep' : 'longe';
  return { prep: prep, div: div, enc: enc, etapa: etapa };
}

var CAL_ETAPA_TXT = { enc: 'Pedidos encerrados', div: 'Hora de divulgar', prep: 'Hora de preparar', longe: 'Ainda longe' };
var CAL_POT_CLASS = { 'Muito alto': 'bp-n', 'Alto': 'bp-p', 'Médio': 'bp-c', 'Baixo': 'bp-c' };

// ── Troca de visão ──
var origRenderGen = renderGeneric;
renderGeneric = function(section) {
  if (section === 'cal') { renderCal(); return; }
  origRenderGen(section);
};

function setCalView(view) {
  calView = view;
  ['next', 'all'].forEach(function(v) {
    document.getElementById('cv-' + v).classList.toggle('active', v === view);
    document.getElementById('cal-view-' + v).style.display = v === view ? 'block' : 'none';
  });
  renderCal();
}

function renderCal() {
  var data = (genericData['cal'] || []).filter(function(i) { return i.status !== 'Cancelada'; });
  var hoje = calHoje();
  if (calView === 'next') renderCalProximas(data, hoje);
  else renderCalAno(data, hoje);
}

// ── Visão "Próximas datas" ──
function renderCalProximas(data, hoje) {
  var box = document.getElementById('cal-cards');
  if (!box) return;
  var lista = data.map(function(i) { return { item: i, data: calProxima(i, hoje) }; })
    .filter(function(x) { return x.data; })
    .sort(function(a, b) { return a.data - b.data; });

  if (!lista.length) {
    box.innerHTML = '<div class="es"><span>📅</span>Nenhuma data cadastrada</div>';
    return;
  }

  var perto = lista.filter(function(x) { return calDiasEntre(hoje, x.data) <= 120; });
  if (perto.length < 3) perto = lista.slice(0, 3);

  box.innerHTML = perto.map(function(x) {
    var it = x.item, d = x.data;
    var dias = calDiasEntre(hoje, d);
    var quando = dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : 'em ' + dias + ' dias';
    var pz = calPrazos(it, d, hoje);
    var det = '';
    if (it.produtos_sugeridos) det += '<p><strong>Ideias:</strong> ' + esc(it.produtos_sugeridos) + '</p>';
    if (it.msg_whatsapp) det += '<p><strong>WhatsApp:</strong> ' + esc(it.msg_whatsapp) + '</p>';
    if (it.observacoes) det += '<p><strong>Obs.:</strong> ' + esc(it.observacoes) + '</p>';
    var btnDet = det ? '<button class="cal-btn" data-cal="det" data-id="' + it.id + '">Detalhes</button>' : '';
    return '<div class="cal-card cal-etapa-' + pz.etapa + '">'
      + '<div class="cal-card-top"><div><div class="cal-card-nome">' + esc(it.nome) + '</div>'
      + '<div class="cal-card-data">' + calFmt(d) + ' · ' + CAL_DIAS_SEM[d.getDay()] + ' · ' + quando + '</div></div>'
      + '<span class="bp ' + (CAL_POT_CLASS[it.potencial] || 'bp-c') + '">' + esc(it.potencial || '') + '</span></div>'
      + (it.linha_produto ? '<div class="cal-card-linha">' + esc(it.linha_produto) + '</div>' : '')
      + '<div class="cal-card-etapa">' + CAL_ETAPA_TXT[pz.etapa] + '</div>'
      + '<div class="cal-prazos"><span>Preparar a partir de <b>' + calFmt(pz.prep) + '</b></span>'
      + '<span>Divulgar a partir de <b>' + calFmt(pz.div) + '</b></span>'
      + '<span>Pedidos até <b>' + calFmt(pz.enc) + '</b></span></div>'
      + '<div class="cal-card-acoes">' + btnDet
      + '<button class="cal-btn" data-cal="edit" data-id="' + it.id + '">Editar</button>'
      + '<button class="cal-btn cal-btn-del" data-cal="del" data-id="' + it.id + '">Excluir</button></div>'
      + (det ? '<div class="cal-det" id="cal-det-' + it.id + '" style="display:none">' + det + '</div>' : '')
      + '</div>';
  }).join('');
}

// ── Visão "Ano todo" ──
function renderCalAno(data, hoje) {
  var tb = document.getElementById('cal-tbody');
  if (!tb) return;
  var ano = hoje.getFullYear();
  var lista = data.map(function(i) { return { item: i, data: calDataNoAno(i, ano) }; })
    .sort(function(a, b) {
      if (!a.data) return 1;
      if (!b.data) return -1;
      return a.data - b.data;
    });

  if (!lista.length) {
    tb.innerHTML = '<tr><td colspan="6"><div class="es"><span>📅</span>Nenhuma data cadastrada</div></td></tr>';
    return;
  }

  tb.innerHTML = lista.map(function(x) {
    var it = x.item, d = x.data;
    var enc = d ? calFmt(calSoma(d, -(parseInt(it.dias_encerrar_pedidos) || 0))) : '—';
    return '<tr>'
      + '<td style="white-space:nowrap"><strong>' + (d ? calFmt(d) : esc(it.data_evento || '—')) + '</strong></td>'
      + '<td><strong>' + esc(it.nome) + '</strong></td>'
      + '<td><span class="bp ' + (CAL_POT_CLASS[it.potencial] || 'bp-c') + '">' + esc(it.potencial || '') + '</span></td>'
      + '<td>' + esc(it.linha_produto || '—') + '</td>'
      + '<td>' + enc + '</td>'
      + '<td><div class="ac">'
      + '<button class="cal-btn" data-cal="edit" data-id="' + it.id + '">Editar</button>'
      + '<button class="cal-btn cal-btn-del" data-cal="del" data-id="' + it.id + '">Excluir</button>'
      + '</div></td></tr>';
  }).join('');
}

// Cliques nos botões do calendário (sem onclick inline)
document.addEventListener('click', function(e) {
  var el = e.target.closest ? e.target.closest('[data-cal]') : null;
  if (!el) return;
  var acao = el.getAttribute('data-cal');
  var id = el.getAttribute('data-id');
  if (acao === 'edit') editGeneric('cal', id);
  else if (acao === 'del') delGeneric('cal', id);
  else if (acao === 'det') {
    var box = document.getElementById('cal-det-' + id);
    if (box) box.style.display = box.style.display === 'block' ? 'none' : 'block';
  }
});


// ============================================================
// FAIXAS DE PREÇO POR QUANTIDADE (catálogo)
// ============================================================
// Toggle da caixa de faixas
document.addEventListener("change", function(e){
  if (e.target && e.target.id === "ffx_on") {
    var box = document.getElementById("ffx_box");
    if (box) box.style.display = e.target.checked ? "block" : "none";
  }
});

// Lê os campos do form e monta o objeto JSON (ou null se não usar)
function montarPrecosFaixa() {
  var on = document.getElementById("ffx_on");
  if (!on || !on.checked) return null;
  var num = function(id){ var v=(document.getElementById(id).value||"").trim().replace(",","."); return v?parseFloat(v):null; };
  var txt = function(id){ return (document.getElementById(id).value||"").trim().replace(",","."); };
  var faixas = [];
  [["ffx_q1","ffx_p1"],["ffx_q2","ffx_p2"],["ffx_q3","ffx_p3"]].forEach(function(par){
    var ate = num(par[0]); var preco = txt(par[1]);
    if (ate && preco) faixas.push({ate: ate, preco: preco});
  });
  var minimo = num("ffx_min");
  var consulta = document.getElementById("ffx_consulta");
  // se não preencheu nada útil, não salva
  if (!faixas.length && !minimo) return null;
  return {
    ativo: true,
    pedido_minimo: minimo || null,
    faixas: faixas,
    acima_sob_consulta: consulta ? consulta.checked : false
  };
}

// Preenche o form ao editar um produto
function carregarPrecosFaixa(p) {
  var pf = p && p.precos_faixa ? p.precos_faixa : null;
  if (typeof pf === "string") { try { pf = JSON.parse(pf); } catch(e){ pf=null; } }
  var on = document.getElementById("ffx_on");
  var box = document.getElementById("ffx_box");
  var set = function(id,v){ var el=document.getElementById(id); if(el) el.value = (v==null?"":String(v).replace(".",",")); };
  // limpa
  ["ffx_min","ffx_q1","ffx_p1","ffx_q2","ffx_p2","ffx_q3","ffx_p3"].forEach(function(id){ set(id,""); });
  if (document.getElementById("ffx_consulta")) document.getElementById("ffx_consulta").checked = false;

  if (pf && pf.ativo) {
    if(on) on.checked = true;
    if(box) box.style.display = "block";
    set("ffx_min", pf.pedido_minimo);
    var f = pf.faixas || [];
    if (f[0]) { set("ffx_q1", f[0].ate); set("ffx_p1", f[0].preco); }
    if (f[1]) { set("ffx_q2", f[1].ate); set("ffx_p2", f[1].preco); }
    if (f[2]) { set("ffx_q3", f[2].ate); set("ffx_p3", f[2].preco); }
    if (document.getElementById("ffx_consulta")) document.getElementById("ffx_consulta").checked = !!pf.acima_sob_consulta;
  } else {
    if(on) on.checked = false;
    if(box) box.style.display = "none";
  }
}


// ════════════════════════════════════════════════════
// TAREFAS PENDENTES (tabela privada "tarefas": só quem está logado lê e escreve)
// ════════════════════════════════════════════════════
TABLES['tar'] = { table: "tarefas", label: "Tarefa", order: "id.asc" };

var TAR_GRUPOS = ['Natal', 'Catálogo', 'Marca e site', 'WhatsApp', 'Planejamento', 'Técnico', 'Segurança', 'Organização'];
var TAR_PESO = { 'Alta': 0, 'Média': 1, 'Baixa': 2 };
var TAR_PRIO_CLASS = { 'Alta': 'bp-h', 'Média': 'bp-n', 'Baixa': 'bp-c' };
var tarFiltro = 'abertas';
var tarGrupo = '';

FORM_FIELDS['tar'] = [
  { id: 'g-titulo', label: 'Tarefa *', type: 'text', field: 'titulo', required: true },
  { id: 'g-grupo', label: 'Grupo', type: 'select', field: 'grupo', opts: TAR_GRUPOS, def: 'Planejamento' },
  { id: 'g-prio', label: 'Prioridade', type: 'select', field: 'prioridade', opts: ['Alta', 'Média', 'Baixa'], def: 'Média' },
  { id: 'g-status', label: 'Situação', type: 'select', field: 'status', opts: ['A fazer', 'Fazendo', 'Feito'], def: 'A fazer' },
  { id: 'g-prazo', label: 'Prazo (opcional, ex: 13/12)', type: 'text', field: 'prazo' },
  { id: 'g-obs', label: 'Observações', type: 'textarea', field: 'observacoes' }
];

var origRenderGen2 = renderGeneric;
renderGeneric = function(section) {
  if (section === 'tar') { renderTar(); return; }
  origRenderGen2(section);
};

function setTarFiltro(f) {
  tarFiltro = f;
  ['abertas', 'feitas', 'todas'].forEach(function(v) {
    var b = document.getElementById('tf-' + v);
    if (b) b.classList.toggle('active', v === f);
  });
  renderTar();
}

function setTarGrupo(g) {
  tarGrupo = g;
  renderTar();
}

function renderTar() {
  var box = document.getElementById('tar-lista');
  if (!box) return;
  var todas = genericData['tar'] || [];

  // filtro de grupo (só mostra os grupos que existem)
  var sel = document.getElementById('tar-grupo');
  if (sel && !sel.getAttribute('data-ok')) {
    sel.innerHTML = '<option value="">Todos os grupos</option>' + TAR_GRUPOS.map(function(g) {
      return '<option value="' + esc(g) + '">' + esc(g) + '</option>';
    }).join('');
    sel.setAttribute('data-ok', '1');
  }

  var abertas = todas.filter(function(t) { return t.status !== 'Feito'; }).length;
  var resumo = document.getElementById('tar-resumo');
  if (resumo) resumo.textContent = abertas + ' em aberto · ' + (todas.length - abertas) + ' feitas';

  var lista = todas.filter(function(t) {
    var feita = t.status === 'Feito';
    if (tarFiltro === 'abertas' && feita) return false;
    if (tarFiltro === 'feitas' && !feita) return false;
    if (tarGrupo && t.grupo !== tarGrupo) return false;
    return true;
  });

  if (!lista.length) {
    box.innerHTML = '<div class="es"><span>✅</span>' + (todas.length ? 'Nada por aqui com esse filtro' : 'Nenhuma tarefa cadastrada') + '</div>';
    return;
  }

  var porGrupo = {};
  lista.forEach(function(t) {
    var g = t.grupo || 'Planejamento';
    (porGrupo[g] = porGrupo[g] || []).push(t);
  });
  var ordemGrupos = TAR_GRUPOS.filter(function(g) { return porGrupo[g]; })
    .concat(Object.keys(porGrupo).filter(function(g) { return TAR_GRUPOS.indexOf(g) < 0; }));

  box.innerHTML = ordemGrupos.map(function(g) {
    var itens = porGrupo[g].sort(function(a, b) {
      var fa = a.status === 'Feito' ? 1 : 0, fb = b.status === 'Feito' ? 1 : 0;
      if (fa !== fb) return fa - fb;
      var pa = TAR_PESO[a.prioridade] !== undefined ? TAR_PESO[a.prioridade] : 1;
      var pb = TAR_PESO[b.prioridade] !== undefined ? TAR_PESO[b.prioridade] : 1;
      if (pa !== pb) return pa - pb;
      return (a.id || 0) - (b.id || 0);
    });
    return '<div class="tar-grupo"><div class="tar-grupo-nome">' + esc(g) + ' <span>' + itens.length + '</span></div>'
      + itens.map(function(t) {
        var feita = t.status === 'Feito';
        return '<div class="tar-row' + (feita ? ' tar-feita' : '') + '">'
          + '<button class="tar-chk" data-tar="toggle" data-id="' + t.id + '" title="' + (feita ? 'Reabrir' : 'Marcar como feita') + '">' + (feita ? '✓' : '') + '</button>'
          + '<div class="tar-main"><div class="tar-tit">' + esc(t.titulo) + '</div>'
          + (t.observacoes ? '<div class="tar-obs">' + esc(t.observacoes) + '</div>' : '') + '</div>'
          + '<div class="tar-meta">'
          + (t.status === 'Fazendo' ? '<span class="bp bp-p">Fazendo</span>' : '')
          + (!feita && t.prioridade ? '<span class="bp ' + (TAR_PRIO_CLASS[t.prioridade] || 'bp-c') + '">' + esc(t.prioridade) + '</span>' : '')
          + (t.prazo ? '<span class="tar-prazo">📅 ' + esc(t.prazo) + '</span>' : '')
          + '</div>'
          + '<div class="tar-acoes">'
          + '<button class="cal-btn" data-tar="edit" data-id="' + t.id + '">Editar</button>'
          + '<button class="cal-btn cal-btn-del" data-tar="del" data-id="' + t.id + '">Excluir</button>'
          + '</div></div>';
      }).join('')
      + '</div>';
  }).join('');
}

document.addEventListener('click', function(e) {
  var el = e.target.closest ? e.target.closest('[data-tar]') : null;
  if (!el) return;
  var acao = el.getAttribute('data-tar');
  var id = el.getAttribute('data-id');
  if (acao === 'edit') editGeneric('tar', id);
  else if (acao === 'del') delGeneric('tar', id);
  else if (acao === 'toggle') {
    var t = (genericData['tar'] || []).find(function(x) { return x.id == id; });
    if (!t) return;
    var novo = t.status === 'Feito' ? 'A fazer' : 'Feito';
    supa('PATCH', 'tarefas?id=eq.' + id, { status: novo }).then(function() {
      loadGeneric('tar');
    }).catch(function(err) { toast('Erro: ' + err.message, 'err'); });
  }
});
