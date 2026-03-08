// i18n.js: Lightweight internationalization for ColorBrewer
// Pattern: browser language detection + localStorage override + data-i18n DOM translation

(function () {
  'use strict';

  var translations = {
    ja: {
      // Number of data classes
      'num.label': '階級分類数を選択してください:',
      // Data type
      'type.label': 'データの性質を選択してください:',
      'type.sequential': '定量的（sequential）',
      'type.diverging': '分岐的（diverging）',
      'type.qualitative': '定性的（qualitative）',
      // Color scheme
      'scheme.label': 'カラースキームを選択してください:',
      // Filters
      'filter.label': '表示内容を以下に限定する:',
      'filter.blind': '配色のバリアフリー',
      'filter.print': '紙への印刷',
      'filter.copy': '複写に耐える',
      // Context
      'context.label': 'コンテクスト:',
      'context.roads': '道路',
      'context.cities': '都市',
      'context.borders': '境',
      // Background
      'bg.label': '背景:',
      'bg.solid': '一色塗り',
      'bg.terrain': '起伏',
      'bg.transparency': '色の透明度',
      // Navigation
      'nav.how': '使い方',
      'nav.downloads': 'ダウンロード',
      'nav.credits': 'クレジット',
      'nav.langToggle': 'English',
      // Export
      'export.title': '選択したこのカラースキームを出力する:',
      'export.gimp': 'GIMPカラーパレット',
      'export.js': 'JavaScript（JS配列）',
      'export.css': 'CSS（CSSクラス）',
      // Dialog titles
      'dialog.number': 'データ階級数について',
      'dialog.schemes': 'カラー配色タイプについて',
      'dialog.usability': 'ユーザビリティアイコンについて',
      'dialog.howto': 'HOW TO USE: MAP DIAGNOSTICS',
      'dialog.credits': 'CREDITS',
      'dialog.downloads': 'DOWNLOADS',
      'dialog.context': '地図のコンテキストと背景について',
      // Messages
      'msg.saveError': '設定の保存中にエラーが発生しました: ',
      'msg.invalidFile': '無効な設定ファイル形式です',
      'msg.loadConfirm': '設定を読み込みますか？\n\n保存日時: {timestamp}\n\n現在の設定は上書きされます。',
      'msg.loadSuccess': '設定を読み込みました',
      'msg.loadError': '設定の読み込み中にエラーが発生しました: ',
      'msg.loadFailed': 'ファイルの読み込みに失敗しました',
      'msg.unknown': '不明',
      // Map tooltips
      'map.noMatch': 'この条件に合うカラースキームはありません。',
      'map.noMatchAdvice': '階級分類数を減らすか、別のデータタイプを選ぶか、フィルタオプションを減らしてください。',
      'map.schemeClass': '{numClasses}クラス {scheme}',
      'map.multiHue': 'マルチ色相:',
      'map.singleHue': '単一色相:',
      'map.blindFriendly': '{scheme}は色覚バリアフリー{word}',
      'map.copyFriendly': '{scheme}は複写{word}',
      'map.screenFriendly': '{scheme}はLCD表示{word}',
      'map.printFriendly': '{scheme}は印刷{word}',
      'map.friendlyYes': 'です',
      'map.friendlyMaybe': 'の可能性があります',
      'map.friendlyNo': 'に不適です',
    },
    en: {
      'num.label': 'Number of data classes:',
      'type.label': 'Nature of your data:',
      'type.sequential': 'sequential',
      'type.diverging': 'diverging',
      'type.qualitative': 'qualitative',
      'scheme.label': 'Pick a color scheme:',
      'filter.label': 'Only show:',
      'filter.blind': 'colorblind safe',
      'filter.print': 'print friendly',
      'filter.copy': 'photocopy safe',
      'context.label': 'Context:',
      'context.roads': 'roads',
      'context.cities': 'cities',
      'context.borders': 'borders',
      'bg.label': 'Background:',
      'bg.solid': 'solid color',
      'bg.terrain': 'terrain',
      'bg.transparency': 'color transparency',
      'nav.how': 'how to use',
      'nav.downloads': 'downloads',
      'nav.credits': 'credits',
      'nav.langToggle': '日本語',
      'export.title': 'Export your selected color scheme:',
      'export.gimp': 'GIMP color palette',
      'export.js': 'JavaScript',
      'export.css': 'CSS',
      'dialog.number': 'NUMBER OF DATA CLASSES',
      'dialog.schemes': 'TYPES OF COLOR SCHEMES',
      'dialog.usability': 'USABILITY ICONS',
      'dialog.howto': 'HOW TO USE: MAP DIAGNOSTICS',
      'dialog.credits': 'CREDITS',
      'dialog.downloads': 'DOWNLOADS',
      'dialog.context': 'MAP CONTEXT and BACKGROUND',
      'msg.saveError': 'Error saving settings: ',
      'msg.invalidFile': 'Invalid settings file format',
      'msg.loadConfirm': 'Load settings?\n\nSaved: {timestamp}\n\nCurrent settings will be overwritten.',
      'msg.loadSuccess': 'Settings loaded',
      'msg.loadError': 'Error loading settings: ',
      'msg.loadFailed': 'Failed to read file',
      'msg.unknown': 'unknown',
      'map.noMatch': 'No color schemes match these criteria.',
      'map.noMatchAdvice': 'Please choose fewer data classes, a different data type, and/or fewer filtering options.',
      'map.schemeClass': '{numClasses}-class {scheme}',
      'map.multiHue': 'Multi-hue:',
      'map.singleHue': 'Single hue:',
      'map.blindFriendly': '{numClasses}-class {scheme} is {word}color blind friendly',
      'map.copyFriendly': '{numClasses}-class {scheme} is {word}photocopy friendly',
      'map.screenFriendly': '{numClasses}-class {scheme} is {word}LCD friendly',
      'map.printFriendly': '{numClasses}-class {scheme} is {word}print friendly',
      'map.friendlyYes': '',
      'map.friendlyMaybe': 'potentially not ',
      'map.friendlyNo': 'not ',
    }
  };

  var currentLang = 'ja';

  function detectLanguage() {
    var stored = localStorage.getItem('colorbrewer-lang');
    if (stored && translations[stored]) {
      currentLang = stored;
      return;
    }
    var browserLang = (navigator.language || navigator.userLanguage || 'ja').toLowerCase();
    currentLang = browserLang.startsWith('ja') ? 'ja' : 'en';
  }

  function getLang() {
    return currentLang;
  }

  function setLang(lang) {
    if (translations[lang]) {
      currentLang = lang;
      localStorage.setItem('colorbrewer-lang', lang);
    }
  }

  function t(key, params) {
    var dict = translations[currentLang] || translations.ja;
    var text = dict[key];
    if (text === undefined) {
      // Fallback to Japanese
      text = translations.ja[key];
    }
    if (text === undefined) return key;
    if (params) {
      Object.keys(params).forEach(function (k) {
        text = text.replace(new RegExp('\\{' + k + '\\}', 'g'), params[k]);
      });
    }
    return text;
  }

  function translateDOM() {
    // data-i18n: set textContent
    var elements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elements.length; i++) {
      var key = elements[i].getAttribute('data-i18n');
      if (key) {
        elements[i].textContent = t(key);
      }
    }
    // data-i18n-html: set innerHTML
    var htmlElements = document.querySelectorAll('[data-i18n-html]');
    for (var j = 0; j < htmlElements.length; j++) {
      var htmlKey = htmlElements[j].getAttribute('data-i18n-html');
      if (htmlKey) {
        htmlElements[j].innerHTML = t(htmlKey);
      }
    }
  }

  // Auto-initialize
  detectLanguage();

  console.log('[i18n] navigator.language:', navigator.language);
  console.log('[i18n] detected lang:', currentLang);
  console.log('[i18n] localStorage colorbrewer-lang:', localStorage.getItem('colorbrewer-lang'));

  // Expose globally
  window.t = t;
  window.getLang = getLang;
  window.setLang = setLang;
  window.translateDOM = translateDOM;

  // Translate DOM immediately
  // Script is placed after all data-i18n elements, so they are already in the DOM
  var i18nElements = document.querySelectorAll('[data-i18n]');
  console.log('[i18n] data-i18n elements found:', i18nElements.length);
  translateDOM();
  setupLangToggle();
  console.log('[i18n] translateDOM completed');

  function setupLangToggle() {
    var toggle = document.getElementById('lang-toggle');
    if (toggle) {
      toggle.textContent = t('nav.langToggle');
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        setLang(currentLang === 'ja' ? 'en' : 'ja');
        location.reload();
      });
    }
  }
})();
