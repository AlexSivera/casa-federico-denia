/* Casa Federico — interacción mínima, sin dependencias.
   La página funciona sin JS: la clase .js en <html> activa los estados animados. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ——— Estado de hoy (zona Europe/Madrid). Horario verificado en Google Business Profile. ——— */
  var TURNOS = [[13 * 60 + 30, 16 * 60, 'comidas'], [19 * 60 + 30, 23 * 60, 'cenas']];
  var DIA_CERRADO = 2;          // martes
  var MES_VACACIONES = 0;       // enero
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  function ahoraMadrid() {
    try {
      var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', weekday: 'short', month: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
      var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
      return { dia: wd, mes: +o.month - 1, min: (+o.hour) * 60 + (+o.minute) };
    } catch (e) {
      var d = new Date(); return { dia: d.getDay(), mes: d.getMonth(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  var hh = function (m) { return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); };

  function estado() {
    var n = ahoraMadrid();
    var manana = (n.dia + 1) % 7;
    var proximo = manana === DIA_CERRADO ? 'el ' + DIAS[(manana + 1) % 7] : 'mañana';
    if (n.mes === MES_VACACIONES) return { c: 'tancat', t: '<strong>Enero: cerrados por vacaciones.</strong> Volvemos en febrero.' };
    if (n.dia === DIA_CERRADO) return { c: 'tancat', t: '<strong>Hoy martes cerramos.</strong> Volvemos mañana a las 13:30.' };
    for (var i = 0; i < TURNOS.length; i++) {
      var t = TURNOS[i];
      if (n.min >= t[0] && n.min < t[1]) return { c: 'obert', t: '<strong>Abierto ahora</strong> · ' + t[2] + ' hasta las ' + hh(t[1]) };
      if (n.min < t[0]) return { c: i ? 'tancat' : 'obert', t: '<strong>Hoy abrimos</strong> ' + (i ? 'para cenas a las ' : 'a las ') + hh(t[0]) + (i ? '' : ' · cenas desde las 19:30') };
    }
    return { c: 'tancat', t: '<strong>Ya hemos cerrado.</strong> Abrimos ' + proximo + ' a las 13:30.' };
  }
  var hoy = $('[data-hoy]');
  if (hoy) {
    var e = estado();
    hoy.classList.add('is-' + e.c);
    $('[data-hoy-text]', hoy).innerHTML = e.t;
  }
  var horari = $('[data-horari]');
  if (horari) {
    var fila = $('tr[data-dia="' + ahoraMadrid().dia + '"]', horari);
    if (fila) { fila.classList.add('is-avui'); $('th', fila).insertAdjacentHTML('beforeend', ' <span class="sr">(hoy)</span>'); }
  }

  /* ——— Cabecera con borde al bajar y barra móvil tras la portada ——— */
  var cab = $('[data-cab]');
  var barra = $('[data-barra]');
  var portada = $('.portada, .pagina-cap');
  if (barra) document.body.classList.add('te-barra');
  function alScroll() {
    var y = window.scrollY;
    if (cab) cab.classList.toggle('is-baix', y > 8);
    if (barra && portada) barra.classList.toggle('is-visible', y > portada.offsetHeight * 0.6);
  }
  window.addEventListener('scroll', alScroll, { passive: true });
  alScroll();

  /* ——— Menú móvil ——— */
  var menu = $('[data-menu]');
  if (menu && typeof menu.showModal === 'function') {
    $$('[data-obre-menu]').forEach(function (b) { b.addEventListener('click', function () { menu.showModal(); }); });
    $$('[data-tanca-menu]').forEach(function (b) { b.addEventListener('click', function () { menu.close(); }); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { menu.close(); }); });
    menu.addEventListener('click', function (ev) { if (ev.target === menu) menu.close(); });
  }

  /* ——— Paella que gira con el scroll, como cuando se posa en la mesa ——— */
  var paella = $('[data-gira]');
  if (paella && !reduce) {
    var pend = false;
    var gira = function () {
      pend = false;
      var r = paella.getBoundingClientRect();
      var p = Math.min(Math.max(1 - (r.top + r.height) / (window.innerHeight + r.height), 0), 1);
      paella.style.transform = 'rotate(' + (-14 + p * 44).toFixed(2) + 'deg)';
    };
    window.addEventListener('scroll', function () { if (!pend) { pend = true; requestAnimationFrame(gira); } }, { passive: true });
    gira();
  }

  /* ——— Seco, meloso o caldoso ——— */
  var TEXTURAS = {
    sec: ['Seco, en su paella', 'Grano suelto, capa fina y el socarrat pegado al fondo. Se sirve en la misma paella, en el centro de la mesa.', 'Como la <b>paella valenciana</b> o el <b>arroz a banda</b>.'],
    melos: ['Meloso, envuelto en su caldo', 'Cremoso, con el caldo justo para que el grano quede jugoso. Ni paella ni sopa: se come con tenedor o con cuchara.', 'Prueba el <b>senyoret</b> o el <b>bogavante</b>, melosos.'],
    caldos: ['Caldoso, de cuchara', 'Con caldo abundante, en cazuela honda. El arroz de los días de fresco y de las comidas largas.', 'Como el <b>arròs amb fesols i naps</b> o el <b>caldós de rap i verdura</b>.']
  };
  var textura = $('[data-textura]');
  if (textura) {
    $$('[data-tria]', textura).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-tria');
        textura.setAttribute('data-textura', k);
        $$('[data-tria]', textura).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        $('[data-desc-t]', textura).textContent = TEXTURAS[k][0];
        $('[data-desc-p]', textura).textContent = TEXTURAS[k][1];
        $('[data-desc-e]', textura).innerHTML = TEXTURAS[k][2];
      });
    });
  }

  /* ——— Filtro de arroces ——— */
  var filtres = $$('[data-filtre]');
  filtres.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filtre');
      filtres.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      $$('.arros').forEach(function (li) {
        li.hidden = f !== 'tots' && (' ' + li.getAttribute('data-familia') + ' ').indexOf(' ' + f + ' ') < 0;
      });
    });
  });

  var mes = $('[data-mes-arrossos]');
  if (mes) {
    mes.addEventListener('click', function () {
      $('#llista-arrossos').classList.remove('arros-curta');
      mes.setAttribute('aria-expanded', 'true');
      mes.hidden = true;
    });
    // Al filtrar se ve la lista completa de esa familia.
    filtres.forEach(function (b) { b.addEventListener('click', function () { if (b.getAttribute('data-filtre') !== 'tots') mes.click(); }); });
  }

  /* ——— Aparición al entrar en pantalla ——— */
  var vistos = $$('[data-aparece], [data-mencions]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-vist'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    vistos.forEach(function (el) { io.observe(el); });
  } else {
    vistos.forEach(function (el) { el.classList.add('is-vist'); });
  }

  /* ——— Carta: idioma (VAL · ES · EN) y sección activa ——— */
  var carta = $('[data-idioma]');
  if (carta) {
    var guardat = null;
    try { guardat = localStorage.getItem('cf-idioma'); } catch (err) { /* sin almacenamiento */ }
    var posa = function (l) {
      carta.setAttribute('data-idioma', l);
      $$('[data-posa-idioma]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-posa-idioma') === l)); });
      try { localStorage.setItem('cf-idioma', l); } catch (err) { /* sin almacenamiento */ }
    };
    if (guardat === 'val' || guardat === 'en' || guardat === 'es') posa(guardat);
    $$('[data-posa-idioma]').forEach(function (b) { b.addEventListener('click', function () { posa(b.getAttribute('data-posa-idioma')); }); });

    var enllacos = $$('.carta-index a');
    if ('IntersectionObserver' in window && enllacos.length) {
      var actiu = function (id) {
        enllacos.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + id;
          a.classList.toggle('is-actiu', on);
          if (on) { a.setAttribute('aria-current', 'true'); a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' }); }
          else a.removeAttribute('aria-current');
        });
      };
      var io2 = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) actiu(en.target.id); });
      }, { rootMargin: '-35% 0px -60% 0px' });
      $$('.carta-sec').forEach(function (s) { io2.observe(s); });
    }
  }

  /* ——— Reservas: módulo oficial en español o inglés ——— */
  var modul = $('[data-modul]');
  if (modul) {
    var URLS = {
      es: 'https://www.covermanager.com/reservation/module_restaurant/restaurante-casafedericolesmarines/spanish',
      en: 'https://www.covermanager.com/reservation/module_restaurant/restaurante-casafedericolesmarines/english'
    };
    var frame = $('iframe', modul);
    $$('[data-modul-idioma]', modul).forEach(function (b) {
      b.addEventListener('click', function () {
        var l = b.getAttribute('data-modul-idioma');
        $$('[data-modul-idioma]', modul).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        frame.src = URLS[l];
        frame.title = l === 'en' ? 'Book a table at Casa Federico' : 'Reserva de mesa en Casa Federico';
      });
    });
  }
})();
