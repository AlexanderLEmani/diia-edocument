(function (global) {
  'use strict';

  var STORAGE_KEY = 'rezerv-admin-config';

  function getConfigPath() {
    if (location.pathname.indexOf('/admin') !== -1) return 'config.json';
    return 'admin/config.json';
  }

  var STYLE_PROPS = [
    { key: 'fontSize', label: 'Розмір шрифту', unit: 'px', step: 0.1 },
    { key: 'fontWeight', label: 'Жирність', unit: '', step: 100 },
    { key: 'letterSpacing', label: 'Міжлітерний інтервал', unit: 'em', step: 0.001 },
    { key: 'wordSpacing', label: 'Міжсловний інтервал', unit: 'em', step: 0.001 },
    { key: 'lineHeight', label: 'Висота рядка', unit: '', step: 0.01 },
    { key: 'paddingTop', label: 'Відступ зверху (padding)', unit: 'px', step: 1 },
    { key: 'paddingBottom', label: 'Відступ знизу (padding)', unit: 'px', step: 1 },
    { key: 'paddingLeft', label: 'Padding зліва', unit: 'px', step: 1 },
    { key: 'paddingRight', label: 'Padding справа', unit: 'px', step: 1 },
    { key: 'marginTop', label: 'Відступ зверху (margin)', unit: 'px', step: 1 },
    { key: 'marginBottom', label: 'Відступ знизу (margin)', unit: 'px', step: 1 },
    { key: 'gap', label: 'Gap між елементами', unit: 'px', step: 1 },
    { key: 'translateX', label: 'Зсув X', unit: 'px', step: 1 },
    { key: 'translateY', label: 'Зсув Y', unit: 'px', step: 1 },
    { key: 'width', label: 'Ширина', unit: 'px', step: 1 },
    { key: 'maxWidth', label: 'Макс. ширина', unit: 'px', step: 1 },
    { key: 'height', label: 'Висота', unit: 'px', step: 1 },
    { key: 'color', label: 'Колір', unit: '', step: 1 },
    { key: 'borderRadius', label: 'Border radius', unit: 'px', step: 1 },
  ];

  var PAGES = [
    { id: 'rezerv-id', label: 'Резерв ID', previewPath: '/rezerv/?preview=1' },
    { id: 'rezerv-services', label: 'Сервіси', previewPath: '/rezerv/?preview=1#services' },
    { id: 'rezerv-vacancies', label: 'Вакансії', previewPath: '/rezerv/?preview=1#vacancies' },
    { id: 'rezerv-menu', label: 'Меню', previewPath: '/rezerv/?preview=1#menu' },
    { id: 'rezerv-nav', label: 'Навігація', previewPath: '/rezerv/?preview=1' },
    { id: 'rezerv-doc', label: 'Документ', previewPath: '/rezerv/?preview=1&docsheet=1' },
  ];

  function item(id, page, label, opts) {
    opts = opts || {};
    return {
      id: id,
      page: page,
      label: label,
      selector: opts.selector || null,
      text: opts.text !== false,
      html: !!opts.html,
      multiline: !!opts.multiline,
      resizable: !!opts.resizable,
      resizeMin: opts.resizeMin || null,
      dragAxis: opts.dragAxis || 'xy',
      styleUnits: opts.styleUnits || {},
      styles: opts.styles || STYLE_PROPS.map(function (p) { return p.key; }),
      defaults: {
        text: opts.defaultText != null ? opts.defaultText : '',
        styles: opts.defaultStyles || {},
      },
    };
  }

  var SCHEMA = [
    item('rezerv-card', 'rezerv-id', 'Картка — прямокутник', {
      text: false,
      resizable: true,
      dragAxis: 'xy',
      defaultStyles: {
        width: '360px',
        height: '520px',
        borderRadius: '16px',
        paddingTop: '20px',
        paddingBottom: '18px',
        paddingLeft: '18px',
        paddingRight: '18px',
      },
      styles: ['width', 'height', 'translateX', 'translateY', 'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'borderRadius'],
    }),
    item('rezerv-title', 'rezerv-id', 'Заголовок картки', {
      defaultText: 'Резерв ID',
      defaultStyles: { fontSize: '22px', fontWeight: '700', letterSpacing: '-0.01em', lineHeight: '1.12' },
    }),
    item('rezerv-emblem', 'rezerv-id', 'Герб (SVG)', {
      text: false,
      resizable: true,
      resizeMin: { width: 20, height: 24 },
      defaultStyles: { width: '36px', height: '44px' },
      styles: ['width', 'height', 'translateX', 'translateY', 'marginTop', 'marginBottom'],
    }),
    item('rezerv-emblem-wrap', 'rezerv-id', 'Герб — обгортка', {
      text: false,
      defaultStyles: {},
      styles: ['translateX', 'translateY', 'marginTop', 'marginBottom'],
    }),
    item('rezerv-photo', 'rezerv-id', 'Фото — розмір', {
      text: false,
      resizable: true,
      resizeMin: { width: 60, height: 80 },
      defaultStyles: { width: '42%', maxWidth: '130px' },
      styleUnits: { width: '%' },
      styles: ['width', 'maxWidth', 'height', 'translateX', 'translateY', 'borderRadius'],
    }),
    item('rezerv-row', 'rezerv-id', 'Ряд фото + текст — gap', {
      text: false,
      defaultStyles: { gap: '16px' },
      styles: ['gap', 'paddingTop', 'paddingBottom', 'translateX', 'translateY'],
    }),
    item('rezerv-card-body', 'rezerv-id', 'Тіло картки — відступи', {
      text: false,
      defaultStyles: { marginBottom: '16px' },
      styles: ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom'],
    }),
    item('rezerv-birth-label', 'rezerv-id', 'Підпис «Дата народження»', {
      defaultText: 'Дата народження',
      defaultStyles: { fontSize: '14px', fontWeight: '400', lineHeight: '1.3', color: '#6B6B6B' },
    }),
    item('rezerv-birth-value', 'rezerv-id', 'Дата народження — значення', {
      defaultText: '30.01.2001',
      defaultStyles: { fontSize: '17px', fontWeight: '600', lineHeight: '1.25' },
    }),
    item('rezerv-deferral-label', 'rezerv-id', 'Підпис «Відстрочка»', {
      defaultText: 'Відстрочка до:',
      defaultStyles: { fontSize: '14px', fontWeight: '400', lineHeight: '1.3', color: '#6B6B6B' },
    }),
    item('rezerv-deferral-value', 'rezerv-id', 'Відстрочка — значення', {
      defaultText: 'завершення мобілізації',
      defaultStyles: { fontSize: '17px', fontWeight: '600', lineHeight: '1.25' },
    }),
    item('rezerv-ticker', 'rezerv-id', 'Бігучий рядок', {
      html: true,
      defaultText: '<span class="id-ticker-part">Документ оновлено о 06:56 | 13.06.2026 • </span>',
      defaultStyles: { fontSize: '12px', fontWeight: '600', letterSpacing: '0.01em', lineHeight: '1' },
    }),
    item('rezerv-ticker-wrap', 'rezerv-id', 'Обгортка тикера — відступи', {
      text: false,
      defaultStyles: { marginTop: '0px', marginBottom: '0px' },
      styles: ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom'],
    }),
    item('rezerv-status-label', 'rezerv-id', 'Статус «Військовозобов\'язаний»', {
      defaultText: 'Військовозобов\'язаний',
      defaultStyles: { fontSize: '14px', fontWeight: '400', lineHeight: '1.3', color: '#6B6B6B' },
      styles: ['fontSize', 'fontWeight', 'lineHeight', 'color', 'translateX', 'translateY', 'marginTop', 'marginBottom'],
    }),
    item('rezerv-name-1', 'rezerv-id', 'Прізвище', {
      defaultText: 'Бондарев',
      defaultStyles: { fontSize: '22px', fontWeight: '600', lineHeight: '1.15', letterSpacing: '-0.01em' },
    }),
    item('rezerv-name-2', 'rezerv-id', 'Ім\'я', {
      defaultText: 'Іоанн',
      defaultStyles: { fontSize: '22px', fontWeight: '700', lineHeight: '1.15', letterSpacing: '-0.01em' },
    }),
    item('rezerv-name-3', 'rezerv-id', 'По батькові', {
      defaultText: 'Олександрович',
      defaultStyles: { fontSize: '22px', fontWeight: '700', lineHeight: '1.15', letterSpacing: '-0.01em' },
    }),
    item('rezerv-name-group', 'rezerv-id', 'ФІО — gap між рядками', {
      text: false,
      defaultStyles: { gap: '2px', marginTop: '4px' },
      styles: ['gap', 'marginTop', 'marginBottom'],
    }),
    item('rezerv-fields', 'rezerv-id', 'Блок полів — gap', {
      text: false,
      defaultStyles: { gap: '20px' },
      styles: ['gap', 'marginBottom', 'paddingTop', 'paddingBottom'],
    }),
    item('rezerv-field-birth', 'rezerv-id', 'Поле дати — gap', {
      text: false,
      defaultStyles: { gap: '2px' },
      styles: ['gap'],
    }),
    item('rezerv-field-deferral', 'rezerv-id', 'Поле відстрочки — gap', {
      text: false,
      defaultStyles: { gap: '2px' },
      styles: ['gap'],
    }),
    item('rezerv-footer', 'rezerv-id', 'Футер картки — padding', {
      text: false,
      defaultStyles: { paddingTop: '18px' },
      styles: ['paddingTop', 'paddingBottom', 'gap'],
    }),
    item('rezerv-qr-label', 'rezerv-id', 'QR — підпис', {
      defaultText: 'QR-код дійсний до 20 червня 2027',
      defaultStyles: { fontSize: '13px', fontWeight: '500', lineHeight: '1.3', color: '#555' },
      styles: ['fontSize', 'fontWeight', 'lineHeight', 'color', 'translateX', 'translateY', 'marginTop', 'marginBottom'],
    }),
    item('rezerv-qr-image', 'rezerv-id', 'QR — розмір', {
      text: false,
      resizable: true,
      resizeMin: { width: 120, height: 120 },
      defaultStyles: { width: '220px', maxWidth: '240px' },
      styles: ['width', 'maxWidth', 'height', 'translateX', 'translateY', 'marginTop', 'marginBottom'],
    }),
    item('rezerv-qr-wrap', 'rezerv-id', 'QR — блок — gap', {
      text: false,
      defaultStyles: { gap: '16px' },
      styles: ['gap', 'paddingTop', 'paddingBottom', 'translateX', 'translateY'],
    }),
    item('rezerv-notify-text', 'rezerv-id', 'Кнопка сповіщень — текст', {
      defaultText: 'Сповіщення',
      defaultStyles: { fontSize: '14px', fontWeight: '500' },
    }),

    item('rezerv-services-title', 'rezerv-services', 'Заголовок «Сервіси»', {
      defaultText: 'Сервіси',
      defaultStyles: { fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em' },
    }),
    item('rezerv-svc-1', 'rezerv-services', 'Сервіс 1', { defaultText: 'Виправити дані онлайн', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),
    item('rezerv-svc-2', 'rezerv-services', 'Сервіс 2', { defaultText: 'Електронна черга в ТЦК та СП', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),
    item('rezerv-svc-3', 'rezerv-services', 'Сервіс 3', { defaultText: 'Запит на відстрочку', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),
    item('rezerv-svc-4', 'rezerv-services', 'Сервіс 4', { defaultText: 'Направлення на ВЛК', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),
    item('rezerv-svc-5', 'rezerv-services', 'Сервіс 5', { defaultText: 'Розширені дані з реєстру', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),
    item('rezerv-svc-6', 'rezerv-services', 'Сервіс 6', { defaultText: 'Стати на облік', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),
    item('rezerv-svc-7', 'rezerv-services', 'Сервіс 7', { defaultText: 'Уточнити контактні дані', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),
    item('rezerv-svc-8', 'rezerv-services', 'Сервіс 8', { defaultText: 'Штрафи', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),

    item('rezerv-vac-title', 'rezerv-vacancies', 'Заголовок вакансій', {
      defaultText: 'Вакансії в Силах оборони України',
      defaultStyles: { fontSize: '22px', fontWeight: '700', lineHeight: '1.2' },
    }),
    item('rezerv-vac-card-title', 'rezerv-vacancies', 'Заголовок картки', {
      defaultText: 'На вас чекають',
      defaultStyles: { fontSize: '20px', fontWeight: '700' },
    }),
    item('rezerv-vac-grid', 'rezerv-vacancies', 'Сітка — відступи', {
      text: false,
      defaultStyles: { marginBottom: '24px' },
      styles: ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'translateX', 'translateY'],
    }),
    item('rezerv-vac-grid-image', 'rezerv-vacancies', 'Сітка емблем — фото', {
      text: false,
      resizable: true,
      resizeMin: { width: 120, height: 120 },
      defaultStyles: { width: '100%' },
      styles: ['width', 'maxWidth', 'height', 'translateX', 'translateY', 'marginTop', 'marginBottom'],
    }),
    item('rezerv-vac-more', 'rezerv-vacancies', 'Лічильник «+206»', {
      defaultText: '+206',
      defaultStyles: { fontSize: '15px', fontWeight: '600' },
    }),
    item('rezerv-vac-cta', 'rezerv-vacancies', 'Кнопка CTA', {
      defaultText: 'Змінити перебіг подій',
      defaultStyles: { fontSize: '16px', fontWeight: '600' },
    }),
    item('rezerv-vac-tab-1', 'rezerv-vacancies', 'Таб 1', { defaultText: 'IT-вертикаль', defaultStyles: { fontSize: '15px', fontWeight: '500' } }),
    item('rezerv-vac-tab-2', 'rezerv-vacancies', 'Таб 2', { defaultText: 'Нові контракти', defaultStyles: { fontSize: '15px', fontWeight: '600' } }),
    item('rezerv-vac-tab-3', 'rezerv-vacancies', 'Таб 3', { defaultText: 'Для вас', defaultStyles: { fontSize: '15px', fontWeight: '500' } }),
    item('rezerv-vac-tab-4', 'rezerv-vacancies', 'Таб 4', { defaultText: 'Всі', defaultStyles: { fontSize: '15px', fontWeight: '500' } }),

    item('rezerv-menu-title', 'rezerv-menu', 'Заголовок меню', {
      defaultText: 'Меню',
      defaultStyles: { fontSize: '28px', fontWeight: '700' },
    }),
    item('rezerv-menu-version', 'rezerv-menu', 'Версія', {
      defaultText: 'Версія 2.3.1',
      defaultStyles: { fontSize: '14px', fontWeight: '400', color: '#8A8A8A' },
    }),
    item('rezerv-menu-1', 'rezerv-menu', 'Пункт 1', { defaultText: 'Активні сесії', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),
    item('rezerv-menu-2', 'rezerv-menu', 'Пункт 2', { defaultText: 'Налаштування', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),
    item('rezerv-menu-3', 'rezerv-menu', 'Пункт 3', { defaultText: 'Питання та відповіді', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),
    item('rezerv-menu-4', 'rezerv-menu', 'Пункт 4', { defaultText: 'Служба підтримки', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),
    item('rezerv-menu-5', 'rezerv-menu', 'Пункт 5', { defaultText: 'Копіювати номер пристрою', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),
    item('rezerv-menu-6', 'rezerv-menu', 'Пункт 6', { defaultText: 'Сканувати документ', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),
    item('rezerv-logout', 'rezerv-menu', 'Кнопка виходу', {
      defaultText: 'Вийти',
      defaultStyles: { fontSize: '16px', fontWeight: '600' },
    }),
    item('rezerv-privacy', 'rezerv-menu', 'Посилання конфіденційності', {
      defaultText: 'Повідомлення про обробку персональних даних',
      defaultStyles: { fontSize: '12px', fontWeight: '400' },
    }),

    item('rezerv-nav-icon-1', 'rezerv-nav', 'Навігація — Резерв ID', {
      text: false,
      resizable: true,
      dragAxis: 'xy',
      resizeMin: { width: 16, height: 16 },
      defaultStyles: { width: '24px', height: '24px' },
      styles: ['width', 'height', 'translateX', 'translateY'],
    }),
    item('rezerv-nav-icon-2', 'rezerv-nav', 'Навігація — Сервіси', {
      text: false,
      resizable: true,
      dragAxis: 'xy',
      resizeMin: { width: 16, height: 16 },
      defaultStyles: { width: '24px', height: '24px' },
      styles: ['width', 'height', 'translateX', 'translateY'],
    }),
    item('rezerv-nav-icon-3', 'rezerv-nav', 'Навігація — Вакансії', {
      text: false,
      resizable: true,
      dragAxis: 'xy',
      resizeMin: { width: 16, height: 16 },
      defaultStyles: { width: '24px', height: '24px' },
      styles: ['width', 'height', 'translateX', 'translateY'],
    }),
    item('rezerv-nav-icon-4', 'rezerv-nav', 'Навігація — Меню', {
      text: false,
      resizable: true,
      dragAxis: 'xy',
      resizeMin: { width: 16, height: 16 },
      defaultStyles: { width: '24px', height: '24px' },
      styles: ['width', 'height', 'translateX', 'translateY'],
    }),

    item('rezerv-sheet-1', 'rezerv-id', 'Шит — Переглянути', { defaultText: 'Переглянути документ', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),
    item('rezerv-sheet-2', 'rezerv-id', 'Шит — PDF', { defaultText: 'Завантажити PDF', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),
    item('rezerv-sheet-3', 'rezerv-id', 'Шит — Оновити', { defaultText: 'Оновити документ', defaultStyles: { fontSize: '16px', fontWeight: '500' } }),

    // ── Документ ──
    item('rezerv-doc-name1', 'rezerv-doc', 'Прізвище', {
      defaultText: 'Бондарев',
      defaultStyles: { fontSize: '22px', fontWeight: '500', lineHeight: '1.18', letterSpacing: '-0.01em' },
    }),
    item('rezerv-doc-name2', 'rezerv-doc', "Ім'я", {
      defaultText: 'Іоанн',
      defaultStyles: { fontSize: '22px', fontWeight: '500', lineHeight: '1.18', letterSpacing: '-0.01em' },
    }),
    item('rezerv-doc-name3', 'rezerv-doc', 'По батькові', {
      defaultText: 'Олександрович',
      defaultStyles: { fontSize: '22px', fontWeight: '500', lineHeight: '1.18', letterSpacing: '-0.01em' },
    }),
    item('rezerv-doc-status', 'rezerv-doc', 'Статус', {
      defaultText: "Військовозобов'язаний",
      defaultStyles: { fontSize: '15px', fontWeight: '400', color: '#6B6B6B' },
    }),
    item('rezerv-doc-photo', 'rezerv-doc', 'Фото', {
      text: false,
      resizable: true,
      resizeMin: { width: 60, height: 80 },
      defaultStyles: { width: '130px' },
      styles: ['width', 'height', 'borderRadius', 'translateX', 'translateY'],
    }),
    item('rezerv-doc-birth-lbl', 'rezerv-doc', 'Підпис «Дата народження»', {
      defaultText: 'Дата народження:',
      defaultStyles: { fontSize: '14px', fontWeight: '400', color: '#6B6B6B' },
    }),
    item('rezerv-doc-birth', 'rezerv-doc', 'Дата народження — значення', {
      defaultText: '30.01.2001',
      defaultStyles: { fontSize: '16px', fontWeight: '500' },
    }),
    item('rezerv-doc-rnokpp-lbl', 'rezerv-doc', 'Підпис «РНОКПП»', {
      defaultText: 'РНОКПП:',
      defaultStyles: { fontSize: '14px', fontWeight: '400', color: '#6B6B6B' },
    }),
    item('rezerv-doc-rnokpp', 'rezerv-doc', 'РНОКПП — значення', {
      defaultText: '3638805490',
      defaultStyles: { fontSize: '16px', fontWeight: '500' },
    }),
    item('rezerv-doc-tcc', 'rezerv-doc', 'ТЦК та СП', {
      defaultText: 'Шевченківський районний у місті Дніпро ТЦК та СП',
      defaultStyles: { fontSize: '15px', fontWeight: '500' },
    }),
    item('rezerv-doc-rank', 'rezerv-doc', 'Звання', {
      defaultText: 'Солдат',
      defaultStyles: { fontSize: '15px', fontWeight: '500' },
    }),
    item('rezerv-doc-vos', 'rezerv-doc', 'ВОС', {
      defaultText: '999097',
      defaultStyles: { fontSize: '15px', fontWeight: '500' },
    }),
    item('rezerv-doc-note', 'rezerv-doc', 'Примітка', {
      defaultText: 'Потребує проходження базової загальновійськової підготовки, Солдат резерву',
      defaultStyles: { fontSize: '14px', fontWeight: '400' },
    }),
    item('rezerv-doc-registry', 'rezerv-doc', 'Номер Оберіг', {
      defaultText: '030220241429041800006',
      defaultStyles: { fontSize: '15px', fontWeight: '500' },
    }),
    item('rezerv-doc-phone', 'rezerv-doc', 'Телефон', {
      defaultText: '+380 96 663 5523',
      defaultStyles: { fontSize: '15px', fontWeight: '500' },
    }),
    item('rezerv-doc-email', 'rezerv-doc', 'Email', {
      defaultText: 'sayonaraboy965123@gmail.com',
      defaultStyles: { fontSize: '15px', fontWeight: '500' },
    }),
    item('rezerv-doc-address', 'rezerv-doc', 'Адреса', {
      defaultText: 'Україна, Дніпропетровська область, м Дніпро, ЗАПОРІЗЬКЕ ШОСЕ, б. 38, кв. 226',
      defaultStyles: { fontSize: '15px', fontWeight: '500' },
    }),
    item('rezerv-doc-updated', 'rezerv-doc', 'Дата уточнення', {
      defaultText: 'Дата останнього уточнення даних: 20.05.2024',
      defaultStyles: { fontSize: '14px', fontWeight: '400', color: '#6B6B6B' },
    }),
  ];

  function schemaById() {
    var map = {};
    SCHEMA.forEach(function (s) { map[s.id] = s; });
    return map;
  }

  function buildDefaultsConfig() {
    var elements = {};
    SCHEMA.forEach(function (s) {
      elements[s.id] = {
        text: s.defaults.text,
        styles: Object.assign({}, s.defaults.styles),
      };
    });
    return { version: 1, elements: elements };
  }

  function mergeConfig(base, override) {
    var result = JSON.parse(JSON.stringify(base));
    if (!override || !override.elements) return result;
    Object.keys(override.elements).forEach(function (id) {
      if (!result.elements[id]) result.elements[id] = { text: '', styles: {} };
      var src = override.elements[id];
      if (src.text != null) result.elements[id].text = src.text;
      if (src.styles) {
        result.elements[id].styles = Object.assign({}, result.elements[id].styles, src.styles);
      }
    });
    if (override.updatedAt) result.updatedAt = override.updatedAt;
    return result;
  }

  function migrateConfig(config) {
    return config;
  }

  function loadFromStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  }

  function saveToStorage(config) {
    config.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  function clearStorage() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function fetchFileConfig() {
    return fetch(getConfigPath()).then(function (res) {
      if (!res.ok) return null;
      return res.json();
    }).catch(function () { return null; });
  }

  function loadConfig() {
    var defaults = buildDefaultsConfig();
    return fetchFileConfig().then(function (fileConfig) {
      var merged = fileConfig ? mergeConfig(defaults, fileConfig) : defaults;
      var stored = loadFromStorage();
      if (stored) merged = mergeConfig(merged, stored);
      return migrateConfig(merged);
    });
  }

  function cssProp(key) {
    return key.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); });
  }

  function applyStyles(el, styles) {
    if (!el || !styles) return;
    var tx = styles.translateX;
    var ty = styles.translateY;
    var isPhoto = el.classList.contains('id-photo') || el.getAttribute('data-ed') === 'rezerv-photo';

    Object.keys(styles).forEach(function (key) {
      if (key === 'translateX' || key === 'translateY') return;
      var val = styles[key];
      if (val == null || val === '') return;
      if (typeof val === 'string' && (val.indexOf('%') !== -1 || val.indexOf('/') !== -1)) {
        el.style.setProperty(cssProp(key), val);
        return;
      }
      var meta = STYLE_PROPS.find(function (p) { return p.key === key; });
      if (meta && meta.unit) el.style.setProperty(cssProp(key), String(val).indexOf(meta.unit) !== -1 ? val : parseFloat(val) + meta.unit);
      else el.style.setProperty(cssProp(key), String(val));
    });

    if (isPhoto && (styles.width || styles.maxWidth || styles.height)) {
      el.style.aspectRatio = 'auto';
    } else if (styles.height) {
      el.style.aspectRatio = 'auto';
    } else if (isPhoto) {
      el.style.removeProperty('aspect-ratio');
    }

    if (styles.width || styles.height) {
      el.style.boxSizing = 'border-box';
    }

    var parts = [];
    if (tx != null && tx !== '' && tx !== '0px' && tx !== 0) parts.push('translateX(' + tx + ')');
    if (ty != null && ty !== '' && ty !== '0px' && ty !== 0) parts.push('translateY(' + ty + ')');

    var hasMargin = ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'].some(function (k) {
      return styles[k] != null && styles[k] !== '' && styles[k] !== '0px';
    });
    var isInlineText = el.tagName === 'SPAN' || el.classList.contains('id-label') ||
      el.classList.contains('id-value') || el.classList.contains('id-name-line');

    if (parts.length || (hasMargin && isInlineText)) {
      if (isInlineText) el.style.display = 'inline-block';
    }

    if (parts.length) el.style.transform = parts.join(' ');
    else el.style.removeProperty('transform');
  }

  function applyItem(id, data, schemaItem) {
    var selector = schemaItem.selector || '[data-ed="' + id + '"]';
    var nodes = document.querySelectorAll(selector);
    if (!nodes.length) return false;

    nodes.forEach(function (el) {
      if (schemaItem.text !== false && data.text != null) {
        if (schemaItem.html) el.innerHTML = data.text;
        else el.textContent = data.text;
      }
      applyStyles(el, data.styles);
    });
    return true;
  }

  function applyConfig(config) {
    var map = schemaById();
    var applied = 0;
    Object.keys(config.elements || {}).forEach(function (id) {
      if (map[id] && applyItem(id, config.elements[id], map[id])) applied++;
    });
    return applied;
  }

  function exportConfigJson(config) {
    return JSON.stringify(config, null, 2);
  }

  function downloadConfig(config, filename) {
    var blob = new Blob([exportConfigJson(config)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename || 'config.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  global.AdminCore = {
    STORAGE_KEY: STORAGE_KEY,
    getConfigPath: getConfigPath,
    STYLE_PROPS: STYLE_PROPS,
    PAGES: PAGES,
    SCHEMA: SCHEMA,
    schemaById: schemaById,
    buildDefaultsConfig: buildDefaultsConfig,
    mergeConfig: mergeConfig,
    migrateConfig: migrateConfig,
    loadFromStorage: loadFromStorage,
    saveToStorage: saveToStorage,
    clearStorage: clearStorage,
    fetchFileConfig: fetchFileConfig,
    loadConfig: loadConfig,
    applyConfig: applyConfig,
    exportConfigJson: exportConfigJson,
    downloadConfig: downloadConfig,
  };
})(typeof window !== 'undefined' ? window : this);
