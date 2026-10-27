# TEST RESULTS — Matrix Calculator BD (factory run, 2026-10-27, 16:00 slot)

## Unit tests — 31/31 passed, 0 failed

`node tests/test.js` — pure math engine (`js/logic.js`):

- add / sub / mul (2×2 hand-verified 19/22/43/50; non-square 2×3 × 3×2 = 58/64/139/154)
- dimension-mismatch throws for add and mul; scalar, transpose (rectangular), trace
- determinant: 1×1, 2×2 (= 5), 3×3 (= −306), singular (= 0), non-square throws
- inverse: 2×2 exact, singular throws, non-square throws,
  3×3 and 4×4 verified by A × A⁻¹ ≈ I (tolerance 1e-6)
- display rounding (1/3 → 0.333333), −0 collapse
- matrix validation: ragged, NaN, 5×5 rejected; 4×4 accepted
- history-file validation: valid accepted; wrong app, bad item, 101 items rejected
- tab-separated result text format

## Headless-Chrome smoke — 14/14 passed, 0 console/page errors

`node tests/smoke.js` (raw CDP, /opt/meta-chromium/chrome, file:// URL):

- title, 2×2 A grid, default sample values, EN heading
- A × B = 19/22/43/50; det(A) = −2; inverse A = −2/1/1.5/−0.5; trace(A) = 5
- singular inverse shows an error; empty cell shows an error (no crash)
- বাংলা toggle rewrites the heading and persists `matrix-calc-lang = bn`
- 390px mobile viewport: no horizontal overflow

## Repairs

0 app-logic repairs. One UX fix during build: the "No calculation yet" empty
note is now hidden once a result or error is shown (it previously stayed
visible after the first calculation).
