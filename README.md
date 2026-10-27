# Matrix Calculator BD

Offline, bilingual (English / বাংলা) matrix calculator for students and anyone
who needs quick linear-algebra answers. Add, subtract, multiply, scale,
transpose, and find the determinant, inverse and trace of matrices — all in
the browser, with no accounts and no network requests.

Live demo: https://fahad3235.github.io/matrix-calc-bd/

## Features

- **Matrix editors** — Matrix A and Matrix B, each 2×2 to 4×4 (rows and columns
  chosen independently), with values preserved when the size changes.
- **Fill buttons** — Identity, Zero and Sample presets for Matrix A.
- **Operations** — A + B, A − B, A × B, B × A, k × A (scalar), Transpose A,
  det(A), A⁻¹ and trace(A).
- **Honest errors** — empty/non-numeric cells, dimension mismatches, non-square
  inputs for det/inverse/trace, and singular matrices all produce a clear
  inline message instead of a wrong answer.
- **Copy result** — copy the result matrix as tab-separated text.
- **History** — the last 100 calculations persist in localStorage, with JSON
  export and strictly validated import (wrong app, wrong version or any bad
  entry rejects the whole file, leaving existing history untouched).
- **Bilingual UI** — EN / বাংলা toggle, persisted, with Bengali digits in
  results and history when বাংলা is active.
- **Responsive** — verified at 390px mobile width with no horizontal overflow.

## Stack

Vanilla HTML, CSS and JavaScript. No frameworks, no build step, no CDN
dependencies. Pure math lives in `js/logic.js` (usable from Node for tests);
DOM code lives in `js/app.js`.

## Run locally

Open `index.html` in any modern browser — or serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

## Testing

```sh
node tests/test.js    # 31 Node unit tests for the math engine
node tests/smoke.js   # 14 headless-Chrome (CDP) checks: operations, errors,
                      # BN toggle + persistence, 390px overflow, zero page errors
```

Hand-verified values (also asserted by the tests):

- A × B for A=[[1,2],[3,4]], B=[[5,6],[7,8]] = [[19,22],[43,50]]
- det([[6,1,1],[4,-2,5],[2,8,7]]) = −306
- inverse of [[4,7],[2,6]] = [[0.6,−0.7],[−0.2,0.4]]
- A × A⁻¹ ≈ identity for tested 3×3 and 4×4 matrices (tolerance 1e-6)

## Math notes

- Determinant uses cofactor expansion (exact for the 1×1–4×4 sizes offered).
- Inverse uses Gauss–Jordan elimination with partial pivoting. A matrix whose
  largest pivot is below 1e-12 is reported as singular.
- Results are rounded to 6 decimal places for display; −0 is shown as 0.
- Multiplication needs A columns = B rows; addition/subtraction need identical
  sizes; determinant, inverse and trace need a square Matrix A.

## Limitations

- Matrix sizes are capped at 4×4 — enough for coursework, not for large
  numerical work.
- Display rounding (6 decimals) means results are not exact fractions; for
  exact rational arithmetic use a computer-algebra tool.
- This is an educational calculator, not a verified numerical library.

## Status

MVP complete and tested (see `TEST_RESULTS.md`). Ships with the sample
matrices A=[[1,2],[3,4]] and B=[[5,6],[7,8]] pre-filled so the operations work
immediately; no user data is collected or sent anywhere.
