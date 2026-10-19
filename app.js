/* Modelos AR — lógica compartida. Todo corre en el navegador; nada se envía a ningún servidor. */
const $ = id => document.getElementById(id);
const form = $("form"), preview = $("preview"), statusEl = $("status");
function val(name) { const el = form && form.elements[name]; return el ? el.value.trim() : ""; }
function fd(v) { if (!v) return ""; const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); return m ? `${m[3]}/${m[2]}/${m[1]}` : v; }
function today() { return new Intl.DateTimeFormat("es-AR").format(new Date()); }
function setStatus(t) { if (statusEl) statusEl.textContent = t; }

/* ---------- almacenamiento local (siempre protegido) ---------- */
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
function lsDelPrefix(p) { try { Object.keys(localStorage).filter(k => k.startsWith(p)).forEach(k => localStorage.removeItem(k)); } catch (e) {} }

/* ---------- importes en letras (para pagaré, recibos) ---------- */
const _UN = ["cero","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez","once","doce","trece","catorce","quince","dieciséis","diecisiete","dieciocho","diecinueve","veinte","veintiuno","veintidós","veintitrés","veinticuatro","veinticinco","veintiséis","veintisiete","veintiocho","veintinueve"];
const _DEC = ["","","","treinta","cuarenta","cincuenta","sesenta","setenta","ochenta","noventa"];
const _CEN = ["","ciento","doscientos","trescientos","cuatrocientos","quinientos","seiscientos","setecientos","ochocientos","novecientos"];
function _apocope(t) { return t.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un"); }
function _menos1000(n, apoc) {
  if (n === 100) return "cien";
  const c = Math.floor(n / 100), r = n % 100, out = [];
  if (c) out.push(_CEN[c]);
  if (r) { if (r < 30) out.push(_UN[r]); else { const d = Math.floor(r / 10), u = r % 10; out.push(u ? `${_DEC[d]} y ${_UN[u]}` : _DEC[d]); } }
  const t = out.join(" ");
  return apoc ? _apocope(t) : t;
}
function numeroEnLetras(n, apoc = true) {
  if (n === 0) return "cero";
  if (n >= 1e12) return String(n);
  const millones = Math.floor(n / 1e6), resto = n % 1e6, miles = Math.floor(resto / 1000), unidades = resto % 1000, p = [];
  if (millones) p.push(millones === 1 ? "un millón" : `${numeroEnLetras(millones, true)} millones`);
  if (miles) p.push(miles === 1 ? "mil" : `${_menos1000(miles, true)} mil`);
  if (unidades) p.push(_menos1000(unidades, apoc));
  return p.join(" ");
}
function parseImporte(s) {
  s = String(s || "").trim().replace(/[^\d.,-]/g, "");
  if (!s) return NaN;
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  return parseFloat(s);
}
function importeEnLetras(valor, moneda) {
  const num = parseImporte(valor);
  if (!isFinite(num) || num < 0 || num >= 1e12) return "";
  let ent = Math.floor(num), cent = Math.round((num - ent) * 100);
  if (cent === 100) { ent += 1; cent = 0; }
  const usd = /USD|d[oó]lar/i.test(moneda || "");
  const nombre = usd ? (ent === 1 ? "dólar estadounidense" : "dólares estadounidenses") : (ent === 1 ? "peso" : "pesos");
  const de = ent >= 1e6 && ent % 1e6 === 0 ? " de" : "";
  return `${numeroEnLetras(ent, true)}${de} ${nombre}${cent ? ` con ${String(cent).padStart(2, "0")}/100` : ""}`;
}
function fmtImporte(valor) {
  const n = parseImporte(valor);
  return isFinite(n) ? new Intl.NumberFormat("es-AR", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n) : "";
}

/* ---------- tema claro / oscuro ---------- */
function currentTheme() {
  const t = document.documentElement.dataset.theme;
  return t || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}
function initTheme() {
  const nav = document.querySelector(".nav"); if (!nav) return;
  const btn = document.createElement("button"); btn.type = "button"; btn.className = "pill theme";
  nav.insertBefore(btn, nav.querySelector(".cafe"));
  const paint = () => { const d = currentTheme() === "dark"; btn.textContent = d ? "☀️ Claro" : "🌙 Oscuro"; btn.setAttribute("aria-label", d ? "Cambiar a tema claro" : "Cambiar a tema oscuro"); };
  btn.addEventListener("click", () => { const n = currentTheme() === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = n; lsSet("modelosar:theme", n); paint(); });
  paint();
}

/* ---------- buscador del índice ---------- */
function initSearch() {
  const inp = $("buscar"); if (!inp) return;
  const list = document.querySelector(".model-list");
  const cards = [...list.querySelectorAll("a")], heads = [...list.querySelectorAll("h2.cat")];
  const count = $("cuenta"), none = $("sin-resultados");
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  cards.forEach(a => { a._t = norm(a.textContent + " " + (a.dataset.keywords || "")); });
  function run() {
    const q = norm(inp.value.trim()).split(/\s+/).filter(Boolean); let n = 0;
    cards.forEach(a => { const ok = q.every(w => a._t.includes(w)); a.hidden = !ok; if (ok) n++; });
    heads.forEach(h => { let el = h.nextElementSibling, any = false; while (el && !el.matches("h2.cat")) { if (el.tagName === "A" && !el.hidden) any = true; el = el.nextElementSibling; } h.hidden = !any; });
    none.hidden = n > 0;
    count.textContent = q.length ? (n === 1 ? "1 modelo encontrado" : `${n} modelos encontrados`) : `${cards.length} modelos disponibles`;
  }
  inp.addEventListener("input", run); run();
}

/* ---------- validación ---------- */
const DATE_PAIRS = [["salida","regreso"],["desde","hasta"],["inicio","fin"],["inicio","entrega"],["emision","vencimiento"]];
function cuitOk(d) {
  const w = [5,4,3,2,7,6,5,4,3,2]; let s = 0;
  for (let i = 0; i < 10; i++) s += +d[i] * w[i];
  const m = s % 11, dv = m === 0 ? 0 : 11 - m;
  return dv !== 10 && dv === +d[10];
}
function labelOf(el) { const l = el.id && document.querySelector(`label[for="${el.id}"]`); return l ? l.textContent.replace("*", "").trim() : el.name; }
function validateField(el) {
  const n = el.name, v = el.value.trim(); if (!v) return "";
  if (/^dni/i.test(n)) {
    if (/[a-z]/i.test(v)) return "";                    // pasaporte u otro documento
    if (!/^\d{7,8}$/.test(v.replace(/[.\s-]/g, ""))) return "El DNI debe tener 7 u 8 números.";
  }
  if (/^cu(it|il)/i.test(n)) {
    const d = v.replace(/[-\s.]/g, "");
    if (!/^\d{11}$/.test(d)) return "El CUIT/CUIL debe tener 11 números.";
    if (!cuitOk(d)) return "Ese CUIT/CUIL no parece válido: revisá los números.";
  }
  if (el.type === "date") {
    for (const [a, b] of DATE_PAIRS) {
      const ea = form.elements[a];
      if (n === b && ea && ea.value && v < ea.value) return `Esta fecha no puede ser anterior a «${labelOf(ea)}».`;
    }
  }
  return "";
}
function setHint(el, msg) {
  let h = el.parentElement.querySelector(".hint");
  if (!h) { h = document.createElement("small"); h.className = "hint"; h.id = "h_" + el.name; el.insertAdjacentElement("afterend", h); }
  h.textContent = msg || "";
  if (msg) { el.setAttribute("aria-invalid", "true"); el.setAttribute("aria-describedby", h.id); }
  else { el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby"); }
}
function checkField(el) { const m = validateField(el); setHint(el, m); return !m; }

/* ---------- inicio de cada generador ---------- */
function initApp(update) {
  initTheme();
  if (!form || !preview) return;
  const fields = [...form.elements].filter(e => e.name && e.type !== "button" && e.type !== "checkbox");

  // etiquetas asociadas a sus campos + marca de obligatorio
  let hayReq = false;
  form.querySelectorAll(".field").forEach(f => {
    const l = f.querySelector("label"), c = f.querySelector("input,select,textarea");
    if (!l || !c) return;
    c.id = "f_" + c.name; l.htmlFor = c.id;
    if (c.required) { hayReq = true; l.insertAdjacentHTML("beforeend", ' <span class="req" aria-hidden="true">*</span>'); c.setAttribute("aria-required", "true"); }
  });
  // reservar el lugar del aviso en los campos validados, así el diseño no se mueve al validar
  // (si se moviera entre apretar y soltar el clic, el botón «PDF» perdería el clic)
  const segundos = DATE_PAIRS.map(p => p[1]);
  fields.forEach(el => { if (/^dni|^cu(it|il)/i.test(el.name) || segundos.includes(el.name)) setHint(el, ""); });
  if (hayReq) form.insertAdjacentHTML("afterbegin", '<p class="req-note"><span class="req" aria-hidden="true">*</span> Campo obligatorio</p>');

  // borrador local (opcional)
  const KEY = "modelosar:draft:" + (location.pathname.split("/").pop() || "index");
  form.insertAdjacentHTML("afterbegin",
    '<div class="draft"><label><input type="checkbox" id="autosave"> Guardar borrador en este navegador</label>' +
    '<button type="button" class="secondary" id="clearForm">Borrar formulario</button></div>');
  const auto = $("autosave"); auto.checked = lsGet("modelosar:autosave") === "1";
  let timer;
  const save = () => {
    if (!auto.checked) return;
    const o = {}; fields.forEach(e => { o[e.name] = e.value; });
    if (lsSet(KEY, JSON.stringify(o))) setStatus("Borrador guardado en este navegador.");
  };
  if (auto.checked) {
    try { const o = JSON.parse(lsGet(KEY) || "null"); if (o) { fields.forEach(e => { if (o[e.name] != null) e.value = o[e.name]; }); setStatus("Se recuperó tu borrador guardado en este navegador."); } } catch (e) {}
  }
  auto.addEventListener("change", () => {
    if (auto.checked) { lsSet("modelosar:autosave", "1"); save(); }
    else { lsSet("modelosar:autosave", "0"); lsDelPrefix("modelosar:draft:"); setStatus("Borradores eliminados de este navegador."); }
  });
  $("clearForm").addEventListener("click", () => {
    form.reset(); fields.forEach(e => setHint(e, "")); lsDel(KEY); update(); setStatus("Formulario borrado.");
  });

  // validación y formato
  form.addEventListener("focusout", e => {
    const el = e.target; if (!fields.includes(el)) return;
    if (/^dni/i.test(el.name)) { const d = el.value.replace(/[.\s-]/g, ""); if (/^\d{7,8}$/.test(d)) { el.value = d.replace(/\B(?=(\d{3})+(?!\d))/g, "."); update(); } }
    checkField(el);
  });
  form.addEventListener("input", e => { const el = e.target; if (el.getAttribute && el.getAttribute("aria-invalid") === "true") checkField(el); });
  form.addEventListener("change", e => {
    const el = e.target;
    DATE_PAIRS.forEach(([a, b]) => { if ((el.name === a || el.name === b) && form.elements[b]) checkField(form.elements[b]); });
  });
  form.addEventListener("input", () => { update(); clearTimeout(timer); timer = setTimeout(save, 400); });
  form.addEventListener("change", () => { update(); save(); });
  update();

  // copiar y PDF
  $("copy").addEventListener("click", async () => {
    const t = preview.textContent + "\n\n— Modelo de simulación generado en Modelos AR. Sin validez legal. —";
    try { await navigator.clipboard.writeText(t); setStatus("Texto copiado."); }
    catch (e) { setStatus("No se pudo copiar automáticamente. Seleccioná y copiá el texto de la vista previa."); }
  });
  let avisado = false;
  $("pdf").addEventListener("click", () => {
    let malos = 0, primero = null;
    fields.forEach(el => {
      let m = validateField(el);
      if (!m && el.required && !el.value.trim()) m = "Completá este campo.";
      setHint(el, m); if (m) { malos++; primero = primero || el; }
    });
    if (malos && !avisado) {
      avisado = true; primero.focus();
      setStatus(`Hay ${malos} campo(s) para revisar (marcados en rojo). Si querés descargar igual, tocá el botón otra vez.`);
      return;
    }
    avisado = false;
    setStatus("Se abrirá la ventana de impresión. Elegí «Guardar como PDF».");
    window.print();
  });
}

initSearch();
