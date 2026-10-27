// Node unit tests for js/logic.js — run: node tests/test.js
const M = require('../js/logic.js');
let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('ok - ' + name); }
  else { fail++; console.log('FAIL - ' + name + (extra ? ' :: ' + extra : '')); }
}
function eq(a, b) { return JSON.stringify(M.fmtMatrix(a)) === JSON.stringify(M.fmtMatrix(b)); }
function throws(fn, re) { try { fn(); return false; } catch (e) { return re ? re.test(e.message) : true; } }

check('add 2x2', eq(M.add([[1, 2], [3, 4]], [[5, 6], [7, 8]]), [[6, 8], [10, 12]]));
check('sub 2x2', eq(M.sub([[5, 6], [7, 8]], [[1, 2], [3, 4]]), [[4, 4], [4, 4]]));
check('mul 2x2 hand-verified 19/22/43/50',
  eq(M.mul([[1, 2], [3, 4]], [[5, 6], [7, 8]]), [[19, 22], [43, 50]]));
check('mul non-square 2x3 x 3x2',
  eq(M.mul([[1, 2, 3], [4, 5, 6]], [[7, 8], [9, 10], [11, 12]]), [[58, 64], [139, 154]]));
check('mul dimension mismatch throws', throws(() => M.mul([[1, 2]], [[1, 2]]), /dimension/));
check('add dimension mismatch throws', throws(() => M.add([[1, 2]], [[1], [2]]), /dimension/));
check('scalar 3x', eq(M.scalarMul([[1, -2], [0, 5]], 3), [[3, -6], [0, 15]]));
check('transpose rectangular', eq(M.transpose([[1, 2, 3], [4, 5, 6]]), [[1, 4], [2, 5], [3, 6]]));
check('trace 3x3 = 15', M.trace([[1, 2, 3], [4, 5, 6], [7, 8, 9]]) === 15);
check('trace non-square throws', throws(() => M.trace([[1, 2, 3], [4, 5, 6]]), /square/));
check('det 2x2 [[2,1],[3,4]] = 5', M.det([[2, 1], [3, 4]]) === 5);
check('det 3x3 known = -306', M.det([[6, 1, 1], [4, -2, 5], [2, 8, 7]]) === -306);
check('det singular = 0', M.det([[1, 2], [2, 4]]) === 0);
check('det 1x1', M.det([[7]]) === 7);
check('det non-square throws', throws(() => M.det([[1, 2, 3], [4, 5, 6]]), /square/));
check('inverse 2x2 exact', eq(M.inverse([[4, 7], [2, 6]]), [[0.6, -0.7], [-0.2, 0.4]]));
check('inverse singular throws', throws(() => M.inverse([[1, 2], [2, 4]]), /singular/));
check('inverse non-square throws', throws(() => M.inverse([[1, 2, 3], [4, 5, 6]]), /square/));
const A3 = [[2, 1, 1], [1, 3, 2], [1, 0, 0]];
check('inverse 3x3: A x Ainv approx I',
  M.approxEqual(M.mul(A3, M.inverse(A3)), [[1, 0, 0], [0, 1, 0], [0, 0, 1]], 1e-6));
const A4 = [[1, 2, 3, 4], [0, 1, 2, 3], [0, 0, 1, 2], [0, 0, 0, 1]];
check('inverse 4x4 upper-triangular: A x Ainv approx I',
  M.approxEqual(M.mul(A4, M.inverse(A4)),
    [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]], 1e-6));
check('fmt rounds to 6dp', M.fmt(1 / 3) === 0.333333);
check('fmt collapses -0', Object.is(M.fmt(-0.0000001), 0));
check('validateMatrix rejects ragged', M.validateMatrix([[1, 2], [3]]) === false);
check('validateMatrix rejects NaN', M.validateMatrix([[1, NaN]]) === false);
check('validateMatrix rejects 5x5', M.validateMatrix([[1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5]]) === false);
check('validateMatrix accepts 4x4', M.validateMatrix(A4) === true);
check('history file valid', M.validateHistoryFile({ app: 'matrix-calc-bd', version: 1, items: [{ op: 'A + B', text: 'A + B', result: [[1]] }] }) === true);
check('history file wrong app rejected', M.validateHistoryFile({ app: 'other', version: 1, items: [] }) === false);
check('history file bad item rejected', M.validateHistoryFile({ app: 'matrix-calc-bd', version: 1, items: [{ op: 'x', text: 'x', result: [[NaN]] }] }) === false);
check('history file too many rejected',
  M.validateHistoryFile({ app: 'matrix-calc-bd', version: 1, items: new Array(101).fill({ op: 'x', text: 'x', result: null }) }) === false);
check('matrixToText tab format', M.matrixToText([[19, 22], [43, 50]]) === '19\t22\n43\t50');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
