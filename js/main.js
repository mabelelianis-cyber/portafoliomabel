/* =====================================================
   CONFIGURACIÓN: lo que más vas a querer cambiar
   ===================================================== */
const CONFIG = {
  correo: "elianis@ejemplo.com",
  anuncio:
    "Señores pasajeros, bienvenidos a bordo del portafolio de Elianis Pérez. " +
    "Les habla su capitana. Por favor, abrochen sus cinturones, mantengan sus mentes abiertas " +
    "y disfruten del vuelo. Gracias por visitarnos."
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* ---------- Avión del hero: si se prefiere menos movimiento, queda al final ---------- */
if (reduceMotion) {
  const anim = $("#avion-hero animateMotion");
  if (anim) anim.remove();
  const g = $("#avion-hero");
  if (g) g.setAttribute("transform", "translate(1180 95) rotate(-45)");
}

/* ---------- Riel: el avión baja con el scroll y marca la sección activa ---------- */
const riel = $(".rail");
function actualizarProgreso() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  riel.style.setProperty("--p", p.toFixed(4));
}
window.addEventListener("scroll", actualizarProgreso, { passive: true });
window.addEventListener("resize", actualizarProgreso);
actualizarProgreso();

const enlaces = $$(".rail a");
const marcar = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => {
    if (e.isIntersecting) {
      enlaces.forEach((a) =>
        a.setAttribute("aria-current", a.getAttribute("href") === "#" + e.target.id ? "true" : "false")
      );
    }
  });
}, { rootMargin: "-45% 0px -50% 0px" });
$$("main > section, main > header").forEach((s) => marcar.observe(s));

/* ---------- Tablero de salidas: letras que giran hasta acomodarse ---------- */
const LETRAS = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789";
function girar(el) {
  const final = el.textContent;
  el.setAttribute("aria-label", final);
  const total = final.length;
  let paso = 0;
  const id = setInterval(() => {
    paso++;
    el.textContent = [...final].map((c, i) => {
      if (c === " ") return " ";
      return i < paso / 2 ? c : LETRAS[Math.floor(Math.random() * LETRAS.length)];
    }).join("");
    if (paso / 2 >= total) { el.textContent = final; clearInterval(id); }
  }, 45);
}
const tablero = $(".tablero");
if (tablero && !reduceMotion) {
  const io = new IntersectionObserver((entradas, obs) => {
    if (entradas[0].isIntersecting) {
      $$("[data-flip]", tablero).forEach((el, i) => setTimeout(() => girar(el), i * 90));
      obs.disconnect();
    }
  }, { threshold: 0.35 });
  io.observe(tablero);
}

/* ---------- Video de YouTube: carga al hacer clic ---------- */
function idYouTube(url) {
  const m = (url || "").match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/);
  return m ? m[1] : null;
}
const caja = $("#video");
if (caja) {
  const id = idYouTube(caja.dataset.video);
  if (!id) {
    caja.innerHTML = '<p class="cine__aviso">Aquí va tu video. Pega el enlace de YouTube en index.html, en el atributo data-video.</p>';
  } else {
    caja.innerHTML =
      '<img src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="Vista previa del video">' +
      '<button class="cine__play" type="button" aria-label="Reproducir video">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg></button>';
    $(".cine__play", caja).addEventListener("click", () => {
      caja.innerHTML =
        '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" ' +
        'title="Video de Elianis Pérez" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>';
    });
  }
}

/* ---------- Pase de abordar personalizado ---------- */
const hoy = new Date().toLocaleDateString("es-PA", { day: "numeric", month: "long", year: "numeric" });
$("#p-fecha").textContent = hoy;
$("#enlace-correo").href = "mailto:" + CONFIG.correo + "?subject=" + encodeURIComponent("Hola Elianis");

$("#form-pase").addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = $("#nombre-pasajero").value.trim();
  if (!nombre) return;
  $("#p-nombre").textContent = nombre;
  $("#p-talon").textContent = "1A";
  const sello = $("#p-sello");
  sello.hidden = true;
  void sello.offsetWidth; // reinicia la animación del sello
  sello.hidden = false;
  $("#enlace-correo").href =
    "mailto:" + CONFIG.correo +
    "?subject=" + encodeURIComponent("Pasajero " + nombre + " solicita abordar") +
    "&body=" + encodeURIComponent("Hola Elianis, soy " + nombre + " y vi tu portafolio. ");
  mostrar("Pase emitido, " + nombre + ". Ya puedes escribirle desde abajo.", 3500);
});

/* ---------- Anuncio de cabina: campanita, voz y mensaje ---------- */
let toastTimer;
function mostrar(texto, ms) {
  const t = $("#toast");
  t.textContent = texto;
  t.hidden = false;
  clearTimeout(toastTimer);
  if (ms) toastTimer = setTimeout(() => (t.hidden = true), ms);
}
function campanita() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 659.25].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      const t0 = ctx.currentTime + i * 0.5;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.2);
      o.connect(g).connect(ctx.destination);
      o.start(t0); o.stop(t0 + 1.3);
    });
  } catch (_) { /* sin audio, no pasa nada */ }
}
function elegirVoz() {
  const voces = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("es"));
  const femeninas = /paulina|monica|mónica|helena|sabina|laura|google español|female|mujer/i;
  return voces.find((v) => femeninas.test(v.name)) || voces[0] || null;
}
const btn = $("#btn-anuncio");
btn.addEventListener("click", () => {
  if (btn.getAttribute("aria-pressed") === "true") {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    btn.setAttribute("aria-pressed", "false");
    $("#toast").hidden = true;
    return;
  }
  btn.setAttribute("aria-pressed", "true");
  campanita();
  mostrar(CONFIG.anuncio);
  const terminar = () => { btn.setAttribute("aria-pressed", "false"); setTimeout(() => ($("#toast").hidden = true), 1500); };
  if (!("speechSynthesis" in window)) { setTimeout(terminar, 9000); return; }
  setTimeout(() => {
    const u = new SpeechSynthesisUtterance(CONFIG.anuncio);
    const v = elegirVoz();
    u.lang = v ? v.lang : "es-419";
    if (v) u.voice = v;
    u.rate = 0.95; u.pitch = 1.05;
    u.onend = terminar; u.onerror = terminar;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }, 1300);
});
if ("speechSynthesis" in window) speechSynthesis.getVoices();
