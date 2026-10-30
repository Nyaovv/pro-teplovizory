/* UI: router, header, drawers, toasts, chat consultant, event delegation. */
(function () {
  'use strict';
  const PT = window.PT, V = PT.views;
  const { esc, rub, icon, plural } = PT;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const app = $('#app');

  /* ---------- toasts ---------- */
  PT.toast = (text, action) => {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `${icon('i-check')}<span>${esc(text)}</span>${action ? `<a href="${action[1]}">${esc(action[0])}</a>` : ''}`;
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), 3600);
  };

  /* ---------- counters ---------- */
  const syncCounts = () => {
    const c = { cart: PT.cart.count(), fav: PT.store.fav.length, cmp: PT.store.cmp.length };
    $$('[data-count]').forEach((el) => {
      const v = c[el.dataset.count];
      if (String(v) !== el.textContent && v) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
      el.textContent = v; el.hidden = !v;
    });
    const sum = $('[data-cart-sum]');
    if (sum) sum.textContent = c.cart ? rub(PT.cart.total()) : 'Корзина';
  };
  PT.on('store', () => { syncCounts(); refreshButtons(); if (!$('#cart').hidden) renderCart(); });

  // Update card buttons in place instead of re-rendering the page.
  const refreshButtons = () => {
    $$('[data-act="fav"]').forEach((b) => { const on = PT.fav.has(b.dataset.id); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    $$('[data-act="cmp"]').forEach((b) => { const on = PT.cmp.has(b.dataset.id); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    $$('.cart-btn').forEach((b) => { const p = PT.byId[b.dataset.id]; if (p) b.outerHTML = PT.cartBtn(p); });
  };

  /* ---------- overlays ---------- */
  const overlays = ['#cart', '#mmenu', '#fsheet', '#modal'];
  let lastFocus = null;
  const openOverlay = (sel) => {
    closeAll(true);
    lastFocus = document.activeElement;
    $(sel).hidden = false;
    if (sel !== '#modal') $('#scrim').hidden = false;
    document.body.style.overflow = 'hidden';
    const f = $(sel).querySelector('input, button, a[href]');
    if (f) setTimeout(() => f.focus({ preventScroll: true }), 30);
  };
  const closeAll = (quiet) => {
    overlays.forEach((s) => ($(s).hidden = true));
    $('#scrim').hidden = true;
    document.body.style.overflow = '';
    closeMega();
    if (!quiet && lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  };
  PT.closeAll = closeAll;

  /* ---------- cart drawer ---------- */
  const renderCart = () => {
    const lines = PT.cart.lines();
    const body = $('#cart-body'), foot = $('#cart-foot');
    if (!lines.length) {
      body.innerHTML = `<div class="empty" style="border:0">${icon('i-cart')}<h3>В корзине пусто</h3><p>Добавьте прибор из каталога. Если не знаете, что выбрать, пройдите подбор.</p><div class="row"><a class="btn" href="#catalog" data-act="close-all">Каталог</a><a class="btn btn-ghost" href="#quiz" data-act="close-all">Подбор прибора</a></div></div>`;
      foot.innerHTML = '';
      return;
    }
    const total = PT.cart.total();
    const extras = PT.products.filter((p) => p.cat === 'accessories' && !PT.cart.has(p.id)).slice(0, 2);
    body.innerHTML = lines.map(({ p, q }) => `<div class="cart-line">${PT.thumb(p)}<div><a class="n" href="#p-${p.id}" data-act="close-all">${esc(p.name)}</a><div>${PT.stockHtml(p)}</div><div class="row"><span class="qty"><button data-act="qty" data-id="${p.id}" data-d="-1" aria-label="Меньше">${icon('i-minus')}</button><span>${q}</span><button data-act="qty" data-id="${p.id}" data-d="1" aria-label="Больше">${icon('i-plus')}</button></span><b class="tnum">${rub(p.price * q)}</b><button class="icon-btn icon-btn-sm" data-act="cart-rm" data-id="${p.id}" aria-label="Удалить ${esc(p.name)}">${icon('i-trash')}</button></div></div></div>`).join('')
      + `<div class="cart-sum"><div><span>${PT.cart.count()} ${plural(PT.cart.count(), 'товар', 'товара', 'товаров')}</span><span>${rub(total)}</span></div><div><span>Доставка СДЭК</span><span>${total >= 30000 ? 'бесплатно' : 'от 490 ₽'}</span></div><div class="big"><span>Итого</span><span>${rub(total)}</span></div></div>`
      + (extras.length ? `<div class="cart-x"><b>Часто берут вместе</b>${extras.map((p) => `<div class="cart-x-item">${PT.thumb(p)}<span>${esc(p.name)}<br><span class="muted">${rub(p.price)}</span></span><button class="btn btn-ghost btn-sm" data-act="cart-add" data-id="${p.id}" aria-label="Добавить ${esc(p.name)}">${icon('i-plus')}</button></div>`).join('')}</div>` : '');
    foot.innerHTML = `<a class="btn btn-lg" href="#checkout" data-act="close-all">Оформить заказ</a>`;
  };

  /* ---------- mega menu ---------- */
  const megaHtml = () => {
    const col = (c, links) => `<div class="mega-col"><h3><a href="#cat-${c.id}">${c.name}</a></h3>${links.map(([t, h]) => `<a class="ml" href="#${h}">${t}</a>`).join('')}</div>`;
    const C = PT.catById;
    return col(C.monoculars, [['Все монокуляры', 'cat-monoculars'], ['С дальномером', 'cat-monoculars.lrf'], ['Компактные', 'cat-monoculars.compact'], ['Профессиональные', 'cat-monoculars.pro'], ['Новинки', 'cat-monoculars.new']])
      + col(C.scopes, [['Тепловизионные', 'cat-scopes.thermal'], ['Насадки на дневной прицел', 'cat-scopes.clipon'], ['С дальномером', 'cat-scopes.lrf'], ['HD 1280×1024', 'cat-scopes.hd'], ['Премиальные', 'cat-scopes.premium'], ['До 150 000 ₽', 'cat-scopes.budget']])
      + col(C.binoculars, [['Тепловизионные', 'cat-binoculars.thermal'], ['Мультиспектральные', 'cat-binoculars.multi'], ['С дальномером', 'cat-binoculars.lrf'], ['Премиальные', 'cat-binoculars.premium']])
      + col(C.digital, [['Прицелы день/ночь', 'cat-digital.scope'], ['Бинокли день/ночь', 'cat-digital.binocular'], ['4K', 'cat-digital.k4'], ['ИК-осветители', 'cat-accessories.ir']])
      + col(C.accessories, [['Аккумуляторы', 'cat-accessories.battery'], ['Крепления', 'cat-accessories.mount'], ['ИК-осветители', 'cat-accessories.ir']])
      + `<div class="mega-side"><h3>Подборки</h3><div class="chips"><a class="chip" href="#col-stock">В наличии</a><a class="chip" href="#col-new">Новинки</a><a class="chip" href="#col-hits">Хиты продаж</a><a class="chip" href="#col-preorder">Предзаказ</a><a class="chip" href="#brands">Бренды</a></div><a class="btn btn-sm" href="#quiz">${icon('i-spark')}Подобрать прибор</a></div>`;
  };
  const openMega = () => { $('#mega-in').innerHTML = megaHtml(); $('#mega').hidden = false; $$('[data-act="mega"]').forEach((b) => b.setAttribute('aria-expanded', 'true')); };
  const closeMega = () => { $('#mega').hidden = true; $$('[data-act="mega"]').forEach((b) => b.setAttribute('aria-expanded', 'false')); };

  const mobileMenu = () => {
    $('#mmenu-body').innerHTML = PT.CATS.map((c) => `<details class="mm-group"><summary>${c.name}${icon('i-chev-d')}</summary><a href="#cat-${c.id}">Все товары</a>${(PT.PRESET_SETS[c.id] || []).map((k) => `<a href="#cat-${c.id}.${k}">${PT.PRESETS[k].label}</a>`).join('')}</details>`).join('')
      + `<div class="mm-links"><a href="#col-stock">В наличии</a><a href="#col-new">Новинки</a><a href="#col-preorder">Предзаказ</a><a href="#quiz">Подбор прибора</a><a href="#brands">Бренды</a><a href="#reviews-list">Обзоры</a><a href="#reviews">Отзывы</a><a href="#info-about">О компании</a><a href="#info-contacts">Контакты</a><a href="#info-delivery">Доставка и оплата</a><a href="#info-warranty">Гарантия и сервис</a><a href="#fav">Избранное</a><a href="#project">Как будет устроен сайт</a></div>
      <div class="mm-phone"><b class="tnum">8 (800) 000-00-00</b><span class="muted">Ежедневно 10:00–20:00</span><button class="btn btn-sm" data-act="callback">Заказать звонок</button></div>`;
    openOverlay('#mmenu');
  };

  /* ---------- search ---------- */
  const q = $('#q'), drop = $('#search-drop');
  let active = -1;
  const renderDrop = () => {
    const val = q.value.trim();
    if (val.length < 2) { drop.hidden = true; return; }
    const r = PT.search(val);
    const cats = PT.CATS.filter((c) => c.name.toLowerCase().includes(val.toLowerCase().slice(0, 5)));
    let h = r.swapped ? `<div class="sd-note">Показываем результаты по запросу «${esc(r.swapped)}»</div>` : r.budget ? `<div class="sd-note">Учли бюджет: до ${rub(r.budget)}</div>` : '';
    if (cats.length) h += `<div class="sd-group"><div class="sd-title">Категории</div>${cats.map((c) => `<a class="sd-cat" href="#cat-${c.id}">${c.name}<span class="muted">${PT.products.filter((p) => p.cat === c.id).length}</span></a>`).join('')}</div>`;
    if (r.items.length) h += `<div class="sd-group"><div class="sd-title">Товары</div>${r.items.slice(0, 6).map((p) => `<a class="sd-item" href="#p-${p.id}">${PT.thumb(p)}<span><span class="sd-name">${esc(p.name)}</span><br><span class="sd-meta">${esc(PT.stockLabel(p))}</span></span><span class="sd-price">${rub(p.price)}</span></a>`).join('')}</div><a class="sd-all" href="#search" data-act="search-all">Все результаты: ${r.items.length}${icon('i-chev-r')}</a>`;
    if (!r.items.length && !cats.length) h += `<div class="sd-empty"><b>Ничего не нашли по «${esc(val)}»</b>Попробуйте название модели или бренда. Или <button class="link-btn" data-act="chat-q" data-q="${esc(val)}">спросите консультанта</button>.</div>`;
    drop.innerHTML = h; drop.hidden = false; active = -1;
  };
  q.addEventListener('input', renderDrop);
  q.addEventListener('focus', renderDrop);
  q.addEventListener('keydown', (e) => {
    const items = $$('.sd-item, .sd-cat, .sd-all', drop);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!items.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((x, i) => x.classList.toggle('is-active', i === active));
    } else if (e.key === 'Enter' && active >= 0 && items[active]) { e.preventDefault(); items[active].click(); }
    else if (e.key === 'Escape') { drop.hidden = true; q.blur(); }
  });
  $('#search').addEventListener('submit', (e) => { e.preventDefault(); goSearch(); });
  const goSearch = () => { PT.lastQuery = q.value.trim(); drop.hidden = true; if (!PT.lastQuery) return; if (location.hash === '#search') render(); else location.hash = 'search'; };
  document.addEventListener('click', (e) => { if (!e.target.closest('#search')) drop.hidden = true; if (!e.target.closest('#mega, [data-act="mega"]')) closeMega(); });

  /* ---------- hero ---------- */
  let heroI = 0, heroT = null;
  const heroGo = (i) => {
    const slides = $$('.hero-slide');
    if (!slides.length) return;
    heroI = (i + slides.length) % slides.length;
    slides.forEach((s, k) => (s.hidden = k !== heroI));
    $$('.hero-dots button').forEach((b, k) => b.classList.toggle('on', k === heroI));
    PT.paintAll(slides[heroI]);
  };

  /* ---------- chat consultant (rules for the mockup; the real site uses a neural network over the catalogue) ---------- */
  const log = $('#chat-log'), chips = $('#chat-chips');
  let chatStarted = false;
  const CHIPS = ['Прицел для кабана до 300 тыс.', 'Что взять для леса?', 'Чем отличается NETD 15 и 40?', 'Есть ли в наличии Thermion 3?', 'Как доставка и оплата?', 'Позвать менеджера'];
  const addMsg = (who, html) => { const m = document.createElement('div'); m.className = 'msg msg-' + who; m.innerHTML = html; log.appendChild(m); log.scrollTop = log.scrollHeight; return m; };
  const startChat = () => {
    if (chatStarted) return;
    chatStarted = true;
    addMsg('bot', '<p>Здравствуйте! Я консультант PRO ТЕПЛОВИЗОРЫ и знаю характеристики и наличие всех моделей в каталоге.</p><p>Расскажите, для чего нужен прибор и какой бюджет, подберу 2–3 варианта. Или выберите вопрос ниже.</p>');
    chips.innerHTML = CHIPS.map((c) => `<button data-act="chat-q" data-q="${esc(c)}">${esc(c)}</button>`).join('');
  };
  const nlow = (s) => s.toLowerCase().replace(/ё/g, 'е');
  const findProduct = (t) => {
    const s = nlow(t);
    let bestP = null, bestScore = 0;
    PT.products.forEach((p) => {
      const words = nlow(p.name).split(/\s+/).filter((w) => w.length > 1);
      const hits = words.filter((w) => s.includes(w)).length;
      const score = hits / words.length + (s.includes(nlow(p.name)) ? 1 : 0);
      if (hits >= 2 && score > bestScore) { bestScore = score; bestP = p; }
    });
    if (!bestP) {
      const r = PT.search(t);
      if (r.items.length && r.items.length <= 3 && /(thermion|термион|merger|мерджер|telos|телос|axion|аксион|ace|quest|квест|habrok|хаброк|stellar|krypton|talion|trail|vista|arma|nevis)/i.test(t)) bestP = r.items[0];
    }
    return bestP;
  };
  const cards = (list, why) => `<div class="msg-cards">${list.map((p, i) => PT.miniLine(p, why ? why[i] : '')).join('')}</div>`;
  const recommend = (t) => {
    const s = nlow(t);
    const cat = /насадк/.test(s) ? 'clip' : /прицел/.test(s) ? 'scopes' : /бинокл/.test(s) ? 'binoculars' : /монокуляр|поиск|подранк|наблюд/.test(s) ? 'monoculars' : /ночн|день.?ночь|цифров/.test(s) ? 'digital' : null;
    const budget = PT.parseBudget(t);
    const lrf = /дальномер|lrf|дистанц/.test(s);
    const field = /пол[еяю]|дальн|далеко|степ/.test(s), forest = /лес|загон|близк/.test(s);
    let list = PT.products.filter((p) => p.cat !== 'accessories');
    if (cat === 'clip') list = list.filter((p) => p.sub === 'clipon');
    else if (cat) list = list.filter((p) => p.cat === cat);
    if (budget) list = list.filter((p) => p.price <= budget);
    if (lrf) list = list.filter((p) => p.lrf > 0);
    if (!cat && !budget && !lrf && !field && !forest && !/кабан|лис|косул|олен|заяц|охот/.test(s)) return null;
    const scored = list.map((p) => ({ p, s: (field ? (p.range || 0) / 100 : 0) + (forest ? (p.weight && p.weight < 700 ? 15 : 0) : 0) + (p.stock === 'in' ? 6 : 0) + (p.hit ? 5 : 0) + (budget ? (p.price / budget) * 10 : 0) + (/кабан/.test(s) && p.lrf ? 6 : 0) + (/лис/.test(s) ? PT.pixels(p.res) / 80000 : 0) }))
      .sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.p);
    if (!list.length) return { html: `<p>Под ${budget ? 'бюджет до ' + rub(budget) : 'эти условия'}${lrf ? ' с дальномером' : ''} в каталоге моделей нет.</p><p>Можно чуть поднять бюджет или убрать дальномер. Позвать менеджера, чтобы он предложил варианты под заказ?</p>`, chips: ['Позвать менеджера', 'Что есть до 150 тыс.?'] };
    const what = cat === 'scopes' ? 'прицелы' : cat === 'binoculars' ? 'бинокли' : cat === 'monoculars' ? 'монокуляры' : cat === 'clip' ? 'насадки' : cat === 'digital' ? 'приборы день/ночь' : 'модели';
    const ctx = [budget ? 'до ' + rub(budget) : '', lrf ? 'с дальномером' : '', field ? 'для полей' : forest ? 'для леса' : ''].filter(Boolean).join(', ');
    return { html: `<p>Вот ${what}${ctx ? ' ' + ctx : ''}, которые я бы посмотрел первыми:</p>${cards(scored, scored.map((p) => [PT.resLabel(p), p.lrf ? 'LRF' : ''].filter(Boolean).join(' · ')))}<p>${field ? 'Для полей важны дальность и матрица 640 и выше. ' : forest ? 'Для леса важнее вес и широкий угол обзора, объектив 35 мм. ' : ''}Хотите, сравню их в таблице?</p>`, chips: ['Сравнить их', 'А подешевле?', 'Позвать менеджера'], ids: scored.map((p) => p.id) };
  };
  let lastIds = [];
  const botReply = (text) => {
    const s = nlow(text);
    if (/^сравнить их/.test(s) && lastIds.length > 1) { PT.cmp.set(lastIds); return { html: '<p>Добавил их в сравнение. <a class="link-btn" href="#compare">Открыть таблицу</a></p>' }; }
    if (/подешевле/.test(s)) return recommend('прибор до 150 тыс');
    if (/менеджер|человек|оператор|позвон|перезвон/.test(s)) return { html: '<p>Передаю диалог менеджеру: ему уже пришло уведомление в Telegram вместе с историей переписки. Обычно отвечает за 5–10 минут.</p><p>Оставьте телефон, если удобнее, чтобы перезвонили.</p><form class="chat-form" data-form="chat-phone" style="padding:8px 0 0"><label class="sr-only" for="chat-phone">Телефон</label><input id="chat-phone" type="tel" placeholder="+7 900 000-00-00" required><button class="btn btn-sm" type="submit">Жду звонка</button></form>' };
    if (/доставк|сдэк|самовывоз|курьер|оплат|рассроч|сбп|карт/.test(s)) return { html: '<p><b>Доставка:</b> СДЭК по России за 1–5 дней, бесплатно от 30 000 ₽. По Москве курьер сегодня или завтра, есть самовывоз из шоурума.</p><p><b>Оплата:</b> картой или по СБП на сайте, рассрочка, при получении или по счёту для организаций.</p>' };
    if (/гарант|сервис|ремонт|возврат|оригинал/.test(s)) return { html: '<p>Перед отправкой включаем прибор, проверяем картинку и дальномер и присылаем вам видео именно вашего экземпляра.</p><p>Гарантийные случаи принимаем сами, срок зависит от бренда и указан в паспорте. Вернуть прибор можно в течение 7 дней.</p>' };
    if (/netd|нетд|чувствит/.test(s)) return { html: '<p><b>NETD</b> показывает, какую разницу температур видит матрица. Чем меньше число, тем контрастнее картинка в туман, дождь и при слабом перепаде температур.</p><p>15 мК даёт заметно более «сочную» картинку в плохую погоду, чем 40 мК. В ясную ночь разница меньше.</p>', chips: ['Модели с NETD до 15 мК', 'Прицел для кабана до 300 тыс.'] };
    if (/модели с netd/.test(s)) { const l = PT.products.filter((p) => p.netd && p.netd <= 15).sort((a, b) => a.price - b.price).slice(0, 3); return { html: `<p>Самые доступные модели с NETD до 15 мК:</p>${cards(l, l.map(PT.netdLabel))}`, ids: l.map((p) => p.id) }; }
    if (/матриц|разрешени|640|384|1280/.test(s) && /разниц|отлич|какую|лучше|зачем/.test(s)) return { html: '<p><b>384×288</b> хватает для леса и дистанций до 300–400 м. <b>640×512</b> даёт детальную картинку на полях. <b>1280×1024</b> нужна, чтобы опознать зверя и трофей далеко и при большом увеличении.</p>' };
    const p = findProduct(text);
    if (p) {
      if (/налич|есть ли|когда|поступ|привез/.test(s)) return { html: `<p><b>${esc(p.name)}</b>: ${p.stock === 'in' ? 'есть на складе в Москве, отправим сегодня при заказе до 16:00.' : p.stock === 'pre' ? 'ожидаем ' + esc(p.eta) + '. Можно оформить предзаказ без предоплаты, цена ' + rub(p.price) + ' фиксируется.' : 'привезём под заказ за 7–10 дней.'}</p>${cards([p])}`, chips: ['Как доставка и оплата?', 'Позвать менеджера'] };
      const alt = /лучше|отлич|сравн/.test(s) ? PT.products.find((x) => x.id !== p.id && s.includes(nlow(x.name.split(' ').slice(1, 3).join(' ')))) : null;
      if (alt) { PT.cmp.set([p.id, alt.id]); return { html: `<p>Коротко: у ${esc(p.name)} ${esc(PT.resLabel(p) || '')}${p.netd ? ', NETD ' + PT.netdLabel(p) : ''}${p.range ? ', дальность ' + PT.rangeLabel(p) : ''}. У ${esc(alt.name)} ${esc(PT.resLabel(alt) || '')}${alt.netd ? ', NETD ' + PT.netdLabel(alt) : ''}${alt.range ? ', дальность ' + PT.rangeLabel(alt) : ''}. Разница в цене ${rub(Math.abs(p.price - alt.price))}.</p><p>Положил обе модели в сравнение: <a class="link-btn" href="#compare">открыть таблицу</a>.</p>` }; }
      if (/лес/.test(s)) return { html: `<p>${esc(p.name)} в лесу ${p.lens && p.lens <= 35 ? 'подойдёт хорошо: объектив ' + PT.lensLabel(p) + ' даёт широкий обзор.' : 'работать будет, но объектив ' + PT.lensLabel(p) + ' рассчитан скорее на поля: поле зрения уже, зверя в чаще ловить сложнее.'}${p.weight ? ' Вес ' + PT.weightLabel(p) + '.' : ''}</p>` };
      return { html: `<p><b>${esc(p.name)}</b>: ${esc(p.short || p.type)}</p>${cards([p])}`, chips: ['Есть ли в наличии ' + p.name + '?', 'Позвать менеджера'] };
    }
    const rec = recommend(text);
    if (rec) return rec;
    if (/привет|здравств|добр/.test(s)) return { html: '<p>Здравствуйте! Подскажите, что ищете: прицел, монокуляр или бинокль? И примерный бюджет.</p>' };
    return { html: '<p>Не совсем понял вопрос. Подскажите, что нужно: прицел, монокуляр или бинокль, и примерный бюджет? Или позову менеджера.</p>', chips: ['Прицел для кабана до 300 тыс.', 'Позвать менеджера'] };
  };
  const ask = (text) => {
    if (!text.trim()) return;
    openChat();
    addMsg('me', esc(text));
    const typing = addMsg('bot', '<span class="typing"><i></i><i></i><i></i></span>');
    typing.style.padding = '0';
    const r = botReply(text);
    if (r.ids) lastIds = r.ids;
    setTimeout(() => {
      typing.style.padding = ''; typing.innerHTML = r.html;
      if (r.chips) chips.innerHTML = r.chips.map((c) => `<button data-act="chat-q" data-q="${esc(c)}">${esc(c)}</button>`).join('');
      log.scrollTop = log.scrollHeight;
    }, 550 + Math.min(text.length * 12, 600));
  };
  PT.ask = ask;
  const openChat = () => { $('#chat-hello').hidden = true; $('#chat-panel').hidden = false; $('#chat-fab').classList.add('is-open'); startChat(); if (matchMedia('(min-width: 761px)').matches) $('#chat-input').focus({ preventScroll: true }); };
  const closeChat = () => { $('#chat-panel').hidden = true; $('#chat-fab').classList.remove('is-open'); };
  $('#chat-form').addEventListener('submit', (e) => { e.preventDefault(); const i = $('#chat-input'); const v = i.value; i.value = ''; ask(v); });
  setTimeout(() => { let seen = null; try { seen = sessionStorage.getItem('pt.hello'); } catch (e) { /* ignore */ } if (!seen && $('#chat-panel').hidden) $('#chat-hello').hidden = false; }, 4000);

  /* ---------- modals ---------- */
  const modal = (html) => { $('#modal-card').innerHTML = `<button class="icon-btn" data-act="close-all" aria-label="Закрыть">${icon('i-close')}</button>` + html; openOverlay('#modal'); };
  const phoneForm = (title, sub, p) => modal(`<h2 id="modal-title">${title}</h2>${p ? `<div class="mini-prod">${PT.thumb(p)}<span><b>${esc(p.name)}</b><span class="price" style="font-size:16px">${rub(p.price)}</span></span></div>` : ''}<p>${sub}</p><form data-form="phone" style="display:grid;gap:12px"><label class="field" for="m-phone">Телефон<input id="m-phone" type="tel" required placeholder="+7 900 000-00-00" autocomplete="tel"></label><label class="consent"><input id="m-consent" type="checkbox" required checked> Согласен на обработку персональных данных</label><button class="btn btn-lg" type="submit">${p ? 'Купить в 1 клик' : 'Перезвоните мне'}</button></form>`);

  /* ---------- router ---------- */
  const setCurrentNav = (token) => {
    $$('.hdr-nav a').forEach((a) => a.classList.toggle('is-current', token && a.getAttribute('href') === '#' + (token.startsWith('a-') ? 'reviews-list' : token.split('.')[0])));
    const tab = token.startsWith('cat') || token.startsWith('col') || token === 'catalog' ? 'catalog' : token === 'home' || token === '' ? 'home' : token;
    $$('.tabbar [data-tab]').forEach((t) => t.classList.toggle('on', t.dataset.tab === tab));
  };
  const titleFor = (token) => {
    if (token.startsWith('p-') && PT.byId[token.slice(2)]) return PT.byId[token.slice(2)].name + ' — PRO ТЕПЛОВИЗОРЫ';
    return 'PRO ТЕПЛОВИЗОРЫ';
  };
  const render = () => {
    const token = decodeURIComponent(location.hash.slice(1)) || 'home';
    closeAll(true);
    let html;
    if (token === 'home') html = V.home();
    else if (token.startsWith('p-')) html = V.product(token.slice(2));
    else if (/^(cat-|col-|brand-)/.test(token) || token === 'catalog' || token === 'fav' || token === 'search') html = V.catalog(token);
    else if (token === 'compare') html = V.compare();
    else if (token === 'quiz') html = V.quiz();
    else if (token === 'checkout') html = V.checkout();
    else if (token === 'brands') html = V.brands();
    else if (token === 'reviews-list') html = V.reviewsList();
    else if (token === 'reviews') html = V.reviewsPage();
    else if (token.startsWith('a-')) html = V.article(token.slice(2));
    else if (token.startsWith('info-')) html = V.info(token.slice(5));
    else if (token === 'project') html = V.project ? V.project() : V.notfound();
    else html = V.notfound();
    app.innerHTML = html;
    document.title = titleFor(token);
    setCurrentNav(token);
    if ($('#cat-grid')) PT.renderResults();
    if (token !== 'checkout') PT.orderDone = null;
    heroI = 0;
    PT.paintAll(app);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  PT.render = render;
  window.addEventListener('hashchange', render);

  /* ---------- delegation ---------- */
  const acts = {
    'cart-add': (el) => {
      const p = PT.byId[el.dataset.id]; if (!p) return;
      PT.cart.add(p.id);
      PT.toast(p.stock === 'pre' ? 'Предзаказ добавлен в корзину' : 'Добавили в корзину', ['Оформить', '#checkout']);
      if (el.classList.contains('btn')) { el.classList.add('is-done'); el.dataset.act = 'cart-open'; el.innerHTML = icon('i-check') + 'В корзине'; }
    },
    'cart-open': () => { renderCart(); openOverlay('#cart'); },
    'cart-rm': (el) => PT.cart.remove(el.dataset.id),
    qty: (el) => PT.cart.set(el.dataset.id, (PT.store.cart[el.dataset.id] || 0) + +el.dataset.d),
    fav: (el) => { const on = PT.fav.toggle(el.dataset.id); PT.toast(on ? 'Добавили в избранное' : 'Убрали из избранного', on ? ['Открыть', '#fav'] : null); },
    cmp: (el) => {
      const r = PT.cmp.toggle(el.dataset.id);
      if (r === 'full') PT.toast('В сравнении уже 4 прибора. Уберите один, чтобы добавить новый', ['Сравнение', '#compare']);
      else PT.toast(r === 'added' ? `В сравнении ${PT.store.cmp.length} из 4` : 'Убрали из сравнения', r === 'added' ? ['Сравнить', '#compare'] : null);
      if (location.hash === '#compare') render();
    },
    'cmp-rm': (el) => { PT.cmp.remove(el.dataset.id); render(); },
    'cmp-set': (el) => { PT.cmp.set(el.dataset.ids.split(',')); location.hash = 'compare'; },
    'close-all': () => closeAll(),
    mega: () => { if (matchMedia('(max-width: 760px)').matches) return mobileMenu(); if ($('#mega').hidden) openMega(); else closeMega(); },
    'menu-open': mobileMenu,
    callback: () => phoneForm('Заказать звонок', 'Перезвоним в течение 15 минут в рабочее время и поможем с выбором.'),
    oneclick: (el) => phoneForm('Купить в 1 клик', 'Оставьте телефон: менеджер перезвонит, уточнит доставку и оформит заказ за вас.', PT.byId[el.dataset.id]),
    palette: (el) => {
      const pal = el.dataset.pal;
      const wrap = el.closest('.hero-visual, .g-main');
      const canvas = el.dataset.target ? document.getElementById(el.dataset.target) : wrap && wrap.querySelector('canvas');
      if (!canvas) return;
      canvas.dataset.palette = pal; PT.paint(canvas);
      $$('.pal', el.parentNode).forEach((b) => { b.classList.toggle('on', b === el); b.setAttribute('aria-pressed', b === el); });
    },
    'hero-go': (el) => heroGo(+el.dataset.i),
    'hero-step': (el) => heroGo(heroI + +el.dataset.d),
    rail: (el) => { const r = document.getElementById(el.dataset.rail); r.scrollBy({ left: +el.dataset.d * r.clientWidth * 0.8, behavior: 'smooth' }); },
    preset: (el) => { PT.PRESETS[el.dataset.k].toggle(PT.catState.f); PT.renderResults(); },
    pill: (el) => {
      const f = PT.catState.f, k = el.dataset.k;
      if (k.startsWith('sel:')) { const [, fid, v] = k.split(':'); f.sel[fid] = (f.sel[fid] || []).filter((x) => x !== v); }
      else if (k === 'lrf') f.lrf = false; else f[k] = null;
      PT.renderResults();
    },
    'reset-filters': () => { PT.catState.f = PT.newFilter(); PT.renderResults(); },
    'filters-open': () => { openOverlay('#fsheet'); $('#fsheet-body').innerHTML = PT.facetHtml(PT.catState.scope, PT.catState.f); PT.renderResults(); },
    'spec-more': (el) => { $$('[data-more]').forEach((g) => (g.hidden = false)); el.remove(); },
    gal: (el) => {
      $$('.g-thumb').forEach((t) => { t.classList.toggle('on', t === el); t.setAttribute('aria-selected', t === el); });
      $$('#g-main [data-pane]').forEach((p) => (p.hidden = p.dataset.pane !== el.dataset.v));
      PT.paintAll($('#g-main'));
    },
    tab: (el, e) => { e.preventDefault(); const t = document.querySelector(el.getAttribute('href')); if (t) t.scrollIntoView({ behavior: 'smooth' }); $$('.pp-tabs a').forEach((a) => a.classList.toggle('on', a === el)); },
    'quiz-opt': (el) => { PT.quiz.a[el.dataset.k] = el.dataset.v; el.classList.add('on'); setTimeout(() => { PT.quiz.step++; render(); }, 180); },
    'quiz-back': () => { PT.quiz.step = Math.max(0, PT.quiz.step - 1); render(); },
    'quiz-reset': () => { PT.quiz = { step: 0, a: {} }; render(); },
    'co-dl': (el) => { PT.checkoutDelivery = el.value; const keep = new FormData($('#co-form')); render(); ['name', 'phone', 'email', 'note'].forEach((k) => { const i = $(`#co-form [name="${k}"]`); if (i) i.value = keep.get(k) || ''; }); },
    'chat-toggle': () => ($('#chat-panel').hidden ? openChat() : closeChat()),
    'chat-open': () => { closeAll(true); openChat(); },
    'chat-close': closeChat,
    'chat-hello-x': () => { $('#chat-hello').hidden = true; try { sessionStorage.setItem('pt.hello', '1'); } catch (e) { /* ignore */ } },
    'qp': (el) => { PT.quiz.a[el.dataset.k] = el.dataset.v; el.parentNode.querySelectorAll('.qp-opt').forEach((b) => { b.classList.toggle('on', b === el); b.setAttribute('aria-pressed', b === el); }); },
    'quiz-go': () => { const i = PT.QUIZ.findIndex((q) => !(q.k in PT.quiz.a)); PT.quiz.step = i < 0 ? PT.QUIZ.length : i; location.hash = '#quiz'; },
    'art-filter': (el) => { el.parentNode.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === el)); $$('.articles .art').forEach((a) => { a.hidden = !!el.dataset.tag && a.dataset.tag !== el.dataset.tag; }); },
    'chat-q': (el) => { drop.hidden = true; ask(el.dataset.q); },
    'chat-ask': (el) => { const p = PT.byId[el.dataset.id]; openChat(); ask('Расскажите про ' + p.name); },
    'search-all': (el, e) => { e.preventDefault(); goSearch(); },
    'cookie-ok': () => { $('#cookie').hidden = true; PT.LS.set('cookie', 1); },
  };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
    const fn = acts[el.dataset.act];
    if (fn) { if (el.tagName === 'BUTTON') e.preventDefault(); fn(el, e); }
  });
  document.addEventListener('change', (e) => {
    const el = e.target, a = el.dataset.act, f = PT.catState.f;
    if (a === 'facet') {
      const fid = el.dataset.f;
      if (el.type === 'radio') f.sel[fid] = (f.sel[fid] || [])[0] === el.value ? [] : [el.value];
      else { const cur = new Set(f.sel[fid] || []); el.checked ? cur.add(el.value) : cur.delete(el.value); f.sel[fid] = Array.from(cur); }
      PT.renderResults();
    } else if (a === 'lrf') { f.lrf = el.checked; PT.renderResults(); }
    else if (a === 'price') { const v = parseInt(el.value.replace(/\D/g, ''), 10); f[el.dataset.k] = isNaN(v) ? null : v; PT.renderResults(); }
    else if (a === 'sort') { PT.catState.sort = el.value; PT.renderResults(); }
    else if (a === 'cmp-same') $('#ctable').classList.toggle('show-all', el.checked);
  });
  // Radio "one" facets: clicking the checked option again clears it.
  document.addEventListener('click', (e) => {
    const r = e.target.closest('input[type="radio"][data-act="facet"]');
    if (r && (PT.catState.f.sel[r.dataset.f] || [])[0] === r.value) { e.preventDefault(); PT.catState.f.sel[r.dataset.f] = []; setTimeout(PT.renderResults, 0); }
  }, true);

  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (form.id === 'search' || form.id === 'chat-form') return;
    e.preventDefault();
    if (form.id === 'co-form') {
      let ok = true;
      ['name', 'phone'].forEach((k) => {
        const i = form.querySelector(`[name="${k}"]`), wrap = i.closest('.field'), bad = k === 'phone' ? i.value.replace(/\D/g, '').length < 10 : !i.value.trim();
        wrap.classList.toggle('has-err', bad); wrap.querySelector('.err').hidden = !bad; if (bad && ok) { i.focus(); ok = false; }
      });
      if (!ok) return;
      PT.orderDone = { n: 10000 + Math.floor(Math.random() * 9000), name: form.name.value.trim(), phone: form.phone.value.trim() };
      PT.cart.clear(); render(); return;
    }
    const kind = form.dataset.form;
    if (kind === 'phone') { closeAll(); PT.toast('Спасибо! Перезвоним в течение 15 минут (демо)'); }
    else if (kind === 'subscribe') { form.reset(); PT.toast('Подписка оформлена (демо)'); }
    else if (kind === 'chat-phone') { form.outerHTML = '<p><b>Записал.</b> Менеджер перезвонит в ближайшие 15 минут (демо).</p>'; }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAll(); closeChat(); } });

  // Image fallbacks: brand logos try svg → png → wordmark; products show the crosshair placeholder.
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!img || img.tagName !== 'IMG') return;
    if (img.dataset.alt) { const n = img.dataset.alt; delete img.dataset.alt; img.src = n; return; }
    if (img.dataset.word) { const s = document.createElement('span'); s.className = 'brand-word'; s.textContent = img.dataset.word; img.replaceWith(s); return; }
    if ('hideMissing' in img.dataset) { img.remove(); return; }
    const t = img.closest('.thumb'); if (t) t.classList.add('is-missing');
  }, true);

  /* ---------- boot ---------- */
  const hdr = $('#hdr');
  const setHdr = () => document.documentElement.style.setProperty('--hdr-h', hdr.offsetHeight + 'px');
  window.addEventListener('resize', setHdr);
  setHdr();
  syncCounts();
  if (!PT.LS.get('cookie', 0)) setTimeout(() => ($('#cookie').hidden = false), 1500);
  render();
})();
