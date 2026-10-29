# Transformations

How to go from a block to a design. Transformations are made on the points of the `pieces_<size>.json`
file, before adding seam allowances. After each transformation, run the `piece` command again and compare
the lengths of the edges sewn together.

## Two fundamental techniques

- **Pivot**: part of the pattern turns around a point, usually the dart point. One dart opening closes
  while another opens, by the same angle.
- **Slash and spread**: the pattern is cut along a line, then the pieces are spread to add fullness. The
  spread can be parallel, adding everywhere, or fan-shaped, adding on one side only.

In coordinates, a pivot of angle θ around point P turns each point M into P + rotation(θ) × (M − P). The
script does it with the `pivot` command.

## Script tools

Every command edits a pieces file (in place by default, or to `--output`) and prints the edge lengths.
Node names are those of the file, visible in `pieces_<size>.json`.

**Pivot on a dart**: the dart closes and its value moves into a slash drawn from its point.
- `--direction dx,dy`: slash direction, `0,1` downwards (default), `0,-1` upwards.
- `--to-node NAME`, or `--to-edge N --to-d CM`: exact end of the slash.
- Without `--flare`, the slash becomes a new dart: this is a dart transfer.
- With `--flare`, the slash is filled: fullness is added to the edge, for example at the hem.
- `--fraction 0.5` closes only half of the dart.
- The half of the piece holding the fold stays fixed. Unequal dart legs are trued at their midpoint,
  with a note.

**Pivot on any point**: give `--angle` in degrees to open a slash of free fullness, for example from a
point of the waist towards the hem. The direction that opens the slash is chosen automatically.

**Smooth**: `smooth --from NODE --to NODE` replaces the path between two nodes with a curve leaving and
arriving perpendicular to the neighbouring edges. Do it after each hem flare.

Example, A-line skirt from the block:

```
python scripts/pattern.py block skirt --body women --size 38 --out skirt
python scripts/pattern.py pivot skirt/pieces_38.json --piece "Skirt front" --pivot dart0 --flare
python scripts/pattern.py pivot skirt/pieces_38.json --piece "Skirt front" --pivot dart1 --flare
python scripts/pattern.py smooth skirt/pieces_38.json --piece "Skirt front" --from side_hem --to center_hem
python scripts/pattern.py piece skirt/pieces_38.json --out a_line_skirt
```

Do the same for the back. Closing every dart gives a full A-line.
For a softer flare, close part of each dart with `--fraction`. Dart names depend on the size: read them in
`pieces_<size>.json`.

Example, bust dart transferred from the side to the shoulder:

```
python scripts/pattern.py pivot bodice/pieces_38.json --piece "Bodice front" --pivot side_dart --direction 0,-1
```

## Darts

- **Transfer**: a dart can start from any edge, as long as it points to the same apex (the bust point for
  the front). Draw the new dart line, cut, close the old one by pivoting.
- **Splitting**: a large dart is divided into two smaller ones, easier to sew and softer.
- **Into gathers**: open the dart over the intended length and gather instead of stitching.
- **Dart point**: the point stops 2 to 3 cm before the apex of the curve, 1 to 2 cm for a small bust.
- **Dart end**: before drawing the allowance, close the dart and redraw the edge, so the allowance follows
  the shape once sewn.

## Style lines

- **Princess line**: join the shoulder or armhole dart and the waist dart with a curved seam passing through
  the apex. The two pieces are sewn edge to edge: check they have the same length, within the ease at
  the apex.
- **Yoke**: draw a horizontal line, cut, and transfer the shoulder dart into the yoke seam.
- **Skirt panels**: divide the skirt into 4, 6 or 8 panels, moving the darts into the seams.

## Fullness

- **Gathers**: multiply the length by 1.5 for a thick fabric, 2 for a medium fabric, 2.5 to 3 for a fine one.
- **Flared skirt**: fan-shaped slash and spread from the waist, closing the darts.
- **Circle skirt**: waist radius r = waist / (2π) for a full circle, waist / π for a half circle,
  2 × waist / π for a quarter circle. The hem radius is r plus the length. Bias parts stretch: let the
  skirt hang 24 hours before levelling the hem.
- **Godets**: insert triangles into open seams, rounded top.
- **Pleats**: add twice the pleat depth for each pleat. Box pleats, inverted pleats or knife pleats are
  drafted the same way, only the folding direction changes.

## Necklines and collars

- **Changing the neckline**: redraw the curve keeping a right angle at center front and center back, and
  curves that continue smoothly at the shoulder once front and back are joined.
- **Facing**: copy the edge to face over 4 to 6 cm width, 1 to 2 mm narrower so the seam rolls to the
  inside.
- **Mandarin collar**: rectangle as long as the half neckline, 3 to 4 cm high, top edge slightly
  shortened so it hugs the neck.
- **Shirt collar**: a curved collar stand and a fall collar whose outer edge is longer than the
  attaching edge.
- **Peter Pan collar**: lay front and back with shoulders overlapping by 1 to 2 cm, and draw the collar on
  the neckline. The overlap lifts the collar slightly so it rolls.
- **Notched collar**: lapel obtained by extending the front beyond the roll line, collar attached to the
  back neckline and the lapel notch. It is the most technical transformation: draw the roll line, the
  lapel by symmetry, then the collar.

## Sleeves

- **Short sleeve**: cut the block at the intended length and slightly reduce the hem width.
- **Puff or leg-of-mutton sleeve**: vertical slash and spread in the cap, then cap raised by 2 to 4 cm.
- **Flared sleeve**: fan-shaped slash and spread from the cap downwards.
- **Raglan sleeve**: the seam runs from the neckline to the underarm. Part of the front and back moves to
  the sleeve cap, and the shoulder becomes a dart or a seam.
- **Kimono sleeve**: the sleeve is extended from the body, with an underarm gusset to lift the arm.

## Openings and closures

- **Button extension**: the extension equals the button diameter, added beyond center front.
- **Buttonholes**: length equal to the button diameter plus its thickness. One button at bust level to
  avoid gaping, then even spacing.
- **Zip**: allowance of 1.5 to 2 cm on the seam concerned, notch at the bottom of the opening.

## Pockets

- **Patch pocket**: free shape, 3 cm allowance at the top for the turn-back, 1 cm elsewhere.
- **In-seam pocket, in the side seam**: pocket bag 17 to 20 cm deep, opening 15 to 17 cm.
- **Welt pocket**: opening 12 to 15 cm, welts of 0.5 cm each.

## Lining

Copy the garment pieces, reduce by the facings, and add a 2 cm ease pleat at center back. The lining is
2 to 3 cm shorter at the hem.
