/* Core: data helpers, store (cart / favourites / compare), facets, search, shared renderers. */
(function () {
  'use strict';
  const PT = (window.PT = {});
  // No official photo found yet for these: keep them out of the mockup.
  const NO_PHOTO = ['sytong-am06-35-lrf', 'innomount-qd-weaver', 'nextorch-wl50ir', 'arkon-arma-lr25'];
  const products = ((window.PT_DATA && window.PT_DATA.products) || []).filter((p) => !NO_PHOTO.includes(p.id));

  products.forEach((p, i) => {
    if (p.stock === 'pre') { p.rating = 0; p.reviews = 0; }
    p.img = 'img/' + p.id + '.webp';
    p.pop = (p.hit ? 1000 : 0) + (p.reviews || 0) * 4 + (p.rating || 0) * 10 - i;
  });
  PT.products = products;
  PT.byId = Object.fromEntries(products.map((p) => [p.id, p]));

  /* ---------- tiny utils ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nf = new Intl.NumberFormat('ru-RU');
  const num = (n) => nf.format(n);
  const rub = (n) => nf.format(n) + ' ₽';
  const icon = (id, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  };
  const dec = (x) => String(x).replace('.', ',');
  Object.assign(PT, { esc, num, rub, icon, plural, dec });

  /* ---------- events ---------- */
  const handlers = {};
  PT.on = (ev, fn) => (handlers[ev] = handlers[ev] || []).push(fn);
  PT.emit = (ev, data) => (handlers[ev] || []).forEach((fn) => fn(data));

  /* ---------- storage (per viewer, optional) ---------- */
  const LS = {
    get(k, d) { try { const v = localStorage.getItem('pt.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('pt.' + k, JSON.stringify(v)); } catch (e) { /* storage blocked: keep in memory */ } },
  };
  PT.LS = LS;
  const valid = (id) => !!PT.byId[id];
  const store = {
    cart: Object.fromEntries(Object.entries(LS.get('cart', {})).filter(([id, q]) => valid(id) && q > 0)),
    fav: LS.get('fav', []).filter(valid),
    cmp: LS.get('cmp', []).filter(valid).slice(0, 4),
  };
  PT.store = store;
  const save = (k) => { LS.set(k, store[k]); PT.emit('store', k); };

  PT.cart = {
    add(id, q = 1) { store.cart[id] = (store.cart[id] || 0) + q; save('cart'); },
    set(id, q) { if (q <= 0) delete store.cart[id]; else store.cart[id] = Math.min(q, 9); save('cart'); },
    remove(id) { delete store.cart[id]; save('cart'); },
    clear() { store.cart = {}; save('cart'); },
    has: (id) => !!store.cart[id],
    lines: () => Object.entries(store.cart).map(([id, q]) => ({ p: PT.byId[id], q })).filter((l) => l.p),
    count: () => Object.values(store.cart).reduce((a, b) => a + b, 0),
    total: () => PT.cart.lines().reduce((s, l) => s + l.p.price * l.q, 0),
  };
  PT.fav = {
    has: (id) => store.fav.includes(id),
    toggle(id) { const i = store.fav.indexOf(id); if (i >= 0) store.fav.splice(i, 1); else store.fav.unshift(id); save('fav'); return i < 0; },
  };
  PT.cmp = {
    has: (id) => store.cmp.includes(id),
    toggle(id) {
      const i = store.cmp.indexOf(id);
      if (i >= 0) { store.cmp.splice(i, 1); save('cmp'); return 'removed'; }
      if (store.cmp.length >= 4) return 'full';
      store.cmp.push(id); save('cmp'); return 'added';
    },
    set(ids) { store.cmp = ids.filter(valid).slice(0, 4); save('cmp'); },
    remove(id) { store.cmp = store.cmp.filter((x) => x !== id); save('cmp'); },
  };

  /* ---------- catalogue structure ---------- */
  PT.CATS = [
    { id: 'monoculars', name: 'Тепловизоры', note: 'Монокуляры для наблюдения и поиска', hero: 'pulsar-telos-lrf-xp50' },
    { id: 'scopes', name: 'Тепловизионные прицелы', short: 'Прицелы', note: 'Прицелы и насадки на дневную оптику', hero: 'pulsar-thermion-2-lrf-xp50-pro' },
    { id: 'binoculars', name: 'Бинокли', note: 'Тепловизионные и мультиспектральные', hero: 'pulsar-merger-lrf-xp50' },
    { id: 'digital', name: 'Цифровая оптика', note: 'Прицелы и бинокли день/ночь', hero: 'arkon-nvd-pro-lrf' },
    { id: 'accessories', name: 'Аксессуары', note: 'Аккумуляторы, крепления, ИК-осветители', hero: 'pulsar-aps3' },
  ];
  PT.catById = Object.fromEntries(PT.CATS.map((c) => [c.id, c]));
  PT.SUBS = {
    thermal: 'Тепловизионные', clipon: 'Насадки на дневной прицел', multi: 'Мультиспектральные',
    scope: 'Прицелы день/ночь', binocular: 'Бинокли день/ночь', monocular: 'Монокуляры день/ночь', battery: 'Аккумуляторы', charger: 'Зарядные устройства', mount: 'Крепления', case: 'Чехлы и сумки', ir: 'ИК-осветители', other: 'Прочее',
  };
  PT.BRANDS = [
    { id: 'pulsar', name: 'Pulsar' }, { id: 'hikmicro', name: 'HIKMICRO' }, { id: 'nocpix', name: 'Nocpix', logo: 'nocpix.webp' },
    { id: 'guide', name: 'Guide', logo: 'guide.svg' }, { id: 'infiray', name: 'InfiRay' }, { id: 'arkon', name: 'Arkon' },
    { id: 'sytong', name: 'Sytong' }, { id: 'innomount', name: 'Innomount' }, { id: 'nextorch', name: 'Nextorch' },
  ];
  PT.brandId = (name) => String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
  PT.brandByName = (name) => PT.BRANDS.find((b) => b.id === PT.brandId(name));

  // Collections from the client's structure (sections 8–11) + useful filter landings.
  PT.COLS = {
    stock: { title: 'В наличии', desc: 'Только то, что лежит на складе. Заказ до 16:00 уходит в тот же день.', test: (p) => p.stock === 'in' },
    new: { title: 'Новинки', desc: 'Модели, которые только появились на рынке и у нас.', test: (p) => p.new },
    hits: { title: 'Хиты продаж', desc: 'То, что покупают чаще всего.', test: (p) => p.hit },
    preorder: { title: 'Предзаказ', desc: 'Ожидаем поступление: дата, цена и оформление предзаказа без предоплаты.', test: (p) => p.stock === 'pre' },
  };

  /* ---------- labels ---------- */
  PT.stockLabel = (p) => (p.stock === 'in' ? 'В наличии' : p.stock === 'pre' ? 'Ожидаем ' + p.eta : 'Под заказ, 7–10 дней');
  PT.stockHtml = (p) => `<span class="stock stock-${p.stock}">${esc(PT.stockLabel(p))}</span>`;
  PT.netdLabel = (p) => (p.netd ? '≤ ' + p.netd + ' мК' : null);
  PT.rangeLabel = (p) => (p.range ? num(p.range) + ' м' : null);
  PT.lrfLabel = (p) => (p.lrf > 1 ? 'до ' + num(p.lrf) + ' м' : p.lrf ? 'есть' : 'нет');
  PT.batteryLabel = (p) => (p.battery ? 'до ' + dec(p.battery) + ' ч' : null);
  PT.weightLabel = (p) => (p.weight ? (p.weight >= 1000 ? dec(+(p.weight / 1000).toFixed(2)) + ' кг' : p.weight + ' г') : null);
  PT.lensLabel = (p) => (p.lens ? p.lens + ' мм' : null);
  PT.resLabel = (p) => {
    if (!p.res) return null;
    if (p.cat === 'digital') return p.res === '3840×2160' ? '4K, 3840×2160' : p.res === '5360×3008' ? '16 МП' : p.res;
    return p.res;
  };
  PT.pixels = (res) => { const m = /(\d+)×(\d+)/.exec(res || ''); return m ? +m[1] * +m[2] : 0; };
  PT.split = (price) => Math.ceil(price / 12 / 100) * 100;

  PT.cardSpecs = (p) => {
    if (p.cat === 'accessories') return p.compat ? [p.compat.split(',')[0]] : [];
    const s = [PT.resLabel(p), PT.netdLabel(p), PT.lensLabel(p), PT.rangeLabel(p)];
    if (p.lrf) s.push('LRF');
    return s.filter(Boolean).slice(0, 4);
  };

  PT.keySpecs = (p) => {
    if (p.cat === 'accessories') return [];
    const k = [
      { i: 'i-matrix', l: 'Матрица', v: PT.resLabel(p) },
      { i: 'i-temp', l: 'NETD', v: PT.netdLabel(p) },
      { i: 'i-target', l: 'Дальность', v: PT.rangeLabel(p) },
      { i: 'i-lens', l: 'Объектив', v: PT.lensLabel(p) },
      { i: 'i-laser', l: 'Дальномер', v: p.lrf ? PT.lrfLabel(p) : 'нет' },
      { i: 'i-zoom', l: 'Увеличение', v: p.mag },
      { i: 'i-battery', l: 'Работа', v: PT.batteryLabel(p) },
      { i: 'i-weight', l: 'Вес', v: PT.weightLabel(p) },
    ];
    return k.filter((x) => x.v);
  };

  /* ---------- shared renderers ---------- */
  PT.thumb = (p, cls) => `<span class="thumb${cls ? ' ' + cls : ''}"><img src="${p.img}" alt="${esc(p.name)}" loading="lazy" decoding="async"></span>`;

  PT.badges = (p) => {
    const b = [];
    if (p.new) b.push('<span class="badge badge-new">Новинка</span>');
    if (p.hit) b.push('<span class="badge badge-hit">Хит</span>');
    if (p.old) b.push(`<span class="badge badge-sale">−${Math.round((1 - p.price / p.old) * 100)}%</span>`);
    if (p.stock === 'pre') b.push('<span class="badge badge-pre">Предзаказ</span>');
    return b.join('');
  };

  PT.cartBtn = (p) => {
    const inCart = PT.cart.has(p.id);
    const pre = p.stock === 'pre';
    const label = inCart ? 'Уже в корзине, открыть' : pre ? 'Оформить предзаказ' : 'Добавить в корзину';
    return `<button class="cart-btn${inCart ? ' in' : pre ? ' pre' : ''}" data-act="${inCart ? 'cart-open' : 'cart-add'}" data-id="${p.id}" aria-label="${label}: ${esc(p.name)}" title="${label}">${icon(inCart ? 'i-check' : pre ? 'i-calendar' : 'i-cart')}</button>`;
  };

  PT.rating = (p) => (p.reviews ? `<span class="pcard-rating">${icon('i-star')}${dec(p.rating.toFixed(1))} · ${p.reviews} ${plural(p.reviews, 'отзыв', 'отзыва', 'отзывов')}</span>` : '');

  PT.card = (p) => {
    const fav = PT.fav.has(p.id), cmp = PT.cmp.has(p.id);
    return `<article class="pcard" data-id="${p.id}">
      <div class="pcard-badges">${PT.badges(p)}</div>
      <div class="pcard-acts">
        <button class="pcard-act${fav ? ' on' : ''}" data-act="fav" data-id="${p.id}" aria-pressed="${fav}" aria-label="В избранное: ${esc(p.name)}">${icon('i-heart', 'ic-heart')}</button>
        ${p.cat !== 'accessories' ? `<button class="pcard-act${cmp ? ' on' : ''}" data-act="cmp" data-id="${p.id}" aria-pressed="${cmp}" aria-label="Сравнить: ${esc(p.name)}">${icon('i-compare')}</button>` : ''}
      </div>
      <a class="pcard-img" href="#p-${p.id}" tabindex="-1" aria-hidden="true">${PT.thumb(p)}</a>
      <div class="pcard-body">
        <span class="pcard-brand">${esc(p.brand)}</span>
        <a class="pcard-name" href="#p-${p.id}">${esc(p.name)}</a>
        <div class="specs">${PT.cardSpecs(p).map((s) => `<span class="spec">${esc(s)}</span>`).join('')}</div>
        ${PT.rating(p)}
        ${PT.stockHtml(p)}
        <div class="pcard-foot">
          <div class="pcard-price">${p.old ? `<span class="price-old">${rub(p.old)}</span>` : ''}<span class="price">${rub(p.price)}</span></div>
          ${PT.cartBtn(p)}
        </div>
      </div>
    </article>`;
  };

  PT.miniLine = (p, extra) => `<a class="msg-card" href="#p-${p.id}">${PT.thumb(p)}<span><b>${esc(p.name)}</b><small><span>${rub(p.price)}</span><span>${esc(PT.stockLabel(p))}</span>${extra ? `<span>${esc(extra)}</span>` : ''}</small></span></a>`;

  PT.stars = (n) => `<span class="stars" aria-label="Оценка ${n} из 5">${Array.from({ length: 5 }, (_, i) => icon('i-star', i < n ? '' : 'ic-off')).join('')}</span>`;

  /* ---------- facets ---------- */
  const B = (id, label, test) => ({ id, label, test });
  PT.FACETS = {
    cat: { label: 'Категория', type: 'multi', get: (p) => p.cat, opts: () => PT.CATS.map((c) => B(c.id, c.name)) },
    sub: { label: 'Тип', type: 'multi', get: (p) => p.sub, opts: (list) => Object.keys(PT.SUBS).filter((s) => list.some((p) => p.sub === s)).map((s) => B(s, PT.SUBS[s])) },
    stock: { label: 'Наличие', type: 'multi', get: (p) => p.stock, opts: () => [B('in', 'В наличии'), B('pre', 'Предзаказ'), B('order', 'Под заказ')] },
    brand: {
      label: 'Бренд', type: 'multi', get: (p) => p.brand,
      opts: (list) => { const c = {}; list.forEach((p) => (c[p.brand] = (c[p.brand] || 0) + 1)); return Object.keys(c).sort((a, b) => c[b] - c[a] || a.localeCompare(b)).map((b) => B(b, b)); },
    },
    res: {
      label: 'Разрешение матрицы', hint: 'Больше точек, детальнее картинка на дальней дистанции', type: 'multi', get: (p) => p.res,
      opts: (list) => Array.from(new Set(list.map((p) => p.res).filter(Boolean))).sort((a, b) => PT.pixels(b) - PT.pixels(a)).map((r) => B(r, r === '3840×2160' ? '3840×2160 (4K)' : r)),
    },
    netd: {
      label: 'Чувствительность NETD', hint: 'Чем меньше, тем контрастнее в туман и дождь', type: 'one', get: (p) => p.netd,
      opts: () => [B('15', 'до 15 мК', (v) => v != null && v <= 15), B('25', 'до 25 мК', (v) => v != null && v <= 25), B('40', 'до 40 мК', (v) => v != null && v <= 40)],
    },
    lens: {
      label: 'Объектив', type: 'multi', get: (p) => p.lens,
      opts: () => [B('s', 'до 35 мм: лес, близко', (v) => v != null && v <= 35), B('m', '50 мм: универсально', (v) => v > 35 && v < 56), B('l', '60 мм и больше: поля', (v) => v >= 56)],
    },
    range: {
      label: 'Дальность обнаружения', type: 'one', get: (p) => p.range,
      opts: () => [B('1500', 'от 1 500 м', (v) => v >= 1500), B('2500', 'от 2 500 м', (v) => v >= 2500), B('3000', 'от 3 000 м', (v) => v >= 3000)],
    },
  };
  PT.FACET_SETS = {
    monoculars: ['stock', 'brand', 'res', 'netd', 'lens', 'range'],
    scopes: ['sub', 'stock', 'brand', 'res', 'netd', 'lens', 'range'],
    binoculars: ['sub', 'stock', 'brand', 'res', 'netd', 'range'],
    digital: ['sub', 'stock', 'brand', 'res'],
    accessories: ['sub', 'stock', 'brand'],
    any: ['cat', 'stock', 'brand', 'res', 'netd', 'range'],
  };

  PT.newFilter = () => ({ sel: {}, lrf: false, pmin: null, pmax: null, wmax: null, flag: null });

  const testFacet = (p, fid, vals) => {
    if (!vals || !vals.length) return true;
    const f = PT.FACETS[fid];
    const v = f.get(p);
    const opts = f.opts(PT.products);
    return vals.some((id) => {
      const o = opts.find((x) => x.id === id);
      if (o && o.test) return o.test(v);
      return String(v) === String(id);
    });
  };
  PT.passes = (p, f, except) => {
    for (const fid in f.sel) if (fid !== except && !testFacet(p, fid, f.sel[fid])) return false;
    if (except !== 'lrf' && f.lrf && !(p.lrf > 0)) return false;
    if (except !== 'price') {
      if (f.pmin != null && p.price < f.pmin) return false;
      if (f.pmax != null && p.price > f.pmax) return false;
    }
    if (f.wmax != null && !(p.weight && p.weight <= f.wmax)) return false;
    if (f.flag === 'new' && !p.new) return false;
    if (f.flag === 'hit' && !p.hit) return false;
    if (f.flag === 'pro' && !(p.price >= 300000)) return false;
    return true;
  };
  PT.filter = (list, f) => list.filter((p) => PT.passes(p, f));
  PT.facetCounts = (list, f, fid) => {
    const base = list.filter((p) => PT.passes(p, f, fid));
    const facet = PT.FACETS[fid];
    return facet.opts(list).map((o) => ({ ...o, n: base.filter((p) => (o.test ? o.test(facet.get(p)) : String(facet.get(p)) === o.id)).length }));
  };

  // Presets: the client's sub-sections ("С дальномером", "4K", "Премиальные"…) become one-click filters.
  const setSel = (f, fid, v) => {
    const cur = f.sel[fid] || [];
    const on = cur.length === 1 && cur[0] === v;
    f.sel[fid] = on ? [] : [v];
  };
  PT.PRESETS = {
    stock: { label: 'В наличии', on: (f) => (f.sel.stock || []).join() === 'in', toggle: (f) => setSel(f, 'stock', 'in') },
    lrf: { label: 'С дальномером', on: (f) => f.lrf, toggle: (f) => (f.lrf = !f.lrf) },
    hd: { label: 'HD-матрица 1280×1024', on: (f) => (f.sel.res || []).join() === '1280×1024', toggle: (f) => setSel(f, 'res', '1280×1024') },
    k4: { label: '4K', on: (f) => (f.sel.res || []).join() === '3840×2160', toggle: (f) => setSel(f, 'res', '3840×2160') },
    premium: { label: 'Премиальные', on: (f) => f.pmin === 400000, toggle: (f) => (f.pmin = f.pmin === 400000 ? null : 400000) },
    budget: { label: 'До 150 000 ₽', on: (f) => f.pmax === 150000, toggle: (f) => (f.pmax = f.pmax === 150000 ? null : 150000) },
    compact: { label: 'Компактные до 450 г', on: (f) => f.wmax === 450, toggle: (f) => (f.wmax = f.wmax === 450 ? null : 450) },
    pro: { label: 'Профессиональные', on: (f) => f.flag === 'pro', toggle: (f) => (f.flag = f.flag === 'pro' ? null : 'pro') },
    new: { label: 'Новинки', on: (f) => f.flag === 'new', toggle: (f) => (f.flag = f.flag === 'new' ? null : 'new') },
    thermal: { label: 'Тепловизионные', on: (f) => (f.sel.sub || []).join() === 'thermal', toggle: (f) => setSel(f, 'sub', 'thermal') },
    clipon: { label: 'Насадки', on: (f) => (f.sel.sub || []).join() === 'clipon', toggle: (f) => setSel(f, 'sub', 'clipon') },
    multi: { label: 'Мультиспектральные', on: (f) => (f.sel.sub || []).join() === 'multi', toggle: (f) => setSel(f, 'sub', 'multi') },
    scope: { label: 'Прицелы день/ночь', on: (f) => (f.sel.sub || []).join() === 'scope', toggle: (f) => setSel(f, 'sub', 'scope') },
    binocular: { label: 'Бинокли день/ночь', on: (f) => (f.sel.sub || []).join() === 'binocular', toggle: (f) => setSel(f, 'sub', 'binocular') },
    battery: { label: 'Аккумуляторы', on: (f) => (f.sel.sub || []).join() === 'battery', toggle: (f) => setSel(f, 'sub', 'battery') },
    mount: { label: 'Крепления', on: (f) => (f.sel.sub || []).join() === 'mount', toggle: (f) => setSel(f, 'sub', 'mount') },
    ...Object.fromEntries(['monocular', 'charger', 'case', 'other'].map((k) => [k, { label: PT.SUBS[k], on: (f) => (f.sel.sub || []).join() === k, toggle: (f) => setSel(f, 'sub', k) }])),
    ir: { label: 'ИК-осветители', on: (f) => (f.sel.sub || []).join() === 'ir', toggle: (f) => setSel(f, 'sub', 'ir') },
  };
  PT.PRESET_SETS = {
    monoculars: ['lrf', 'compact', 'pro', 'hd', 'new', 'stock'],
    scopes: ['thermal', 'clipon', 'lrf', 'hd', 'premium', 'budget', 'stock'],
    binoculars: ['thermal', 'multi', 'lrf', 'hd', 'premium'],
    digital: ['scope', 'monocular', 'binocular', 'k4', 'lrf'],
    accessories: ['mount', 'battery', 'charger', 'case', 'ir', 'other'],
    any: ['stock', 'lrf', 'hd', 'new', 'budget', 'premium'],
  };

  PT.SORTS = [
    ['pop', 'Сначала популярные', (a, b) => b.pop - a.pop],
    ['cheap', 'Сначала дешевле', (a, b) => a.price - b.price],
    ['exp', 'Сначала дороже', (a, b) => b.price - a.price],
    ['new', 'Сначала новинки', (a, b) => (b.new || 0) - (a.new || 0) || b.pop - a.pop],
    ['range', 'По дальности обнаружения', (a, b) => (b.range || 0) - (a.range || 0)],
  ];

  /* ---------- search ---------- */
  const SYN = {
    'пульсар': 'pulsar', 'хикмикро': 'hikmicro', 'хикмайкро': 'hikmicro', 'хикмикра': 'hikmicro', 'нокпикс': 'nocpix', 'нокпекс': 'nocpix',
    'гайд': 'guide', 'гуиде': 'guide', 'инфирей': 'infiray', 'айрей': 'iray', 'аркон': 'arkon', 'ситонг': 'sytong', 'сайтонг': 'sytong',
    'термион': 'thermion', 'телос': 'telos', 'аксион': 'axion', 'мерджер': 'merger', 'мерджэр': 'merger', 'талион': 'talion',
    'трейл': 'trail', 'криптон': 'krypton', 'хаброк': 'habrok', 'стеллар': 'stellar', 'квест': 'quest', 'виста': 'vista', 'мейт': 'mate',
    'невис': 'nevis', 'арма': 'arma', 'альфа': 'alfa', 'эйс': 'ace', 'иннумаунт': 'innomount', 'некстторч': 'nextorch',
    'лрф': 'lrf', 'дальномер': 'lrf', 'дальномером': 'lrf', 'тепляк': 'тепловизор', 'тепловик': 'тепловизор', 'тепляки': 'тепловизор',
    'монокуляр': 'монокуляр', 'насадка': 'насадк', 'аккумулятор': 'аккумулятор', 'акб': 'аккумулятор', 'батарея': 'аккумулятор', 'кронштейн': 'креплен',
    'ночник': 'ночн', 'пнв': 'ночн',
  };
  const EN = "`qwertyuiop[]asdfghjkl;'zxcvbnm,.";
  const RU = 'ёйцукенгшщзхъфывапролджэячсмитьбю';
  PT.swapLayout = (s) => {
    let out = '', changed = false;
    for (const ch of s.toLowerCase()) {
      const i = EN.indexOf(ch);
      if (i >= 0) { out += RU[i]; changed = true; continue; }
      const j = RU.indexOf(ch);
      if (j >= 0) { out += EN[j]; changed = true; continue; }
      out += ch;
    }
    return changed ? out : null;
  };
  const normStr = (s) => String(s).toLowerCase().replace(/ё/g, 'е').replace(/[×x]/g, 'x').replace(/[^a-zа-я0-9x.]+/g, ' ').trim();
  const stem = (t) => (t.length > 5 ? t.replace(/(ами|ями|ого|его|ому|ему|ыми|ими|ом|ем|ов|ей|ам|ям|ах|ях|ый|ий|ая|яя|ое|ее|ые|ие|ы|и|а|я|е|у|ю|о)$/, '') : t);
  products.forEach((p) => {
    p._idx = normStr([p.name, p.brand, p.type, p.res, p.res && p.res.replace('×', 'x'), PT.catById[p.cat].name, PT.SUBS[p.sub], p.lrf ? 'lrf дальномер' : '', p.cat === 'monoculars' ? 'тепловизор монокуляр' : '', p.cat === 'scopes' ? 'прицел тепловизор' : '', p.cat === 'binoculars' ? 'бинокль тепловизор' : '', p.cat === 'digital' ? 'ночного видения ночн цифровой' : '', p.compat || ''].join(' '));
  });
  PT.parseBudget = (q) => {
    const s = q.toLowerCase().replace(/ /g, ' ');
    const m = /(?:до|дешевле|не дороже|бюджет|за)\s*(\d[\d\s]*(?:[.,]\d+)?)\s*(тыс|т\.р|тр|к\b|k\b|000|руб|₽|млн)?/.exec(s) || /(\d[\d\s]*)\s*(тыс|т\.р|тр|к\b|k\b)/.exec(s);
    if (!m) return null;
    let n = parseFloat(m[1].replace(/\s/g, '').replace(',', '.'));
    const u = m[2] || '';
    if (/тыс|т\.р|тр|к|k/.test(u)) n *= 1000;
    else if (/млн/.test(u)) n *= 1e6;
    else if (n < 2000) n *= 1000;
    return n >= 5000 ? Math.round(n) : null;
  };
  PT.search = (raw) => {
    const q = String(raw || '').trim();
    if (!q) return { items: [], q, budget: null };
    const budget = PT.parseBudget(q);
    const run = (text) => {
      const cleaned = normStr(text.replace(/(до|дешевле|не дороже|бюджет|за)\s*\d[\d\s]*(?:[.,]\d+)?\s*(тыс\S*|т\.р|тр|к\b|k\b|000|руб\S*|₽|млн)?/gi, ' '));
      const toks = cleaned.split(' ').filter((t) => t && !['для', 'на', 'с', 'и', 'в', 'по', 'от', 'до', 'руб', 'рублей', 'купить', 'цена'].includes(t)).map((t) => SYN[t] || stem(t));
      let items = products.filter((p) => toks.every((t) => p._idx.includes(t)));
      if (budget) items = items.filter((p) => p.price <= budget);
      return { items, toks };
    };
    let r = run(q), swapped = null;
    if (!r.items.length) {
      const alt = PT.swapLayout(q);
      if (alt) { const r2 = run(alt); if (r2.items.length) { r = r2; swapped = alt; } }
    }
    r.items.sort((a, b) => b.pop - a.pop);
    return { items: r.items, q, swapped, budget };
  };

  /* ---------- thermal canvases (lazy) ---------- */
  const drawFallback = (c) => {
    const x = c.getContext('2d');
    const g = x.createRadialGradient(c.width * 0.5, c.height * 0.6, 4, c.width * 0.5, c.height * 0.5, c.width * 0.7);
    g.addColorStop(0, '#5c5f63'); g.addColorStop(1, '#0f1114');
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  };
  PT.paint = (c) => {
    const r = c.getBoundingClientRect();
    if (!r.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const max = +(c.dataset.max || 720);
    const w = Math.min(Math.round(r.width * dpr), max), h = Math.round(w * (r.height / r.width));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const opts = { scene: c.dataset.scene || 'boar', palette: c.dataset.palette || 'white', seed: +(c.dataset.seed || 7) };
    try { if (window.Thermal && window.Thermal.render) window.Thermal.render(c, opts); else drawFallback(c); } catch (e) { drawFallback(c); }
    c.dataset.painted = opts.palette;
  };
  let io = null;
  PT.paintAll = (root) => {
    const list = Array.from((root || document).querySelectorAll('canvas[data-scene]'));
    if (!('IntersectionObserver' in window)) { list.forEach(PT.paint); return; }
    io = io || new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); PT.paint(e.target); } }), { rootMargin: '200px' });
    list.forEach((c) => io.observe(c));
  };
})();
