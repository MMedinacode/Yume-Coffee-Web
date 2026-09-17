/* ══════════════════════════════════════════════════════════════════════
   PULIDO — la parte que necesita saber cuándo pasan las cosas
   ══════════════════════════════════════════════════════════════════════
   Acompaña a pulido.css. Todo lo que hace es poner clases y variables;
   el aspecto sigue viviendo en el CSS. Así, si algo se ve mal, se
   corrige en un solo archivo y no hay que tocar JavaScript.

   Está escrito para no pisar nada de lo que ya hacía cada sitio:
   · si un contenedor ya tenía su propio escalonado, no se le pone otro;
   · si el navegador no trae IntersectionObserver, no pasa nada y listo;
   · si alguien pidió menos movimiento, el módulo se va sin hacer ruido.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var quieto = window.matchMedia &&
               window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function listo(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  /* ─── 1. La cabecera sabe si estás arriba ──────────────────────────── */
  function cabecera() {
    var raiz = document.documentElement;
    var ultimo = null;
    function mirar() {
      var abajo = window.pageYOffset > 18;
      if (abajo !== ultimo) {
        raiz.classList.toggle('pl-abajo', abajo);
        ultimo = abajo;
      }
    }
    window.addEventListener('scroll', mirar, { passive: true });
    mirar();
  }

  /* ─── 2. Escalonar lo que entra en pantalla ────────────────────────────
     Se numeran los hijos con --pl-i y se marca el contenedor recién
     cuando asoma. Numerar de entrada haría que la cascada se gastara
     mientras nadie la mira. */
  var CONTENEDORES = [
    '.menu', '.menu-grid', '.menu-items', '.menu-list',
    '.redes-grid', '.red-grid', '.resenas-grid', '.reviews-grid',
    '.info-grid', '.galeria', '.gallery'
  ].join(',');

  function cascada() {
    if (quieto || !('IntersectionObserver' in window)) return;

    var cajas = document.querySelectorAll(CONTENEDORES);
    var candidatos = [];
    for (var i = 0; i < cajas.length; i++) {
      var c = cajas[i];
      /* Si el sitio ya tenía su propio escalonado, se respeta el suyo. */
      if (c.className.indexOf('stagger') >= 0) continue;
      if (c.children.length < 2 || c.children.length > 60) continue;
      candidatos.push(c);
    }
    if (!candidatos.length) return;

    var obs = new IntersectionObserver(function (entradas) {
      for (var k = 0; k < entradas.length; k++) {
        if (!entradas[k].isIntersecting) continue;
        var caja = entradas[k].target;
        obs.unobserve(caja);
        var hijos = caja.children;
        /* Se topa en 14: a partir de ahí la espera ya se sentiría. */
        for (var j = 0; j < hijos.length; j++) {
          hijos[j].style.setProperty('--pl-i', Math.min(j, 14));
        }
        caja.classList.add('pl-cascada');
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });

    for (var m = 0; m < candidatos.length; m++) obs.observe(candidatos[m]);
  }

  /* ─── 3. Al cambiar de pestaña, la cascada vuelve a empezar ──────────
     Los paneles ocultos nunca asomaron, así que su cascada estaba sin
     estrenar. Se observa el cambio de clase del panel y se numera ahí
     mismo lo que acaba de quedar a la vista. */
  function alCambiarDePestana() {
    if (quieto || !('MutationObserver' in window)) return;
    var paneles = document.querySelectorAll('.tab-panel, .tab-section, [data-tab-panel]');
    if (!paneles.length) return;

    var mo = new MutationObserver(function (cambios) {
      for (var i = 0; i < cambios.length; i++) {
        var p = cambios[i].target;
        if (!p.classList.contains('active') && !p.classList.contains('on')) continue;
        var cajas = p.querySelectorAll(CONTENEDORES);
        for (var j = 0; j < cajas.length; j++) {
          var c = cajas[j];
          if (c.className.indexOf('stagger') >= 0) continue;
          if (c.children.length < 2 || c.children.length > 60) continue;
          for (var k = 0; k < c.children.length; k++) {
            c.children[k].style.setProperty('--pl-i', Math.min(k, 14));
          }
          c.classList.remove('pl-cascada');
          /* Forzar el reflow para que la animación se vuelva a disparar. */
          void c.offsetWidth;
          c.classList.add('pl-cascada');
        }
      }
    });
    for (var n = 0; n < paneles.length; n++) {
      mo.observe(paneles[n], { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* ─── 4. Las fotos de galería, con marco que recorta ─────────────────
     Sólo se marca el envoltorio cuando la foto es la única hija: si hay
     texto al lado, el zoom se vería raro. */
  function zoomFotos() {
    var figs = document.querySelectorAll('figure, .foto, .galeria a, .gallery a, .split-img');
    for (var i = 0; i < figs.length; i++) {
      var f = figs[i];
      if (f.classList.contains('pl-zoom')) continue;
      var imgs = f.querySelectorAll('img');
      if (imgs.length !== 1) continue;
      /* Nada de tocar el logo ni los iconos. */
      var src = imgs[0].getAttribute('src') || '';
      if (/logo|icon|favicon/i.test(src)) continue;
      f.classList.add('pl-zoom');
    }
  }

  /* ─── 5. El número de reseñas se cuenta solo ──────────────────────────
     Sólo la primera vez y sólo si el número es de verdad: se lee del
     texto que ya estaba escrito, nunca se inventa una cifra. */
  function contarResenas() {
    if (quieto || !('IntersectionObserver' in window)) return;
    var nodos = document.querySelectorAll('[data-pl-contar]');
    if (!nodos.length) return;

    var obs = new IntersectionObserver(function (entradas) {
      for (var i = 0; i < entradas.length; i++) {
        if (!entradas[i].isIntersecting) continue;
        var el = entradas[i].target;
        obs.unobserve(el);
        var fin = parseInt(el.getAttribute('data-pl-contar'), 10);
        if (!fin || fin > 100000) continue;
        el.classList.add('pl-contando');
        var ini = performance.now();
        var dur = 900;
        (function paso(t) {
          var p = Math.min(1, (t - ini) / dur);
          /* easeOutCubic: arranca rápido y frena al final */
          var e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(fin * e).toLocaleString('es-CL');
          if (p < 1) requestAnimationFrame(paso);
        })(ini);
      }
    }, { threshold: 0.5 });

    for (var j = 0; j < nodos.length; j++) obs.observe(nodos[j]);
  }

  listo(function () {
    try { cabecera(); } catch (e) {}
    try { cascada(); } catch (e) {}
    try { alCambiarDePestana(); } catch (e) {}
    try { zoomFotos(); } catch (e) {}
    try { contarResenas(); } catch (e) {}
  });
})();
