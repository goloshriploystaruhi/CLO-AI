# Garment spec

`python scripts/pattern.py garment spec.json --out folder` drafts a whole garment from the engine's bodice block
with reusable constructions, so a jacket or a coat is a short JSON file, not a script. Every key is optional;
values are in cm. It writes the cut pieces (SVG, DXF, `pieces_<size>.json`), the 3D shell for CLO3D in
`folder/clo3d/` (mirror halves, every seam split one edge to one edge with its ease declared, wrap holds), and
the report. `python scripts/sheet.py folder/pieces_<size>.json` draws PNG sheets (needs Pillow).

Worked specs: `examples/notched-lapel-jacket/` (fitted and oversize), `examples/velvet-coat/`.

| Key | Content | Default |
|---|---|---|
| `title`, `body`, `size`, `measurements` | Body (women, men, children), standard size, or a measurements file as for `block` | women, reference size |
| `fit` | `side_ease` (per quarter at the side seam), `dart_reduce` (waist darts narrower, more waist ease), `neck_widen`, `neck_drop` (front), `arm_drop` (armhole lowered), `across_out` | 1.0, 0, 0, 0, 1.5, 0 |
| `shoulder` | `extend` (shoulder wider), `pad` (tip raised by the pad thickness); the back keeps its shoulder ease | 0, 0 |
| `shaping` | `darts`: side bust dart, fish darts, side seam out to the hip. `boxy`: unfitted, straight side seams, bust dart reduced to `boxy.dart_keep`, the rest as hem shaping. `princess`: armhole princess front and back, side dart turned into the seam, front edge bowed over the bust to match | darts |
| `length` | `below_waist` (along each seam), `hip_ease` (darts), `hem`: full hem circumference for a flared princess (flare solved on every vertical seam, hems trued square) | 23, 6, none |
| `front` | `extension` past the centre front (8 for a 16 cm wrap), `buttons` (heights below the neck point), `hold_to` (end of the fastened part; default last button + 2) | 2 |
| `collar` | `type`: `none`, `stand`, `funnel` (`h_cb`, `h_cf`, `funnel`: top edge longer than the neck edge, whole collar), `notched` (`break`, `stand`, `lapel`, `belly`, `gorge_y`, `gorge_angle`, `notch_lapel`, `notch_collar`, `notch_angle`, `collar_stand`, `collar_fall`, `spring`, `turn_of_cloth`, `facing_turn`) | none |
| `sleeve` | Two-piece: `length`, `hem` width, cap `ease`, `cap_height` (default 5/6 of the armhole depth minus half of `drop`), `drop` (dropped shoulder), `front_in`, `back_out`, `bend`, `elbow` ease, `vent` length | arm length, 28, 2.5 |
| `facing` | `type`: `width` (inner edge `width` from the front edge) or `panel` (whole front panel, the default for princess); `back_neck`: depth of a back neck facing | auto, 10, none |
| `lining` | `hem`: `jump` (sewn to the hem, `up` 1.5) or `free` (hangs `up` 3 above the hem); `cb_pleat` | none |
| `pockets` | `patch` (`w`, `h`, `x`, `y` below the waist, `facing`) or `in-seam` (`top` below the waist, `length`; in the front princess seam or the side seam) | none |
| `allowance`, `hem_allowance` | Seam and hem allowances | 1, 4 |

Rules built in: a princess garment takes the panel facing (a narrower facing leaves a lining strip, caught by the
narrow-passage check); facings declare `within`; linings get 1 cm higher underarm and 0.5 cm side ease; a wrap is
never sewn closed in 3D: the top front's edge is held on an internal line of the under front along the fastened
part, top front on layer 1 (`references/clo3d.md`).

Not covered yet: raglan and kimono sleeves, one-piece sleeves, shirt collars, hoods, welt pockets, trousers and
skirts (use `block` and `piece`).
