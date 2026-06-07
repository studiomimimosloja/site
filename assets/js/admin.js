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
    return '<tr><td><div class="pi">' + foto + '<div><div class="pn">' + esc(p.nome) + '</div><div class="pc">' + esc(p.categoria||"") + '</div>' + varLabel + '</div></div></td>'
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
  document.getElementById("fbdg").value = "Nenhum";
  document.getElementById("fpt").value = "fixo";
  document.getElementById("fsts").value = "Ativo";
  document.getElementById("ford").value = "0";
  document.getElementById("fpc").checked = false;
  document.getElementById("pflds").classList.remove("sh");
  document.getElementById("eid").value = "";
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
  document.getElementById("fcat").value = p.categoria || "";
  document.getElementById("fsubcat").value = p.subcategoria || "";
  document.getElementById("fbdg").value = p.badge || "Nenhum";
  document.getElementById("fpr").value = p.preco || "";
  document.getElementById("fpt").value = p.preco_tipo || "fixo";
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

function handleF(input) {
  var file = input.files[0];
  if (!file) return;
  if (file.size > 5*1024*1024) { toast("Foto muito grande (max 5MB)","err"); return; }
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
    if (!fotoFile) { resolve(fotoB64 || ""); return; }
    var ext = fotoFile.name.split(".").pop().toLowerCase();
    var fileName = "prod_" + Date.now() + "." + ext;
    var mime = fotoFile.type || "image/jpeg";
    fetch(SUPA_URL + "/storage/v1/object/produtos/" + fileName, {
      method: "POST",
      headers: {
        "apikey": SUPA_KEY,
        "Authorization": "Bearer " + (sessionToken || SUPA_KEY),
        "Content-Type": mime,
        "x-upsert": "true"
      },
      body: fotoFile
    }).then(function(r) {
      if (!r.ok) return r.text().then(function(t){ throw new Error(t); });
      var publicUrl = SUPA_URL + "/storage/v1/object/public/produtos/" + fileName;
      resolve(publicUrl);
    }).catch(function(e) { reject(e); });
  });
}

