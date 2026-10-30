/* Views: each returns HTML for <main>; afterRender hooks run in ui.js. */
(function () {
  'use strict';
  const PT = window.PT;
  const { esc, rub, num, icon, plural } = PT;
  const V = (PT.views = {});

  const HERO = [
    { id: 'pulsar-thermion-3-lrf-xt60', flag: 'Новинка 2026', scene: 'boar', pal: 'white', mag: '×2,0', lrf: '286 м',
      lead: 'Новое поколение легендарной серии: HD-матрица 1280×1024, круглый AMOLED-экран и баллистический калькулятор внутри.' },
    { id: 'pulsar-merger-lrf-xp50', flag: 'Хит продаж', scene: 'deer', pal: 'iron', mag: '×2,5', lrf: '412 м',
      lead: 'Тепловизионный бинокль: смотрите двумя глазами всю ночь и меряйте дистанцию одной кнопкой.' },
    { id: 'nocpix-ace-h50r', flag: 'В наличии', scene: 'fox', pal: 'red', mag: '×3,0', lrf: '198 м',
      lead: 'Матрица с NETD ≤15 мК: контрастная картинка в туман и дождь, дальномер на 1200 м.' },
  ];
  PT.HERO = HERO;
  const PALS = [['white', 'Белый горячий', '#fff'], ['black', 'Чёрный горячий', '#111'], ['red', 'Красный горячий', 'linear-gradient(135deg,#fff 50%,#e0331b 50%)'], ['iron', 'Железо', 'linear-gradient(135deg,#2b0f5e,#d1335b,#f6b73c)'], ['rainbow', 'Радуга', 'linear-gradient(135deg,#2a4bd7,#2fd3a2,#f2d03b,#e0331b)']];
  PT.PALS = PALS;

  const reticle = `<svg class="reticle" viewBox="0 0 100 100" aria-hidden="true"><g stroke="#fc7c1e" stroke-width=".55" fill="none" stroke-linecap="round"><path d="M50 18v26M50 56v26M18 50h26M56 50h26"/><circle cx="50" cy="50" r="3.2" stroke-width=".4"/></g><circle cx="50" cy="50" r=".7" fill="#fc7c1e"/><g stroke="rgba(255,255,255,.55)" stroke-width=".3"><path d="M50 60v1.6M50 64v1.6M50 68v1.6M46 62.8h8M47 66.8h6"/></g></svg>`;

  const keySpecs = (p, n) => `<div class="kspecs">${PT.keySpecs(p).slice(0, n || 4).map((k) => `<div class="kspec"><span class="kspec-i">${icon(k.i)}</span><small>${k.l}</small><b>${esc(k.v)}</b></div>`).join('')}</div>`;

  const heroSlide = (h, i) => {
    const p = PT.byId[h.id];
    const pre = p.stock === 'pre';
    return `<div class="hero-slide" data-slide="${i}"${i ? ' hidden' : ''}>
      <div class="hero-copy">
        <div class="hero-flags"><span class="badge ${pre || p.new ? 'badge-new' : p.hit ? 'badge-hit' : 'badge-pre'}">${h.flag}</span>${PT.stockHtml(p)}</div>
        <h1 class="hero-title"><small>${esc(p.type)}</small>${esc(p.name)}</h1>
        <p class="hero-lead">${esc(h.lead)}</p>
        ${keySpecs(p, 4)}
        <div class="hero-buy">
          <span class="price">${rub(p.price)}</span>
          <a class="btn btn-lg" href="#p-${p.id}">${pre ? 'Оформить предзаказ' : 'Подробнее'}</a>
          <button class="btn btn-ghost btn-lg" data-act="cmp" data-id="${p.id}">${icon('i-compare')}Сравнить</button>
        </div>
      </div>
      <div class="hero-visual">
        <div class="scope-wrap"><div class="scope">
          <canvas data-scene="${h.scene}" data-palette="${h.pal}" data-seed="${i + 3}" data-max="760" role="img" aria-label="Так выглядит ночь в тепловизор: ${h.scene === 'boar' ? 'кабан' : h.scene === 'deer' ? 'косуля' : 'лиса'} в поле"></canvas>
          ${reticle}
          <span class="hud hud-tl">${h.mag}</span>
          <span class="hud hud-tr">${icon('i-battery')}86%</span>
          <span class="hud hud-b">${icon('i-laser')}${h.lrf}</span>
        </div>
        <img class="hero-device" src="img/${p.id}-cut.webp" alt="" data-hide-missing></div>
        <div class="palettes" role="group" aria-label="Палитра тепловизора">${PALS.map(([id, name, sw]) => `<button class="pal${id === h.pal ? ' on' : ''}" data-act="palette" data-pal="${id}" aria-pressed="${id === h.pal}"><i style="background:${sw}"></i>${name}</button>`).join('')}</div>
        <p class="pal-label">Переключайте палитры: так картинка выглядит в окуляре</p>
      </div>
    </div>`;
  };

  const sec = (title, inner, link, sub) => `<section class="sec"><div class="wrap"><div class="sec-head"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>${link || ''}</div>${inner}</div></section>`;

  const REVIEWS = [
    { n: 'Андрей', c: 'Тверская обл.', id: 'pulsar-thermion-2-lrf-xp50-pro', s: 5, t: 'Брал под кабана с вышки. Дальномер очень выручает: на поле за 400 метров сразу понятно, стоит ли ждать. Перед отправкой прислали видео с моим прибором.', sc: ['boar', 'white'] },
    { n: 'Игорь', c: 'Краснодар', id: 'pulsar-axion-2-lrf-xg35', s: 5, t: 'Хотел маленький монокуляр для поиска подранка. Помогли выбрать между Axion и Telos, объяснили разницу по-человечески. Лёгкий, в карман куртки влезает.', sc: ['fox', 'black'] },
    { n: 'Михаил', c: 'Новосибирск', id: 'pulsar-merger-lrf-xp50', s: 4, t: 'Бинокль для долгих засидок, глаза правда меньше устают. Доставили СДЭКом за 4 дня. Минус один: чехол в комплекте мог бы быть получше.', sc: ['deer', 'iron'] },
  ];
  // Articles: guides help choose, reviews/tests show a device in use. Each one ends with the devices it mentions (price + stock), so reading leads to buying.
  const ARTICLES = [
    { slug: 'kak-vybrat', tag: 'Как выбрать', min: 6, t: 'Как выбрать тепловизор для охоты: 5 вопросов по порядку', d: 'Тип прибора, матрица, NETD, объектив и дальномер. Без формул, с примерами из каталога.', sc: ['boar', 'white'],
      ids: ['guide-ts432l', 'pulsar-trail-3-lrf-xq50', 'nocpix-ace-h50r'],
      body: [
        ['Сначала решите, что это будет', 'Прицел ставится на оружие, монокуляр нужен для поиска зверя и подранка, бинокль для долгого наблюдения двумя глазами. Если прибор первый и денег на два нет, чаще берут прицел: им и смотрят, и стреляют.'],
        ['Матрица: 384, 640 или 1280', 'Чем больше точек, тем чётче картинка и тем раньше вы поймёте, кто перед вами: кабан или куст. 384×288 хватает для леса до 300 м. 640×512 универсальный вариант. 1280×1024 нужен на больших полях.'],
        ['NETD: чем меньше, тем лучше', 'Это чувствительность матрицы. 15–25 мК дают контрастную картинку в туман и дождь, 40 мК в сырую погоду заметно «плывут». Подробно разобрали в отдельной статье.'],
        ['Объектив и дистанция', '35 мм даёт широкий обзор для леса, 50 мм универсальный, 60 мм для полей. Чем длиннее объектив, тем дальше видно, но тем уже поле зрения.'],
        ['Дальномер', 'Если стреляете на разные дистанции, он окупается сразу: нажали кнопку и знаете расстояние. Для загонной охоты в лесу можно сэкономить.'],
      ],
      verdict: 'Не знаете, что выбрать? Пройдите подбор из 4 вопросов или спросите консультанта на сайте.' },
    { slug: 'pricel-monokulyar-binokl', tag: 'Как выбрать', min: 4, t: 'Прицел, монокуляр или бинокль: что брать первым', d: 'Три типа приборов, для чего каждый и почему у опытных охотников их обычно два.', sc: ['deer', 'black'],
      ids: ['pulsar-talion-xq35-pro', 'pulsar-axion-2-lrf-xg35', 'pulsar-merger-lrf-xp50'],
      body: [
        ['Прицел', 'Сразу и смотрите, и стреляете. Минус: водить оружием по полю долго тяжело, а осматривать местность через прицел небезопасно.'],
        ['Монокуляр', 'Лёгкий, помещается в карман. Им ищут зверя и подранка, осматривают опушку перед выстрелом. Хорошая пара к любому прицелу.'],
        ['Бинокль', 'Смотрите двумя глазами, поэтому меньше устаёте. Выбор для долгих засидок и наблюдения за территорией.'],
        ['Что выбирают чаще', 'Первым обычно берут прицел. Вторым монокуляр для поиска, а бинокль, когда засидки становятся долгими.'],
      ],
      verdict: 'Если сомневаетесь, напишите консультанту, где и как охотитесь. Он предложит комплект под бюджет.' },
    { slug: 'chto-takoe-netd', tag: 'Как выбрать', min: 3, t: 'Что такое NETD и почему 15 мК лучше 40', d: 'Одна цифра в характеристиках, от которой зависит картинка в туман, дождь и сырую погоду.', sc: ['fox', 'white'],
      ids: ['nocpix-ace-h50r', 'pulsar-thermion-2-lrf-xp50-pro', 'pulsar-thermion-2-lrf-xg60'],
      body: [
        ['Простыми словами', 'NETD показывает, какую самую маленькую разницу температур видит матрица. Чем меньше число, тем больше оттенков на картинке и тем лучше видно контур зверя.'],
        ['Когда это важно', 'В сухую ясную ночь разница почти не заметна. В туман, дождь и при высокой влажности прибор с 15 мК покажет зверя, а с 40 мК картинка станет серой и плоской.'],
        ['На что смотреть в карточке', 'Мы указываем NETD у каждой модели и подсвечиваем лучшее значение в сравнении. Хороший уровень сегодня 15–25 мК.'],
      ],
      verdict: 'Если охотитесь в сырых местах, у реки или в туман, берите модель с NETD до 25 мК.' },
    { slug: 'pulsar-thermion-3-xt60', tag: 'Обзор', min: 8, video: 1, t: 'Pulsar Thermion 3 XT60: полный обзор', d: 'Что даёт матрица 1280×1024 на практике, как работает баллистика и стоит ли переходить с Thermion 2.', sc: ['boar', 'white'],
      ids: ['pulsar-thermion-3-lrf-xt60', 'pulsar-thermion-2-lrf-xp50-pro', 'pulsar-thermion-2-lrf-xg60'],
      body: [
        ['Что нового', 'Матрица 1280×1024 вместо 640×480, AMOLED-экран, дальномер на 1200 м и баллистический калькулятор внутри прицела.'],
        ['Картинка', 'Тут будут фото и видео через окуляр: один и тот же кабан на 150, 300 и 500 м, рядом кадры с Thermion 2 для сравнения.'],
        ['Баллистика', 'Вводите патрон один раз, дальше прицел сам сдвигает точку прицеливания по дистанции с дальномера.'],
        ['Кому переходить с Thermion 2', 'Если охотитесь на больших полях и не хватает детализации. Для леса Thermion 2 по-прежнему отличный выбор и заметно дешевле.'],
      ],
      verdict: 'Флагман для полей и дальних выстрелов. Пока доступен по предзаказу.' },
    { slug: 'nocpix-quest-s50r', tag: 'Тест', min: 7, video: 1, t: 'Nocpix Quest S50R: тест в реальных условиях', d: 'Ночь на поле: дальность, дальномер, автономность на морозе.', sc: ['deer', 'iron'],
      ids: ['nocpix-quest-s50r', 'pulsar-merger-lrf-xp50'],
      body: [
        ['Как тестируем', 'Берём прибор со склада, едем в поле, снимаем видео через окуляр и замеряем, на каком расстоянии видно и узнаётся зверь.'],
        ['Дальность и дальномер', 'Тут будут замеры: на каком расстоянии заметили косулю, когда смогли понять, кто это, и как дальномер ловит цель на 500+ м.'],
        ['Мороз', 'Тут будет, сколько прибор проработал при −15 °C и как вёл себя экран.'],
      ],
      verdict: 'Результаты появятся, когда модель приедет на склад. Предзаказ уже открыт.' },
    { slug: 'habrok-vs-merger-quest', tag: 'Сравнение', min: 9, video: 1, t: 'HIKMICRO Habrok PRO HX60LS: сравнение', d: 'Против Pulsar Merger DUO и Nocpix Quest: что лучше для наблюдения днём и ночью.', sc: ['fox', 'black'],
      ids: ['hikmicro-habrok-pro-hx60ls', 'pulsar-merger-duo-nxp50', 'nocpix-quest-s50r'],
      body: [
        ['Почему эти три', 'Все три бинокля работают и днём, и ночью и стоят от 480 до 590 тысяч. Покупатели чаще всего выбирают именно между ними.'],
        ['Ночью', 'Тут будут кадры одной сцены через все три прибора: кто раньше заметит зверя и у кого чище картинка.'],
        ['Днём', 'Тут будет сравнение дневного канала: цвет, резкость, увеличение.'],
        ['Итог по таблице', 'Под статьёй кнопка «Сравнить эти модели» открывает таблицу со всеми характеристиками рядом.'],
      ],
      verdict: 'Самый детальный из трёх Habrok, самый лёгкий Quest, у Merger DUO самая долгая автономность.' },
  ];
  PT.REVIEWS = REVIEWS; PT.ARTICLES = ARTICLES;

  const reviewCard = (r) => {
    const p = PT.byId[r.id];
    return `<article class="rev"><div class="rev-top"><div class="rev-who"><span class="rev-ava">${r.n[0]}</span><span><b>${r.n}</b><small>${r.c}</small></span></div>${PT.stars(r.s)}</div>
      <p>${esc(r.t)}</p>
      <div class="rev-media"><canvas data-scene="${r.sc[0]}" data-palette="${r.sc[1]}" data-seed="11" data-max="200" aria-label="Фото от покупателя"></canvas><canvas data-scene="${r.sc[0]}" data-palette="white" data-seed="23" data-max="200" aria-label="Фото от покупателя"></canvas></div>
      <a class="rev-prod" href="#p-${p.id}">${PT.thumb(p)}<span>${esc(p.name)}</span></a>
      <span class="tag-sample">Пример отзыва для мокапа</span></article>`;
  };
  const articleCard = (a) => `<a class="art" href="#a-${a.slug}" data-tag="${a.tag}"><div class="art-media"><canvas data-scene="${a.sc[0]}" data-palette="${a.sc[1]}" data-seed="5" data-max="640" aria-hidden="true"></canvas><span class="badge badge-hit">${a.tag}</span>${a.video ? `<span class="play">${icon('i-play')}</span>` : ''}</div><div class="art-body"><h3>${esc(a.t)}</h3><p>${esc(a.d)}</p><small class="art-meta">${a.min} мин чтения · ${a.ids.length} ${plural(a.ids.length, 'прибор', 'прибора', 'приборов')} из каталога</small></div></a>`;
  PT.articlesFor = (id) => ARTICLES.filter((a) => a.ids.includes(id));

  const brandTile = (b) => {
    const n = PT.products.filter((p) => PT.brandId(p.brand) === b.id).length;
    // ponytail: wordmark unless we have the logo file; real logos come from the brands' press kits at build time
    return `<a class="brand-tile" href="#brand-${b.id}"><span>${b.logo ? `<img src="img/brands/${b.logo}" alt="${b.name}">` : `<span class="brand-word">${b.name}</span>`}<small>${n ? n + ' ' + plural(n, 'модель', 'модели', 'моделей') : 'скоро'}</small></span></a>`;
  };

  V.home = () => {
    const cats = PT.CATS.map((c) => {
      const n = PT.products.filter((p) => p.cat === c.id).length;
      return `<a class="cat-tile" href="#cat-${c.id}">${PT.thumb(PT.byId[c.hero])}<div><h3>${c.name}${icon('i-arrow-r')}</h3><p>${c.note}</p><small>${n} ${plural(n, 'модель', 'модели', 'моделей')}</small></div></a>`;
    }).join('');
    const colIcon = { stock: ['i-check', 'ok'], new: ['i-spark', 'or'], hits: ['i-star', ''], preorder: ['i-calendar', 'wa'] };
    const cols = Object.entries(PT.COLS).map(([id, c]) => {
      const n = PT.products.filter(c.test).length;
      return `<a class="coll" href="#col-${id}"><span class="coll-i ${colIcon[id][1]}">${icon(colIcon[id][0])}</span><span><b>${c.title}</b><small>${esc(c.desc.split('.')[0])}</small></span><span class="coll-n">${n}</span></a>`;
    }).join('');
    const popular = PT.products.filter((p) => p.cat !== 'accessories').sort((a, b) => b.pop - a.pop).slice(0, 10).map(PT.card).join('');
    return `
    <section class="hero"><div class="wrap"><div class="hero-card" id="hero">
      ${HERO.map(heroSlide).join('')}
      <div class="hero-ctrl"><div class="hero-dots">${HERO.map((h, i) => `<button data-act="hero-go" data-i="${i}" class="${i ? '' : 'on'}" aria-label="Слайд ${i + 1}"></button>`).join('')}</div>
      <div class="hero-arrows"><button data-act="hero-step" data-d="-1" aria-label="Предыдущий">${icon('i-chev-l')}</button><button data-act="hero-step" data-d="1" aria-label="Следующий">${icon('i-chev-r')}</button></div></div>
    </div></div></section>
    <section class="sec"><div class="wrap"><div class="cats">${cats}</div></div></section>
    <section class="sec" style="padding-top:0"><div class="wrap"><div class="collections">${cols}</div></div></section>
    ${sec('Популярные товары', `<div class="rail" id="rail-pop">${popular}</div>`, `<div class="rail-nav"><button data-act="rail" data-d="-1" data-rail="rail-pop" aria-label="Назад">${icon('i-chev-l')}</button><button data-act="rail" data-d="1" data-rail="rail-pop" aria-label="Вперёд">${icon('i-chev-r')}</button></div>`)}
    <section class="sec"><div class="wrap"><div class="quiz-band">
      <svg class="mark-bg ic" aria-hidden="true"><use href="#i-mark"/></svg>
      <div><h2>Поможем выбрать прибор</h2><p>Ответьте на 4 вопроса: что нужно, где охотитесь, нужен ли дальномер и какой бюджет. Покажем 3 подходящие модели и объясним, почему они.</p><button class="btn btn-lg" data-act="quiz-go">Подобрать за минуту</button></div>
      <div class="quiz-preview">${[['need', 'Что нужно?', [['scope', 'Прицел'], ['mono', 'Монокуляр'], ['bino', 'Бинокль']]], ['place', 'Где охотитесь?', [['forest', 'Лес, до 300 м'], ['field', 'Поля, 500 м и дальше'], ['mixed', 'Лес и поля']]], ['lrf', 'Нужен дальномер?', [['yes', 'Нужен'], ['no', 'Не нужен'], ['any', 'Не знаю']]]].map(([k, q, o]) => `<span class="qp-q" id="qp-${k}">${q}</span><div class="qp-row" role="group" aria-labelledby="qp-${k}">${o.map(([v, t]) => `<button class="qp-opt${PT.quiz.a[k] === v ? ' on' : ''}" data-act="qp" data-k="${k}" data-v="${v}" aria-pressed="${PT.quiz.a[k] === v}">${t}</button>`).join('')}</div>`).join('')}</div>
    </div></div></section>
    <section class="sec"><div class="wrap"><div class="adv">
      <div class="adv-item">${icon('i-award')}<div><b>Оригинальная техника</b><small>Работаем с проверенными поставщиками, серийник в документах</small></div></div>
      <div class="adv-item">${icon('i-shield')}<div><b>Гарантия и сервис</b><small>Принимаем по гарантии сами, без поездок по сервисам</small></div></div>
      <div class="adv-item">${icon('i-truck')}<div><b>Доставка по России</b><small>СДЭК 1–5 дней, курьер и самовывоз в Москве</small></div></div>
      <div class="adv-item">${icon('i-video')}<div><b>Видео перед отправкой</b><small>Проверяем прибор и присылаем видео именно вашего экземпляра</small></div></div>
      <div class="adv-item">${icon('i-headset')}<div><b>Помощь в выборе</b><small>Консультант на сайте и живой специалист в мессенджерах</small></div></div>
    </div></div></section>
    ${sec('Обзоры и тесты', `<div class="articles">${ARTICLES.map(articleCard).join('')}</div>`, '<a class="sec-link" href="#reviews-list">Все обзоры' + icon('i-chev-r') + '</a>', 'Пишем сами, по приборам со склада. Это и помощь в выборе, и трафик из поиска.')}
    ${sec('Отзывы покупателей', `<div class="reviews">${REVIEWS.map(reviewCard).join('')}</div>`, '<a class="sec-link" href="#reviews">Все отзывы' + icon('i-chev-r') + '</a>', 'С фото и видео от покупателей. После покупки приходит просьба оставить отзыв.')}
    ${sec('Официальные бренды', `<div class="brands-row">${PT.BRANDS.slice(0, 6).map(brandTile).join('')}</div>`, '<a class="sec-link" href="#brands">Все бренды' + icon('i-chev-r') + '</a>')}`;
  };

  /* ---------- catalog ---------- */
  PT.catState = { key: null, f: PT.newFilter(), sort: 'pop' };
  V.scopeOf = (token) => {
    const [base, preset] = token.split('.');
    if (base.startsWith('cat-')) { const c = PT.catById[base.slice(4)]; if (!c) return null; return { key: base, title: c.name, set: c.id, list: PT.products.filter((p) => p.cat === c.id), preset, crumbs: [[c.name]], desc: c.note }; }
    if (base.startsWith('col-')) { const c = PT.COLS[base.slice(4)]; if (!c) return null; return { key: base, title: c.title, set: 'any', list: PT.products.filter(c.test), preset, crumbs: [[c.title]], desc: c.desc }; }
    if (base.startsWith('brand-')) { const b = PT.BRANDS.find((x) => x.id === base.slice(6)); if (!b) return null; return { key: base, title: b.name, set: 'any', list: PT.products.filter((p) => PT.brandId(p.brand) === b.id), preset, crumbs: [['Бренды', '#brands'], [b.name]], desc: 'Все модели ' + b.name + ' в нашем каталоге.' }; }
    if (base === 'catalog') return { key: base, title: 'Каталог', set: 'any', list: PT.products.slice(), preset, crumbs: [['Каталог']] };
    if (base === 'fav') return { key: base, title: 'Избранное', set: 'any', list: PT.store.fav.map((id) => PT.byId[id]).filter(Boolean), crumbs: [['Избранное']], fav: true };
    if (base === 'search') { const r = PT.search(PT.lastQuery || ''); return { key: base + ':' + (PT.lastQuery || ''), title: 'Поиск: «' + (PT.lastQuery || '') + '»', set: 'any', list: r.items, crumbs: [['Поиск']], search: r }; }
    return null;
  };

  const facetHtml = (sc, f) => {
    const st = PT.catState;
    const ids = PT.FACET_SETS[sc.set] || PT.FACET_SETS.any;
    const prices = sc.list.map((p) => p.price);
    const lo = prices.length ? Math.min(...prices) : 0, hi = prices.length ? Math.max(...prices) : 0;
    const lrfN = sc.list.filter((p) => PT.passes(p, f, 'lrf') && p.lrf > 0).length;
    let h = `<div class="fgroup"><b>Цена, ₽</b><div class="fprice"><label class="sr-only" for="pmin">Цена от</label><input id="pmin" inputmode="numeric" placeholder="от ${num(lo)}" value="${f.pmin != null ? f.pmin : ''}" data-act="price" data-k="pmin"><label class="sr-only" for="pmax">Цена до</label><input id="pmax" inputmode="numeric" placeholder="до ${num(hi)}" value="${f.pmax != null ? f.pmax : ''}" data-act="price" data-k="pmax"></div></div>`;
    if (sc.set !== 'accessories') h += `<div class="fgroup"><label class="fswitch">Встроенный дальномер<em>${lrfN}</em><input type="checkbox" data-act="lrf" ${f.lrf ? 'checked' : ''}></label></div>`;
    ids.forEach((fid) => {
      const fc = PT.FACETS[fid];
      const counts = PT.facetCounts(sc.list, f, fid).filter((o) => o.n > 0 || (f.sel[fid] || []).includes(o.id));
      if (counts.length < 2 && !(f.sel[fid] || []).length) return;
      const type = fc.type === 'one' ? 'radio' : 'checkbox';
      h += `<div class="fgroup"><b>${fc.label}</b>${fc.hint ? `<small class="hint">${fc.hint}</small>` : ''}${counts.map((o) => `<label class="fopt${o.n ? '' : ' is-zero'}"><input type="${type}" name="f-${fid}" data-act="facet" data-f="${fid}" value="${esc(o.id)}" ${(f.sel[fid] || []).includes(o.id) ? 'checked' : ''}><span>${esc(o.label)}</span><em>${o.n}</em></label>`).join('')}</div>`;
    });
    return h + `<button class="btn btn-ghost btn-sm freset" data-act="reset-filters">Сбросить фильтры</button>`;
  };
  PT.facetHtml = facetHtml;

  const pillsHtml = (f) => {
    const pills = [];
    for (const fid in f.sel) (f.sel[fid] || []).forEach((v) => { const o = PT.FACETS[fid].opts(PT.products).find((x) => x.id === v); pills.push([`sel:${fid}:${v}`, o ? o.label : v]); });
    if (f.lrf) pills.push(['lrf', 'С дальномером']);
    if (f.pmin != null) pills.push(['pmin', 'от ' + rub(f.pmin)]);
    if (f.pmax != null) pills.push(['pmax', 'до ' + rub(f.pmax)]);
    if (f.wmax != null) pills.push(['wmax', 'до ' + f.wmax + ' г']);
    if (f.flag) pills.push(['flag', { new: 'Новинки', hit: 'Хиты', pro: 'Профессиональные' }[f.flag]]);
    return pills.map(([k, l]) => `<button class="pill" data-act="pill" data-k="${esc(k)}">${esc(l)}${icon('i-close')}</button>`).join('');
  };

  PT.renderResults = () => {
    const st = PT.catState, sc = st.scope;
    const sorter = (PT.SORTS.find((s) => s[0] === st.sort) || PT.SORTS[0])[2];
    const items = PT.filter(sc.list, st.f).sort(sorter);
    const grid = document.getElementById('cat-grid');
    if (!grid) return;
    document.getElementById('cat-found').textContent = items.length ? `Найдено ${items.length} ${plural(items.length, 'товар', 'товара', 'товаров')}` : 'Ничего не найдено';
    document.getElementById('cat-pills').innerHTML = pillsHtml(st.f);
    document.getElementById('cat-presets').innerHTML = presetsHtml(sc, st.f);
    const fb = document.getElementById('filters');
    if (fb) fb.innerHTML = facetHtml(sc, st.f);
    const fs = document.getElementById('fsheet-body');
    if (fs && !document.getElementById('fsheet').hidden) fs.innerHTML = facetHtml(sc, st.f);
    const ap = document.getElementById('fsheet-apply');
    if (ap) ap.textContent = items.length ? `Показать ${items.length} ${plural(items.length, 'товар', 'товара', 'товаров')}` : 'Ничего не найдено';
    const nf = Object.values(st.f.sel).reduce((a, v) => a + v.length, 0) + (st.f.lrf ? 1 : 0) + (st.f.pmin != null) + (st.f.pmax != null) + (st.f.wmax != null) + (st.f.flag ? 1 : 0);
    const bf = document.getElementById('btn-filters');
    if (bf) bf.innerHTML = icon('i-filter') + 'Фильтры' + (nf ? ` (${nf})` : '');
    grid.innerHTML = items.length ? items.map(PT.card).join('') : emptyHtml(sc);
  };
  const emptyHtml = (sc) => sc.fav && !sc.list.length
    ? `<div class="empty">${icon('i-heart')}<h3>В избранном пока пусто</h3><p>Нажмите на сердечко у товара, чтобы вернуться к нему позже.</p><div class="row"><a class="btn" href="#catalog">Перейти в каталог</a></div></div>`
    : `<div class="empty">${icon('i-search')}<h3>Под эти условия ничего не нашлось</h3><p>Попробуйте убрать один из фильтров. Или опишите задачу консультанту, он подберёт похожие модели.</p><div class="row"><button class="btn btn-ghost" data-act="reset-filters">Сбросить фильтры</button><button class="btn" data-act="chat-open">Спросить консультанта</button></div></div>`;
  const presetsHtml = (sc, f) => (PT.PRESET_SETS[sc.set] || PT.PRESET_SETS.any).filter((k) => {
    const g = PT.newFilter(); PT.PRESETS[k].toggle(g); return sc.list.some((p) => PT.passes(p, g));
  }).map((k) => `<button class="chip${PT.PRESETS[k].on(f) ? ' on' : ''}" data-act="preset" data-k="${k}">${PT.PRESETS[k].label}</button>`).join('');

  V.catalog = (token) => {
    const sc = V.scopeOf(token);
    if (!sc) return V.notfound();
    const st = PT.catState;
    if (st.key !== sc.key + '|' + (sc.preset || '')) {
      st.key = sc.key + '|' + (sc.preset || ''); st.f = PT.newFilter(); st.sort = 'pop';
      if (sc.preset && PT.PRESETS[sc.preset]) PT.PRESETS[sc.preset].toggle(st.f);
    }
    st.scope = sc;
    const crumbs = `<nav class="crumbs" aria-label="Вы здесь"><a href="#home">Главная</a>${sc.crumbs.map(([t, h]) => icon('i-chev-r') + (h ? `<a href="${h}">${t}</a>` : `<span>${esc(t)}</span>`)).join('')}</nav>`;
    const note = sc.search && sc.search.swapped ? `<p class="cat-desc">Показаны результаты по запросу «${esc(sc.search.swapped)}». Похоже, была включена другая раскладка.</p>` : sc.search && sc.search.budget ? `<p class="cat-desc">Учли бюджет: до ${rub(sc.search.budget)}.</p>` : sc.desc ? `<p class="cat-desc">${esc(sc.desc)}</p>` : '';
    return `<div class="wrap">${crumbs}
      <div class="cat-head"><h1>${esc(sc.title)}</h1><span class="cnt-line">${sc.list.length} ${plural(sc.list.length, 'модель', 'модели', 'моделей')}</span></div>
      ${note}
      <div class="presets" id="cat-presets"></div>
      <div class="cat-layout">
        <aside class="filters" id="filters" aria-label="Фильтры"></aside>
        <div>
          <div class="toolbar"><span class="found" id="cat-found" aria-live="polite"></span>
            <div class="toolbar-r"><button class="btn btn-ghost btn-sm btn-filters" id="btn-filters" data-act="filters-open"></button>
            <label class="sr-only" for="sort">Сортировка</label><select class="sort" id="sort" data-act="sort">${PT.SORTS.map(([id, l]) => `<option value="${id}"${id === st.sort ? ' selected' : ''}>${l}</option>`).join('')}</select></div></div>
          <div class="pills" id="cat-pills"></div>
          <div class="grid-cards" id="cat-grid"></div>
        </div>
      </div></div>`;
  };

  /* ---------- product ---------- */
  const SCENES = { scopes: 'boar', monoculars: 'fox', binoculars: 'deer', digital: 'hare' };
  V.product = (id) => {
    const p = PT.byId[id];
    if (!p) return V.notfound();
    const c = PT.catById[p.cat];
    const fav = PT.fav.has(p.id), cmp = PT.cmp.has(p.id), inCart = PT.cart.has(p.id), pre = p.stock === 'pre';
    const thermal = p.cat !== 'accessories';
    const similar = PT.products.filter((x) => x.cat === p.cat && x.id !== p.id).sort((a, b) => Math.abs(a.price - p.price) - Math.abs(b.price - p.price)).slice(0, 2);
    const groups = p.groups || [];
    const specRows = groups.map(([g, rows], gi) => `<div class="spec-group"${gi > 3 ? ' data-more hidden' : ''}><b>${esc(g)}</b>${rows.map(([k, v]) => `<div class="spec-row"><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join('')}</div>`).join('');
    const scene = SCENES[p.cat] || 'boar';
    const acc = PT.products.filter((x) => x.cat === 'accessories').slice(0, 3);
    const cmpRows = [['Цена', (x) => rub(x.price)], ['Матрица', PT.resLabel], ['NETD', PT.netdLabel], ['Дальность', PT.rangeLabel], ['Дальномер', PT.lrfLabel], ['Вес', PT.weightLabel]];
    return `<div class="wrap">
      <nav class="crumbs" aria-label="Вы здесь"><a href="#home">Главная</a>${icon('i-chev-r')}<a href="#cat-${c.id}">${c.name}</a>${icon('i-chev-r')}<a href="#brand-${PT.brandId(p.brand)}">${esc(p.brand)}</a></nav>
      <div class="pp">
        <div class="gallery">
          <div class="g-thumbs" role="tablist" aria-label="Фото и вид в окуляре">
            <button class="g-thumb on" data-act="gal" data-v="photo" role="tab" aria-selected="true" aria-label="Фото">${PT.thumb(p)}</button>
            ${thermal ? `<button class="g-thumb" data-act="gal" data-v="view" role="tab" aria-selected="false" aria-label="Вид в окуляре"><canvas data-scene="${scene}" data-palette="white" data-seed="9" data-max="160"></canvas></button>
            <button class="g-thumb" data-act="gal" data-v="video" role="tab" aria-selected="false" aria-label="Видео с прибора"><canvas data-scene="${scene}" data-palette="iron" data-seed="4" data-max="160"></canvas>${icon('i-play')}</button>` : ''}
          </div>
          <div class="g-main" id="g-main">
            <div class="badges">${PT.badges(p)}</div>
            <div data-pane="photo">${PT.thumb(p)}</div>
            ${thermal ? `<div data-pane="view" hidden><canvas id="pp-view" data-scene="${scene}" data-palette="white" data-seed="9" data-max="900" aria-label="Пример изображения в окуляре"></canvas><span class="g-cap">Пример картинки в окуляре</span>${reticle}<div class="g-pal">${PALS.map(([pid, name, sw]) => `<button class="pal${pid === 'white' ? ' on' : ''}" data-act="palette" data-pal="${pid}" data-target="pp-view"><i style="background:${sw}"></i>${name}</button>`).join('')}</div></div>
            <div data-pane="video" hidden><canvas data-scene="${scene}" data-palette="iron" data-seed="4" data-max="900"></canvas><div class="g-video"><span class="playbig">${icon('i-play')}</span><b>Видео этой модели</b><small>Включение, меню и вид в окуляре. Снимаем сами на приборе со склада</small></div></div>` : ''}
          </div>
        </div>
        <div class="buy">
          <div class="buy-top"><a href="#brand-${PT.brandId(p.brand)}">${esc(p.brand)}</a>${p.reviews ? `<a href="#pp-reviews">${PT.stars(Math.round(p.rating))} ${p.reviews} ${plural(p.reviews, 'отзыв', 'отзыва', 'отзывов')}</a>` : ''}<span>Код: ${p.id.length * 137 % 9000 + 1000}</span></div>
          <h1><small>${esc(p.type)}</small>${esc(p.name)}</h1>
          ${p.short ? `<p class="buy-lead">${esc(p.short)}</p>` : ''}
          ${thermal ? `<div class="kspecs-pp">${PT.keySpecs(p).slice(0, 6).map((k) => `<div class="kspec"><span class="kspec-i">${icon(k.i)}</span><small>${k.l}</small><b>${esc(k.v)}</b></div>`).join('')}</div>` : ''}
          <div class="buy-box">
            <div class="buy-price">${p.old ? `<span class="price-old">${rub(p.old)}</span>` : ''}<span class="price">${rub(p.price)}</span>${pre ? '<span class="badge badge-pre">Цена предзаказа</span>' : ''}</div>
            ${p.price > 30000 ? `<p class="buy-split">В рассрочку от <b>${rub(PT.split(p.price))}/мес</b> на 12 месяцев, решение банка онлайн</p>` : ''}
            <div class="buy-stock${pre ? ' pre' : ''}">${PT.stockHtml(p)}<span>${p.stock === 'in' ? 'На складе в Москве. Отправим сегодня, если оформить до 16:00.' : pre ? 'Оформите предзаказ без предоплаты: цена фиксируется, придёт уведомление о поступлении.' : 'Привезём под заказ, менеджер подтвердит срок.'}</span></div>
            <div class="buy-acts">
              <button class="btn btn-lg${inCart ? ' is-done' : ''}" data-act="${inCart ? 'cart-open' : 'cart-add'}" data-id="${p.id}">${icon(inCart ? 'i-check' : pre ? 'i-calendar' : 'i-cart')}${inCart ? 'В корзине' : pre ? 'Оформить предзаказ' : 'В корзину'}</button>
              <button class="sq-btn${fav ? ' on' : ''}" data-act="fav" data-id="${p.id}" aria-pressed="${fav}" aria-label="В избранное">${icon('i-heart', 'ic-heart')}</button>
              ${thermal ? `<button class="sq-btn${cmp ? ' on' : ''}" data-act="cmp" data-id="${p.id}" aria-pressed="${cmp}" aria-label="Сравнить">${icon('i-compare')}</button>` : ''}
            </div>
            <div class="buy-alt"><button class="btn btn-ghost" data-act="oneclick" data-id="${p.id}">Купить в 1 клик</button><button class="btn btn-ghost" data-act="chat-ask" data-id="${p.id}">${icon('i-chat')}Спросить о приборе</button></div>
          </div>
          ${PT.articlesFor(p.id).slice(0, 1).map((a) => `<a class="pp-article" href="#a-${a.slug}">${icon('i-play')}<span><small>${a.tag} на сайте</small><b>${esc(a.t)}</b></span>${icon('i-chev-r')}</a>`).join('')}
          <ul class="clean trust">
            <li>${icon('i-video')}<span><b>Видео вашего экземпляра перед отправкой</b><small>Включаем, проверяем картинку и дальномер, присылаем в мессенджер</small></span></li>
            <li>${icon('i-truck')}<span><b>Доставка СДЭК 1–5 дней, бесплатно от 30 000 ₽</b><small>Курьер по Москве сегодня или завтра, самовывоз из шоурума</small></span></li>
            <li>${icon('i-shield')}<span><b>Гарантия и сервис через нас</b><small>Срок зависит от бренда, указан в паспорте прибора</small></span></li>
          </ul>
        </div>
      </div>
      <div class="pp-tabs"><nav aria-label="Разделы товара"><a href="#pp-specs" data-act="tab" class="on">Характеристики</a>${p.fit ? '<a href="#pp-fit" data-act="tab">Кому подойдёт</a>' : ''}${thermal && similar.length ? '<a href="#pp-cmp" data-act="tab">Сравнить с похожими</a>' : ''}<a href="#pp-reviews" data-act="tab">Отзывы</a><a href="#pp-acc" data-act="tab">С этим покупают</a></nav></div>
      <section class="pp-sec" id="pp-specs"><h2>Характеристики</h2><div class="pp-cols"><div class="spec-table">${specRows || '<div class="spec-row"><span>Совместимость</span><span>' + esc(p.compat || '—') + '</span></div>'}${groups.length > 4 ? '<button class="spec-more" data-act="spec-more">Показать все характеристики</button>' : ''}</div>
        <div style="display:grid;gap:14px">${p.fit ? `<div class="fit" id="pp-fit"><h3>Кому подойдёт</h3><ul class="clean" style="display:grid;gap:8px">${p.fit.map((x) => `<li>${icon('i-check')}<span>${esc(x)}</span></li>`).join('')}</ul></div>` : ''}
        <div class="ask-box"><b>Не уверены, что подойдёт?</b><p>Спросите консультанта: он знает характеристики всех моделей и наличие на складе.</p><div class="qp-row"><button class="qp-opt" data-act="chat-q" data-q="Подойдёт ли ${esc(p.name)} для леса?">Подойдёт для леса?</button><button class="qp-opt" data-act="chat-q" data-q="Есть ли в наличии ${esc(p.name)}?">Есть в наличии?</button>${similar[0] ? `<button class="qp-opt" data-act="chat-q" data-q="Чем ${esc(p.name)} лучше ${esc(similar[0].name)}?">Чем лучше ${esc(similar[0].name.split(' ').slice(1, 3).join(' '))}?</button>` : ''}</div></div></div></div></section>
      ${thermal && similar.length ? `<section class="pp-sec" id="pp-cmp"><h2>Сравнить с похожими</h2><div class="table-scroll"><table class="ctable"><thead><tr><th></th>${[p, ...similar].map((x) => `<th><a href="#p-${x.id}" class="cmp-head"><span class="thumb">${`<img src="${x.img}" alt="" loading="lazy">`}</span><span class="n">${esc(x.name)}</span></a></th>`).join('')}</tr></thead><tbody>${cmpRows.map(([l, fn]) => `<tr><th scope="row">${l}</th>${[p, ...similar].map((x) => `<td>${esc(fn(x) || '—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div><p style="margin-top:10px"><button class="btn btn-ghost btn-sm" data-act="cmp-set" data-ids="${[p, ...similar].map((x) => x.id).join(',')}">${icon('i-compare')}Открыть полное сравнение</button></p></section>` : ''}
      <section class="pp-sec" id="pp-reviews"><h2>Отзывы</h2>${p.reviews ? `<div class="reviews">${(PT.REVIEWS.filter((r) => r.id === p.id).length ? PT.REVIEWS.filter((r) => r.id === p.id) : PT.REVIEWS.slice(0, 2).map((r) => ({ ...r, id: p.id }))).map(reviewCard).join('')}</div>` : `<div class="empty">${icon('i-star')}<h3>Отзывов пока нет</h3><p>${pre ? 'Модель ещё не приехала. Первые отзывы появятся после поставки.' : 'Купите прибор и расскажите о нём первым: пришлём ссылку на форму с фото и видео.'}</p></div>`}</section>
      <section class="pp-sec" id="pp-acc"><h2>С этим покупают</h2><div class="grid-cards">${acc.filter((a) => a.id !== p.id).map(PT.card).join('')}</div></section>
    </div>`;
  };
  V.reviewCard = reviewCard;

  /* ---------- compare ---------- */
  const best = (vals, mode) => {
    const nums = vals.map((v) => (typeof v === 'number' && !isNaN(v) ? v : null));
    const ok = nums.filter((v) => v != null);
    if (ok.length < 2 || new Set(ok).size < 2) return -1;
    const t = mode === 'max' ? Math.max(...ok) : Math.min(...ok);
    return nums.indexOf(t);
  };
  const CMP = [
    ['Тип', (p) => p.type],
    ['Матрица', (p) => (p.res ? PT.resLabel(p) + (p.pitch ? ', ' + p.pitch + ' мкм' : '') : null), (p) => PT.pixels(p.res), 'max'],
    ['NETD', PT.netdLabel, (p) => p.netd, 'min'],
    ['Объектив', PT.lensLabel],
    ['Увеличение', (p) => p.mag],
    ['Дальность обнаружения', PT.rangeLabel, (p) => p.range, 'max'],
    ['Дальномер', PT.lrfLabel, (p) => (p.lrf > 1 ? p.lrf : null), 'max'],
    ['Дисплей', (p) => p.display],
    ['Автономность', PT.batteryLabel, (p) => p.battery, 'max'],
    ['Вес', PT.weightLabel, (p) => p.weight, 'min'],
    ['Частота кадров', (p) => (p.fps ? p.fps + ' Гц' : null), (p) => p.fps, 'max'],
    ['Цена', (p) => rub(p.price), (p) => p.price, 'min'],
    ['Наличие', (p) => PT.stockLabel(p)],
  ];
  V.compare = () => {
    const ps = PT.store.cmp.map((id) => PT.byId[id]).filter(Boolean);
    const head = `<nav class="crumbs"><a href="#home">Главная</a>${icon('i-chev-r')}<span>Сравнение</span></nav><div class="cat-head"><h1>Сравнение</h1><span class="cnt-line">${ps.length} из 4</span></div>`;
    if (ps.length < 2) {
      const sug = PT.products.filter((p) => p.hit && !PT.cmp.has(p.id) && p.cat !== 'accessories').slice(0, 4);
      return `<div class="wrap">${head}<div class="empty" style="margin-bottom:18px">${icon('i-compare')}<h3>${ps.length ? 'Добавьте ещё хотя бы один прибор' : 'Пока нечего сравнивать'}</h3><p>Нажмите значок сравнения на карточке товара. Можно сравнить до 4 приборов: матрицу, NETD, дальность, дальномер, вес и цену.</p></div><div class="sec-head"><h2>Часто сравнивают</h2></div><div class="grid-cards">${[...ps, ...sug].slice(0, 4).map(PT.card).join('')}</div></div>`;
    }
    const rows = CMP.map(([label, show, val, mode]) => {
      const shown = ps.map((p) => show(p));
      const b = val ? best(ps.map(val), mode) : -1;
      const same = new Set(shown.map((x) => x || '—')).size === 1;
      return `<tr class="${same ? 'is-same' : ''}"><th scope="row">${label}</th>${shown.map((s, i) => `<td class="${i === b ? 'best' : ''}${s ? '' : ' na'}">${esc(s || '—')}</td>`).join('')}</tr>`;
    }).join('');
    return `<div class="wrap">${head}
      <div class="cmp-tools"><label class="fswitch" style="gap:12px">Показывать одинаковые строки<input type="checkbox" data-act="cmp-same"></label><span class="legend-best"><b>Зелёным</b> отмечено лучшее значение в строке</span></div>
      <div class="table-scroll"><table class="ctable" id="ctable"><thead><tr><th scope="col"><span class="sr-only">Параметр</span></th>${ps.map((p) => `<th scope="col"><div class="cmp-head"><button class="x" data-act="cmp-rm" data-id="${p.id}" aria-label="Убрать ${esc(p.name)} из сравнения">${icon('i-close')}</button><a href="#p-${p.id}">${PT.thumb(p)}</a><a class="n" href="#p-${p.id}">${esc(p.name)}</a>${PT.cartBtn(p)}</div></th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></div>`;
  };

  /* ---------- quiz ---------- */
  const Q = [
    { k: 'need', t: 'Что нужно?', s: 'От этого зависит тип прибора', o: [['scope', 'Прицел на оружие', 'Тепловизионный прицел или насадка', 'i-target'], ['mono', 'Монокуляр', 'Наблюдение, поиск зверя и подранка', 'i-eye'], ['bino', 'Бинокль', 'Долгое наблюдение двумя глазами', 'i-zoom'], ['any', 'Пока не знаю', 'Покажем лучшее под остальные ответы', 'i-info']] },
    { k: 'place', t: 'Где охотитесь или наблюдаете?', s: 'Дистанция определяет объектив и матрицу', o: [['forest', 'Лес, до 300 м', 'Важны лёгкость и широкий обзор', 'i-pin'], ['mixed', 'Лес и поля', 'Универсальный вариант', 'i-pin'], ['field', 'Большие поля, 500 м и дальше', 'Нужны дальность и детализация', 'i-target'], ['guard', 'Охрана, наблюдение за территорией', 'Важны автономность и запись видео', 'i-shield']] },
    { k: 'lrf', t: 'Нужен встроенный дальномер?', s: 'Дальномер мгновенно показывает расстояние до цели', o: [['yes', 'Нужен', 'Стреляю на разные дистанции', 'i-laser'], ['no', 'Не нужен', 'Дистанции короткие и понятные', 'i-close'], ['any', 'Не знаю', 'Посчитаем плюсом, но не обязательным', 'i-info']] },
    { k: 'budget', t: 'Какой бюджет?', s: 'Покажем лучшее в этих пределах', o: [['150', 'до 150 000 ₽', 'Хороший старт', 'i-bolt'], ['300', '150–300 000 ₽', 'Самый популярный диапазон', 'i-bolt'], ['500', '300–500 000 ₽', 'Чувствительные матрицы и дальномеры', 'i-bolt'], ['max', 'Не ограничен', 'Флагманы и HD-матрицы', 'i-award']] },
  ];
  PT.QUIZ = Q;
  PT.quiz = PT.quiz || { step: 0, a: {} };
  PT.quizResult = (a) => {
    const catOf = { scope: ['scopes'], mono: ['monoculars'], bino: ['binoculars'], any: ['scopes', 'monoculars', 'binoculars'] }[a.need || 'any'];
    const cap = { 150: 150000, 300: 300000, 500: 500000, max: Infinity }[a.budget || 'max'];
    const lo = { 150: 0, 300: 120000, 500: 280000, max: 380000 }[a.budget || 'max'];
    const list = PT.products.filter((p) => catOf.includes(p.cat) && p.price <= cap);
    return list.map((p) => {
      let s = 0; const why = [];
      if (p.price >= lo) s += 10;
      if (a.lrf === 'yes') { if (p.lrf > 0) { s += 30; why.push('дальномер ' + PT.lrfLabel(p)); } else s -= 40; }
      if (a.lrf === 'any' && p.lrf > 0) { s += 8; why.push('есть дальномер'); }
      if (a.place === 'field') { s += (p.range || 0) / 100 + PT.pixels(p.res) / 60000; if ((p.range || 0) >= 2500) why.push('дальность ' + PT.rangeLabel(p)); }
      if (a.place === 'forest') { s += (p.weight && p.weight < 700 ? 15 : 0) + ((p.lens || 50) <= 35 ? 12 : 0); if (p.weight && p.weight < 700) why.push('лёгкий, ' + PT.weightLabel(p)); }
      if (a.place === 'mixed') { s += (p.lens === 50 ? 12 : 4) + (p.range || 0) / 300; why.push('объектив ' + PT.lensLabel(p) + ' для леса и полей'); }
      if (a.place === 'guard') { s += (p.battery || 0) * 2 + (p.video ? 6 : 0); if (p.battery) why.push('работа ' + PT.batteryLabel(p)); }
      if (p.netd && p.netd <= 15) { s += 8; why.push('NETD ' + PT.netdLabel(p)); }
      if (p.stock === 'in') { s += 6; why.push('в наличии'); }
      if (p.hit) s += 4;
      if (a.budget) why.unshift('в бюджете ' + Q[3].o.find((o) => o[0] === a.budget)[1]);
      return { p, s, why: why.slice(0, 4) };
    }).sort((x, y) => y.s - x.s).slice(0, 3);
  };
  V.quiz = () => {
    const qz = PT.quiz;
    if (qz.step >= Q.length) {
      const res = PT.quizResult(qz.a);
      const body = res.length ? `<div class="qres">${res.map((r, i) => `<div class="qres-card">${PT.thumb(r.p)}<div><h3><a href="#p-${r.p.id}">${esc(r.p.name)}</a></h3><div class="qres-why">${r.why.map((w) => `<span class="why">${icon('i-check')}${esc(w)}</span>`).join('')}</div></div><div class="qres-buy">${i ? '' : '<span class="qres-top">Лучшее совпадение</span>'}<span class="price">${rub(r.p.price)}</span>${PT.stockHtml(r.p)}<a class="btn btn-sm" href="#p-${r.p.id}">Смотреть</a></div></div>`).join('')}</div>
        <div class="quiz-nav"><button class="btn btn-ghost" data-act="quiz-reset">Пройти заново</button><button class="btn" data-act="cmp-set" data-ids="${res.map((r) => r.p.id).join(',')}">${icon('i-compare')}Сравнить эти модели</button></div>`
        : `<div class="empty">${icon('i-search')}<h3>Под такие условия моделей нет</h3><p>Чаще всего мешает бюджет. Попробуйте увеличить его или спросите консультанта.</p><div class="row"><button class="btn btn-ghost" data-act="quiz-reset">Пройти заново</button><button class="btn" data-act="chat-open">Спросить консультанта</button></div></div>`;
      return `<div class="wrap"><div class="quiz"><div class="quiz-top"><b>Подбор прибора</b><span class="quiz-steps">Готово</span></div><div class="quiz-bar"><i style="width:100%"></i></div><div class="quiz-body"><h2>Вам подойдут</h2><p>Подобрали по вашим ответам из того, что есть в каталоге. Можно сравнить их в таблице или задать вопрос консультанту.</p>${body}</div></div></div>`;
    }
    const q = Q[qz.step];
    return `<div class="wrap"><div class="quiz"><div class="quiz-top"><b>Подбор прибора</b><span class="quiz-steps">Вопрос ${qz.step + 1} из ${Q.length}</span></div><div class="quiz-bar"><i style="width:${(qz.step / Q.length) * 100}%"></i></div>
      <div class="quiz-body"><h2>${q.t}</h2><p>${q.s}</p><div class="qopts">${q.o.map(([v, t, s, ic]) => `<button class="qopt${qz.a[q.k] === v ? ' on' : ''}" data-act="quiz-opt" data-k="${q.k}" data-v="${v}"><span class="qopt-i">${icon(ic)}</span><span><b>${t}</b><small>${s}</small></span></button>`).join('')}</div>
      <div class="quiz-nav">${qz.step ? `<button class="btn btn-ghost" data-act="quiz-back">${icon('i-chev-l')}Назад</button>` : '<span></span>'}<span class="muted" style="align-self:center;font-size:13px">Выберите вариант, следующий вопрос откроется сам</span></div></div></div></div>`;
  };

  /* ---------- checkout ---------- */
  V.checkout = () => {
    const lines = PT.cart.lines();
    if (PT.orderDone) {
      const o = PT.orderDone;
      return `<div class="wrap"><div class="success"><span class="ok-ring">${icon('i-check')}</span><h1>Заказ №${o.n} оформлен</h1><p>${esc(o.name)}, менеджер позвонит на ${esc(o.phone)} в течение 15 минут и подтвердит наличие. Уведомление о заказе уже ушло в Telegram магазина.</p><p class="muted" style="font-size:13px">Это демо: данные никуда не отправлялись.</p><a class="btn" href="#home">На главную</a></div></div>`;
    }
    if (!lines.length) return `<div class="wrap"><div class="success"><span class="ok-ring" style="background:var(--soft);color:var(--muted)">${icon('i-cart')}</span><h1>Корзина пуста</h1><p>Добавьте прибор из каталога или пройдите подбор, если не знаете, с чего начать.</p><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><a class="btn" href="#catalog">Каталог</a><a class="btn btn-ghost" href="#quiz">Подбор прибора</a></div></div></div>`;
    const total = PT.cart.total();
    const d = PT.checkoutDelivery || 'cdek';
    const dPrice = d === 'cdek' ? (total >= 30000 ? 0 : 490) : d === 'courier' ? 0 : 0;
    return `<div class="wrap"><nav class="crumbs"><a href="#home">Главная</a>${icon('i-chev-r')}<span>Оформление заказа</span></nav>
      <form class="co" id="co-form" novalidate><div><h1>Оформление заказа</h1>
        <div class="co-step"><h2><i>1</i>Контакты</h2><div class="fields">
          <label class="field" for="co-name">Имя<input id="co-name" name="name" autocomplete="name" required placeholder="Как к вам обращаться"><span class="err" hidden>Укажите имя</span></label>
          <label class="field" for="co-phone">Телефон<input id="co-phone" name="phone" type="tel" autocomplete="tel" required placeholder="+7 900 000-00-00"><span class="err" hidden>Нужен телефон, чтобы подтвердить заказ</span></label>
          <label class="field wide" for="co-email">E-mail, по желанию<input id="co-email" name="email" type="email" autocomplete="email" placeholder="Пришлём чек и трек-номер"></label></div></div>
        <div class="co-step"><h2><i>2</i>Доставка</h2><div class="ropts">
          <label class="ropt"><input type="radio" name="dl" value="cdek" data-act="co-dl" ${d === 'cdek' ? 'checked' : ''}><span><b>СДЭК, пункт выдачи</b><small>1–5 дней по России. Пункт выберете на карте.</small></span><em>${total >= 30000 ? 'бесплатно' : '490 ₽'}</em></label>
          <label class="ropt"><input type="radio" name="dl" value="courier" data-act="co-dl" ${d === 'courier' ? 'checked' : ''}><span><b>Курьер по Москве</b><small>Сегодня или завтра, с проверкой прибора при вас</small></span><em>бесплатно</em></label>
          <label class="ropt"><input type="radio" name="dl" value="pickup" data-act="co-dl" ${d === 'pickup' ? 'checked' : ''}><span><b>Самовывоз из шоурума</b><small>Москва, ежедневно 10:00–20:00. Покажем прибор в работе.</small></span><em>бесплатно</em></label></div></div>
        <div class="co-step"><h2><i>3</i>Оплата</h2><div class="ropts">
          <label class="ropt"><input type="radio" name="pay" value="online" checked><span><b>Картой или по СБП на сайте</b><small>Через ЮKassa, чек придёт на почту</small></span><em></em></label>
          <label class="ropt"><input type="radio" name="pay" value="split"><span><b>Рассрочка или оплата частями</b><small>От ${rub(PT.split(total))}/мес, решение банка за пару минут</small></span><em></em></label>
          <label class="ropt"><input type="radio" name="pay" value="cod"><span><b>При получении</b><small>Наличными или картой курьеру, в пункте выдачи СДЭК</small></span><em></em></label>
          <label class="ropt"><input type="radio" name="pay" value="invoice"><span><b>По счёту для организаций</b><small>Выставим счёт с НДС</small></span><em></em></label></div>
          <label class="field" for="co-note">Комментарий<textarea id="co-note" name="note" placeholder="Например: нужен кронштейн под кольца 30 мм"></textarea></label></div>
      </div>
      <aside class="co-sum"><h2>Ваш заказ</h2>${lines.map((l) => `<div class="co-line">${PT.thumb(l.p)}<span>${esc(l.p.name)}<small>${l.q} шт.${l.p.stock === 'pre' ? ', предзаказ' : ''}</small></span><b class="tnum">${rub(l.p.price * l.q)}</b></div>`).join('')}
        <div class="co-tot"><div><span>Товары</span><span>${rub(total)}</span></div><div><span>Доставка</span><span>${dPrice ? rub(dPrice) : 'бесплатно'}</span></div><div class="big"><span>Итого</span><span>${rub(total + dPrice)}</span></div></div>
        <label class="consent"><input id="co-consent" type="checkbox" required checked> Согласен на обработку персональных данных и с условиями оферты</label>
        <button class="btn btn-lg btn-block" type="submit">Подтвердить заказ</button>
        <p class="muted" style="font-size:12.5px">Это демо: заказ никуда не отправится.</p></aside></form></div>`;
  };

  /* ---------- simple pages ---------- */
  V.brands = () => `<div class="wrap"><nav class="crumbs"><a href="#home">Главная</a>${icon('i-chev-r')}<span>Бренды</span></nav><div class="cat-head"><h1>Бренды</h1></div><p class="cat-desc">Нажмите на бренд, чтобы открыть его каталог.</p><div class="brands-row" style="margin-bottom:40px">${PT.BRANDS.map(brandTile).join('')}</div></div>`;
  V.reviewsList = () => {
    const tags = [...new Set(ARTICLES.map((a) => a.tag))];
    return `<div class="wrap"><nav class="crumbs"><a href="#home">Главная</a>${icon('i-chev-r')}<span>Обзоры</span></nav><div class="cat-head"><h1>Обзоры и статьи</h1></div><p class="cat-desc">Помогаем выбрать: как разобраться в характеристиках, обзоры и тесты приборов со склада, сравнения похожих моделей. В конце каждой статьи приборы из неё с ценой и наличием.</p>
      <div class="chips art-chips" role="group" aria-label="Тип статьи"><button class="chip on" data-act="art-filter" data-tag="">Все</button>${tags.map((t) => `<button class="chip" data-act="art-filter" data-tag="${t}">${t}</button>`).join('')}</div>
      <div class="articles" style="margin-bottom:40px">${ARTICLES.map(articleCard).join('')}</div></div>`;
  };
  V.reviewsPage = () => `<div class="wrap"><nav class="crumbs"><a href="#home">Главная</a>${icon('i-chev-r')}<span>Отзывы</span></nav><div class="cat-head"><h1>Отзывы покупателей</h1></div><p class="cat-desc">Отзывы с фото и видео. После покупки покупателю приходит ссылка на форму, отзыв появляется на сайте и в карточке товара после проверки.</p><div class="reviews" style="margin-bottom:40px">${REVIEWS.map(reviewCard).join('')}</div></div>`;
  V.article = (slug) => {
    const a = ARTICLES.find((x) => x.slug === slug);
    if (!a) return V.notfound();
    const prods = a.ids.map((id) => PT.byId[id]).filter(Boolean);
    const more = ARTICLES.filter((x) => x !== a).slice(0, 3);
    const thermal = prods.filter((p) => p.cat !== 'accessories' && p.cat !== 'digital');
    return `<div class="wrap"><nav class="crumbs"><a href="#home">Главная</a>${icon('i-chev-r')}<a href="#reviews-list">Обзоры</a>${icon('i-chev-r')}<span>${a.tag}</span></nav>
      <article class="post">
        <header class="post-head"><span class="badge badge-hit">${a.tag}</span><h1>${esc(a.t)}</h1><p class="post-lead">${esc(a.d)}</p><small class="art-meta">${a.min} мин чтения · <span class="tag-sample">Пример статьи для мокапа</span></small></header>
        <div class="post-media"><canvas data-scene="${a.sc[0]}" data-palette="${a.sc[1]}" data-seed="5" data-max="1100" aria-label="Кадр через тепловизор"></canvas>${a.video ? `<div class="g-video"><span class="playbig">${icon('i-play')}</span><b>Видео через окуляр</b><small>Снимаем сами на приборе со склада</small></div>` : ''}</div>
        <div class="post-body">${a.body.map(([h, p]) => `<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('')}<p class="post-verdict">${icon('i-check')}<span>${esc(a.verdict)}</span></p></div>
      </article>
      <section class="pp-sec"><div class="sec-head"><div><h2>Приборы из статьи</h2><p>Цена и наличие обновляются сами</p></div>${thermal.length > 1 ? `<button class="btn btn-ghost btn-sm" data-act="cmp-set" data-ids="${thermal.map((p) => p.id).join(',')}">${icon('i-compare')}Сравнить эти модели</button>` : ''}</div><div class="grid-cards">${prods.map(PT.card).join('')}</div></section>
      <section class="pp-sec"><div class="post-cta"><div><b>Остались вопросы?</b><p>Подбор из 4 вопросов покажет 3 модели под ваши условия. Или спросите консультанта.</p></div><div class="row"><a class="btn" href="#quiz">Подобрать прибор</a><button class="btn btn-ghost" data-act="chat-open">${icon('i-chat')}Спросить</button></div></div></section>
      <section class="pp-sec"><h2>Ещё статьи</h2><div class="articles">${more.map(articleCard).join('')}</div></section>
    </div>`;
  };
  V.info = (kind) => {
    const pages = {
      delivery: ['Доставка и оплата', [
        ['Доставка', '<ul><li>СДЭК по всей России: 1–5 дней, бесплатно от 30 000 ₽.</li><li>Курьер по Москве: сегодня или завтра, прибор можно проверить при курьере.</li><li>Самовывоз из шоурума в Москве, ежедневно 10:00–20:00.</li><li>Предзаказы отправляем в день поступления.</li></ul>'],
        ['Оплата', '<ul><li>Картой или по СБП на сайте.</li><li>Рассрочка или оплата частями.</li><li>При получении: наличными или картой.</li><li>По счёту для организаций.</li></ul>'],
      ]],
      warranty: ['Гарантия и сервис', [
        ['Проверка перед отправкой', '<p>Каждый прибор включаем, проверяем изображение, дальномер и запись видео. Короткое видео с вашим экземпляром присылаем в мессенджер до отправки.</p>'],
        ['Гарантия', '<p>Срок гарантии зависит от бренда и указан в паспорте прибора. По гарантии приборы принимаем сами и сами передаём в сервис.</p>'],
        ['Возврат', '<p>Если прибор не подошёл, его можно вернуть в течение 7 дней после получения при сохранении вида и комплектации.</p>'],
      ]],
    };
    pages.about = ['О компании', [
      ['Кто мы', '<p>Специализированный магазин тепловизионной и цифровой оптики. Сами охотимся и пользуемся приборами, которые продаём, поэтому подскажем по делу.</p>'],
      ['Почему «ПРО ТЕПЛОВИЗОРЫ»', '<ul><li>Только тепловизоры и цифровая оптика, ничего лишнего.</li><li>Реальное наличие на складе в Москве, а не «под заказ» по умолчанию.</li><li>Обзоры и видео снимаем сами.</li></ul>'],
      ['Оригинальная техника', '<p>Работаем с официальными дистрибьюторами. Серийный номер прибора можно проверить на сайте производителя.</p>'],
      ['Проверка приборов', '<p>Перед отправкой включаем каждый прибор, проверяем картинку, дальномер и запись. Присылаем видео вашего экземпляра.</p>'],
      ['Фото и видео со склада', '<p>Тут будут фото шоурума, склада и команды. Покупателю важно видеть, что за магазином стоят живые люди.</p>'],
    ]];
    pages.contacts = ['Контакты', [
      ['Телефон и мессенджеры', '<p><b>8 (800) 000-00-00</b>, звонок бесплатный.<br>Telegram, WhatsApp и MAX: ответим за 15 минут в рабочее время.</p>'],
      ['Шоурум и склад', '<p>Москва, адрес уточняется. Можно приехать, посмотреть и проверить прибор на месте.</p><p class="muted">Тут будет карта Яндекса.</p>'],
      ['Режим работы', '<p>Ежедневно 10:00–20:00. Заказы на сайте принимаем круглосуточно.</p>'],
      ['Реквизиты', '<p>ИП или ООО, ИНН, ОГРН: добавим после регистрации.</p>'],
    ]];
    const pg = pages[kind];
    if (!pg) return V.notfound();
    return `<div class="wrap"><nav class="crumbs"><a href="#home">Главная</a>${icon('i-chev-r')}<span>${pg[0]}</span></nav><div class="doc"><h1>${pg[0]}</h1>${pg[1].map(([h, b]) => `<div class="doc-card"><h2>${h}</h2>${b}</div>`).join('')}<p class="muted" style="font-size:13px">Тексты для мокапа. Финальные условия согласуем перед запуском.</p></div></div>`;
  };
  V.project = () => {
    const step = (n, t, when, d) => `<div class="tl-step"><span class="tl-n">${n}</span><div><b>${t}</b> <em>${when}</em><p>${d}</p></div></div>`;
    const tryIt = (t) => `<div class="try">${icon('i-check')}<span>${t}</span></div>`;
    return `<div class="wrap"><nav class="crumbs"><a href="#home">Главная</a>${icon('i-chev-r')}<span>Как будет устроен сайт</span></nav><div class="doc">
      <h1>Как будет устроен сайт</h1>
      <p class="lead">Это живой мокап, а не картинка: почти всё можно нажать. Взял за основу ваш макет и структуру, добавил то, чего нет у конкурентов. Вёрстка мокапа потом идёт прямо в тему сайта, так что эта работа не пропадёт.</p>
      <div class="doc-card"><h2>Что можно попробовать</h2><div class="try-list">
        ${tryIt('<a href="#cat-scopes">Каталог прицелов</a>: фильтры по матрице, NETD, дальности, дальномеру и цене. Счётчики обновляются сразу, без перезагрузки.')}
        ${tryIt('Поиск в шапке: напишите «пульсар до 300 тыс» или наберите «ghbwtk» в английской раскладке.')}
        ${tryIt('<a href="#quiz">Подбор прибора</a>: 4 вопроса, в конце 3 модели и объяснение, почему они.')}
        ${tryIt('Сравнение: добавьте 2–4 прибора значком весов, лучшие значения подсвечиваются.')}
        ${tryIt('Консультант справа внизу: спросите «прицел для кабана до 300 тысяч» или «есть ли Thermion 3».')}
        ${tryIt('<a href="#col-preorder">Предзаказ</a>: дата поступления, цена и кнопка предзаказа.')}
        ${tryIt('Палитры тепловизора на главной и в карточке товара.')}
        ${tryIt('Корзина и <a href="#checkout">оформление</a>: доставка СДЭК, курьер, самовывоз, оплата онлайн, частями или при получении.')}
      </div></div>
      <div class="doc-card"><h2>На чём делаю</h2><p>WordPress + WooCommerce и своя лёгкая тема ровно под ваш макет, без конструкторов типа Elementor. Так работают многие магазины оптики, в том числе один из сильных конкурентов.</p><ul><li>Админка как личный кабинет: вы сами добавляете товары, меняете цены и наличие, ставите дату предзаказа.</li><li>Заказы, статусы и письма покупателям работают из коробки, уведомление о заказе приходит в Telegram.</li><li>Готовые модули: ЮKassa (карта, СБП), СДЭК, выгрузка товаров в Яндекс.</li><li>Товары можно загрузить разом из таблицы поставщика.</li></ul></div>
      <div class="doc-card"><h2>Скорость</h2><p>Страницы отдаются из кэша готовыми, картинки в WebP, скрипты лёгкие и свои. Фильтры и поиск считаются прямо в браузере, поэтому срабатывают мгновенно. Цель: страница открывается быстрее секунды, на телефоне 90+ баллов в Google PageSpeed.</p></div>
      <div class="doc-card"><h2>ИИ-консультант</h2><p>Окно чата всплывает с предложением задать вопрос. Отвечает нейросеть YandexGPT или GigaChat: обе российские, оплата в рублях, данные остаются в России. Перед ответом она получает выдержку из нашего каталога, поэтому отвечает про реальные модели, цены и наличие и даёт ссылки. Если вопрос сложный или человек просит, зовёт менеджера, уведомление приходит в Telegram.</p><p>Нейросеть оплачивается по факту использования, это ежемесячный платёж. Точную сумму посчитаю под ваш трафик, при обычной посещаемости это несколько тысяч рублей в месяц.</p></div>
      <div class="doc-card"><h2>Этапы и сроки</h2><div class="tl">
        ${step(1, 'Старт', '2–3 дня', 'Домен, хостинг, тестовый адрес, доступы.')}
        ${step(2, 'Дизайн всех страниц', '3–5 дней', 'Дорабатываем мокап под ваши правки.')}
        ${step(3, 'Сборка магазина на тестовом адресе', '2–3 недели', 'Каталог, фильтры, карточки, поиск, сравнение, корзина, заказы в Telegram, страницы доставки и гарантии. Вы смотрите по ходу.')}
        ${step(4, 'Наполнение', 'параллельно', 'Импорт товаров из таблицы, фото, характеристики.')}
        ${step(5, 'Запуск первой версии', 'около 4 недель от старта', 'Перенос на домен, Метрика, Вебмастер, видео-инструкция по админке.')}
        ${step(6, 'Вторая очередь', '+2–3 недели', 'ИИ-консультант, подбор прибора, онлайн-оплата, СДЭК, выгрузка в Яндекс. Консультанта можно сделать раньше, если он важнее.')}
      </div></div>
      <div class="doc-card"><h2>Что нужно от вас</h2><ul><li>Таблица товаров от поставщика, если есть: название, характеристики, цена, фото.</li><li>Где сейчас ведётся наличие: 1С, МойСклад, таблица или пока нигде.</li><li>ИП или ООО: нужно для онлайн-оплаты и договора со СДЭК.</li><li>Домен, если уже есть, или выберем вместе.</li><li>Телефон, адрес шоурума и мессенджеры для шапки.</li></ul></div>
    </div></div>`;
  };
  V.notfound = () => `<div class="wrap"><div class="success"><span class="ok-ring" style="background:var(--soft);color:var(--muted)">${icon('i-search')}</span><h1>Страница не найдена</h1><p>Возможно, ссылка устарела. Начните с каталога или поиска.</p><a class="btn" href="#catalog">Открыть каталог</a></div></div>`;
})();
