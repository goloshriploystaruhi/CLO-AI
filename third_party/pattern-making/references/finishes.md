# Pattern finishes

## Seam allowances

| Seam | Allowance |
|---|---|
| Plain seam, side seam, shoulder | 1 cm, 1.5 cm in industrial production |
| Neckline, armhole with facing | 0.6 to 1 cm |
| Center back with zip | 1.5 to 2 cm |
| French seam | 1.5 cm |
| Trouser crotch, center back | 1.5 to 2.5 cm, to allow alterations |
| Straight skirt or dress hem | 3 to 4 cm |
| Trouser hem | 4 cm |
| Sleeve hem | 2 to 3 cm |
| Very flared skirt hem | 0.5 to 1 cm |
| Edge on the fold | 0 |

In the piece format, `"allowance"` gives the default value and `"allowances"` the value edge by edge.
For CLO3D, send the net outline: CLO3D adds its own seam allowances.

## Notches and markings

- **Notches**: 0.5 to 0.6 cm cuts into the allowance. They show where pieces meet.
- **Convention**: one notch at the front, two notches at the back, one notch at the top of the sleeve cap.
- **Placement**: on every long seam, at least every 20 to 30 cm, at changes of shape (hip, knee) and at
  points of ease or gathers.
- **Darts**: notches at each dart leg, and a drill hole 1 cm before the point, inside the dart.
- **Pockets, buttonholes**: drill holes at the corners.

## Grain line

An arrow parallel to the fabric selvedge. Vertical and in the middle of the piece by default.
- Piece on the fold: the fold itself is the grain line.
- Bias: arrow at 45°, for roll collars, bias skirts or piping.

## Annotations

On each piece: name, size, number of pieces to cut, "on fold" when relevant, fabric direction if the fabric
has a nap (velvet, directional print).

## Checks before cutting

1. Edges sewn together have the same length, within the planned ease.
2. Curves continue without an angle once the pieces are joined: neckline and armhole at the shoulder,
   waist line at the side, hem at the side, crotch at the inseam.
3. Darts are "trued": the allowance follows the shape of the closed dart.
4. Notches match from one piece to the other.
5. The test square of the printed SVG measures exactly 10 cm.

## Grading

Grading moves a pattern from one size to another.

- **With the script**: `--sizes` redrafts each size from its standard measurements, then overlays the
  outlines in `pattern.svg`. This measurement-based grading keeps each size's proportions.
- **Usual differences between two neighbouring sizes, women and men**: 4 cm of bust, waist and hip round,
  0.5 cm of back and arm length, 0.3 to 0.5 cm of shoulder length, 0.5 to 1 cm of neck.
- **Manual point grading**: each key point moves by a fixed vector per size, keeping one reference point
  fixed, often center front at the waist. Points at the center move little, those at the side and the
  underarm move most.
- **Children**: grade by height, every length follows the child's height.
- Beyond three or four sizes apart, draft a new block rather than grading.