// ── FOTOS EXTRAS (carrossel) ──
function handleExtraFoto(input) {
  var files = input.files;
  if (!files || !files.length) return;
  var allowed = ['image/jpeg','image/png','image/webp'];
  for (var i = 0; i < files.length; i++) {
    var f = files[i];
    if (f.size > 5*1024*1024) { toast("Foto '" + f.name + "' muito grande (max 5MB)","err"); continue; }
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
    var ext = foto.file.name.split(".").pop().toLowerCase();
    var fileName = "extra_" + Date.now() + "_" + Math.random().toString(36).substring(2,6) + "." + ext;
    return fetch(SUPA_URL + "/storage/v1/object/produtos/" + fileName, {
      method: "POST",
      headers: {
        "apikey": SUPA_KEY,
        "Authorization": "Bearer " + (sessionToken || SUPA_KEY),
        "Content-Type": foto.file.type || "image/jpeg",
        "x-upsert": "true"
      },
      body: foto.file
    }).then(function(r) {
      if (!r.ok) return r.text().then(function(t){ throw new Error(t); });
      return SUPA_URL + "/storage/v1/object/public/produtos/" + fileName;
    });
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
      promo_texto: promo ? document.getElementById("fptx").value.trim() : ""
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
      return '<tr><td><strong>' + esc(item.nome) + '</strong></td><td>' + esc(item.descricao||'—') + '</td><td>' + (item.ordem||0) + '</td><td>' + st + '</td><td>' + actions + '</td></tr>';
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
      (f.opts||[]).forEach(function(o) {
        var sel = (val+'' === o+'') ? ' selected' : '';
        html += '<option value="' + o + '"' + sel + '>' + (o||'Selecione...') + '</option>';
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
  if (file.size > 5*1024*1024) { toast("Foto muito grande (max 5MB)","err"); return; }
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
    var ext = genFotoFile.name.split(".").pop().toLowerCase();
    var fileName = folder + "_" + Date.now() + "." + ext;
    fetch(SUPA_URL + "/storage/v1/object/produtos/" + fileName, {
      method: "POST",
      headers: {
        "apikey": SUPA_KEY,
        "Authorization": "Bearer " + (sessionToken || SUPA_KEY),
        "Content-Type": genFotoFile.type || "image/jpeg",
        "x-upsert": "true"
      },
      body: genFotoFile
    }).then(function(r) {
      if (!r.ok) return r.text().then(function(t){ throw new Error(t); });
      resolve(SUPA_URL + "/storage/v1/object/public/produtos/" + fileName);
    }).catch(reject);
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
  if (!confirm("Excluir este " + cfg.label.toLowerCase() + "?")) return;
  supa("DELETE", cfg.table + "?id=eq." + id).then(function() {
    toast("Excluído.", "ok");
    loadGeneric(section);
  }).catch(function(e) { toast("Erro: " + e.message, "err"); });
}

// ════════════════════════════════════════════════════
// CALENDÁRIO COMERCIAL — Multi-view
// ════════════════════════════════════════════════════

TABLES['cal'] = { table: "calendario", label: "Data comemorativa", order: "mes.asc,data_evento.asc" };

FORM_FIELDS['cal'] = [
  { id: 'g-nome', label: 'Nome da data *', type: 'text', field: 'nome', required: true },
  { id: 'g-data', label: 'Data (ex: 10/05 ou Mês)', type: 'text', field: 'data_evento', required: true },
  { id: 'g-mes', label: 'Mês', type: 'select', field: 'mes', opts: ['','JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ','TODO'] },
  { id: 'g-cat', label: 'Categoria', type: 'select', field: 'categoria', opts: ['','Família','Empresas','Escolas','Religioso','Saúde','Cultura','Festas','Comercial'] },
  { id: 'g-potencial', label: 'Potencial de venda', type: 'select', field: 'potencial', opts: ['Baixo','Médio','Alto','Muito alto'], def: 'Médio' },
  { id: 'g-publico', label: 'Público-alvo', type: 'textarea', field: 'publico_alvo' },
  { id: 'g-produtos', label: 'Produtos sugeridos', type: 'textarea', field: 'produtos_sugeridos' },
  { id: 'g-materiais', label: 'Materiais necessários', type: 'textarea', field: 'materiais_necessarios' },
  { id: 'g-dplan', label: 'Dias p/ planejamento', type: 'number', field: 'dias_planejamento', def: '90' },
  { id: 'g-dcomp', label: 'Dias p/ comprar materiais', type: 'number', field: 'dias_compra_materiais', def: '60' },
  { id: 'g-ddiv', label: 'Dias p/ divulgação', type: 'number', field: 'dias_divulgacao', def: '30' },
  { id: 'g-denc', label: 'Dias p/ encerrar pedidos', type: 'number', field: 'dias_encerrar_pedidos', def: '7' },
  { id: 'g-campanha', label: 'Ideias de campanha', type: 'textarea', field: 'ideias_campanha' },
  { id: 'g-posts', label: 'Ideias de posts', type: 'textarea', field: 'ideias_posts' },
  { id: 'g-reels', label: 'Ideias de reels', type: 'textarea', field: 'ideias_reels' },
  { id: 'g-stories', label: 'Ideias de stories', type: 'textarea', field: 'ideias_stories' },
  { id: 'g-wpp', label: 'Mensagem WhatsApp', type: 'textarea', field: 'msg_whatsapp' },
  { id: 'g-obs', label: 'Observações', type: 'textarea', field: 'observacoes' },
  { id: 'g-custo', label: 'Custo estimado', type: 'text', field: 'custo_estimado' },
  { id: 'g-prior', label: 'Prioridade', type: 'select', field: 'prioridade', opts: ['Baixa','Média','Alta','Urgente'], def: 'Média' },
  { id: 'g-status', label: 'Status', type: 'select', field: 'status', opts: ['Planejada','Em andamento','Concluída','Atrasada','Cancelada'], def: 'Planejada' },
  { id: 'g-rvendas', label: '📊 Resultado: Vendas', type: 'text', field: 'resultado_vendas' },
  { id: 'g-rprod', label: '📊 Resultado: Produtos top', type: 'textarea', field: 'resultado_produtos_top' },
  { id: 'g-rmelhoria', label: '📊 Melhorias p/ próximo ano', type: 'textarea', field: 'resultado_melhorias' }
];

var calView = 'list';
var calMonth = new Date().getMonth(); // 0-11 for month view navigation

var MES_ORDER = {JAN:1,FEV:2,MAR:3,ABR:4,MAI:5,JUN:6,JUL:7,AGO:8,SET:9,OUT:10,NOV:11,DEZ:12,TODO:13};
var MES_NAMES = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
var MES_SHORT = ['','JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];

function parseCalDate(item) {
  // Extract day number from data_evento (e.g. "13/06" -> {day:13, month:6})
  var d = (item.data_evento || '').trim();
  var mesIdx = MES_ORDER[item.mes] || 13;
  
  // Try DD/MM format
  var m = d.match(/^(\d{1,2})\/(\d{1,2})/);
  if (m) return { day: parseInt(m[1]), month: parseInt(m[2]), sortKey: parseInt(m[2]) * 100 + parseInt(m[1]) };
  
  // Try DD-DD/MM format (ranges like "14-17/02")
  m = d.match(/^(\d{1,2})-(\d{1,2})\/(\d{1,2})/);
  if (m) return { day: parseInt(m[1]), month: parseInt(m[3]), sortKey: parseInt(m[3]) * 100 + parseInt(m[1]) };
  
  // Try DD/MM-DD/MM format
  m = d.match(/^(\d{1,2})\/(\d{1,2})-(\d{1,2})\/(\d{1,2})/);
  if (m) return { day: parseInt(m[1]), month: parseInt(m[2]), sortKey: parseInt(m[2]) * 100 + parseInt(m[1]) };

  // Fallback: use month order, put at start of month
  return { day: 1, month: mesIdx <= 12 ? mesIdx : 0, sortKey: mesIdx * 100 };
}

function sortCalItems(items) {
  return items.slice().sort(function(a, b) {
    var da = parseCalDate(a);
    var db = parseCalDate(b);
    if (da.sortKey !== db.sortKey) return da.sortKey - db.sortKey;
    return (a.nome || '').localeCompare(b.nome || '');
  });
}

function filterCalItems(data) {
  var fmes = (document.getElementById('cal-fmes') || {}).value || '';
  var fst = (document.getElementById('cal-fst') || {}).value || '';
  var fpot = (document.getElementById('cal-fpot') || {}).value || '';
  return data.filter(function(item) {
    return (!fmes || item.mes === fmes || item.mes === 'TODO')
      && (!fst || item.status === fst)
      && (!fpot || item.potencial === fpot);
  });
}

// Override generic render for calendar
var origRenderGen = renderGeneric;
renderGeneric = function(section) {
  if (section === 'cal') { renderCal(); return; }
  origRenderGen(section);
};

function setCalView(view) {
  calView = view;
  document.querySelectorAll('.cal-view-btn').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('cv-' + view).classList.add('active');
  document.getElementById('cal-view-list').style.display = view === 'list' ? 'block' : 'none';
  document.getElementById('cal-view-month').style.display = view === 'month' ? 'block' : 'none';
  document.getElementById('cal-view-timeline').style.display = view === 'timeline' ? 'block' : 'none';
  renderCal();
}

function renderCal() {
  var data = genericData['cal'] || [];
  var cnt = document.getElementById('cal-cnt');
  if (cnt) cnt.textContent = '(' + data.length + ')';
  
  var filtered = filterCalItems(data);
  var sorted = sortCalItems(filtered);

  renderCalAlerts(data);

  if (calView === 'list') renderCalList(sorted);
  else if (calView === 'month') renderCalMonth(data);
  else if (calView === 'timeline') renderCalTimeline(sorted);
}

// ── LIST VIEW ──
function renderCalList(list) {
  var tb = document.getElementById('cal-tbody');
  if (!tb) return;
  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="7"><div class="es"><span>📅</span>Nenhuma data encontrada</div></td></tr>';
    return;
  }

  var potIcons = { 'Muito alto': '🔥🔥', 'Alto': '🔥', 'Médio': '⭐', 'Baixo': '·' };
  var stColors = { 'Planejada': 'sp-o', 'Em andamento': 'sp-a', 'Concluída': 'sp-a', 'Atrasada': 'sp-e', 'Cancelada': 'sp-o' };
  var prioColors = { 'Urgente': 'bp-h', 'Alta': 'bp-n', 'Média': 'bp-p', 'Baixa': 'bp-c' };

  tb.innerHTML = list.map(function(item) {
    var st = stColors[item.status] || 'sp-o';
    var pr = prioColors[item.prioridade] || 'bp-c';
    var parsed = parseCalDate(item);
    var mesLabel = parsed.month > 0 && parsed.month <= 12 ? MES_SHORT[parsed.month] : (item.mes || '');
    return '<tr>'
      + '<td style="white-space:nowrap"><strong>' + esc(item.data_evento || '') + '</strong><br><small style="color:var(--sf)">' + mesLabel + '</small></td>'
      + '<td><strong>' + esc(item.nome) + '</strong><br><small style="color:var(--sf)">' + esc(item.categoria || '') + '</small></td>'
      + '<td style="text-align:center">' + (potIcons[item.potencial] || '·') + '<br><small style="font-size:.65rem;color:var(--sf)">' + esc(item.potencial || '') + '</small></td>'
      + '<td>' + (item.dias_divulgacao || 30) + ' dias</td>'
      + '<td><span class="bp ' + pr + '">' + esc(item.prioridade || 'Média') + '</span></td>'
      + '<td><span class="sp ' + st + '">' + esc(item.status || 'Planejada') + '</span></td>'
      + '<td><div class="ac">'
      + '<button class="ab ab-e" onclick="editGeneric(\"cal\",' + item.id + ')" title="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>'
      + '<button class="ab ab-d" onclick="delGeneric(\"cal\",' + item.id + ')" title="Excluir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>'
      + '</div></td></tr>';
  }).join('');
}

// ── MONTH VIEW ──
function calMonthNav(dir) {
  calMonth += dir;
  if (calMonth < 0) calMonth = 11;
  if (calMonth > 11) calMonth = 0;
  renderCalMonth(genericData['cal'] || []);
}

function renderCalMonth(allData) {
  var monthIdx = calMonth + 1; // 1-12
  var titleEl = document.getElementById('cal-month-title');
  if (titleEl) titleEl.textContent = MES_NAMES[monthIdx] + ' 2026';

  var grid = document.getElementById('cal-month-grid');
  if (!grid) return;

  // Get events for this month
  var events = allData.filter(function(item) {
    var p = parseCalDate(item);
    return p.month === monthIdx || item.mes === 'TODO';
  });

  // Build calendar grid
  var firstDay = new Date(2026, calMonth, 1).getDay(); // 0=Sun
  var daysInMonth = new Date(2026, calMonth + 1, 0).getDate();
  var today = new Date();
  var todayDay = (today.getMonth() === calMonth && today.getFullYear() === 2026) ? today.getDate() : -1;

  var html = '';
  var dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  dayNames.forEach(function(d) { html += '<div class="cal-grid-header">' + d + '</div>'; });

  // Previous month padding
  for (var i = 0; i < firstDay; i++) html += '<div class="cal-day other"></div>';

  // Days
  for (var d = 1; d <= daysInMonth; d++) {
    var isToday = d === todayDay;
    html += '<div class="cal-day' + (isToday ? ' today' : '') + '">';
    html += '<div class="cal-day-num">' + d + '</div>';
    
    // Find events on this day
    events.forEach(function(ev) {
      var p = parseCalDate(ev);
      if (p.day === d && p.month === monthIdx) {
        var potClass = 'pot-' + (ev.potencial || 'medio').toLowerCase().replace(' ', '-');
        html += '<div class="cal-day-event ' + potClass + '" onclick="editGeneric(\"cal\",' + ev.id + ')" title="' + esc(ev.nome) + '">' + esc(ev.nome) + '</div>';
      }
    });
    
    // "TODO" events show on day 1 with a subtle indicator
    if (d === 1) {
      events.forEach(function(ev) {
        if (ev.mes === 'TODO') {
          html += '<div class="cal-day-event pot-medio" onclick="editGeneric(\"cal\",' + ev.id + ')" title="' + esc(ev.nome) + ' (contínuo)" style="opacity:.6;font-style:italic">↻ ' + esc(ev.nome).substring(0,15) + '</div>';
        }
      });
    }
    
    html += '</div>';
  }

  // Remaining padding
  var totalCells = firstDay + daysInMonth;
  var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (var i = 0; i < remaining; i++) html += '<div class="cal-day other"></div>';

  grid.innerHTML = html;
}

// ── TIMELINE VIEW ──
function renderCalTimeline(sorted) {
  var container = document.getElementById('cal-timeline');
  if (!container) return;
  if (!sorted.length) { container.innerHTML = '<div class="es"><span>📅</span>Nenhuma data encontrada</div>'; return; }

  var potIcons = { 'Muito alto': '🔥🔥', 'Alto': '🔥', 'Médio': '⭐', 'Baixo': '·' };
  var stColors = { 'Planejada': '#9ca3af', 'Em andamento': '#2ECFC4', 'Concluída': '#22c55e', 'Atrasada': '#ef4444' };

  // Group by month
  var groups = {};
  sorted.forEach(function(item) {
    var p = parseCalDate(item);
    var key = p.month > 0 && p.month <= 12 ? p.month : 13;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  var html = '';
  Object.keys(groups).sort(function(a,b){ return a-b; }).forEach(function(monthKey) {
    var mIdx = parseInt(monthKey);
    var mName = mIdx <= 12 ? MES_NAMES[mIdx] : 'Todo o Ano';
    var items = groups[monthKey];
    
    html += '<div class="tl-month">';
    html += '<div class="tl-month-title">' + mName + ' <span>' + items.length + ' data' + (items.length > 1 ? 's' : '') + '</span></div>';
    
    items.forEach(function(item) {
      var potClass = 'pot-' + (item.potencial || 'medio').toLowerCase().replace(' ', '-');
      var stColor = stColors[item.status] || '#9ca3af';
      html += '<div class="tl-item ' + potClass + '">';
      html += '<div class="tl-date">' + esc(item.data_evento || '') + '</div>';
      html += '<div class="tl-info">';
      html += '<div class="tl-name">' + (potIcons[item.potencial] || '') + ' ' + esc(item.nome) + '</div>';
      html += '<div class="tl-detail">' + esc(item.categoria || '') + (item.publico_alvo ? ' · ' + esc((item.publico_alvo||'').substring(0,60)) : '') + '</div>';
      html += '<div style="margin-top:4px"><span class="sp" style="background:' + stColor + '20;color:' + stColor + '">' + esc(item.status || '') + '</span></div>';
      html += '</div>';
      html += '<div class="tl-actions">';
      html += '<button class="ab ab-e" onclick="editGeneric(\"cal\",' + item.id + ')" title="Editar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>';
      html += '<button class="ab ab-d" onclick="delGeneric(\"cal\",' + item.id + ')" title="Excluir"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg></button>';
      html += '</div>';
      html += '</div>';
    });
    
    html += '</div>';
  });

  container.innerHTML = html;
}

function renderCalAlerts(data) {
  var alertsDiv = document.getElementById('cal-alerts');
  if (!alertsDiv || !data.length) { if(alertsDiv) alertsDiv.innerHTML = ''; return; }
  
  var pending = data.filter(function(d) { return d.status !== 'Concluída' && d.status !== 'Cancelada' && d.mes !== 'TODO'; });
  if (!pending.length) { alertsDiv.innerHTML = ''; return; }

  var urgentes = pending.filter(function(d) { return d.prioridade === 'Urgente' || d.prioridade === 'Alta'; });
  var emAndamento = pending.filter(function(d) { return d.status === 'Em andamento'; });
  var atrasadas = pending.filter(function(d) { return d.status === 'Atrasada'; });
  var muitoAlto = pending.filter(function(d) { return d.potencial === 'Muito alto'; });

  var html = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px">';
  html += '<div class="sc" style="border-left:3px solid var(--r)"><div class="si" style="background:var(--rl)">⚠️</div><div><div class="sn">' + atrasadas.length + '</div><div class="sl">Atrasadas</div></div></div>';
  html += '<div class="sc" style="border-left:3px solid var(--a)"><div class="si" style="background:var(--al)">🔥</div><div><div class="sn">' + urgentes.length + '</div><div class="sl">Alta prioridade</div></div></div>';
  html += '<div class="sc" style="border-left:3px solid var(--t)"><div class="si" style="background:var(--tl)">🚀</div><div><div class="sn">' + emAndamento.length + '</div><div class="sl">Em andamento</div></div></div>';
  html += '<div class="sc" style="border-left:3px solid #F59E0B"><div class="si" style="background:#FFFBEB">💰</div><div><div class="sn">' + muitoAlto.length + '</div><div class="sl">Potencial máximo</div></div></div>';
  html += '</div>';
  alertsDiv.innerHTML = html;
}

// ============================================================
// ERP / ESTOQUE — integrado ao admin (usa o mesmo login/token)
// ============================================================
var erpLoaded = false;

function erpBRL(v){ return "R$ " + (Number(v)||0).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}); }

var ERP_NIVEL = {
  ok:       {txt:"OK",       cor:"#13877e", bg:"rgba(46,207,196,.15)", ord:2},
  acabando: {txt:"Acabando", cor:"#b9760a", bg:"rgba(245,166,35,.16)", ord:1},
  acabou:   {txt:"Acabou",   cor:"#c0234b", bg:"rgba(224,73,107,.14)", ord:0}
};

function loadERP() {
  Promise.all([
    supa("GET", "erp_materiais?select=*&order=nome.asc"),
    supa("GET", "erp_produtos?select=*&order=nome.asc"),
    supa("GET", "erp_produto_materiais?select=*"),
    supa("GET", "erp_pedidos?select=*&order=data.desc&limit=15"),
    supa("GET", "erp_configuracoes?select=*"),
    supa("GET", "erp_custos_fixos?select=*"),
    supa("GET", "erp_custos_impressao?select=*")
  ]).then(function(res){
    renderERP(res[0]||[], res[1]||[], res[2]||[], res[3]||[], res[4]||[], res[5]||[], res[6]||[]);
    var u = document.getElementById("erp-upd");
    if (u) u.textContent = "· atualizado " + new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
  }).catch(function(e){
    console.error(e);
    toast("Erro ao carregar ERP: " + e.message, "err");
  });
}

function renderERP(materiais, produtos, comp, pedidos, cfg, fixos, tintas) {
  var conf = {}; cfg.forEach(function(c){ conf[c.chave] = c.valor; });
  var margem = parseFloat(conf.margem_padrao || "0.7");
  var valorHora = parseFloat(conf.valor_hora || "30");
  var prodMensal = parseFloat(conf.producao_mensal || "300");
  var custoFixoUn = fixos.reduce(function(s,f){return s+(parseFloat(f.valor_mensal)||0);},0) / (prodMensal||1);
  var custoImpFolha = tintas.reduce(function(s,t){return s + (t.rendimento_folhas? (parseFloat(t.valor)/parseFloat(t.rendimento_folhas)):0);},0);

  // KPIs
  var emAlerta = materiais.filter(function(m){return m.nivel!=="ok";});
  var acabou = materiais.filter(function(m){return m.nivel==="acabou";}).length;
  var k = document.getElementById("erp-kpis");
  if (k) k.innerHTML =
    erpKpi("Materiais", materiais.length, "no controle de estoque", false) +
    erpKpi("Precisam de atenção", emAlerta.length, acabou+" acabaram · "+(emAlerta.length-acabou)+" acabando", emAlerta.length>0) +
    erpKpi("Produtos", produtos.length, "com preço calculável", false) +
    erpKpi("Sua margem", Math.round(margem*100)+"%", "mão de obra: "+erpBRL(valorHora)+"/h", false);

  // Estoque (alerta primeiro)
  var ord = materiais.slice().sort(function(a,b){
    return (ERP_NIVEL[a.nivel]?ERP_NIVEL[a.nivel].ord:9) - (ERP_NIVEL[b.nivel]?ERP_NIVEL[b.nivel].ord:9)
        || a.nome.localeCompare(b.nome);
  });
  var est = document.getElementById("erp-estoque");
  if (est) {
    if (!ord.length) { est.innerHTML = '<p style="color:var(--sf);font-size:.85rem">Nenhum material ainda. Registre uma compra pelo bot.</p>'; }
    else {
      est.innerHTML = ord.map(function(m){
        var inf = ERP_NIVEL[m.nivel] || ERP_NIVEL.ok;
        var obs = m.observacao ? ' <span style="color:var(--sf);font-size:.78rem">· '+esc(m.observacao)+'</span>' : '';
        return '<div style="display:flex;align-items:center;gap:12px;padding:11px 4px;border-bottom:1px solid var(--bd)">'
          + '<div style="flex:1;font-weight:500">'+esc(m.nome)+obs+'</div>'
          + '<span style="font-size:.75rem;font-weight:700;padding:4px 11px;border-radius:99px;color:'+inf.cor+';background:'+inf.bg+'">'+inf.txt+'</span>'
          + '</div>';
      }).join("");
    }
  }

  // Produtos + preço
  var matById = {}; materiais.forEach(function(m){ matById[m.id]=m; });
  var compByProd = {}; comp.forEach(function(c){ (compByProd[c.produto_id]=compByProd[c.produto_id]||[]).push(c); });
  var pb = document.getElementById("erp-produtos");
  if (pb) {
    if (!produtos.length) { pb.innerHTML = '<tr><td colspan="3" style="color:var(--sf)">Nenhum produto. Crie pelo bot.</td></tr>'; }
    else {
      pb.innerHTML = produtos.map(function(p){
        var cs = compByProd[p.id]||[];
        var custoMat = cs.reduce(function(s,c){return s + c.quantidade*((matById[c.material_id]||{}).custo_unitario||0);},0);
        var custoMO = (p.minutos_producao/60)*valorHora;
        var custoImp = (p.folhas_impressao||0)*custoImpFolha;
        var custoUn = custoMat+custoMO+custoImp+custoFixoUn;
        var preco = custoUn*(1+margem);
        return '<tr><td><b>'+esc(p.nome)+'</b><br><span style="color:var(--sf);font-size:.76rem">'+cs.length+' material(is) · '+(p.minutos_producao||0)+' min</span></td>'
          + '<td>'+erpBRL(custoUn)+'</td>'
          + '<td style="font-weight:700;color:#13877e">'+erpBRL(preco)+'</td></tr>';
      }).join("");
    }
  }

  // Pedidos
  var pd = document.getElementById("erp-pedidos");
  if (pd) {
    if (!pedidos.length) { pd.innerHTML = '<tr><td colspan="5" style="color:var(--sf)">Nenhuma precificação ainda. Peça ao bot.</td></tr>'; }
    else {
      pd.innerHTML = pedidos.map(function(p){
        var lucro = (parseFloat(p.preco_sugerido)||0)-(parseFloat(p.custo_total)||0);
        var d = p.data ? new Date(p.data).toLocaleDateString("pt-BR") : "";
        return '<tr><td>'+esc(p.produto_nome||"—")+'<br><span style="color:var(--sf);font-size:.76rem">'+d+'</span></td>'
          + '<td>'+(parseFloat(p.quantidade)||0)+'</td>'
          + '<td>'+erpBRL(p.custo_total)+'</td>'
          + '<td style="font-weight:700;color:#13877e">'+erpBRL(p.preco_sugerido)+'</td>'
          + '<td>'+erpBRL(lucro)+'</td></tr>';
      }).join("");
    }
  }
}

function erpKpi(rotulo, valor, nota, alerta) {
  var borda = alerta ? "#F5A623" : "var(--bd)";
  var corVal = alerta ? "#b9760a" : "var(--tx)";
  return '<div style="background:#fff;border:1px solid '+borda+';border-radius:14px;padding:16px">'
    + '<div style="font-size:.78rem;color:var(--sf)">'+rotulo+'</div>'
    + '<div style="font-size:1.7rem;font-weight:800;color:'+corVal+';margin-top:2px">'+valor+'</div>'
    + '<div style="font-size:.72rem;color:var(--sf);margin-top:2px">'+nota+'</div></div>';
}

// Engancha no showP: ao abrir a aba ERP, carrega os dados
(function(){
  var _showP = window.showP;
  window.showP = function(id, btn){
    _showP(id, btn);
    if (id === "erp") { loadERP(); }
  };
})();

// ============================================================
// PEDIDOS — quadro por status (usa o mesmo login/token do admin)
// ============================================================
var PED_FLUXO = ["novo","orcamento_enviado","aprovado","producao","pronto","entregue"];
var PED_LABEL = {
  novo:"🆕 Novo", orcamento_enviado:"📄 Orçamento enviado", aprovado:"✅ Aprovado",
  producao:"🛠️ Produção", pronto:"📦 Pronto", entregue:"🚚 Entregue", cancelado:"❌ Cancelado"
};
var PED_COR = {
  novo:"#8B6BB1", orcamento_enviado:"#6b7db1", aprovado:"#2ECFC4",
  producao:"#F5A623", pronto:"#13877e", entregue:"#6b7280", cancelado:"#c0234b"
};

function loadPedidos() {
  supa("GET","erp_pedidos_fluxo?select=*&order=criado_em.desc&limit=200")
    .then(function(pedidos){
      renderPedidos(pedidos||[]);
      var u=document.getElementById("ped-upd");
      if(u) u.textContent="· atualizado "+new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
    }).catch(function(e){ console.error(e); toast("Erro ao carregar pedidos: "+e.message,"err"); });
}

function renderPedidos(pedidos) {
  // KPIs por status
  var cont={}; PED_FLUXO.forEach(function(s){cont[s]=0;}); cont.cancelado=0;
  pedidos.forEach(function(p){ cont[p.status]=(cont[p.status]||0)+1; });
  var ativos = pedidos.filter(function(p){return p.status!=="entregue"&&p.status!=="cancelado";}).length;
  var k=document.getElementById("ped-kpis");
  if(k) k.innerHTML =
    pedKpi("Em aberto", ativos, "#F5A623", ativos>0) +
    pedKpi("Em produção", cont.producao||0, "#F5A623", false) +
    pedKpi("Prontos", cont.pronto||0, "#13877e", (cont.pronto||0)>0) +
    pedKpi("Entregues", cont.entregue||0, "#6b7280", false);

  // Colunas por status do fluxo
  var col=document.getElementById("ped-colunas");
  if(!col) return;
  if(!pedidos.length){ col.innerHTML='<p style="color:var(--sf);font-size:.85rem">Nenhum pedido ainda. Crie pelo bot: "novo pedido da Maria: 20 caixas".</p>'; return; }
  col.innerHTML = PED_FLUXO.map(function(status){
    var lista = pedidos.filter(function(p){return p.status===status;});
    var cards = lista.map(function(p){
      var cli = p.cliente_nome ? esc(p.cliente_nome) : "—";
      var entrega = p.data_entrega ? '<div style="font-size:.7rem;color:var(--sf);margin-top:3px">🗓️ '+esc(p.data_entrega)+'</div>' : '';
      var valor = (p.valor_total&&p.valor_total>0) ? '<div style="font-size:.72rem;color:#13877e;font-weight:600;margin-top:2px">R$ '+Number(p.valor_total).toLocaleString("pt-BR",{minimumFractionDigits:2})+'</div>' : '';
      return '<div style="background:#fff;border:1px solid var(--bd);border-left:3px solid '+PED_COR[status]+';border-radius:9px;padding:10px 11px;margin-bottom:8px">'
        + '<div style="font-weight:600;font-size:.82rem">#'+p.id+' · '+cli+'</div>'
        + '<div style="font-size:.76rem;color:var(--t);margin-top:2px">'+esc(p.descricao)+'</div>'
        + valor + entrega + '</div>';
    }).join("");
    return '<div style="background:var(--bg2,#f6f7fb);border-radius:12px;padding:12px;min-height:80px">'
      + '<div style="font-size:.8rem;font-weight:700;color:'+PED_COR[status]+';margin-bottom:10px">'+PED_LABEL[status]+' <span style="color:var(--sf);font-weight:400">('+lista.length+')</span></div>'
      + (cards||'<div style="font-size:.74rem;color:var(--sf);font-style:italic">vazio</div>')
      + '</div>';
  }).join("");
}

function pedKpi(rotulo, valor, cor, destaque) {
  return '<div style="background:#fff;border:1px solid '+(destaque?cor:"var(--bd)")+';border-radius:12px;padding:13px">'
    + '<div style="font-size:.72rem;color:var(--sf)">'+rotulo+'</div>'
    + '<div style="font-size:1.5rem;font-weight:800;color:'+cor+';margin-top:2px">'+valor+'</div></div>';
}

// Engancha no showP (que já foi sobrescrito pelo ERP; encadeia de novo)
(function(){
  var _prev = window.showP;
  window.showP = function(id, btn){
    _prev(id, btn);
    if (id === "pedidos") { loadPedidos(); }
  };
})();
