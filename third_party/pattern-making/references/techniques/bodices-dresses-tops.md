# Bodices, dresses and tops

How real patterns for bodices, tops, shirts and dresses are drafted: from a fitted block, by measured
steps, never by tracing an outline. Values are cm, on the half pattern (one side of centre) unless
stated. "Typical" means a textbook starting value to confirm on a toile. Pattern lines are stitch lines;
seam allowances are added last (table 0.3). Blocks are in `blocks.md`, ease in `ease.md`, the generic
pivot and spread in `transformations.md`.

Notation: CF/CB centre front/back, NP neck point (neck and shoulder meet), SP shoulder point, BP bust point
(apex), UB underbust line, W/H waist/hip line, AU underarm (armhole bottom), L = length, Bw = bust width
of the block, ease noted a.

## 0. Conventions

### 0.1 Reading a photo

Identify, in this order: (1) where the seams are (waist, under bust, yoke, vertical panels); (2) where the
shape comes from (darts, seams, gathers, stretch); (3) grain (vertical, or bias if folds run diagonally and
the hem is wavy); (4) closure (CB zip, CF buttons, wrap, none = stretch or loose); (5) silhouette ease
(skin-tight with no seams on the bust = knit; visible tension lines = low ease). Count the pieces you can
see, then double them for the back and add facings, bands and linings.

### 0.2 Cut counts

Written as "n pieces, rule": "1 on fold" = one piece placed on a fold (CF or CB); "2" = a mirrored pair;
"1 pair" = left and right, cut as a mirror pair. "Interfacing" counts are separate lines.

### 0.3 Seam allowances (woven, typical)

| Edge | Allowance | Note |
|---|---|---|
| Side, shoulder, princess, yoke | 1.5 | 1 for industrial; 2 to 3 where fit may change |
| Armhole, neckline (faced) | 1 | clip curves |
| Neckline (bound/self-bias) | 0.6 to 1 | 0.6 if bound with 1 cm tape |
| CB zip | 2 | invisible zip 1.5 |
| CF button extension | see 10.4 | |
| Hem, straight | 3 to 4 | |
| Hem, curved/flared | 1 to 1.5 | narrow or rolled |
| Hem, shirt-tail | 0.6 to 1 | double-turned |
| Waist seam | 1.5 | 1 for knit |
| Knit seams | 1 | serged |

## 1. Bodice block variants

All variants share the neck, shoulder and armhole logic of `blocks.md`. Only ease, depth and dart handling
change.

| Variant | Bust ease (full) | Armhole depth | Darts | Shoulder / sleeve | Use |
|---|---|---|---|---|---|
| Women close-fitting, sleeveless | 0 to 6 (typical 4) | block depth minus 1 | bust + waist | narrower neck by 0.5 | fitted dress, shell, strapless base |
| Women close-fitting, with sleeve | 8 (see `ease.md`) | block depth | bust + waist | cap ease 2.5 | blouse, fitted dress |
| Women blouse/shirt | 10 to 14 | block + 1 to 2 | bust only; waist optional | cap ease 1 to 2 | shirt, tunic |
| Men shirt (see 10.1) | 12 to 20 | block + 3 to 4 | none | cap ease 1 to 1.5, cap height 10 to 13 | shirt |
| Knit (stretch) | 0 to -15 % | block depth | none | cap ease 0 | bodycon, t-shirt |
| Children | 8 to 12 | block + 1 | none (girl teens from ~10 y: bust 1 to 2) | cap ease 1 to 1.5 | all |

Women close-fitting block, principle (Aldrich/Armstrong convention):

- Chest line at scye depth; widths from (B + a)/4 at back and front, with the front slightly wider than the
  back at the bust (front gets the bust dart value in length, not width).
- Front neck depth = width + 1; back neck width = front neck width, back depth 2. NP height must match so
  the shoulders join.
- Shoulder: front slope 5, back 4; shoulder length front = back minus the back shoulder ease (0.5 to 1).
- Waist suppression = (B + a) - (W + a_w), shared across side seams, darts, princess seams. Typical share
  per half bodice: side 25 to 40 % (max 2.5 cm), front dart 30 to 40 %, back dart 30 to 40 %.
- BP at the measured bust-point height and half bust-point separation (typical 9 to 10 cm from CF); the
  block must be adjusted to the individual BP, not the average, before any dart move.

Dart intake by cup (side-dart at the block, typical):

| Cup | A | B | C | D | DD |
|---|---|---|---|---|---|
| Bust dart intake (cm) | 1.5 | 2.5 to 3 | 4 to 4.5 | 5.5 to 6 | 7 to 7.5 |
| Bust dart angle (deg) | 7 | 11 to 13 | 18 to 20 | 24 to 26 | 30 to 32 |

Intake is a function of the difference between the front and back chest-to-bust values of the person. If
the measured front bust minus back bust is known, intake = 2 x that difference (full bust to half-block).

Men shirt block: see 10.1. Children: see 11.5 (grading and growth).

## 2. Dart manipulation

### 2.1 Principle and maths

