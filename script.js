/* ============================================================
   YUME COFFEE — datos y lógica
   ============================================================
   ⚠️ SIN PRECIOS. No publican carta con precios en ningún canal. Los
   productos listados salen de sus reseñas reales, de las palabras más
   repetidas en su ficha, del letrero de su propia fachada ("CAFÉ DE
   ESPECIALIDAD, MATCHA & BRUNCH") y de lo que se ve en sus propias fotos.
   Ninguno inventado. Pedirle la carta al local para cargar los precios.
   ============================================================ */

const MENU = {
  "cafeteria": {
    "label": "Café y matcha",
    "items": [
      {
        "n": "Café de especialidad",
        "d": "Es la palabra más repetida en sus 104 opiniones"
      },
      {
        "n": "Matcha",
        "d": "\"El mejor matcha que he probado\" — publicado por un visitante en su ficha"
      },
      {
        "n": "Capuchino",
        "d": "Servido en loza de gres, con arte latte",
        "img": "capuchino.jpg"
      },
      {
        "n": "Jugo natural",
        "d": "Servido en vaso alto con flor comestible"
      }
    ]
  },
  "dulce": {
    "label": "Pastelería",
    "items": [
      {
        "n": "Tartaleta de pistacho y frambuesa",
        "d": "Fotografiada en el local",
        "img": "tartaletas.jpg"
      },
      {
        "n": "Tarta de chocolate",
        "d": "Con frambuesas, fotografiada en el local"
      },
      {
        "n": "Croissant de almendras",
        "d": "Fotografiado en el local"
      },
      {
        "n": "Pasteles del día",
        "d": "\"Pasteles\" es de lo más nombrado en sus reseñas"
      }
    ]
  },
  "brunch": {
    "label": "Brunch y salado",
    "items": [
      {
        "n": "Sándwich en ciabatta",
        "d": "Ciabatta con verdes frescos, servido en plato de gres",
        "img": "ciabatta.jpg"
      },
      {
        "n": "Brunch",
        "d": "Anunciado en el letrero de su propia fachada: \"café de especialidad, matcha & brunch\""
      }
    ]
  }
};

const money = n => '$' + n.toLocaleString('es-CL');

const tabsEl   = document.getElementById('menuTabs');
const panelsEl = document.getElementById('menuPanels');

Object.keys(MENU).forEach((key, i) => {
  const tab = document.createElement('button');
  tab.className = 'menu-tab' + (i === 0 ? ' active' : '');
  tab.type = 'button';
  tab.textContent = MENU[key].label;
  tab.dataset.key = key;
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
  tab.addEventListener('click', () => showTab(key));
  tabsEl.appendChild(tab);

  const panel = document.createElement('div');
  panel.className = 'menu-panel' + (i === 0 ? ' active' : '');
  panel.id = 'panel-' + key;

  const grid = document.createElement('div');
  grid.className = 'menu-grid';

  MENU[key].items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'menu-item reveal';

    if (item.img) {
      // La clase cf-thumb la necesita el grid de .menu-item para ubicarla en
      // su columna; sin ella la miniatura caia fuera de las areas y abria
      // una fila extra.
      const cont = document.createElement('div');
      cont.className = 'cf-thumb';
      const im = document.createElement('img');
      im.src = 'fotos/' + item.img; im.alt = item.n; im.loading = 'lazy';
      im.style.cssText = 'width:58px;height:58px;object-fit:cover;border-radius:12px;';
      cont.appendChild(im);
      row.appendChild(cont);
    }

    const texto = document.createElement('div');
    texto.className = 'menu-item-text';
    const nombre = document.createElement('span');
    nombre.className = 'name';
    nombre.textContent = item.n;
    texto.appendChild(nombre);

    if (item.d) {
      const desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = item.d;
      texto.appendChild(desc);
    }

    // Sin precio publicado: "Consultar", nunca un monto inventado.
    const precio = document.createElement('div');
    precio.className = 'price';
    precio.textContent = item.p ? money(item.p) : 'Consultar';

    row.appendChild(texto);
    row.appendChild(precio);
    grid.appendChild(row);
  });

  panel.appendChild(grid);
  panelsEl.appendChild(panel);
});

function showTab(key) {
  document.querySelectorAll('.menu-tab').forEach(t => {
    const activo = t.dataset.key === key;
    t.classList.toggle('active', activo);
    t.setAttribute('aria-selected', activo ? 'true' : 'false');
  });
  document.querySelectorAll('.menu-panel').forEach(p => {
    p.classList.toggle('active', p.id === 'panel-' + key);
  });
  initScrollReveal();
}

/* ---------- NAVEGACIÓN POR PESTAÑAS ---------- */
const navLinks = document.getElementById('navLinks');

function goToTab(tabId) {
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.dataset.tabPanel === tabId);
  });
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.tab === tabId);
  });
  navLinks.classList.remove('open');
  document.getElementById('navToggle').setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  initScrollReveal();
}

document.querySelectorAll('[data-tab]').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); goToTab(el.dataset.tab); });
});

document.getElementById('navToggle').addEventListener('click', function () {
  const abierto = navLinks.classList.toggle('open');
  this.setAttribute('aria-expanded', abierto ? 'true' : 'false');
});

/* ---------- INDICADOR ABIERTO / CERRADO ----------
   ⚠️ Google confirma que CIERRA a las 20:45. La hora de apertura NO está publicada: se asume 09:00 como estimación y así se declara en Visítanos. */
function horarioDeHoy() {
  return [9 * 60, 20 * 60 + 45];
}

function actualizarEstado(dotId, textId) {
  const dot  = document.getElementById(dotId);
  const text = document.getElementById(textId);
  if (!dot || !text) return;
  const ahora   = new Date();
  const minutos = ahora.getHours() * 60 + ahora.getMinutes();
  const h       = horarioDeHoy();
  if (!h) {
    // Sin horario publicado: se esconde la pildora entera en vez de
    // afirmar que esta cerrado, cosa que no nos consta.
    const caja = text.closest('.pill, .status-line') || text.parentElement;
    if (caja) caja.hidden = true;
    return;
  }
  const abierto = minutos >= h[0] && minutos < h[1];
  text.textContent = abierto ? 'Abierto ahora' : 'Cerrado ahora';
  dot.classList.toggle('closed', !abierto);
}

actualizarEstado('statusDot', 'statusText');
actualizarEstado('statusDot2', 'statusText2');
actualizarEstado('statusDot3', 'statusText3');

/* ---------- SCROLL REVEAL (con red de seguridad) ---------- */
function initScrollReveal() {
  const els = document.querySelectorAll('.reveal:not(.in)');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach((el, i) => {
    el.style.transitionDelay = (Math.min(i % 6, 6) * 55) + 'ms';
    io.observe(el);
  });

  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in)').forEach(el => el.classList.add('in'));
  }, 1200);
}
initScrollReveal();

window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader').classList.add('done'), 320);
});
