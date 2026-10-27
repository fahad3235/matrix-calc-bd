// Matrix Calc BD — pure matrix math (no DOM). UMD: works in Node and browsers.
(function (root) {
  'use strict';
  function err(msg) { return new Error(msg); }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }

  // Validate a 2-D array of numbers; rows 1..4, cols 1..4, rectangular.
  function validateMatrix(m) {
    if (!Array.isArray(m) || m.length < 1 || m.length > 4) return false;
    var cols = null;
    for (var i = 0; i < m.length; i++) {
      if (!Array.isArray(m[i]) || m[i].length < 1 || m[i].length > 4) return false;
      if (cols === null) cols = m[i].length;
      if (m[i].length !== cols) return false;
      for (var j = 0; j < m[i].length; j++) if (!isNum(m[i][j])) return false;
    }
    return true;
  }

  function shape(m) { return [m.length, m[0].length]; }
  function sameShape(a, b) { var s = shape(a), t = shape(b); return s[0] === t[0] && s[1] === t[1]; }

  function map2(a, b, fn) {
    if (!validateMatrix(a) || !validateMatrix(b)) throw err('invalid matrix');
    if (!sameShape(a, b)) throw err('dimension mismatch');
    return a.map(function (row, i) { return row.map(function (v, j) { return fn(v, b[i][j]); }); });
  }
  function add(a, b) { return map2(a, b, function (x, y) { return x + y; }); }
  function sub(a, b) { return map2(a, b, function (x, y) { return x - y; }); }
  function mul(a, b) {
    if (!validateMatrix(a) || !validateMatrix(b)) throw err('invalid matrix');
    if (a[0].length !== b.length) throw err('dimension mismatch');
    var out = [];
    for (var i = 0; i < a.length; i++) {
      out[i] = [];
      for (var j = 0; j < b[0].length; j++) {
        var s = 0;
        for (var k = 0; k < a[0].length; k++) s += a[i][k] * b[k][j];
        out[i][j] = s;
      }
    }
    return out;
  }
  function scalarMul(a, s) {
    if (!validateMatrix(a) || !isNum(s)) throw err('invalid input');
    return a.map(function (row) { return row.map(function (v) { return v * s; }); });
  }
  function transpose(a) {
    if (!validateMatrix(a)) throw err('invalid matrix');
    return a[0].map(function (_, j) { return a.map(function (row) { return row[j]; }); });
  }
  function trace(a) {
    if (!validateMatrix(a)) throw err('invalid matrix');
    if (a.length !== a[0].length) throw err('not square');
    var s = 0; for (var i = 0; i < a.length; i++) s += a[i][i]; return s;
  }
  function det(a) {
    if (!validateMatrix(a)) throw err('invalid matrix');
    if (a.length !== a[0].length) throw err('not square');
    var n = a.length;
    if (n === 1) return a[0][0];
    if (n === 2) return a[0][0] * a[1][1] - a[0][1] * a[1][0];
    var total = 0;
    for (var j = 0; j < n; j++) {
      var minor = [];
      for (var i = 1; i < n; i++) {
        var row = [];
        for (var k = 0; k < n; k++) if (k !== j) row.push(a[i][k]);
        minor.push(row);
      }
      total += ((j % 2 === 0) ? 1 : -1) * a[0][j] * det(minor);
    }
    return total;
  }
  function inverse(a) {
    if (!validateMatrix(a)) throw err('invalid matrix');
    if (a.length !== a[0].length) throw err('not square');
    var n = a.length;
    // Augment with identity and Gauss-Jordan eliminate with partial pivoting.
    var m = a.map(function (row, i) {
      var r = row.slice();
      for (var j = 0; j < n; j++) r.push(i === j ? 1 : 0);
      return r;
    });
    for (var col = 0; col < n; col++) {
      var piv = col, best = Math.abs(m[col][col]);
      for (var r = col + 1; r < n; r++) {
        if (Math.abs(m[r][col]) > best) { best = Math.abs(m[r][col]); piv = r; }
      }
      if (best < 1e-12) throw err('singular matrix');
      if (piv !== col) { var tmp = m[piv]; m[piv] = m[col]; m[col] = tmp; }
      var d = m[col][col];
      for (var j = 0; j < 2 * n; j++) m[col][j] /= d;
      for (var i = 0; i < n; i++) {
        if (i === col) continue;
        var f = m[i][col];
        if (f !== 0) for (var k = 0; k < 2 * n; k++) m[i][k] -= f * m[col][k];
      }
    }
    return m.map(function (row) { return row.slice(n); });
  }
  // Round to 6 decimals for display; collapse -0 to 0.
  function fmt(v) {
    var r = Math.round(v * 1e6) / 1e6;
    return Object.is(r, -0) ? 0 : r;
  }
  function fmtMatrix(m) { return m.map(function (row) { return row.map(fmt); }); }
  function matrixToText(m) {
    return fmtMatrix(m).map(function (row) { return row.join('\t'); }).join('\n');
  }
  function approxEqual(a, b, tol) {
    if (!sameShape(a, b)) return false;
    for (var i = 0; i < a.length; i++)
      for (var j = 0; j < a[0].length; j++)
        if (Math.abs(a[i][j] - b[i][j]) > tol) return false;
    return true;
  }
  // Strict history-file validation: {app:'matrix-calc-bd', version:1, items:[...]}
  function validateHistoryFile(obj) {
    if (!obj || obj.app !== 'matrix-calc-bd' || obj.version !== 1) return false;
    if (!Array.isArray(obj.items) || obj.items.length > 100) return false;
    for (var i = 0; i < obj.items.length; i++) {
      var it = obj.items[i];
      if (!it || typeof it.op !== 'string' || typeof it.text !== 'string') return false;
      if (it.result !== null && !validateMatrix(it.result)) return false;
    }
    return true;
  }

  var api = { validateMatrix: validateMatrix, shape: shape, add: add, sub: sub,
    mul: mul, scalarMul: scalarMul, transpose: transpose, trace: trace,
    det: det, inverse: inverse, fmt: fmt, fmtMatrix: fmtMatrix,
    matrixToText: matrixToText, approxEqual: approxEqual,
    validateHistoryFile: validateHistoryFile };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MatrixCalc = api;
})(typeof window !== 'undefined' ? window : globalThis);
