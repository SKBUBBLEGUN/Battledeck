(() => {
  'use strict';

  /* ============ utilidades ============ */
  const $ = (s, r = document) => r.querySelector(s);

  const store = {
    get(k, d) { try { const v = localStorage.getItem('bd.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('bd.' + k, JSON.stringify(v)); } catch { /* sem storage */ } }
  };

  function el(tag, props = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    n.append(...kids);
    return n;
  }

  function rng(seed) {
    let s = 0;
    for (const c of seed) s = (s * 31 + c.charCodeAt(0)) >>> 0;
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  }

  function barcode(svg, seed, w = 200, h = 30) {
    const r = rng(seed);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    let x = 0, out = '';
    while (x < w) {
      const bw = 1 + Math.floor(r() * 4);
      const gap = 1 + Math.floor(r() * 3);
      if (x + bw > w) break;
      const tall = r() > 0.15;
      out += `<rect x="${x}" y="${tall ? 0 : h * 0.25}" width="${bw}" height="${tall ? h : h * 0.5}"/>`;
      x += bw + gap;
    }
    svg.innerHTML = out;
  }

  const normalizeUrl = (u) => {
    u = u.trim();
    if (!u) return '';
    return /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : 'https://' + u;
  };
  const looksLikeUrl = (t) => /^[^\s]+\.[a-z]{2,}(\/.*)?$/i.test(t) || /^https?:\/\//i.test(t);
  const NATIVE = typeof window.Android !== 'undefined'; // true dentro do app Android
  document.documentElement.classList.toggle('native', NATIVE);
  const openExternal = (url) => (NATIVE ? window.Android.openUrl(url) : window.open(url, '_blank', 'noopener'));
  const nativeCall = (name) => { try { window.Android.launchCategory(name); return true; } catch { return false; } };

  /* ============ ícones ============ */
  const ICONS = {
    hack: '<path d="M8 4L4 8h3v8h2V8h3L8 4zm8 16l4-4h-3V8h-2v8h-3l4 4z"/>',
    folder: '<path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/>',
    pencil: '<path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>',
    search: '<path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>',
    camera: '<path d="M9 2L7.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3.17L15 2H9zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-1.8a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/>',
    mail: '<path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>',
    chat: '<path d="M21 6h-2v9H6v2a1 1 0 0 0 1 1h11l4 4V7a1 1 0 0 0-1-1zm-4 6V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v14l4-4h10a1 1 0 0 0 1-1z"/>',
    dial: [4, 12, 20].flatMap(y => [5, 12, 19].map(x => `<circle cx="${x}" cy="${y}" r="1.8"/>`)).join('') + '<circle cx="12" cy="21.5" r="1.8"/>'
  };
  const icon = (k) => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICONS[k]}</svg>`;

  /* ============ CONFIGURAÇÃO DOS APPS ============ */
  // Edite aqui para mudar os botões do dock.
  const APPS = [
    { id: 'hack',      label: 'HACK',      sub: 'ENCRYPTED TERMINAL',     icon: 'hack',   run: openTerminal },
    NATIVE
      ? { id: 'shortcuts', label: 'APPS', sub: 'INSTALLED PROGRAMS', icon: 'folder', run: openApps }
      : { id: 'shortcuts', label: 'SHORTCUTS', sub: 'ADVANCED COMMAND TOOLS', icon: 'folder', run: openShortcuts },
    { id: 'notes',     label: 'NOTES',     sub: 'LOCAL DATA VAULT',       icon: 'pencil', run: openNotes },
    { id: 'search',    label: 'SEARCH',    sub: 'GLOBAL NETWORK QUERY',   icon: 'search', run: openSearch },
    { id: 'camera',    label: 'CAMERA',    sub: 'OPTICAL SURVEILLANCE',   icon: 'camera', run: openCamera },
    { id: 'email',     label: 'EMAIL',     sub: 'SECURE COMM CHANNEL',    icon: 'mail',   run: () => { if (!(NATIVE && nativeCall('email'))) location.href = 'mailto:'; } },
    { id: 'messages',  label: 'MESSAGES',  sub: 'ENCRYPTED TRANSMISSION', icon: 'chat',   run: () => { if (!(NATIVE && nativeCall('sms'))) location.href = 'sms:'; } },
    { id: 'phone',     label: 'PHONE',     sub: 'VOICE CONNECTION',       icon: 'dial',   run: () => { if (!(NATIVE && nativeCall('phone'))) location.href = 'tel:'; } }
  ];

  const DEFAULT_SHORTCUTS = [
    { name: 'GitHub',    url: 'https://github.com' },
    { name: 'YouTube',   url: 'https://youtube.com' },
    { name: 'Maps',      url: 'https://maps.google.com' },
    { name: 'Wikipedia', url: 'https://pt.wikipedia.org' }
  ];

  /* ============ dock ============ */
  const dock = $('#dock');
  for (const app of APPS) {
    const b = el('button', { class: 'app', type: 'button', 'data-app': app.id });
    b.innerHTML = `${icon(app.icon)}<span class="label">${app.label}</span><span class="sub">${app.sub}</span>`;
    b.addEventListener('click', app.run);
    dock.append(b);
  }

  /* ============ modal ============ */
  let cleanup = null;
  function openModal(title, build) {
    closeModal();
    $('#modal-title').textContent = title;
    $('#overlay').hidden = false;
    build($('#modal-body'));
  }
  function closeModal() {
    if (cleanup) { cleanup(); cleanup = null; }
    $('#overlay').hidden = true;
    $('#modal-body').replaceChildren();
  }
  $('#modal-close').addEventListener('click', closeModal);
  $('#overlay').addEventListener('click', (e) => { if (e.target.id === 'overlay') closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---- Shortcuts ---- */
  function openShortcuts() {
    openModal('SHORTCUTS', (body) => {
      const list = el('ul', { class: 'sc-list' });
      const render = () => {
        const items = store.get('shortcuts', DEFAULT_SHORTCUTS);
        list.replaceChildren(...items.map((s, i) => {
          const a = el('a', { href: s.url, target: '_blank', rel: 'noopener' }, s.name, el('small', {}, s.url));
          a.addEventListener('click', (e) => { if (NATIVE) { e.preventDefault(); openExternal(s.url); } });
          const del = el('button', { type: 'button', 'aria-label': 'Remover ' + s.name }, '✕');
          del.addEventListener('click', () => {
            const cur = store.get('shortcuts', DEFAULT_SHORTCUTS).filter((_, j) => j !== i);
            store.set('shortcuts', cur); render();
          });
          return el('li', {}, a, del);
        }));
        if (!items.length) list.append(el('li', {}, el('p', { class: 'hint' }, 'NENHUM ATALHO. ADICIONE ABAIXO.')));
      };
      const name = el('input', { type: 'text', placeholder: 'NOME', autocomplete: 'off' });
      const url = el('input', { type: 'url', placeholder: 'URL (ex: github.com)', autocomplete: 'off', inputmode: 'url' });
      const add = el('button', { class: 'btn', type: 'submit' }, 'ADICIONAR');
      const form = el('form', {}, name, url, add);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = normalizeUrl(url.value);
        if (!u) return;
        const items = store.get('shortcuts', DEFAULT_SHORTCUTS);
        items.push({ name: name.value.trim() || u.replace(/^https?:\/\//, ''), url: u });
        store.set('shortcuts', items);
        name.value = url.value = ''; render();
      });
      body.append(list, form, el('p', { class: 'hint' }, 'DADOS SALVOS APENAS NESTE DISPOSITIVO.'));
      render();
    });
  }
  $('#btn-add').addEventListener('click', openShortcuts);

  /* ---- Apps instalados (somente no app Android) ---- */
  function openApps() {
    if (!NATIVE) return openShortcuts();
    openModal('APPS', (body) => {
      let apps = [];
      try { apps = JSON.parse(window.Android.getApps()); } catch { /* lista vazia */ }
      let favs = store.get('favs', []);
      const q = el('input', { type: 'text', placeholder: 'filtrar apps...', autocomplete: 'off', autocapitalize: 'off' });
      const list = el('ul', { class: 'app-list' });
      const io = 'IntersectionObserver' in window
        ? new IntersectionObserver((entries) => {
            for (const en of entries) {
              if (!en.isIntersecting) continue;
              io.unobserve(en.target);
              try {
                const d = window.Android.getIcon(en.target.dataset.pkg);
                if (d) en.target.src = 'data:image/png;base64,' + d;
              } catch { /* sem ícone */ }
            }
          })
        : null;
      cleanup = () => { if (io) io.disconnect(); };

      const render = () => {
        const term = q.value.trim().toLowerCase();
        const rows = apps
          .filter((a) => !term || a.label.toLowerCase().includes(term))
          .sort((a, b) => favs.includes(b.pkg) - favs.includes(a.pkg));
        list.replaceChildren(...rows.map((a) => {
          const isFav = favs.includes(a.pkg);
          const img = el('img', { alt: '', width: '36', height: '36', 'data-pkg': a.pkg });
          const open = el('button', { class: 'app-item', type: 'button' }, img, el('span', {}, a.label));
          open.addEventListener('click', () => { if (window.Android.launch(a.pkg)) closeModal(); });
          const star = el('button', { class: 'star' + (isFav ? ' on' : ''), type: 'button', 'aria-label': 'Favoritar ' + a.label }, isFav ? '★' : '☆');
          star.addEventListener('click', () => {
            favs = isFav ? favs.filter((p) => p !== a.pkg) : [...favs, a.pkg];
            store.set('favs', favs); render();
          });
          if (io) io.observe(img);
          return el('li', {}, open, star);
        }));
      };
      q.addEventListener('input', render);
      body.append(q, list);
      render();
    });
  }

  /* ---- Notes ---- */
  function openNotes() {
    openModal('NOTES', (body) => {
      const ta = el('textarea', { placeholder: '> escreva aqui...', spellcheck: 'false' });
      ta.value = store.get('notes', '');
      ta.addEventListener('input', () => store.set('notes', ta.value));
      body.append(ta, el('p', { class: 'hint' }, 'AUTO-SAVE ATIVO · LOCALSTORAGE'));
      setTimeout(() => ta.focus(), 50);
    });
  }

  /* ---- Search ---- */
  function openSearch() {
    openModal('SEARCH', (body) => {
      const q = el('input', { type: 'text', placeholder: 'buscar ou digitar URL', autocomplete: 'off', autocapitalize: 'off', enterkeyhint: 'search' });
      const go = el('button', { class: 'btn', type: 'submit' }, 'EXECUTAR');
      const form = el('form', {}, q, go);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const t = q.value.trim();
        if (!t) return;
        openExternal(looksLikeUrl(t) ? normalizeUrl(t) : 'https://duckduckgo.com/?q=' + encodeURIComponent(t));
        closeModal();
      });
      body.append(form);
      setTimeout(() => q.focus(), 50);
    });
  }

  /* ---- Camera ---- */
  const camInput = $('#cam-input');
  function openCamera() {
    if (NATIVE && nativeCall('camera')) return;
    camInput.value = ''; camInput.click();
  }
  camInput.addEventListener('change', () => {
    const f = camInput.files && camInput.files[0];
    if (!f) return;
    const src = URL.createObjectURL(f);
    openModal('CAMERA', (body) => {
      cleanup = () => URL.revokeObjectURL(src);
      const dl = el('a', { class: 'btn', href: src, download: 'capture-' + Date.now() + '.jpg', style: 'display:inline-block;text-decoration:none' }, 'SALVAR');
      body.append(el('img', { class: 'cam-preview', src, alt: 'Captura' }), dl);
    });
  });

  /* ---- Hack terminal ---- */
  function openTerminal() {
    openModal('HACK // TERMINAL', (body) => {
      const out = el('pre', { class: 'term-out' });
      const input = el('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'comando' });
      const form = el('form', { class: 'term-form' }, el('span', {}, 'root@deck:~#'), input);
      const print = (t = '') => { out.textContent += t + '\n'; out.scrollTop = out.scrollHeight; };

      const boot = [
        '[ OK ] mounting /dev/battledeck',
        '[ OK ] bypassing firewall ........ done',
        '[ OK ] handshake 0xC0FFEE ........ done',
        'ACCESS GRANTED. digite "help".', ''
      ];
      let i = 0;
      const t = setInterval(() => { if (i < boot.length) print(boot[i++]); else clearInterval(t); }, 320);
      cleanup = () => clearInterval(t);

      const cmds = {
        help: () => print('help  clear  date  whoami  scan  open <url>  search <termo>  notes  exit'),
        clear: () => { out.textContent = ''; },
        date: () => print(new Date().toString()),
        whoami: () => print('root (operador não certificado)'),
        scan: () => {
          let n = 0;
          const s = setInterval(() => {
            print('scanning sector 0x' + Math.floor(Math.random() * 65535).toString(16).padStart(4, '0') + ' ... clean');
            if (++n >= 6) { clearInterval(s); print('scan completo: 0 ameaças.'); }
          }, 200);
        },
        open: (a) => a ? (print('abrindo ' + a), openExternal(normalizeUrl(a))) : print('uso: open <url>'),
        search: (a) => a ? (print('buscando...'), openExternal('https://duckduckgo.com/?q=' + encodeURIComponent(a))) : print('uso: search <termo>'),
        notes: () => { closeModal(); openNotes(); },
        exit: () => closeModal()
      };

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const line = input.value.trim();
        input.value = '';
        if (!line) return;
        print('root@deck:~# ' + line);
        const [cmd, ...rest] = line.split(/\s+/);
        (cmds[cmd.toLowerCase()] || (() => print('comando não encontrado: ' + cmd)))(rest.join(' '));
      });

      body.append(out, form);
      setTimeout(() => input.focus(), 50);
    });
  }

  /* ============ cabeçalho: data, scan, barcodes ============ */
  const label = $('#date-label');
  label.textContent = store.get('label', 'CYBERDECK');
  label.addEventListener('click', () => {
    const v = prompt('Nome do painel:', label.textContent);
    if (v && v.trim()) { label.textContent = v.trim().toUpperCase(); store.set('label', label.textContent); }
  });

  function updateDate() {
    const d = new Date();
    const wd = d.toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '').toUpperCase();
    const rest = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }).toUpperCase();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    $('#day').textContent = d.getDate(); // dia do mês, de 1 a 31
    $('#date-full').textContent = `${wd}, ${rest} · ${hh}:${mm}`;
  }
  updateDate();
  setInterval(updateDate, 15000);

  let pct = 0;
  const bar = $('#scan-bar');
  setInterval(() => {
    pct += Math.random() * 3;
    if (pct >= 100) pct = 0;
    const p = Math.floor(pct);
    bar.style.setProperty('--p', p + '%');
    $('#scan-pct').textContent = p + '%';
    $('#scan-files').textContent = `${Math.round(p * 14.4)} / 1440 FILES`;
  }, 140);

  barcode($('#bc-top'), 'battledeck-top', 200, 30);
  barcode($('#bc-foot'), 'battledeck-foot-' + new Date().getFullYear(), 220, 34);

  /* ============ régua (arrastável) ============ */
  const ruler = $('#ruler');
  const ticks = el('div', { class: 'ticks' });
  for (let i = 0; i < 64; i++) ticks.append(el('i', { class: i % 5 === 0 ? 'l' : '' }));
  ruler.prepend(ticks);

  const moveMarker = (clientY) => {
    const r = ruler.getBoundingClientRect();
    const pctY = Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100));
    ruler.style.setProperty('--m', pctY + '%');
  };
  let dragging = false;
  ruler.addEventListener('pointerdown', (e) => { dragging = true; ruler.setPointerCapture(e.pointerId); moveMarker(e.clientY); });
  ruler.addEventListener('pointermove', (e) => { if (dragging) moveMarker(e.clientY); });
  ruler.addEventListener('pointerup', () => { dragging = false; });
  ruler.addEventListener('pointercancel', () => { dragging = false; });

  /* ============ ganchos do launcher Android ============ */
  window.onHome = () => closeModal();                                   // botão Home
  window.onBack = () => { if (!$('#overlay').hidden) closeModal(); };   // botão Voltar

  if (NATIVE) { // deslizar para cima abre a lista de apps
    let y0 = null;
    const deck = $('#deck');
    deck.addEventListener('touchstart', (e) => {
      y0 = $('#overlay').hidden && !e.target.closest('.dock, .ruler, .plus') ? e.touches[0].clientY : null;
    }, { passive: true });
    deck.addEventListener('touchend', (e) => {
      if (y0 !== null && y0 - e.changedTouches[0].clientY > 90) openApps();
      y0 = null;
    }, { passive: true });
  }
})();