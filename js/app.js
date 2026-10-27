// Matrix Calc BD — UI glue (DOM only; math lives in logic.js).
(function () {
  'use strict';
  var M = window.MatrixCalc;
  var BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  var I18N = {
    en: {
      title: 'Matrix Calculator BD', tagline: 'Add, multiply, invert and explore matrices — fully offline.',
      matrixA: 'Matrix A', matrixB: 'Matrix B', rows: 'Rows', cols: 'Cols',
      fillIdentityA: 'Identity → A', fillZeroA: 'Zero → A', fillSampleA: 'Sample → A',
      scalar: 'Scalar k', operations: 'Operations',
      opAdd: 'A + B', opSub: 'A − B', opMul: 'A × B', opMulBA: 'B × A',
      opScalar: 'k × A', opTranspose: 'Transpose A', opDet: 'det(A)', opInverse: 'A⁻¹', opTrace: 'trace(A)',
      result: 'Result', noResult: 'No calculation yet. Enter numbers and pick an operation.',
      copyResult: 'Copy result as text', copied: 'Copied!',
      history: 'History', clearHistory: 'Clear history', noHistory: 'No calculations yet.',
      exportBtn: 'Export history (JSON)', importBtn: 'Import history (JSON)',
      errEmpty: 'Fill every cell with a number.', errMismatch: 'Matrix sizes do not fit this operation.',
      errSingular: 'Matrix A is singular — it has no inverse.',
      errNotSquare: 'This operation needs a square matrix A.',
      errBadImport: 'That file is not a valid Matrix Calc BD history file — nothing was changed.',
      imported: 'History imported.', cleared: 'History cleared.',
      howTitle: 'How it works', howText: 'Type numbers into A and B (or use the fill buttons), then pick an operation. Addition and subtraction need the same size; multiplication needs A columns = B rows. Determinant, inverse and trace need a square A. Everything runs in your browser — no data ever leaves this page.',
      footer: 'Educational tool. Results are rounded to 6 decimal places. 100% offline — no accounts, no network requests.'
    },
    bn: {
      title: 'ম্যাট্রিক্স ক্যালকুলেটর বিডি', tagline: 'ম্যাট্রিক্স যোগ, গুণ, বিপরীত নির্ণয় — সম্পূর্ণ অফলাইন।',
      matrixA: 'ম্যাট্রিক্স A', matrixB: 'ম্যাট্রিক্স B', rows: 'সারি', cols: 'কলাম',
      fillIdentityA: 'অভেদ → A', fillZeroA: 'শূন্য → A', fillSampleA: 'নমুনা → A',
      scalar: 'স্কেলার k', operations: 'অপারেশন',
      opAdd: 'A + B', opSub: 'A − B', opMul: 'A × B', opMulBA: 'B × A',
      opScalar: 'k × A', opTranspose: 'A-এর ট্রান্সপোজ', opDet: 'det(A)', opInverse: 'A⁻¹', opTrace: 'trace(A)',
      result: 'ফলাফল', noResult: 'এখনো কোনো হিসাব হয়নি। সংখ্যা লিখে একটি অপারেশন বেছে নিন।',
      copyResult: 'ফলাফল টেক্সট হিসেবে কপি করুন', copied: 'কপি হয়েছে!',
      history: 'ইতিহাস', clearHistory: 'ইতিহাস মুছুন', noHistory: 'এখনো কোনো হিসাব নেই।',
      exportBtn: 'ইতিহাস এক্সপোর্ট (JSON)', importBtn: 'ইতিহাস ইমপোর্ট (JSON)',
      errEmpty: 'প্রতিটি ঘরে একটি সংখ্যা লিখুন।', errMismatch: 'এই অপারেশনের জন্য ম্যাট্রিক্সের আকার মিলছে না।',
      errSingular: 'ম্যাট্রিক্স A সিঙ্গুলার — এর কোনো বিপরীত ম্যাট্রিক্স নেই।',
      errNotSquare: 'এই অপারেশনের জন্য বর্গ ম্যাট্রিক্স A দরকার।',
      errBadImport: 'এটি বৈধ Matrix Calc BD ইতিহাস ফাইল নয় — কিছুই বদলায়নি।',
      imported: 'ইতিহাস ইমপোর্ট হয়েছে।', cleared: 'ইতিহাস মোছা হয়েছে।',
      howTitle: 'কীভাবে কাজ করে', howText: 'A ও B-তে সংখ্যা লিখুন (অথবা ফিল বোতাম ব্যবহার করুন), তারপর একটি অপারেশন বেছে নিন। যোগ-বিয়োগের জন্য একই আকার লাগে; গুণের জন্য A-এর কলাম = B-এর সারি হতে হয়। নির্ণায়ক, বিপরীত ও ট্রেসের জন্য বর্গ A দরকার। সবকিছু আপনার ব্রাউজারেই চলে — কোনো তথ্য বাইরে যায় না।',
      footer: 'শিক্ষামূলক টুল। ফলাফল ৬ দশমিক স্থান পর্যন্ত দেখানো হয়। ১০০% অফলাইন — কোনো অ্যাকাউন্ট বা নেটওয়ার্ক অনুরোধ নেই।'
    }
  };
  var lang = localStorage.getItem('matrix-calc-lang') || 'en';
  var history = [];
  try { history = JSON.parse(localStorage.getItem('matrix-calc-history') || '[]'); } catch (e) { history = []; }
  if (!Array.isArray(history)) history = [];

  function $(id) { return document.getElementById(id); }
  function t(key) { return I18N[lang][key] || I18N.en[key] || key; }
  function toBn(s) {
    if (lang !== 'bn') return s;
    return String(s).replace(/[0-9]/g, function (d) { return BN_DIGITS[+d]; });
  }
  function saveHistory() { localStorage.setItem('matrix-calc-history', JSON.stringify(history.slice(0, 100))); }

  // --- matrix grids -------------------------------------------------------
  function gridState(prefix) {
    var rows = +$(prefix + 'Rows').value, cols = +$(prefix + 'Cols').value;
    return { rows: rows, cols: cols };
  }
  function buildGrid(prefix) {
    var st = gridState(prefix), grid = $(prefix + 'Grid');
    var old = {};
    grid.querySelectorAll('input').forEach(function (inp) {
      old[inp.dataset.r + ',' + inp.dataset.c] = inp.value;
    });
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = 'repeat(' + st.cols + ', minmax(0, 1fr))';
    for (var r = 0; r < st.rows; r++) {
      for (var c = 0; c < st.cols; c++) {
        var inp = document.createElement('input');
        inp.type = 'text'; inp.inputMode = 'decimal'; inp.dataset.r = r; inp.dataset.c = c;
        inp.setAttribute('aria-label', prefix + ' ' + (r + 1) + ',' + (c + 1));
        inp.value = old[r + ',' + c] !== undefined ? old[r + ',' + c] : (r === c ? '' : '');
        grid.appendChild(inp);
      }
    }
  }
  function readGrid(prefix) {
    var grid = $(prefix + 'Grid');
    var inputs = Array.prototype.slice.call(grid.querySelectorAll('input'));
    var rows = +$(prefix + 'Rows').value, cols = +$(prefix + 'Cols').value;
    var m = [];
    for (var r = 0; r < rows; r++) {
      m[r] = [];
      for (var c = 0; c < cols; c++) {
        var v = inputs[r * cols + c].value.trim();
        if (v === '' || isNaN(Number(v))) return null;
        m[r][c] = Number(v);
      }
    }
    return m;
  }
  function setGrid(prefix, m) {
    $(prefix + 'Rows').value = m.length;
    $(prefix + 'Cols').value = m[0].length;
    buildGrid(prefix);
    var inputs = $(prefix + 'Grid').querySelectorAll('input');
    m.forEach(function (row, r) { row.forEach(function (v, c) { inputs[r * row.length + c].value = v; }); });
  }

  // --- result / history ---------------------------------------------------
  function showError(msg) {
    $('resultEmpty').hidden = true;
    $('resultError').textContent = msg;
    $('resultError').hidden = false;
    $('resultGrid').innerHTML = '';
    $('resultScalar').textContent = '';
  }
  function showMatrix(m, label) {
    $('resultEmpty').hidden = true;
    $('resultError').hidden = true;
    $('resultScalar').textContent = '';
    var grid = $('resultGrid');
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = 'repeat(' + m[0].length + ', minmax(0, 1fr))';
    M.fmtMatrix(m).forEach(function (row) {
      row.forEach(function (v) {
        var d = document.createElement('div');
        d.className = 'cell'; d.textContent = toBn(String(v));
        grid.appendChild(d);
      });
    });
    $('copyBtn').hidden = false;
    $('copyBtn').dataset.text = M.matrixToText(m);
    pushHistory(label, m);
  }
  function showScalar(v, label) {
    $('resultEmpty').hidden = true;
    $('resultError').hidden = true;
    $('resultGrid').innerHTML = '';
    $('resultScalar').textContent = toBn(String(M.fmt(v)));
    $('copyBtn').hidden = false;
    $('copyBtn').dataset.text = String(M.fmt(v));
    pushHistory(label, null, M.fmt(v));
  }
  function pushHistory(label, m, scalar) {
    history.unshift({ op: label, text: label, result: m || null,
      scalar: (scalar === undefined ? null : scalar), at: new Date().toISOString() });
    history = history.slice(0, 100);
    saveHistory(); renderHistory();
  }
  function renderHistory() {
    var list = $('historyList');
    if (!history.length) {
      list.innerHTML = '<li class="empty">' + t('noHistory') + '</li>';
      return;
    }
    list.innerHTML = '';
    history.forEach(function (h) {
      var li = document.createElement('li');
      var summary = h.result ? M.matrixToText(h.result).replace(/\n/g, ' | ')
        : (h.scalar !== null && h.scalar !== undefined ? String(h.scalar) : '');
      li.textContent = h.op + ' = ' + toBn(summary);
      list.appendChild(li);
    });
  }

  function run(fn, label) {
    var A = readGrid('a'), B = readGrid('b');
    if (!A || !B) { showError(t('errEmpty')); return; }
    try {
      var out = fn(A, B);
      if (typeof out === 'number') showScalar(out, label);
      else showMatrix(out, label);
    } catch (e) {
      if (/singular/.test(e.message)) showError(t('errSingular'));
      else if (/not square/.test(e.message)) showError(t('errNotSquare'));
      else showError(t('errMismatch'));
    }
  }

  function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.dataset.i18n);
    });
    $('langBtn').textContent = lang === 'en' ? 'বাংলা' : 'English';
    document.documentElement.lang = lang === 'en' ? 'en' : 'bn';
    renderHistory();
  }

  // --- wiring -------------------------------------------------------------
  ['a', 'b'].forEach(function (p) {
    $(p + 'Rows').addEventListener('change', function () { buildGrid(p); });
    $(p + 'Cols').addEventListener('change', function () { buildGrid(p); });
  });
  $('fillIdentity').addEventListener('click', function () {
    var n = Math.min(+$('aRows').value, +$('aCols').value);
    var m = [];
    for (var r = 0; r < +$('aRows').value; r++) {
      m[r] = [];
      for (var c = 0; c < +$('aCols').value; c++) m[r][c] = (r === c) ? 1 : 0;
    }
    setGrid('a', m);
  });
  $('fillZero').addEventListener('click', function () {
    var m = [];
    for (var r = 0; r < +$('aRows').value; r++) {
      m[r] = [];
      for (var c = 0; c < +$('aCols').value; c++) m[r][c] = 0;
    }
    setGrid('a', m);
  });
  $('fillSample').addEventListener('click', function () { setGrid('a', [[1, 2], [3, 4]]); setGrid('b', [[5, 6], [7, 8]]); });

  $('opAdd').addEventListener('click', function () { run(function (A, B) { return M.add(A, B); }, 'A + B'); });
  $('opSub').addEventListener('click', function () { run(function (A, B) { return M.sub(A, B); }, 'A − B'); });
  $('opMul').addEventListener('click', function () { run(function (A, B) { return M.mul(A, B); }, 'A × B'); });
  $('opMulBA').addEventListener('click', function () { run(function (A, B) { return M.mul(B, A); }, 'B × A'); });
  $('opScalar').addEventListener('click', function () {
    var A = readGrid('a');
    var k = Number($('scalarInput').value.trim());
    if (!A || $('scalarInput').value.trim() === '' || isNaN(k)) { showError(t('errEmpty')); return; }
    try { showMatrix(M.scalarMul(A, k), $('scalarInput').value.trim() + ' × A'); }
    catch (e) { showError(t('errMismatch')); }
  });
  $('opTranspose').addEventListener('click', function () {
    var A = readGrid('a');
    if (!A) { showError(t('errEmpty')); return; }
    showMatrix(M.transpose(A), 'Aᵀ');
  });
  $('opDet').addEventListener('click', function () {
    var A = readGrid('a');
    if (!A) { showError(t('errEmpty')); return; }
    try { showScalar(M.det(A), 'det(A)'); }
    catch (e) { showError(t('errNotSquare')); }
  });
  $('opInverse').addEventListener('click', function () {
    var A = readGrid('a');
    if (!A) { showError(t('errEmpty')); return; }
    try { showMatrix(M.inverse(A), 'A⁻¹'); }
    catch (e) {
      if (/singular/.test(e.message)) showError(t('errSingular'));
      else showError(t('errNotSquare'));
    }
  });
  $('opTrace').addEventListener('click', function () {
    var A = readGrid('a');
    if (!A) { showError(t('errEmpty')); return; }
    try { showScalar(M.trace(A), 'trace(A)'); }
    catch (e) { showError(t('errNotSquare')); }
  });
  $('copyBtn').addEventListener('click', function () {
    var txt = $('copyBtn').dataset.text || '';
    if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(function () {});
    $('copyBtn').textContent = t('copied');
    setTimeout(function () { $('copyBtn').textContent = t('copyResult'); }, 1500);
  });
  $('clearHistory').addEventListener('click', function () {
    history = []; saveHistory(); renderHistory();
    $('importMsg').textContent = t('cleared');
  });
  $('exportBtn').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify({ app: 'matrix-calc-bd', version: 1, items: history }, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'matrix-calc-history.json'; a.click();
    URL.revokeObjectURL(a.href);
  });
  $('importFile').addEventListener('change', function () {
    var f = $('importFile').files[0]; if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var obj = JSON.parse(reader.result);
        if (!M.validateHistoryFile(obj)) throw new Error('bad');
        history = obj.items.slice(0, 100); saveHistory(); renderHistory();
        $('importMsg').textContent = t('imported');
      } catch (e) { $('importMsg').textContent = t('errBadImport'); }
    };
    reader.readAsText(f);
  });
  $('langBtn').addEventListener('click', function () {
    lang = lang === 'en' ? 'bn' : 'en';
    localStorage.setItem('matrix-calc-lang', lang);
    applyLang();
  });

  buildGrid('a'); buildGrid('b');
  setGrid('a', [[1, 2], [3, 4]]);
  setGrid('b', [[5, 6], [7, 8]]);
  applyLang();
})();
