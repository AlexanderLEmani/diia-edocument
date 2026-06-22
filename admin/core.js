(function (global) {
  'use strict';

  var STORAGE_KEY = 'diia-edocument-admin-config';

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
    { key: 'width', label: 'Ширина', unit: '%', step: 1 },
    { key: 'maxWidth', label: 'Макс. ширина', unit: 'px', step: 1 },
    { key: 'height', label: 'Висота', unit: 'px', step: 1 },
    { key: 'color', label: 'Колір', unit: '', step: 1 },
    { key: 'borderRadius', label: 'Border radius', unit: 'px', step: 1 },
  ];

  var PAGES = [
    { id: 'auth-splash', label: 'Привітствие', previewPath: '/?preview=1&auth=splash' },
    { id: 'index-docs', label: 'Документи', previewPath: '/?preview=1' },
    { id: 'index-feed', label: 'Стрічка', previewPath: '/?preview=1#feed' },
    { id: 'info', label: 'Повна інформація', previewPath: '/info?preview=1' },
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
      image: !!opts.image,
      defaultImage: opts.defaultImage || '',
      styleUnits: opts.styleUnits || {},
      styles: opts.styles || STYLE_PROPS.map(function (p) { return p.key; }),
      defaults: {
        text: opts.defaultText != null ? opts.defaultText : '',
        styles: opts.defaultStyles || {},
      },
    };
  }

  var SCHEMA = [
    item('edoc-title', 'index-docs', 'єДокумент — заголовок', {
      defaultText: 'єДокумент',
      defaultStyles: { fontSize: '24px', fontWeight: '600', letterSpacing: '0.01em', lineHeight: '1.12', paddingTop: '30px', paddingBottom: '24px' },
      styles: ['fontSize', 'fontWeight', 'letterSpacing', 'wordSpacing', 'lineHeight', 'paddingTop', 'paddingBottom'],
    }),
    item('edoc-birth-line1', 'index-docs', 'Дата — рядок 1', {
      defaultText: 'Дата',
      defaultStyles: { fontSize: '15px', fontWeight: '400', letterSpacing: '0.05em', lineHeight: '1.44' },
    }),
    item('edoc-birth-line2', 'index-docs', 'Дата — рядок 2', {
      defaultText: 'народження:',
      defaultStyles: { fontSize: '15px', fontWeight: '400', letterSpacing: '0.05em', lineHeight: '1.44' },
    }),
    item('edoc-birth-value', 'index-docs', 'Дата народження — значення', {
      defaultText: '17.08.1999',
      defaultStyles: { fontSize: '14.7px', fontWeight: '400', letterSpacing: '0.048em', lineHeight: '1.44' },
    }),
    item('edoc-rnokpp-label', 'index-docs', 'РНОКПП — підпис', {
      defaultText: 'РНОКПП:',
      defaultStyles: { fontSize: '15px', fontWeight: '400', letterSpacing: '0.05em', lineHeight: '1.44' },
    }),
    item('edoc-rnokpp-value', 'index-docs', 'РНОКПП — значення', {
      defaultText: '2847193056',
      defaultStyles: { fontSize: '13px', fontWeight: '400', letterSpacing: '0.048em', lineHeight: '1.44', translateY: '-4px' },
    }),
    item('edoc-photo', 'index-docs', 'Фото — розмір прямокутника', {
      text: false,
      defaultStyles: { width: '44%', maxWidth: '158px' },
      styles: ['width', 'maxWidth', 'height', 'translateX', 'translateY'],
    }),
    item('edoc-fields', 'index-docs', 'Блок полів — gap між групами', {
      text: false,
      defaultStyles: { gap: '28px', paddingTop: '2px' },
      styles: ['gap', 'paddingTop', 'paddingBottom'],
    }),
    item('edoc-field-birth', 'index-docs', 'Поле «Дата» — gap між рядками', {
      text: false,
      defaultStyles: { gap: '0px' },
      styles: ['gap'],
    }),
    item('edoc-ticker', 'index-docs', 'єДокумент — бігучий рядок', {
      html: true,
      multiline: true,
      defaultText: 'документ діє під час воєнного стану та 30 днів після його завершення або скасування. Ой у лузі червона калина похилилася, чогось наша славна Україна зажурилася. &nbsp;&nbsp;&nbsp; документ діє під час воєнного стану та 30 днів після його завершення або скасування. Ой у лузі червона калина похилилася, чогось наша славна Україна зажурилася.',
      defaultStyles: { fontSize: '11.5px', fontWeight: '500', letterSpacing: '0.02em', lineHeight: '1' },
    }),
    item('edoc-ticker-wrap', 'index-docs', 'єДокумент — відступ тикера зверху', {
      text: false,
      defaultStyles: { marginTop: '20px' },
      styles: ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom'],
    }),
    item('edoc-name-1', 'index-docs', 'Прізвище', {
      defaultText: 'ГЕРА',
      defaultStyles: { fontSize: '19px', fontWeight: '600', letterSpacing: '0.05em', lineHeight: '1.1' },
    }),
    item('edoc-name-2', 'index-docs', 'Ім\'я', {
      defaultText: 'СЕРГІЙ',
      defaultStyles: { fontSize: '19px', fontWeight: '600', letterSpacing: '0.05em', lineHeight: '1.1' },
    }),
    item('edoc-name-3', 'index-docs', 'По батькові', {
      defaultText: 'СТЕПАНОВИЧ',
      defaultStyles: { fontSize: '19px', fontWeight: '600', letterSpacing: '0.05em', lineHeight: '1.1' },
    }),
    item('edoc-name-group', 'index-docs', 'ФІО — gap між рядками', {
      text: false,
      defaultStyles: { gap: '10px' },
      styles: ['gap'],
    }),
    item('edoc-footer', 'index-docs', 'Футер — padding', {
      text: false,
      defaultStyles: { paddingTop: '28px', paddingBottom: '32px' },
      styles: ['paddingTop', 'paddingBottom'],
    }),

    item('tax-title', 'index-docs', 'Податкова — заголовок', {
      html: true,
      defaultText: 'Картка платника<br>податків',
      defaultStyles: { fontSize: '24px', fontWeight: '500', letterSpacing: '0.01em', lineHeight: '1.15', paddingTop: '30px', paddingBottom: '9px' },
      styles: ['fontSize', 'fontWeight', 'letterSpacing', 'wordSpacing', 'lineHeight', 'paddingTop', 'paddingBottom', 'translateX', 'translateY'],
    }),
    item('tax-subtitle', 'index-docs', 'Податкова — підзаголовок', {
      defaultText: 'РНОКПП',
      defaultStyles: { fontSize: '20px', fontWeight: '50', letterSpacing: '-0.01em', lineHeight: '1.15', translateY: '6px', paddingBottom: '15px' },
      styles: ['fontSize', 'fontWeight', 'letterSpacing', 'wordSpacing', 'lineHeight', 'paddingBottom', 'translateX', 'translateY'],
    }),
    item('tax-name-1', 'index-docs', 'Податкова — прізвище', {
      defaultText: 'Гера',
      defaultStyles: { fontSize: '16px', fontWeight: '440', letterSpacing: '0', lineHeight: '0.3' },
    }),
    item('tax-name-2', 'index-docs', 'Податкова — ім\'я', {
      defaultText: 'Сергій',
      defaultStyles: { fontSize: '16px', fontWeight: '440', letterSpacing: '0', lineHeight: '1.1' },
    }),
    item('tax-name-3', 'index-docs', 'Податкова — по батькові', {
      defaultText: 'Степанович',
      defaultStyles: { fontSize: '16px', fontWeight: '440', letterSpacing: '0', lineHeight: '0.3' },
    }),
    item('tax-name-group', 'index-docs', 'Податкова — ФІО gap між рядками', {
      text: false,
      defaultStyles: { gap: '10px' },
      styles: ['gap'],
    }),
    item('tax-birth-line1', 'index-docs', 'Податкова — дата рядок 1', {
      defaultText: 'Дата',
      defaultStyles: { fontSize: '14px', fontWeight: '450', letterSpacing: '0.05em', lineHeight: '1.44' },
    }),
    item('tax-birth-line2', 'index-docs', 'Податкова — дата рядок 2', {
      defaultText: 'народження:',
      defaultStyles: { fontSize: '14px', fontWeight: '450', letterSpacing: '0.05em', lineHeight: '1.44' },
    }),
    item('tax-birth-value', 'index-docs', 'Податкова — дата значення', {
      defaultText: '17.08.1999',
      defaultStyles: { fontSize: '14px', fontWeight: '450', letterSpacing: '0.048em', lineHeight: '1.44' },
    }),
    item('tax-field-birth', 'index-docs', 'Податкова — поле дати — відступ зверху', {
      text: false,
      defaultStyles: { gap: '0px', paddingTop: '10px' },
      styles: ['gap', 'paddingTop', 'paddingBottom'],
    }),
    item('tax-id-num', 'index-docs', 'Податкова — номер РНОКПП', {
      defaultText: '2847193056',
      defaultStyles: { fontSize: '32px', fontWeight: '500', letterSpacing: '-0.03em' },
      styles: ['fontSize', 'fontWeight', 'letterSpacing', 'wordSpacing', 'lineHeight', 'translateX', 'translateY'],
    }),
    item('tax-ticker', 'index-docs', 'Податкова — бігучий рядок', {
      html: true,
      multiline: true,
      defaultText: 'Документ оновлено сьогодні • Перевірено',
      defaultStyles: { fontSize: '11.5px', fontWeight: '500', letterSpacing: '0.02em', lineHeight: '1' },
    }),

    item('edoc-back-qr', 'index-docs', 'єДокумент — QR зворот', {
      text: false,
      defaultStyles: { width: '78%', maxWidth: '310px' },
      styles: ['width', 'height', 'maxWidth', 'translateX', 'translateY'],
    }),
    item('tax-back', 'index-docs', 'Податкова — зворот padding', {
      text: false,
      defaultStyles: { paddingTop: '34px', paddingBottom: '30px', paddingLeft: '22px', paddingRight: '22px' },
      styles: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
    }),
    item('tax-back-timer', 'index-docs', 'Податкова — таймер QR', {
      defaultText: 'Код діятиме ще 2:53 хв',
      defaultStyles: { fontSize: '18px', fontWeight: '500', color: '#747474', marginBottom: '18px' },
      styles: ['fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'color', 'marginBottom', 'translateX', 'translateY'],
    }),
    item('tax-back-qr', 'index-docs', 'Податкова — QR зворот', {
      text: false,
      defaultStyles: { width: '78%', maxWidth: '300px' },
      styles: ['width', 'height', 'maxWidth', 'translateX', 'translateY'],
    }),
    item('tax-back-tabs', 'index-docs', 'Податкова — блок QR/Штрихкод', {
      text: false,
      defaultStyles: { gap: '54px', paddingTop: '28px' },
      styles: ['gap', 'paddingTop', 'marginTop', 'translateX', 'translateY'],
    }),
    item('tax-back-tab-qr-icon', 'index-docs', 'Податкова — іконка QR', {
      text: false,
      defaultStyles: { width: '72px', height: '72px' },
      styles: ['width', 'height', 'translateX', 'translateY'],
    }),
    item('tax-back-tab-barcode-icon', 'index-docs', 'Податкова — іконка штрихкод', {
      text: false,
      defaultStyles: { width: '72px', height: '72px' },
      styles: ['width', 'height', 'translateX', 'translateY'],
    }),
    item('tax-back-tab-qr-label', 'index-docs', 'Податкова — підпис QR', {
      defaultText: 'QR-код',
      defaultStyles: { fontSize: '23px', fontWeight: '600', letterSpacing: '-0.04em' },
      styles: ['fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'translateX', 'translateY'],
    }),
    item('tax-back-tab-barcode-label', 'index-docs', 'Податкова — підпис Штрихкод', {
      defaultText: 'Штрихкод',
      defaultStyles: { fontSize: '23px', fontWeight: '600', letterSpacing: '-0.04em' },
      styles: ['fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'translateX', 'translateY'],
    }),

    item('ghost-passport-title', 'index-docs', 'Закордонний паспорт — заголовок', {
      defaultText: 'Закордонний паспорт',
      defaultStyles: { fontSize: '24px', fontWeight: '700', letterSpacing: '-0.03em', lineHeight: '1.15' },
    }),
    item('ghost-passport-name', 'index-docs', 'Закордонний паспорт — ПІБ', {
      defaultText: 'Гера Сергій Степанович',
      defaultStyles: { fontSize: '16px', fontWeight: '400', lineHeight: '1.4' },
    }),
    item('ghost-license-title', 'index-docs', 'Посвідчення водія — заголовок', {
      defaultText: 'Посвідчення водія',
      defaultStyles: { fontSize: '24px', fontWeight: '700', letterSpacing: '-0.03em', lineHeight: '1.15' },
    }),
    item('ghost-license-name', 'index-docs', 'Посвідчення водія — ПІБ', {
      defaultText: 'Гера Сергій Степанович',
      defaultStyles: { fontSize: '16px', fontWeight: '400', lineHeight: '1.4' },
    }),
    item('ghost-student-title', 'index-docs', 'Студентський — заголовок', {
      defaultText: 'Студентський квиток',
      defaultStyles: { fontSize: '24px', fontWeight: '700', letterSpacing: '-0.03em', lineHeight: '1.15' },
    }),
    item('ghost-student-name', 'index-docs', 'Студентський — ПІБ', {
      defaultText: 'Гера Сергій Степанович',
      defaultStyles: { fontSize: '16px', fontWeight: '400', lineHeight: '1.4' },
    }),

    item('feed-greeting', 'index-feed', 'Привітання', {
      defaultText: 'Привіт, Сергій 👋',
      defaultStyles: { fontSize: '32px', fontWeight: '700', letterSpacing: '-0.03em', lineHeight: '1.1' },
    }),
    item('feed-credit-label', 'index-feed', 'Кредитна історія — label', {
      defaultText: 'Кредитна історія',
      defaultStyles: { fontSize: '14px', fontWeight: '400', lineHeight: '1.4' },
    }),
    item('feed-credit-text', 'index-feed', 'Кредитна історія — текст', {
      defaultText: "З'явився запис про новий кредит на ваше ім'я",
      defaultStyles: { fontSize: '16px', fontWeight: '600', lineHeight: '1.4' },
    }),
    item('feed-nezl-title', 'index-feed', 'Незламність — заголовок', {
      defaultText: 'Незламність',
      defaultStyles: { fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em', lineHeight: '1.1' },
    }),
    item('feed-nezl-text', 'index-feed', 'Незламність — текст', {
      defaultText: 'Карта укриттів, Power Banking та інші сервіси для вашої безпеки.',
      defaultStyles: { fontSize: '16px', fontWeight: '400', lineHeight: '1.4' },
    }),
    item('feed-drones-title', 'index-feed', 'Лінія дронів — заголовок', {
      defaultText: 'ЛІНІЯ ДРОНІВ',
      defaultStyles: { fontSize: '26px', fontWeight: '700', letterSpacing: '0.06em', lineHeight: '1.1' },
    }),
    item('feed-drones-sub', 'index-feed', 'Лінія дронів — підпис', {
      defaultText: 'Змінити хід подій',
      defaultStyles: { fontSize: '15px', fontWeight: '500', lineHeight: '1.25' },
    }),
    item('feed-cashback-value', 'index-feed', 'Кешбек — сума', {
      defaultText: '250.19 грн',
      defaultStyles: { fontSize: '32px', fontWeight: '700', letterSpacing: '-0.03em', lineHeight: '1.1' },
    }),
    item('feed-cashback-desc', 'index-feed', 'Кешбек — опис', {
      defaultText: 'Накопичено кешбеку за червень',
      defaultStyles: { fontSize: '14px', fontWeight: '400', lineHeight: '1.4' },
    }),
    item('feed-whatsnew-date', 'index-feed', 'Новини — дата', {
      defaultText: '18 червня, 12:00',
      defaultStyles: { fontSize: '14px', fontWeight: '400', lineHeight: '1.4' },
    }),
    item('feed-whatsnew-text', 'index-feed', 'Новини — текст', {
      defaultText: 'Сервіс для тестування онлайн-розлучення',
      defaultStyles: { fontSize: '16px', fontWeight: '600', lineHeight: '1.4' },
    }),
    item('feed-services-title', 'index-feed', 'Популярні послуги — заголовок', {
      defaultText: 'Популярні послуги',
      defaultStyles: { fontSize: '20px', fontWeight: '700', lineHeight: '1.1' },
    }),

    item('info-title', 'info', 'Заголовок сторінки', {
      defaultText: 'єДокумент',
      defaultStyles: { fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em', paddingTop: '4px', paddingBottom: '8px' },
    }),
    item('info-ticker-wrap', 'info', 'Тикер — висота', {
      text: false,
      defaultStyles: { height: '36px' },
      styles: ['height'],
    }),
    item('info-ticker', 'info', 'Бігучий рядок', {
      html: true,
      multiline: true,
      defaultText: 'документ діє під час воєнного стану та 30 днів після його завершення або скасування. Ой у лузі червона калина похилилася, чогось наша славна Україна зажурилася. &nbsp;&nbsp;&nbsp; документ діє під час воєнного стану та 30 днів після його завершення або скасування. Ой у лузі червона калина похилилася, чогось наша славна Україна зажурилася.',
      defaultStyles: { fontSize: '12.5px', fontWeight: '500', letterSpacing: '0.02em', lineHeight: '1' },
    }),
    item('info-card-1', 'info', 'Картка 1 — padding / margin', {
      text: false,
      defaultStyles: { paddingTop: '18px', paddingBottom: '18px', marginTop: '10px' },
      styles: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'marginTop', 'marginBottom', 'borderRadius'],
    }),
    item('info-name', 'info', 'ПІБ (укр)', {
      html: true,
      multiline: true,
      defaultText: 'ГЕРА СЕРГІЙ<br>СТЕПАНОВИЧ',
      defaultStyles: { fontSize: '17px', fontWeight: '700', letterSpacing: '0.01em', lineHeight: '1.2', marginBottom: '2px' },
    }),
    item('info-name-latin', 'info', 'ПІБ (лат)', {
      defaultText: 'Hera Serhii',
      defaultStyles: { fontSize: '15px', fontWeight: '400', letterSpacing: '-0.01em', color: '#636366', marginBottom: '16px' },
    }),
    item('info-row-photo', 'info', 'Ряд фото — gap', {
      text: false,
      defaultStyles: { gap: '14px' },
      styles: ['gap'],
    }),
    item('info-photo', 'info', 'Фото — розмір', {
      text: false,
      defaultStyles: { width: '142px', height: '180px', borderRadius: '14px' },
      styles: ['width', 'height', 'maxWidth', 'borderRadius', 'translateX', 'translateY'],
    }),
    item('info-birth-label', 'info', 'Дата народження — label', {
      defaultText: 'Дата народження:',
      defaultStyles: { fontSize: '14px', fontWeight: '600', lineHeight: '1.3' },
    }),
    item('info-birth-label-en', 'info', 'Date of birth', {
      defaultText: 'Date of birth',
      defaultStyles: { fontSize: '14px', fontWeight: '400', color: '#8e8e93', lineHeight: '1.3' },
    }),
    item('info-birth-value', 'info', 'Дата народження — значення', {
      defaultText: '17.08.1999',
      defaultStyles: { fontSize: '16px', fontWeight: '600', lineHeight: '1.3', marginTop: '4px' },
    }),
    item('info-card-2', 'info', 'Картка 2 — padding / margin', {
      text: false,
      defaultStyles: { paddingTop: '16px', paddingBottom: '16px', paddingLeft: '18px', paddingRight: '18px', marginTop: '10px' },
      styles: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'marginTop', 'marginBottom', 'borderRadius'],
    }),
    item('info-sex-row', 'info', 'Стать — відступ знизу', {
      text: false,
      defaultStyles: { marginBottom: '16px' },
      styles: ['marginBottom', 'gap'],
    }),
    item('info-sex-label', 'info', 'Стать — label', {
      defaultText: 'Стать:',
      defaultStyles: { fontSize: '14px', fontWeight: '600', lineHeight: '1.3' },
    }),
    item('info-sex-label-en', 'info', 'Sex — label', {
      defaultText: 'Sex',
      defaultStyles: { fontSize: '14px', fontWeight: '400', color: '#8e8e93', lineHeight: '1.3' },
    }),
    item('info-sex-value-uk', 'info', 'Стать — Ч', {
      defaultText: 'Ч',
      defaultStyles: { fontSize: '16px', fontWeight: '600', lineHeight: '1.3' },
    }),
    item('info-sex-value-en', 'info', 'Стать — M', {
      defaultText: 'M',
      defaultStyles: { fontSize: '14px', fontWeight: '400', color: '#8e8e93', lineHeight: '1.3' },
    }),
    item('info-rnokpp-row', 'info', 'РНОКПП — відступ знизу', {
      text: false,
      defaultStyles: { marginBottom: '16px' },
      styles: ['marginBottom'],
    }),
    item('info-rnokpp-label', 'info', 'РНОКПП — label', {
      defaultText: 'РНОКПП (ІПН):',
      defaultStyles: { fontSize: '14px', fontWeight: '600', lineHeight: '1.3' },
    }),
    item('info-rnokpp-value', 'info', 'РНОКПП — значення', {
      defaultText: '2847193056',
      defaultStyles: { fontSize: '16px', fontWeight: '600', lineHeight: '1.3' },
    }),
    item('info-doc-field', 'info', 'Документ — блок', {
      text: false,
      defaultStyles: { gap: '0px' },
      styles: ['gap', 'marginTop'],
    }),
    item('info-doc-label', 'info', 'Документ — label', {
      defaultText: 'Документ, що посвідчує особу:',
      defaultStyles: { fontSize: '14px', fontWeight: '400', lineHeight: '1.3' },
    }),
    item('info-doc-value1', 'info', 'Документ — тип', {
      defaultText: 'Паспорт громадянина України',
      defaultStyles: { fontSize: '16px', fontWeight: '600', lineHeight: '1.3', marginTop: '4px' },
    }),
    item('info-doc-value2', 'info', 'Документ — номер', {
      defaultText: '002847391',
      defaultStyles: { fontSize: '16px', fontWeight: '600', lineHeight: '1.3', marginTop: '0px' },
    }),
    item('info-card-3', 'info', 'Картка 3 — padding / margin', {
      text: false,
      defaultStyles: { paddingTop: '16px', paddingBottom: '16px', paddingLeft: '18px', paddingRight: '18px', marginTop: '10px' },
      styles: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'marginTop', 'marginBottom', 'borderRadius'],
    }),
    item('info-address-label', 'info', 'Адреса — label', {
      defaultText: 'Місце проживання зазначене в банку:',
      defaultStyles: { fontSize: '14px', fontWeight: '400', lineHeight: '1.3' },
    }),
    item('info-address-value', 'info', 'Адреса — значення', {
      defaultText: 'UA, обл. Київська, м. Борщагівка, вул. Садова, буд. 14,',
      defaultStyles: { fontSize: '15px', fontWeight: '500', lineHeight: '1.45', marginTop: '4px' },
    }),
    item('info-card-qr', 'info', 'Картка QR — padding / min-height', {
      text: false,
      defaultStyles: { paddingTop: '28px', paddingBottom: '36px', paddingLeft: '20px', paddingRight: '20px', marginTop: '10px' },
      styles: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight', 'marginTop', 'marginBottom', 'borderRadius', 'height'],
    }),
    item('info-qr', 'info', 'QR-код — розмір', {
      text: false,
      defaultStyles: { width: '300px', height: '300px' },
      styles: ['width', 'height', 'maxWidth', 'translateX', 'translateY'],
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
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      elements: elements,
    };
  }

  function migrateTaxPyramid(config) {
    var el = config.elements;
    var oldName = el['tax-name'];
    if (oldName) {
      var parts = (oldName.text || '').trim().split(/\s+/);
      var nameStyles = oldName.styles || {};
      ['tax-name-1', 'tax-name-2', 'tax-name-3'].forEach(function (id, i) {
        if (!el[id]) el[id] = { text: '', styles: {} };
        if (parts[i]) el[id].text = parts[i];
        el[id].styles = Object.assign({}, el[id].styles, nameStyles);
      });
      delete el['tax-name'];
    }
    var oldField = el['tax-field'];
    if (oldField) {
      var fieldText = oldField.text || '';
      var match = fieldText.match(/^(.+?):\s*(.+)$/);
      var fieldStyles = oldField.styles || {};
      var paddingTop = fieldStyles.paddingTop;
      if (!el['tax-birth-line1']) el['tax-birth-line1'] = { text: 'Дата', styles: {} };
      if (!el['tax-birth-line2']) el['tax-birth-line2'] = { text: 'народження:', styles: {} };
      if (!el['tax-birth-value']) el['tax-birth-value'] = { text: '17.08.1999', styles: {} };
      if (!el['tax-field-birth']) el['tax-field-birth'] = { text: '', styles: {} };
      if (match) {
        var label = match[1].trim();
        var labelParts = label.split(/\s+/);
        if (labelParts.length >= 2) {
          el['tax-birth-line1'].text = labelParts[0];
          el['tax-birth-line2'].text = labelParts.slice(1).join(' ') + ':';
        } else {
          el['tax-birth-line1'].text = label;
          el['tax-birth-line2'].text = '';
        }
        el['tax-birth-value'].text = match[2].trim();
      }
      var lineStyles = Object.assign({}, fieldStyles);
      delete lineStyles.paddingTop;
      el['tax-birth-line1'].styles = Object.assign({}, el['tax-birth-line1'].styles, lineStyles);
      el['tax-birth-line2'].styles = Object.assign({}, el['tax-birth-line2'].styles, lineStyles);
      el['tax-birth-value'].styles = Object.assign({}, el['tax-birth-value'].styles, lineStyles);
      if (paddingTop) {
        el['tax-field-birth'].styles = Object.assign({}, el['tax-field-birth'].styles, { paddingTop: paddingTop });
      }
      delete el['tax-field'];
    }
    return config;
  }

  function migrateInfoPage(config) {
    var el = config.elements;
    var oldSex = el['info-sex-value'];
    if (oldSex && oldSex.text) {
      var parts = oldSex.text.split(/\s*\/\s*/);
      if (!el['info-sex-value-uk']) el['info-sex-value-uk'] = { text: 'Ч', styles: {} };
      if (!el['info-sex-value-en']) el['info-sex-value-en'] = { text: 'M', styles: {} };
      if (parts[0]) el['info-sex-value-uk'].text = parts[0].trim();
      if (parts[1]) el['info-sex-value-en'].text = parts[1].trim();
      if (oldSex.styles) {
        el['info-sex-value-uk'].styles = Object.assign({}, el['info-sex-value-uk'].styles, oldSex.styles);
      }
      delete el['info-sex-value'];
    }
    if (el['info-sex-label-en'] && el['info-sex-label-en'].text === 'Sex:') {
      el['info-sex-label-en'].text = 'Sex';
    }
    if (el['info-rnokpp-label'] && el['info-rnokpp-label'].text === 'РНОКПП:') {
      el['info-rnokpp-label'].text = 'РНОКПП (ІПН):';
    }
    delete el['info-field-gap'];
    return config;
  }

  function migratePersonalCodes(config) {
    if (!config || !config.elements) return config;
    var replacements = {
      '3638805490': '2847193056',
      '010328849': '002847391'
    };
    Object.keys(config.elements).forEach(function (id) {
      var item = config.elements[id];
      if (item && item.text && replacements[item.text]) {
        item.text = replacements[item.text];
      }
    });
    return config;
  }

  function migrateTaxTitleBreak(config) {
    if (!config || !config.elements || !config.elements['tax-title']) return config;
    var text = config.elements['tax-title'].text;
    if (text === 'Картка платника податків') {
      config.elements['tax-title'].text = 'Картка платника<br>податків';
    }
    return config;
  }

  function migrateDefaultNames(config) {
    if (!config || !config.elements) return config;
    var nameMap = {
      'ЛЕМАНИЧ': 'ГЕРА',
      'ОЛЕКСАНДР': 'СЕРГІЙ',
      'ОЛЕКСАНДРОВИЧ': 'СТЕПАНОВИЧ',
      'Леманич': 'Гера',
      'Олександр': 'Сергій',
      'Олександрович': 'Степанович',
      'БАРАБУЛЯ': 'ГЕРА',
      'ВОВК': 'СЕРГІЙ',
      'СЕРГІЙ СТЕПАНОВИЧ': 'СТЕПАНОВИЧ',
      'Барабуля': 'Гера',
      'Вовк': 'Сергій',
      'Леманич Олександр Олександрович': 'Гера Сергій Степанович',
      'Барабуля Вовк Сергій Степанович': 'Гера Сергій Степанович',
      'ЛЕМАНИЧ ОЛЕКСАНДР<br>ОЛЕКСАНДРОВИЧ': 'ГЕРА СЕРГІЙ<br>СТЕПАНОВИЧ',
      'БАРАБУЛЯ ВОВК<br>СЕРГІЙ СТЕПАНОВИЧ': 'ГЕРА СЕРГІЙ<br>СТЕПАНОВИЧ',
      'Lemanych Oleksandr': 'Hera Serhii',
      'Barabulia Vovk': 'Hera Serhii',
      'Привіт, Олександр 👋': 'Привіт, Сергій 👋',
      'Привіт, Вовк 👋': 'Привіт, Сергій 👋'
    };
    Object.keys(config.elements).forEach(function (id) {
      var item = config.elements[id];
      if (item && item.text && nameMap[item.text]) {
        item.text = nameMap[item.text];
      }
    });
    return config;
  }

  function migrateAuthSplash(config) {
    if (!config || !config.elements) return config;
    ['auth-trident', 'auth-icon-diia', 'auth-icon-trident', 'auth-brand-row'].forEach(function (id) {
      delete config.elements[id];
    });
    return config;
  }

  function migrateAuthTrident(config) {
    return migrateAuthSplash(config);
  }

  function migrateConfig(config) {
    return migrateAuthSplash(migrateDefaultNames(migrateTaxTitleBreak(migratePersonalCodes(migrateInfoPage(migrateTaxPyramid(config))))));
  }

  function mergeConfig(base, override) {
    var result = JSON.parse(JSON.stringify(base));
    if (!override || !override.elements) return result;
    Object.keys(override.elements).forEach(function (id) {
      if (!result.elements[id]) result.elements[id] = { text: '', styles: {} };
      var src = override.elements[id];
      if (src.text != null) result.elements[id].text = src.text;
      if (src.imageDataUrl != null) result.elements[id].imageDataUrl = src.imageDataUrl;
      if (src.styles) {
        result.elements[id].styles = Object.assign({}, result.elements[id].styles, src.styles);
      }
    });
    if (override.updatedAt) result.updatedAt = override.updatedAt;
    return result;
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
      var before = JSON.stringify(merged);
      var migrated = migrateConfig(merged);
      if (before !== JSON.stringify(migrated)) saveToStorage(migrated);
      return migrated;
    });
  }

  function loadConfigSync() {
    var defaults = buildDefaultsConfig();
    var stored = loadFromStorage();
    var merged = stored ? mergeConfig(defaults, stored) : defaults;
    var before = JSON.stringify(merged);
    var migrated = migrateConfig(merged);
    if (stored && before !== JSON.stringify(migrated)) saveToStorage(migrated);
    return migrated;
  }

  function cssProp(key) {
    return key.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); });
  }

  function applyStyles(el, styles) {
    if (!el || !styles) return;
    var tx = styles.translateX;
    var ty = styles.translateY;

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

    if (styles.height) el.style.aspectRatio = 'auto';
    else if (el.classList.contains('doc-photo')) el.style.removeProperty('aspect-ratio');

    var parts = [];
    if (tx != null && tx !== '' && tx !== '0px' && tx !== 0) parts.push('translateX(' + tx + ')');
    if (ty != null && ty !== '' && ty !== '0px' && ty !== 0) parts.push('translateY(' + ty + ')');
    if (parts.length) el.style.transform = parts.join(' ');
    else el.style.removeProperty('transform');
  }

  function applyItem(id, data, schemaItem) {
    var selector = schemaItem.selector || '[data-ed="' + id + '"]';
    var nodes = document.querySelectorAll(selector);
    if (!nodes.length) return false;

    nodes.forEach(function (el) {
      if (schemaItem.image) {
        var img = el.tagName === 'IMG' ? el : el.querySelector('img');
        if (img) {
          if (data.imageDataUrl) img.src = data.imageDataUrl;
          else if (schemaItem.defaultImage) img.src = schemaItem.defaultImage;
          img.style.removeProperty('width');
          img.style.removeProperty('height');
          img.style.removeProperty('background');
          img.style.removeProperty('background-color');
        }
        el.style.removeProperty('width');
        el.style.removeProperty('height');
        return;
      }
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

  function readImageDataUrl(file, maxSize) {
    maxSize = maxSize || 512;
    return new Promise(function (resolve, reject) {
      if (!file || !file.type || file.type.indexOf('image/') !== 0) {
        reject(new Error('Not an image'));
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var w = img.width;
          var h = img.height;
          var scale = Math.min(1, maxSize / Math.max(w, h));
          var canvas = document.createElement('canvas');
          canvas.width = Math.round(w * scale);
          canvas.height = Math.round(h * scale);
          var ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          var mime = file.type === 'image/png' || file.type === 'image/webp'
            ? file.type
            : 'image/jpeg';
          resolve(canvas.toDataURL(mime, mime === 'image/jpeg' ? 0.92 : undefined));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
    migrateTaxPyramid: migrateTaxPyramid,
    migrateInfoPage: migrateInfoPage,
    migrateConfig: migrateConfig,
    migrateAuthSplash: migrateAuthSplash,
    loadFromStorage: loadFromStorage,
    saveToStorage: saveToStorage,
    clearStorage: clearStorage,
    fetchFileConfig: fetchFileConfig,
    loadConfig: loadConfig,
    loadConfigSync: loadConfigSync,
    applyConfig: applyConfig,
    readImageDataUrl: readImageDataUrl,
    exportConfigJson: exportConfigJson,
    downloadConfig: downloadConfig,
  };
})(typeof window !== 'undefined' ? window : global);