A dart is a wedge that moves fullness from one edge to the shaping point (BP or scapula). Every dart that
points at the same apex has the same angle theta. Intake at distance L from the apex:

    theta = 2 * asin(w / (2 L))             (w intake, L dart leg length on the pattern)
    w' = 2 * L' * sin(theta / 2)             (new intake at a new edge, leg length L')
    small angles: w' = w * L' / L

So moving a 3 cm dart from a point 10 cm from the apex to an edge 14 cm from the apex gives about 4.2 cm.
Dart legs must be equal length. When the apex is not on the edge, the dart stops short of the apex (see
2.4).

Pivot method: trace the block, mark BP and all dart legs. Draw the new dart line from the edge to BP. Cut
it from the edge to BP (stay 1 mm from BP). Close the old dart: the cut opens by the same angle. Re-trace,
redraw edges smoothly, true the dart legs.

### 2.2 Every position

| Position | Where it starts | Dart length | Typical use | Notes |
|---|---|---|---|---|
| Side (mid-side) | side seam, 5 to 7 cm below AU | to BP minus 2.5 to 3 | block, shirt | the default storage for block |
| Side low / French | side seam, 4 to 6 cm above W, angled up | to BP minus 3 to 4 | sheath, blouse, 1940s lines | long diagonal; hides in side |
| Waist (bust to waist) | W at 6 to 8 cm from CF, vertical | to BP minus 3 to 4 | block, jacket | merges with the existing waist dart |
| Centre front | CF at bust level or below, horizontal | to BP minus 2.5 | cowl base, gathered CF, tie fronts | CF cannot be on fold; CF becomes a seam or placket |
| Shoulder | shoulder, 4 to 6 cm from NP, | to BP minus 3 | shirt-dress, gathered shoulder | long dart, usually 12 to 15 cm |
| Neck | neck curve, 3 to 4 cm from NP | to BP minus 3 | tailored top, mandarin | lays flat; may be faired into a gather |
| Armhole | armhole, 6 to 8 cm above AU | to BP minus 2.5 to 3 | sleeveless; raglan blends | cuts on the bias of the armhole |
| Mid-armhole to waist | double dart | as above | princess seam family | see 3 |
| Under bust | UB, horizontal | to BP minus 2 | empire base | seam, not a dart |

### 2.3 Equivalents (dart intake spent another way)

| Equivalent | How | Typical numbers |
|---|---|---|
| Gathers | transfer the dart to the wanted edge, open by w, gather the edge back to the original length | gather zone 5 to 10 cm centred on the dart line; ratio 1.2 to 1.5 for bust gathers |
| Easing | dart intake below 1 cm, ease into a seam | max 1.0 cm per 10 cm of edge in a wool, 0.5 in a cotton |
| Pin tucks / tucks | n tucks replace a dart: tuck depth t = w / (2 n) | tuck 0.3 to 1 cm each, spaced 1 to 2 cm, stitch down to 4 to 8 cm |
| Pleats | like a tuck, folded to the dart side | pleat depth d consumes 2 d; replace dart w by one pleat d = w / 2 |
| Split dart | one large dart becomes two or three parallel darts through the apex or from separate points | no single dart wider than 4 cm |
| Style line (seam) | the dart becomes a seam; see 3 | |
| Yoke | dart closed into a yoke seam; see 3.4 | |
| Dart tuck | stitched short, then released as gathers | length 4 to 6 |
| Stretch | knits close the dart through stretch | up to ~3 cm of dart per 100 % stretch fabrics at bust |

### 2.4 Dart handling rules

- Check side seam length: front side seam (with dart closed) = back side seam. After transfers, the front
  length at the side differs by about dart value x 0.5: true it by pivoting the dart, not by trimming.
- One dart per direction: if more than 4 cm of waist dart is needed, split in two.
- Dart end rule: point at 2.5 to 4 cm from the apex (small bust 1.5 to 2). Waist dart under the bust ends
  3 to 4 cm below BP; waist dart above the bust ends 2.5 cm above BP at UB.
- Press direction: bust and neck darts down, shoulder/armhole darts toward neck, waist darts toward CF.
- Always redraw the edge after closing a dart: the stitch edge must be a smooth curve (hollow darts are
  concave at the edge, convex darts bulge outward).

### 2.5 Waist dart vs darts equivalents at the waist

Waist suppression can be taken by (a) darts, (b) princess seams, (c) side shaping, (d) gathers/elastic,
(e) tucks, (f) release by an empire seam. Do not take more than 2.5 cm at a side seam in a fitted
bodice; beyond that, add a dart or seam.

## 3. Style lines and seams

### 3.1 Princess line (shoulder)

What: a seam from the shoulder over BP to the waist (and hem) that absorbs bust and waist darts. Recognize
by a vertical curve starting at the shoulder, not the armhole.

Pieces: front centre 1 on fold (or 2 if CF seam); front side 2; back centre 1 on fold (or 2); back side 2;
total 8 pieces for a fully princess bodice.

Draft:
1. Pivot the bust dart to the shoulder (2.2) so the apex-aligned dart reaches the shoulder at 4 to 6 cm
   from NP (about 1/3 to 1/2 of the shoulder).
2. Join the dart point (shoulder) to the waist dart point with a smooth line through BP (production
   variant: pass the line 0.5 to 1 cm toward the side of BP so the seam is not on the nipple).
3. Extend the waist dart to a line through the waist to the hem if needed.
4. Cut. The centre piece edge closes the shoulder dart, the side piece closes the waist dart. Redraw the
   curved edges together, keeping seam lengths equal (difference at BP can be 0.3 to 0.5 cm for ease).
5. Mark notches at BP level and at the waist.

Sew: join centre front to side front with the side panel (convex edge) on top; clip the concave edge to
the stitching and press over a ham. Press toward CF.

Faults: seam sits on the nipple (move 1 cm outward); pulling over the bust (too little seam curve, add
0.3 to 0.5 cm to the side piece at BP); gaping at the waist (reduce by 0.3 cm).

### 3.2 Armhole princess

Same as 3.1 but the dart is pivoted to the armhole at 6 to 10 cm above AU (about the front notch). Draw
the line through BP to the waist dart. The armhole seam is cut with the dart on the bias at the armhole,
which opens the armhole slightly: restore 0.5 cm with a sleeve tweak or ease the cap. Used for sleeveless
and cap-sleeve dresses. Pieces as 3.1.

### 3.3 Panel seams

Vertical panels (4 or 6 bodice panels): split a dart as a pair of lines running parallel to CF. Shaping
by taking the suppression equally into every seam. Each panel's width at the bust = (Bw + a) / panels
count + 0.5 cm for the apex area. Cut counts: n panels x 2 (or on fold at CF/CB).

### 3.4 Yoke

What: a horizontal seam across the shoulder area that carries the shoulder dart. Recognize by a seam below
the shoulder line, often with gathers or pleats below.

Draft (front or back):
1. Draw the yoke line parallel to the shoulder and 8 to 12 cm below NP (back: 8 to 10 below CB neck;
   front: above BP, 10 to 13).
2. Pivot the shoulder/neck dart into the yoke seam. For a back yoke on a shirt: close the shoulder dart,
   the intake reappears at the yoke seam: keep 0.6 to 1 cm (shoulder-blade ease) and take the rest
   as a pleat/gather in the lower back (or as a box pleat, 10.3).
3. Add pleat or gather allowance below the yoke line before cutting the yoke.
4. Yoke cut counts: 2 (outer + inner/lining) for the back; front yoke 2 (or none).

Sew: sandwich the body between the two yokes (bagged) or topstitch the lower yoke edge.

### 3.5 Empire line

What: a seam just under the bust, bodice above, skirt below. Recognize by a high horizontal seam and
a loose skirt.

Draft:
1. Draw the empire line horizontal, 3 to 6 cm below BP (or at underbust measure UB + 1).
2. Pivot the bust dart (and waist dart above the line) into the seam: after closing, the empire seam has
   a slight curve; true it.
3. Seam length of the top bodice = underbust + ease (typically + 2 to 4 cm) / 2 per half.
4. Skirt: slash and spread from the empire line to the hem. Skirt top length = seam length (gather ratio
   1 for A-line, 1.3 to 2 for gathered).
5. Cut: bodice 2 (front on fold or pair), skirt panels as per skirt.

Sew: stay the empire seam with 1 cm tape for knits; elastic 1 cm in a casing when gathered.

### 3.6 Combination

Princess + yoke: take the shoulder dart in the yoke and the waist dart in a vertical seam.

## 4. Necklines

Nearly all necklines are redrawn on the block's neck. Rules: keep the NP height, keep the right angle
with CF/CB, keep the neck-shoulder join smooth (join front and back shoulders and check the curve).

| Neckline | How to draft | Gape control |
|---|---|---|
| Jewel / crew | block neckline | none |
| Round / scoop | widen neck point by 0 to 2 cm, lower CF 2 to 10 cm, new curve | remove 0.3 to 0.6 cm at NP per 5 cm of lowering past 4 cm (pivot neckline into bust dart); stay tape |
| V | NP to CF at depth 10 to 25; straight or slightly hollow line | take 0.5 to 1.5 cm out of the V edge by pivoting; stay tape 6 mm |
| Square | vertical from NP at 7 to 9 cm from CF to depth 8 to 15, horizontal across | mitred corner; facing shaped; stay tape |
| Sweetheart | two curves from NP to a CF cusp (depth 6 to 10) with apex of each curve above BP | curve line 1 to 2 cm inside the bust curve for fit; bone at the cusp |
| Boat / bateau | neck point moved out 7 to 10 cm from NP along the shoulder, depth 2 to 4; shoulder stays at least 3 to 4 cm | neckline taken in 1 to 1.5 cm at ends to avoid slipping |
| Halter | remove shoulder; new neck strap from neckline front 7 to 9 cm from CF; armhole cut in 3 to 6 cm at the shoulder, 2 cm at AU | armhole must be raised 1 to 2 cm; fit snug |
| Off-shoulder | top edge crosses the arm 3 to 8 cm below SP (or across at bust); elasticated casing; add width | elastic = across measurement x 0.8 to 0.9 |
| Strapless | see 7 | |
| Keyhole | small opening 2 to 3 wide, 5 to 8 long at neck front | stay-stitch, reinforce corners |

Facings: width 5 to 6 cm; edge 1 to 2 mm smaller than the garment at the seamline so the seam rolls inward.
Interface facings. Bindings: finished 0.8 to 1.2; binding length = neckline x 0.95 for woven, 0.85 for
knit.

## 5. Cowl necks

What: a neckline that drapes in folds, front or back, formed by excess length cut on the bias or from knit.
Recognize by symmetric catenary folds at the neckline and a horizontal ridge.

Pieces: front 1 (cut flat on fold or CF seam), back 1 on fold, front facing (self facing) 1, back facing 1.
Knit: self-lined; woven: lining or facing is essential.

Draft (front cowl, slash method):
1. Decide the cowl depth D (distance from the straight neckline at CF to the lowest fold): shallow 6 to 10,
   medium 12 to 18, deep 20 to 28.
2. Drape test: hold a tape from NP to NP and drop it to the wanted depth; length = T. Each front half
   must carry a neckline edge T / 2 long. Total spread S = T / 2 - L0, where L0 is the current neckline
   half length from NP to CF at the original point.
3. Lower the neckline first: the "base" neckline at CF = D + 3 (the straight neckline from NP to a CF point).
4. Draw three slash lines from the new neckline edge to the shoulder (two) or to mid-armhole (one):
   spacing equal along the neckline.
5. Cut from the neckline to, but not through, the shoulder/armhole. Spread each slash by S / 3 at the
   neckline (typical: 4 to 8 per slash for soft, up to 10 for deep).
6. True CF with the original CF line, redraw the neckline with a smooth curve meeting CF at a right angle.
   The edge of the cowl now extends beyond the original neckline by the spread amount.
7. Cut the facing by folding back the wanted depth (neckline to 6 cm below) so the top edge lies flat.

Back cowl: same with D_back 10 to 25 (backless: spread between back shoulder points). A back cowl needs
a stable CB; a weighted pocket (stitched into the facing) stabilises.

Grain: knit: CF on straight grain fold. Woven: cut on true bias, or grain rotated so CF is at 45 degrees. A
cowl cut on the straight grain will not drape.

Alternative (close dart): close the shoulder or side bust dart; the intake opens along the neckline. Gives a
softer drape on a stretch fabric (Minerva method).

Sew: stay-stitch the neckline, sew shoulders, join facing at the neckline edge only, understitch, hang
before hemming (woven bias).

Faults: cowl collapses (insufficient spread or wrong grain); neckline gapes at NP (pivot out 1 cm); cowl
twists (asymmetric spread, check slash identical).

CLO3D: sew the cowl neckline line to line with the facing, simulation with gravity; a cowl in a knit needs
mesh 8 mm for the folds; set fabric to bias (grain at 45 degrees) in the piece's grain line, not by
rotating the piece.

## 6. Wrap, surplice, plunge, cut-outs

### 6.1 Wrap front (wrap dress)

What: one front crosses over the other and ties or fastens at the side or CF. Recognize by an asymmetric V
and a diagonal overlap at the waist and skirt.

Pieces: front right (overlap) 1; front left (underlap) 1; back 1 on fold; sleeves 2; waist ties 2; neck
facing/bands as needed; skirt with wrap panels. Total ~7 to 10.

Draft:
1. Trace the bodice front full width (not on fold), both halves.
2. Overlap amount O beyond CF at the waist (typical 10 to 18). The wrap edge runs from NP of the overlapping
   side to a point X located O beyond CF (toward the opposite side) at the waist depth D_w.
3. Neckline depth at CF (where the diagonal crosses CF): D_v = D_w x n / (n + O), with n = NP-to-CF
   horizontal distance (typical 7). Example: n = 7, O = 10, D_w = 40 gives D_v = 16.5.
4. The underlap side is the mirror line but ends at the opposite side seam; its edge is hidden.
5. Move the bust dart into the wrap edge (side) or to the waist.
6. Skirt: carry the wrap line straight or flared to the hem; overlap at hem 15 to 25 (walking ease, keep
   closed at rest). Waist tie slot or button at the side.
7. Edge: facing cut along the wrap edge 4 to 5 wide; stay tape 6 mm; hem 1 to 1.5.

Faults: neckline gapes (edge on the bias, stretched): stay tape 0.5 to 1 shorter than the edge; shorten edge
by 1 cm at the V.

### 6.2 Surplice

Both fronts cross at CF forming a V at the neckline, and each front is cut as a full-width piece that
reaches the opposite side seam. Draft: as 6.1 but both fronts are shaped, edge-to-edge sewn into the
shoulder and waist seams. Pieces: front 2 (left, right), back 1 on fold.

### 6.3 Plunge neckline

What: V or U neckline with depth 20 to 35 below NP. Draft as 4 (V) plus a gape fix: before drawing, pivot 1
to 2 cm of the neckline into the bust dart; the plunge edge is then 1 to 2 cm shorter than the front body.
Edge with bias tape or stay tape 1 cm shorter. Optional: a hidden dart or bra-friendly bust band.

### 6.4 Cut-outs

What: an opening inside the garment (keyhole, side, underbust, back). Draft: draw the opening on the block;
keep at least 2 cm of fabric between the opening and any seam; corners rounded (r >= 0.8). Stabilise with
twill tape on the edge (0.6 to 1), or a facing that is a shaped patch. For tension (structured cut-out) the
garment above must be supported by seams or bones; bridge bands should be interfaced.

## 7. Strapless, boned bodice, bustier and corset

### 7.1 Strapless bodice

What: a bodice with no straps held by fit and bones. Recognize by a straight/sweetheart top edge, boning
in seams, a CB zip.

Pieces (6 to 8): front centre 1 on fold or pair, front side 2, side back 2, centre back 2 (zip), lining set,
interlining, waist stay.

Draft:
1. Start from the close-fitting block with a princess seam (3.1) so every seam can carry a bone.
2. Top edge: at the chosen height (above bust 3 to 6, or at upper bust). The edge must be smaller than
   the body by 1 to 2 cm total at the top (a negative top edge keeps it up); at the bust level ease
   0 to 2 cm, at the waist 1 to 2.
3. Straighten the top edge or add the sweetheart (4). Curve CF cusp slightly lower.
4. Bone positions: CF (2 in a cup seam), each princess seam (2), side seam (1), back at both sides of
   the zip (2). Typical 7 to 9 bones in total.
5. Bone channel: 1.2 to 1.5 wide; bone length = seam length - 2.5 to 3.8 (stops at least 1.2 from the top
   and bottom). Round/cap the tips.
6. Add 3 to 4 at the hem if hemmed; if waist-seamed, join to skirt with a stay.

Sew: interface, sew darts/princess seams, press, make channels on seam allowance or applied tape, insert bones,
sew lining, turn, topstitch, insert grip elastic at the top inside (silicone, 1 to 1.5). Waist stay of
2.5 petersham.

Faults: top slides down (reduce top edge 1 cm, add grip elastic); bunching at the waist (reduce the
bodice length at the waist or add a stay); cups collapse (add cup bone or wire).

### 7.2 Corset (waist cinching)

What: a rigid, steel-boned foundation garment with a busk at CF and lacing at CB. Recognize by tight waist
reduction, many vertical seams, lacing.

Drafting rules (reduction):
- Panels per side: 3 (basic) to 8 (sculpted). Panel seams vertical, usually at least 1 per 5 cm of
  circumference at the waist.
- Waist reduction R typical 5 to 10 (for comfort) up to 15 (training). Panel total at waist
  (all panels, both sides) = W - R - G, where G is the lacing gap (2.5 to 5 cm).
- Width per panel at waist: (W - R - G) / (2 n) with n panels per side.
- Hip spring: corset hip circumference = H - 5 to 10 (not smaller than the waist).
- Bust: cup or flat; underbust circumference reduced 5 to 8.
- Height: from the waist, 12 to 17 above (to under the bust) and 8 to 12 below.

Bones: spiral steel at curved seams, flat steel at the busk and lacing; length = channel height - 2.5 to
3.8 in total (1.2 to 1.9 left free at each end); steel boning always 2 per lacing side (flat), 2 on busk (flat).

Layers: fashion fabric, coutil (strength layer), lining; channels between layers or in tape; busk at CF
(~10 to 20 long), eyelets spaced 1.5 to 2 at CB; waist tape 2.5.

Cut counts: for a corset of 8 panels per side: 16 panels in coutil, 16 in lining, 16 fashion, 2 busk strips, 2 lacing
strips.

Sew: sew panels in order (CB piece first), flat-fell or channel seams, insert busk, eyelets, lace.

### 7.3 Bustier and cups

Bustier: corset with cups, usually shorter (under the bust to hip), boned in princess seams, with or
without wires. Cups: shaped by princess seams or curved bust cup seams; bust width at underbust 0 to
-3 ease. A bra-style wire casing is 1 cm wide; wires follow the underbust curve.

## 8. Dresses

### 8.1 Joining bodice and skirt (waist seam)

- Lengths: bodice waist seamline = skirt waist seamline (darts closed on both). Notch CF, CB, side,
  dart positions.
- Darts: align bodice and skirt darts in vertical lines, so the dart continues from bust to hip.
- Waist seam on the natural waist or raised/lowered by the style; do not move it more than 3 cm without
  re-balancing the darts.
- Stabilise the seam with 1 cm stay tape (knit and lightweight woven).
- Waist ease: 2 to 4 (fitted), 6 to 10 (shift/belted).

Pieces: bodice front/back, skirt front/back, facings; total 4 to 8 plus lining.

### 8.2 Sheath dress with fish-eye darts

What: a fitted dress without a waist seam; darts extended through the waist. Recognize by a long dart
at the waist that passes through the waist to the hip, no seam.

Pieces: front 1 on fold, back 2 (zip) or 1 on fold, neck facing, armhole facings (or lining), CB zip.

Draft:
1. Combine bodice and skirt blocks vertically with side seams continuous; align the bodice waist dart with
   the skirt dart.
2. Front fish-eye dart: top point 3 to 4 below BP (or at UB), widest at W, lower point 14 to 20 below W;
   width at W = front waist suppression (typically 2.5 to 4).
3. Back fish-eye dart: top point at 4 to 6 below the chest line (scapula), widest at W, lower point 16 to
   22 below W; width 2 to 3.5.
4. Side suppression: 1 to 2 per side. Add a hip ease 4 to 6.
5. Hem width: reduced 2 to 3 per side from H to knee (pencil) with a slit/vent of 15 to 25 or kick pleat.
6. Hem: 3.5 to 4.

Sew: darts, shoulders, side seams with zip at CB, facings, hem. Stay the neckline.

Faults: pull lines at the dart point (extend dart); bubble at the dart end (blend with a softer curve);
horizontal drag at the hips (add ease 1 to 2 cm).

### 8.3 Shift and A-line dress

What: loose, straight or slightly flared dress with little waist definition. Recognize by absence of waist
seam and ease at waist.

Pieces: front 1 on fold, back 1 on fold or 2 (zip), neck/armhole facings (or lining), pocket bag 4 optional.

Draft:
1. Start from the block with bust ease 8 to 12, hip ease 8 to 12.
2. Move bust dart to the side or French (a shift often keeps a 1.5 to 2 cm dart); remove waist darts or leave 1
   to 1.5 cm.
3. Straighten the side seam from AU to hem; for an A-line add 1.5 to 3 flare at each side at the hem
   (flare angle 2 to 5 degrees) by slash and spread from the hem to the bust.
4. CB zip or loose neck opening; add 5 to 8 at the hem for walking if narrow.
5. Hem 3.5 to 4; hem fall balanced on grain.

Fit faults: bunching under the arm (raise AU 1 cm); dress rides up at the back (shorten front 1 cm, lengthen
back).

### 8.4 Princess dress

Join the princess bodice (3.1/3.2) to a princess skirt (the seam continues to hem). Pieces: front 4, back 4
(plus facings). The seam carries the waist shaping; hips ease 3 to 5. Skirt panels flare 1 to 3 per panel
at the hem.

### 8.5 Slip dress and bias-cut dress

What: a close, light dress cut so the fabric drapes diagonally across the body. Recognize by diagonal
folds, a hem that hangs unevenly, spaghetti straps, a cowl or V bust, no darts.

Pieces: front 1 (CF seam), back 1 (CB seam), 2 straps (bias tubes), facings or self-bias bindings; each
body piece cut single layer or on a fold only if the fold is on a straight grain.

Draft:
1. Start from the block: close all darts at the side (transfer to the side seam) and flare from the bust.
2. Ease: reduce bust ease to 0 to 4 and hip ease to 0 to 6; the garment gains width and loses length on the
   bias.
3. Mark the grain line at 45 degrees to CF (bias). The CF/CB seams are on the true bias; the side seams
   run near the straight grain (little stretch).
4. Add a hem sweep of 15 to 25 per half (full circumference ~ 120 to 160).
5. Add a drop allowance: extra length of 2 to 5 % of the dress length at the CF/CB bias hem; the straight-
   grain side drops least.
6. Straps: bias strips 3 to 3.5 wide, finished 0.6 to 0.8 tube; length = measured shoulder strap
   + 2 for adjustment.

Sew: stay-stitch the neckline and hem 0.5 from the edge; let the fabric relax 24 h after cutting; French
seams or 6 mm seams; neckline faced or bound; hang the finished dress 24 h, level the hem, then narrow-hem
(rolled 3 to 5 or 0.6 turned).

Faults: uneven hem (always); stretched neckline (stay tape); sagging seams (do not hang by the straps
in construction).

CLO3D: set fabric grain at 45 degrees; the stretch of a bias silk is high, simulate 24 hours worth of
relaxation by running a longer simulation; the hem can be levelled only after simulation. Mesh 8 mm for the folds;
collision thickness 0.

### 8.6 Shirt dress

Shirt block (10.1 or 10.2) extended: length to knee or midi, with a CF button placket to hem. Pieces: front
2 (pair, with plackets), back 1 on fold with yoke 2, sleeves 2, cuffs 4, collar 2 and stand 2, pockets 1 to 2,
belt 1. Waist: add waist suppression with side shaping 2 to 3 per side and back darts or a belt. Skirt
flare as A-line (8.3) with side seam 2 to 4. Add 15 to 20 wrap at the hem for walking when long.

### 8.7 Empire dress

3.5 plus skirt: the empire seam under the bust, skirt gathered or A-line. Skirt length measured from the
empire line; hem width 2 to 3 times the seam length for gathered.

### 8.8 Tiered dress

What: a skirt made of gathered tiers, each wider than the one above. Recognize by horizontal seams with
gathers.

Pieces: bodice as chosen; tiers 3 to 5, each cut as a rectangle (width x height), with gather ratio.

Draft:
1. Tier 1 width at its top = waist seam length (or bodice hip). Tier width at its bottom = top width x r.
2. Next tier top = bottom of tier above (gathered onto it); width = previous bottom x r. Typical r 1.5 for
   voluminous, 1.3 for light.
3. Tier heights: tiers get taller toward the hem (e.g. 0.25, 0.32, 0.43 of skirt length), because
   each tier appears shorter when gathered.
4. Check yardage: total width of the lowest tier may exceed fabric width: split into 2 to 3 panels.

Sew: gather each tier at 2 rows of stitching (3.5 length) or ruffler; join top to bottom of tier above;
overlock or French seams; finish the hem 1 cm.

### 8.9 Maxi dress

Long dress, hem at ankle or floor. Hem width for walking: unvented straight 100 to 110 minimum; vent 20 to
35 for narrower; A-line skirts need no vent. Floor length measured barefoot and add shoe allowance
(heel height). Hem finishing: 1.5 to 3 (rolled for chiffon). Weight and bias: longer hems drop more (3 to 5 %).

### 8.10 Bodycon dress (knit)

What: a fitted, stretch-fabric dress with negative ease. Recognize by a tight shape, few seams, no darts.

Pieces: front 1 on fold, back 1 on fold, neck binding/lining, sleeves if any; optional side seams.

Draft:
1. Measure the fabric stretch (`ease.md`): 4-way or 2-way; stretch >= 40 % required.
2. Ease: -5 % to -15 % of the body circumference at each level; vertically 0 to -2 %.
3. No darts: all dart value is removed; the bust is shaped by negative ease and side seam shaping.
4. Waist shaping at the side: remove (circumference at bust - circumference at waist) / 2 x (1 - neg%).
5. Hem length: add 1 for recovery; hem allowance 2.
6. Neck: knit binding length = neckline length x 0.85.

Sew: ballpoint needle, narrow zigzag or stretch stitch, serger 1 cm, clear elastic 6 in shoulder seams,
twin needle or coverstitch hem. Do not stretch while sewing.

Faults: drag at the bust (not enough length, add 1 to 2 over the bust); wrinkles at the back waist (back too
long, shorten 1 to 2); roll at the hem (heavier hem, interfacing).

CLO3D: mesh 8 mm for fitted knit, collision thickness 0; assign real stretch fabric parameters; check the
stress map at the bust and hips.

## 9. Tops

### 9.1 Basic blouse / shell top

Blouse: block with bust ease 10 to 14, set-in sleeves or sleeveless, CF opening, hem curve. Shell: a
sleeveless fitted top with raised armhole and lower neckline.

Pieces: front 1 on fold or pair, back 1 on fold or pair, sleeves 2, neck facing 1 pair, armhole facing 1
pair or bias binding; cuffs optional.

Draft:
1. Start from the close-fitting block; bust dart to the side or French; waist dart as needed.
2. Length: 5 to 7 below W for hip-skimming, 20 for hip length.
3. Hem: straight or with shirt-tail curve (10.5); side slit 5 to 8 for hip ease.
4. Shell: lower the neckline 1 to 3, raise AU by 1 to 2 (armhole depth block minus 1), narrow the shoulder by
   1.5 and cut the armhole in by 1 at the shoulder.
5. Facing or bias binding.

Sew: darts, shoulders, side seams, neck facing, armhole facing, hem.

### 9.2 Peplum

What: a flared skirt-like panel at the waist of a bodice. Recognize by a waist seam with a flare below.

Pieces: bodice as chosen; peplum 2 or 4 (CF/CB seams optional), waist stay.

Draft:
1. Waist seam length Lw (finished, bodice with ease).
2. Fullness: full circle r = Lw / (2 pi); half circle r = Lw / pi; quarter circle r = 2 Lw / pi; for a
   fraction f of a circle: r = Lw / (2 pi f).
3. Peplum length ell, hem radius R = r + ell; outer arc = 2 pi f R.
4. Alternatively, rectangular peplum with gather: width = Lw x 1.5 to 2.5.
5. For a slash-and-spread peplum, start from the bodice's lower edge: 6 to 8 slashes, spread each so the
   total hem width = Lw x ratio.

Sew: join peplum to the bodice at the waist seam with a stay; hem rolled or narrow 0.6 to 1.

### 9.3 Camisole

What: a sleeveless top with spaghetti straps. Recognize by thin straps, a straight or bust-curve top edge, a
straight hem.

Pieces: front 1 on fold, back 1 on fold (or 2 + elastic), straps 2 bias, lace trim optional.

Draft:
1. Start from the sleeveless block with ease 6 to 10.
2. Top edge: curve from AU upward; at the front the top edge is 3 to 6 above BP; at the back 5 to 8 below the neck.
3. Strap: width 1.5 to 2 finished 0.5 to 0.8; length shoulder + adjustment.
4. Bust: gather or small dart (1.5 to 2) at the top edge; or princess seam.
5. Hem: straight with 1 cm narrow hem.

Sew: bias binding or lace on edges, straps with ring and slider (optional), hem.

### 9.4 Tunic

Long shirt-like top, length 20 to 30 below H, side vents 10 to 15, ease 12 to 18 at bust, 14 to 20 at hip.
Draft: block with no waist dart, straight side seam flared 2 to 3 at the hem, neckline with placket
(10.4) or round neck with facing, sleeves in the block.

### 9.5 Crop top

What: a short top, ending between under the bust and above the waist. Recognize by an exposed midriff.

Draft: shorten the block at the wanted height; if it ends at the underbust, UB seam length = underbust + a
(0 to 3). A cropped hem at the natural waist leaves the waist dart; a hem at the underbust needs the dart
closed and replaced by ease. Hem: elastic or band for a fitted crop. For a boxy crop, keep ease 10 to 18
and drop the shoulder (9.6).

### 9.6 Oversized and drop-shoulder block

What: a block with extra width, extended shoulders and a lowered armhole. Recognize by sleeves attached
below the shoulder point, a wide body and a low underarm.

Pieces: front 1 on fold, back 1 on fold, sleeves 2, neck rib or facing.

Draft:
1. Ease at the chest: 20 to 40 (full).
2. Shoulder drop d (typical 3 to 8): extend the shoulder line past SP by d, keeping its slope or reducing
   the slope by 1 to 2 for a flatter line.
3. Lower the underarm: armhole depth + 0.8 to 1.2 x d, or more for deep (8 to 14).
4. Sleeve: cap height reduced to 5 to 10, sleeve width increased to the armhole depth x 2, sleeve
   length reduced by d. Armhole measured along the curve; sleeve cap ease 0 to 1.
5. Side seam straight; hem straight with 8 to 12 hem band for a boxy body.

Check: armhole length front + back vs sleeve cap; arm lift is restricted by a low armhole, so keep the
sleeve under-arm angle at 60 to 75 degrees for movement.

## 10. Shirts

### 10.1 Men shirt block

Draft (typical, ease and numbers from Aldrich-type menswear shirt blocks; confirm on a toile):
1. Chest width: (B + a) / 4 per half, a = 16 to 20 for a regular shirt, 8 to 12 for slim.
2. Neck: width = neck / 5 - 0.5 (compare textbook value), depth front = width + 1.5; back 2.
3. Armhole depth: scye depth + 3 to 4.
4. Shoulder: slope 5 front/back, length set by the across-back width and slope; front shoulder 0.5 to 1 shorter than the back (back ease goes into the yoke seam).
5. Front armhole: through the point at (B/3 + 4.5) of the front chest line (textbook value) and 3 up from
   it; back armhole through the across-back line, ending flat at AU.
6. Back yoke: line 8 to 10 below CB neck; for a pleat, add 2 x D at CB.
7. Hem: shirt-tail (10.5) or straight; shirt length = back length + 20 to 30 (below H).
8. Sleeve: cap height 10 to 13; cap length = armhole + 1 to 1.5 ease; sleeve width (bicep) = arm + 12 to 16.
9. Cuff: wrist + 2 to 3 ease + 2.5 overlap, width 6 to 7 finished.

Pieces (men shirt): front 2 (pair, with placket), back 1 on fold, yoke 2 (outer + inner), sleeves 2, cuffs 4
(2 outer + 2 inner, interfaced), collar 2 (upper + under) + 1 stand 2, interfacing for collar stand, collar,
cuffs, front band. Total about 15 pieces plus 2 front plackets and 2 sleeve plackets.

Sew order: (1) interface collar, stand, cuffs; (2) make collar; (3) make cuffs; (4) sleeve placket and
cuff attach later; (5) join yoke to back (bagged: attach outer yoke to back, inner yoke on top, flip);
(6) join front to yoke; (7) set sleeves flat; (8) close side and underarm seams in one run; (9) attach
collar stand; (10) hem the shirt; (11) buttons and buttonholes.

### 10.2 Women shirt

Women shirt = blouse block + darts. Front: bust dart to the side seam (or French dart), waist darts or
princess seams; Women: right front laps over left, buttonholes on the right front. Men: left front laps over right,
buttonholes on the left front. Fit: bust ease 10 to 14, waist ease 6 to 12. Collar is similar to the men one
(10.6), smaller.

### 10.3 Box pleat and yoke

Back box pleat at CB (on the yoke): add 2D to the half back at CB (D = fold depth, typical 1.5; face width
= 2D, total fabric 4D). Fold toward CB. Stitch the pleat to the yoke line 2 to 3 cm, press. Shirt yoke: two
pieces (outer, inner), shoulder seams sewn first, then body.

### 10.4 Plackets and button stands

| Type | Finished | Pattern |
|---|---|---|
| Grown-on (self) placket | 3 to 3.5 | add 1.5 beyond CF as button stand, 3.5 as facing (turn-under 1) |
| Applied placket (separate band) | 3 to 3.5 | band 7 to 8 cut wide, folded; edge 1.5 from CF |
| Concealed (fly) | 3 | extra 3 to 4 strip, buttons hidden |
| Sleeve placket (continuous lap) | width 1 to 1.5 | strip of 3 x 12 to 15; slit 10 to 12 |

Rule: button stand width = button diameter + 0.6 to 1.0; buttonhole length = diameter + thickness; first
button at neck stand (1.5 below neck edge), second at 7 to 8, then every 8 to 10; button at bust.

### 10.5 Shirt-tail hem

Hem curve: rises at side seam by 8 to 12 relative to CF/CB. Draw a smooth curve from CF through the side
seam point to CB. Hem 0.6 to 1 double-turned, pressed over a template. Side vents 5 to 8 to relieve the
curve.

### 10.6 Collar and stand reference

| Part | Formula (typical) |
|---|---|
| Neck measure | neck circumference N; band length = N + 1.5 to 2 (overlap included) |
| Stand (band) height | 3 to 3.5 at CB, tapering to 2.5 to 3 at the front end |
| Band end | button overlap 1.5 to 2 beyond CF |
| Collar fall height | CB 4.5 to 5.0 (stand + 1.5); point 7.0 to 8.0 (classic) |
| Collar fall length | band length - overlap; outer edge longer by 1 |
| Collar point spread | 80 to 90 degrees (spread) or 60 (point) |

Draft: curve the band's top edge so it hugs the neck; curve the collar's attach edge in the opposite direction.
The collar roll line sits 0.8 to 1 below the band top. Interface the stand and collar; topstitch 0.6.

### 10.7 Cuff and sleeve placket

Cuff: length = wrist + 2 to 3 (ease) + 2.5 (overlap); width 6 to 7; button at 1.5 from the edge. Sleeve placket:
continuous lap or tower placket; slit length 10 to 12; pleats or darts (2 pleats of 1.5 each) distribute sleeve
hem to the cuff.

## 11. Fit faults, children and sewing summary

### 11.1 Bodice fit faults and pattern fixes

| Fault | Cause | Pattern fix |
|---|---|---|
| Horizontal drag across the bust | front too short/narrow | add length (1 to 2) above the bust; widen bust |
| Diagonal drag from bust to side | dart too small, BP too high/low | increase dart; move BP |
| Excess under the bust | dart too long or front too long | shorten dart 1 cm; shorten front length |
| Neckline gape (front) | neckline too long, BP too far | pivot 0.5 to 1.5 cm to the dart; stay tape |
| Neckline gape (back) | back neck too wide | narrow neck 0.5 to 1; add CB neck dart |
| Gaping armhole | armhole too long/open | pivot 0.5 to 1 to armhole dart; raise 0.5 |
| Shoulder drags/pulls | shoulder too long/sloped | shorten shoulder; adjust slope 0.5 to 1 |
| Tight armhole | AU too high or narrow | lower AU 1 to 1.5; widen 0.5 |
| Side seams swing forward | front too wide or back too narrow | shift side seam back 1; balance widths |
| Strap slides | neck width too wide | move strap 1 to 2 inward |
| Waist wrinkle | waist too long/short | adjust length at the waist line |
| Sleeve twist | sleeve cap mismatched | rotate cap 1 to 2 forward; adjust balance marks |

### 11.2 Dress fit faults

| Fault | Fix |
|---|---|
| Hip drag | add 1 to 2 at hip, slash from the side |
| Skirt rides up | add hem or more ease at H |
| Waist seam not level | check bodice length front/back |
| Hem uneven (bias) | hang and level; account for drop |
| Fish-eye bubble | extend dart tip, blend |

### 11.3 CLO3D checks (all garments)

- Sew seams line to line, not point to point; check seam length differences with the seam-length
  tool.
- Mesh size 8 mm for fitted knits and small pieces; default 20 mm is too coarse for close-fitting
  bodices and corsets.
- Collision thickness 0 (added); fabrics already have thickness.
- Boning: represent with Internal Lines + stiff strip or a separate fabric; check bone length.
- Strapless: ensure the top edge sits on the avatar; if it falls, the pattern is too large.
- Bias garments: set grain to 45 degrees; hem drop must be tested by longer simulation.
- Place on the avatar before simulation; capture the 2D view before and after.

### 11.4 Sewing order summary (woven bodice)

(1) interface; (2) darts/princess seams; (3) shoulders; (4) neck facing; (5) armhole facing or sleeves;
(6) side seams; (7) waist seam; (8) zip; (9) hem; (10) buttons. Press at each stage.

### 11.5 Children

Use a block with no darts, ease 8 to 12 at the chest, neck width = neck / 5 (+0.5 for toddlers), front
depth = width + 1.5. Hem allowance 4 to 6 for growth. Armhole slightly lower (+1). Openings: CB or shoulder
envelope neck (overlap 2.5) for babies. Check safety: no strings at the neck for children under 7 (EN 14682).
Grade by age size using standard charts (EN 13402/ISO 8559); never scale proportionally from the adult block.

## Sources

Consulted online (limited detail; numbers marked typical come from the textbook conventions below, not re-verified
page by page):

- Dresspatternmaking, "Ease in the bodice: Aldrich" (https://dresspatternmaking.com/patternmaking-basics/analyzing-other-block-making-intro/ease-in-the-bodice-aldrich): Aldrich size 10 ease analysis.
- Threads, "How to create a draped cowl neckline" (https://www.threadsmagazine.com/2013/11/18/how-to-create-a-draped-cowl-neckline): drape-tape depth method.
- Lovenotions, "How to modify a cowl neckline" (https://www.lovenotions.com/how-to-modify-a-cowl-neckline): slash and spread, facing.
- University of Fashion, pivot lessons (https://www.universityoffashion.com/lessons/pivot-front-shoulder-dart-to-armhole-dart/): dart pivot.
- Fashion English textbook, "Part 4 The Classic Shirt Block" (https://isafe.qq.com/read/1032011545/18): shirt block formulas (neck/5 - 0.5, 1/3 chest + 4.5, button stand 1.5, facing 3.5).
- True Bias, "Ogden cami bias slip dress tutorial" (https://truebias.com/blogs/blog/ogden-cami-bias-slip-dress-tutorial): hanging a bias hem 24 h, stay-stitching.
- FreeSewing, "Cathrin corset" (https://docs.freesewing.org/docs/designs/cathrin): reduction and panel parameters.
- Pattern-cutting course notes on corsets (https://deofsf.com/13-Corsets/09-Corsets-Week-Five.html): boning channels.

Textbooks used as convention reference (not accessible online; values reproduced from standard practice and to be confirmed on a toile):
Winifred Aldrich, Metric Pattern Cutting for Women's Wear; Metric Pattern Cutting for Menswear; Metric Pattern
Cutting for Children's Wear; Helen Joseph Armstrong, Patternmaking for Fashion Design; Müller & Sohn
(M. Müller, System Müller Schnittkonstruktion); Esmod and Bunka course conventions.
