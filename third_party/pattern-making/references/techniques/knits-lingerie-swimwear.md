# Knits, lingerie, swimwear and activewear

Stretch garments are drafted smaller than the body and held in shape by the fabric. Everything below
is metric. Values marked "typical" are working starting points from published pattern-making practice
(Aldrich, Cole, Armstrong, Müller & Sohn, Bare Essentials and the Porcelynne method, industry elastic
practice). Sources disagree on several numbers; the disagreement is stated where it matters. A
stretch pattern is never final before a toile in the real fabric, so every table is a first cut to be
verified, not a law.

Conventions: `S` = fabric stretch as a fraction (0.5 = 50 %). `W` = width (course) direction,
`L` = length (wale) direction. "Full round" = full circumference. Pattern pieces are given as half or
quarter only where stated.

---

## 1. Measuring stretch and classifying fabric

### 1.1 Stretch test (do it in both directions)

1. Fold or cut a swatch at least 20 cm wide, grain straight, no selvedge.
2. Mark 10 cm on the swatch (more reliable: 20 cm; use 10 cm for small swatches).
3. Hold one mark, stretch by hand to the comfortable maximum: the point where the knit structure opens
   and the fabric begins to resist hard or distort. Do not force it.
4. Read the length `L1` reached.
5. Stretch % = (L1 - L0) / L0 x 100. Example: 10 cm reaches 15 cm = 50 %.
6. Release and wait 1 minute. Measure again: recovery should be back to within 2 % of L0. If the
   marked length stays more than 5 % longer, the fabric has poor recovery: do not use it for fitted
   garments, bands or elastics, or add a 15 % margin to the reduction.
7. Repeat across the width (course, W) and along the length (wale, L). Record both: `S_w` and `S_l`.
   Jersey is typically stretchier in W than L.
8. Fabrics advertising "4-way stretch" may have `S_w` and `S_l` within 10 points of each other; "2-way"
   has `S_l` below 10 %.

Rule: measure on the fabric as it will be sewn (washed and pre-shrunk). Hand stretch at 100 % can
exceed the test force of a tester machine; use the same hand-stretch every time.

### 1.2 Fabric categories (typical)

| Category | Stretch W | Examples | Fit use |
|---|---|---|---|
| Stable knit | 18 to 25 % | Ponte, double knit, scuba, interlock, heavy sweatshirt loopback | Ease-fit and skim-fit garments; darts can stay |
| Moderate stretch | 26 to 50 % | Cotton jersey (with a little elastane), viscose jersey, single jersey 100 % cotton is lower (about 25 to 35 %) | T-shirts, dresses, close-fit tops |
| High stretch | 51 to 75 % | Jersey with 3 to 5 % elastane, modal-elastane, light sweater knit | Body-skimming, bodycon, leggings |
| Super stretch | 76 to 100 % | Rib with 5 % elastane, swimwear Lycra (nylon 80 / elastane 20), power mesh | Swimwear, active, lingerie, compression |
| Rib (as band) | 80 to 150 % | 1x1 or 2x2 rib, rib with elastane | Neckbands, cuffs, hem bands |

Fabric categories follow the width stretch. If `S_l` is less than half of `S_w`, treat the vertical
direction as a lower category (see 2.2).

### 1.3 How much of the stretch to use

A garment can use only part of the fabric's stretch at rest; the rest is kept for movement. Let
`u` = fraction of stretch used when the garment is worn still:

- `u` about 0.0 to 0.1 of the available stretch: relaxed fit, no reduction (positive ease).
- `u` 0.1 to 0.25: body-skimming; typical for t-shirts in moderate jersey.
- `u` 0.25 to 0.5: close fit, leggings, swimwear, bodycon.
- `u` above 0.5: compression. Reaches the stretch limit when the body moves; it fatigues and fails.

Never design above `u` = 0.5 of the fabric's measured stretch at any body location except where the
body part is rigid (waist band, compression area on purpose).

Pattern reduction at a body location: `R = (S x u) / (1 + S x u)`.
Pattern width = body measurement x (1 - R), before any ease added.

| S (measured) | u 0.15 | u 0.25 | u 0.40 | u 0.50 |
|---|---|---|---|---|
| 0.25 | 3.6 % | 5.9 % | 9.1 % | 11.1 % |
| 0.50 | 7.0 % | 11.1 % | 16.7 % | 20.0 % |
| 0.75 | 10.1 % | 15.8 % | 23.1 % | 27.3 % |
| 1.00 | 13.0 % | 20.0 % | 28.6 % | 33.3 % |

This is the mechanical model. Published block methods use smaller reductions on the body (see 2.2)
because they keep wearing ease at points where the body bends (bust, seat). Use the published
percentages for blocks and the table above only to check that a design does not stretch the cloth
beyond its limit.

---

## 2. Knit blocks

### 2.1 Two ways to get a knit block

A. **Reduce a woven block.** Start from the woven block with ease. Remove darts and ease, then reduce
   by the percentages below. Quick, and fits the person's existing block shapes.
B. **Draft directly on the body.** Use body measurements with no ease and apply the reduction to the
   measurements, then draft the usual block lines. Preferred for stretch fabric above 50 %, because
   woven ease and darts are not recoverable accurately by reducing.

Both end in the same checks: (1) the girth at each key line matches the target; (2) the armhole and
shoulder lengths match, minus the reductions; (3) the neck and sleeve edges lengths are known for
bands.

### 2.2 Reduction percentages (typical)

Horizontal reduction, applied to the body measurement in direct drafting (no ease added):

| Fabric category | Reduction on body width | Resulting fit |
|---|---|---|
| Stable knit (18 to 25 %) | 0 to 2 % | Fits body measurements; some wearing ease kept at the bust |
| Moderate (26 to 50 %) | 3 % | Skim to close |
| High (51 to 75 %) | 5 % | Close, slight negative ease |
| Super (76 to 100 %) | 10 % | Strong negative ease (bodycon, light compression) |

These figures are from published knit-block practice (dresspatternmaking.com table; Cole's method
gives similar steps) and are applied to the **body measurement**, not to a woven block with ease. Other
authors use larger reductions on top of a woven block. If you reduce a woven block instead, the
required reduction is larger because the block contains its own ease. Compute it by the girth:

`block reduction % = (block girth - target girth) / block girth x 100`, with
`target girth = body girth x (1 - R_category)`.

Vertical reduction, applied to lengths (CB length, torso length, side seam, sleeve length):

| Fabric | L stretch | Vertical reduction |
|---|---|---|
| T-shirt jersey, hangs free | any | 0 % (let it hang and relax; add 1 to 2 cm at hem for drop) |
| Close-fit top, 4-way | 30 to 50 % | 0 to 2 % |
| Bodysuit, one-piece, leggings | 40 to 60 % | 3 to 5 % (rise, inseam, torso length) |
| Swimwear and compression | 50 to 100 % | 5 to 10 % |
| 2-way fabric (L less than 10 %) | under 10 % | 0 %; never reduce |

Rule: never reduce more than half of the measured `S_l` in a direction that is anchored by gravity or
by a seam under tension (shoulder, crotch). Torso length of bodysuits depends on the sum of two
verticals (shoulder to crotch front plus back); small percentages add up (see 5.8).

### 2.3 Where to take the reduction

Reduction is not taken only at the side seam:

- Divide by 4 for a quarter. Remove half at the side seam of front and half of the back's share, or
  split between side seam and centre seams when there is a CB/CF seam (bodysuits, leggings).
- Keep the **shoulder length** unchanged at the neck, but reduce 0.5 to 1 cm at the armhole end if the
  reduction is 5 % or more (the shoulder tip pulls inwards on a close fit).
- The **armhole**: raise the underarm point by 1 to 2 cm for close fit, reduce armhole depth
  accordingly; keep armhole girth within the sleeve reduction.
- **Sleeve**: remove the cap ease entirely (cap ease = 0), reduce the cap height by 0.5 to 1 cm, reduce
  sleeve width by the same percentage as the body at the upper arm (typically 3 to 5 %), and reduce the
  wrist by the same percentage as the body at the wrist; the cuff covers the rest.
- **Neckline**: widen by 0.5 to 1 cm and drop by 0.5 to 1 cm when the neck is finished with a band, so
  the neck edge does not pull when the fabric stretches over the shoulders.
- Do not reduce at points where the body is bony or bends without stretch: the neck circumference
  measured to the head-through limit, hand circumference at the cuff opening, the hip girth when the
  waist is covered by a rib band.

### 2.4 Removing darts

On a block with darts:

1. Closed bust dart: close the dart and let the side seam open. The side seam becomes longer than the
   back side seam by the dart width at the side seam. Re-true the length by cutting the excess at the
   side seam hem: never ease a front side seam into a shorter back by more than 1 cm in a knit.
2. If the dart width is more than 3 cm at the side (bust cup C and above), keep a small shaping:
   a. move 1 cm of intake to the **hem** (hem curved down at the side seam by 1 cm); b. or move 1.5 to
   2 cm to a **French dart** that starts 6 to 8 cm above the hem; c. or use a **princess seam**.
3. Waist dart: take the full intake at the side seam for a fitted top (5 to 8 % high stretch, less than
   10 % super stretch); otherwise leave straight.
4. Check that front and back **side seams are equal**; the front bust adds length to the front only in
   woven blocks.
5. For close fit above 50 % stretch, shoulder dart and neckline dart are not used.

### 2.5 The basic knit blocks (drafted directly)

All dimensions in cm; `F` = reduction fraction from 2.2 on the girth; `ease` = positive ease kept
(0 for close fit, 4 to 8 for relaxed).

**T-shirt / fitted top (half blocks)**

| Line | Formula (typical) |
|---|---|
| Width at chest (half) | (bust + ease) x (1 - F) / 2 |
| Width at waist (half) | (waist + ease_w) x (1 - F) / 2; follow chest + 0.5 to 1 cm for a straight tee |
| Width at hip (half) | (hip + ease_h) x (1 - F) / 2 |
| Armhole depth | woven armhole depth minus 1 to 2 cm for close fit |
| Back neck width | neck width of the block (7 to 8 cm) widened by 0.5 |
| Shoulder slope | same as woven |
| Shoulder length | same as woven (unchanged); back = front, no shoulder ease |
| Side seam | equal front and back |
| Hem | straight; 1 cm of drop at the side seam for hang |
| Sleeve cap height | woven cap height minus 1 to 1.5 cm |

**Dress** (bodycon): body block as above plus skirt; join at the waist; or one piece with the side
seam drafted straight from bust to hip. Hem width not narrower than the hip x (1 - R); for a hem
narrower than the knee a back vent of 12 to 20 cm or slit is required, because jersey does not stretch
at the knee under walking pressure.

**Leggings** (see 6.2 for details): half block with hip, thigh, knee, calf, ankle all reduced by
`R`.

### 2.6 Knit seams and sewing basics

| Item | Typical value |
|---|---|
| Seam allowance | 0.7 to 1.0 cm (overlock), 1.0 cm if sewn on a lockstitch and trimmed |
| Hem allowance | 2.0 to 2.5 cm (coverstitch or twin needle), 1.0 cm for a rolled hem |
| Neck allowance | 0.7 cm with band, 1 cm with binding |
| Shoulder stabilisation | 6 to 10 mm clear elastic, twill tape or fusible stay tape in the seam |
| Needle | Ball-point or stretch, 70/10 for fine jersey, 80/12 for heavy |
| Stitch length | 2.5 to 3.5 mm; zigzag 0.5 to 1 mm wide x 2.5 mm long as fallback |
| Differential feed | 1.0 to 1.5 on overlock for stretch, 0.7 to 0.8 to avoid wavy seams on light jersey |
| Thread | Polyester, or textured nylon in the loopers for stretch |

Seam types:

| Seam | Use | Notes |
|---|---|---|
| 4-thread overlock | Standard knit seam | Stretches, trims, finishes in one pass |
| 5-thread safety stitch | Where a seam must hold without ripping (inseam of tights, shoulder, crotch) | Chain + overlock |
| Coverstitch (2-needle, 4-thread) | Hems, bands, topstitching, necklines | Two parallel lines on the face, looper stitch on the back; needle width 3 to 6 mm |
| Twin needle on a domestic machine | Hem substitute | 4 mm stretch twin needle; loosen the top tension; the underside zigzags, giving stretch |
| Flatlock | Activewear seam, bulk reduction | Overlapped seam without bulk; prints visible as ladder on the face |
| Bonded or taped seam | Swimwear, outdoor | Heat-activated tape; no stitches |

Problems and fixes in knit sewing:

- Wavy seams: reduce differential feed pull or presser pressure; stabilise with tape.
- Skipped stitches: switch to ball-point or stretch needle of the right size.
- Tunnelling on the twin-needle hem: loosen the top tension, reduce presser foot pressure, add a fusible
  hem tape.
- Seam breaks on stretching: use a longer, more elastic stitch (overlock or zigzag), polyester thread,
  not cotton.
- Hems flip out: use a heavier fusible stay tape, press before stitching.

---

## 3. Bands, bindings and necklines

### 3.1 Band length ratios

The band is cut shorter than the edge it joins, so it stays flat after stretching and recovery.

`band length (cut) = edge length x ratio + (seam allowances at the band joins)`

Ratios depend on the band's own stretch `S_b`:

`ratio = 1 / (1 + k x S_b)`, with `k` about 0.3 for necklines (low strain), 0.4 for cuffs and hems.

Typical results; sources agree within the ranges, with Chalk & Notch giving 75 % for bands with 75 to
100 % stretch and 85 % for bands with 50 to 75 %, Siemacht 70 to 80 % for rib and 80 to 90 % for
self-fabric bands, Seamwork 70 %:

| Band material | Stretch | Neckline ratio | Cuff / hem band ratio |
|---|---|---|---|
| Self jersey, 40 to 50 % | 40 to 50 % | 85 to 90 % | 80 to 85 % |
| Self jersey, 50 to 75 % | 50 to 75 % | 82 to 87 % | 75 to 80 % |
| Rib 1x1 / 2x2 | 80 to 120 % | 70 to 80 % | 60 to 75 % |
| Rib with elastane | 120 to 150 % | 65 to 75 % | 60 to 70 % |
| Stable knit (ponte) | 18 to 25 % | 95 to 100 % | 90 to 95 % |

Add seam allowance at the join (0.7 to 1.0 cm each side, so +1.4 to 2 cm in a flat-cut band).

Band width: finished width x 2 + 2 seam allowances (for a folded band). Typical finished widths:

| Band | Finished width |
|---|---|
| T-shirt crew neck | 1.2 to 2.0 cm |
| V-neck | 1.2 to 1.5 cm |
| Polo rib collar | 5.5 to 7 cm (folded; see 4.2) |
| Cuff, sweatshirt | 5 to 7 cm |
| Hem band, sweatshirt | 5 to 7 cm |
| Hood front band / casing | 2.5 to 3.5 cm |
| Mock neck | 3 to 4 cm |
| Turtleneck | 8 to 12 cm (folded, double layer) |

The band must **pass over the head** (neck bands) or the **hand** (cuffs) or the **hips** (hem bands).
Check each: `band stretched length = band length x (1 + 0.8 x S_b)` must exceed the body girth to pass
(head-through 56 to 62 cm; hand 20 to 23 cm; hips as pattern). If not, increase the ratio.

### 3.2 Sewing a flat band (open, then join)

1. Cut band to the length from 3.1. Fold in half, wrong sides together, along the length.
2. Join the short ends (1 cm seam) right sides together to make a ring; press the seam open or to
   one side.
3. Fold wrong sides together; mark the ring in four (join, opposite, two quarters), and mark the
   neckline in four (CB, CF, shoulders).
4. Match the marks, right sides together, raw edges level; band on the garment side or on top.
5. Sew with the band face up, stretching the band evenly between marks so it fits the neckline. Use
   an overlock, then press the seam towards the garment.
6. Topstitch with coverstitch or twin needle 0.5 to 0.7 cm from the seam if desired.

### 3.3 Sewing a flat-lay band for a V-neck

Cut as a straight strip, stretch evenly, sew to the V, then mitre at the point: fold the band back on
itself at the V point, stitch a 45 degree seam across the strip, trim. Cut count: one band for the
whole V-neck, or two with a CB join.

### 3.4 Bindings (fold-over finish)

- Cut width = 4 x finished width + 0.5 cm (fold, fold, seam). Typical finished 0.8 to 1.0 cm: cut 3.5
  to 4 cm.
- Cut ratio: 85 to 90 % of the edge for light jersey; 80 to 85 % for tight necklines or armholes of
  swimwear or lingerie.
- Cut on grain (crosswise), preferably the direction with the most stretch.
- Sew in one pass with a folder attachment, or in two passes (sew to the right side, fold over, stitch
  in the ditch or coverstitch).

### 3.5 Cuffs and hem bands

- Cuff cut length = sleeve opening x ratio (60 to 75 % of the hem opening for rib, see 3.1).
- Hem band cut length = body hem width x ratio (70 to 80 % for rib with elastane; 80 to 85 % for rib
  without).
- The garment's edge is wider than the band: it hangs and blouses over the band. If the band must not
  blouse (fitted sweatshirt), use ratios closer to 85 to 90 %.
- The cuff, stretched to 80 % of its stretch capacity, must still pass the hand: `cuff length x (1 + 0.8 x S_b) >= hand girth (20 to 23 cm)`.
- Join the band in a ring; fold in half; mark in quarters; sew to the garment with differential feed
  at 1.0 to 1.2.

### 3.6 Stabilising shoulders and other seams that must not stretch

- Shoulder seam: 6 mm clear elastic, twill tape 6 mm or fusible stay tape, caught in the seam. Cut the
  tape 0.5 cm shorter than the seam to hold it slightly (back shoulder 0.5 cm shorter than front).
- Neck seam when the band is cotton jersey: tape the neck seam (not the band) to stop it growing in wear.
- Armhole seam in a sleeveless top: elastic or tape at 90 to 95 % of the armhole length.
- Waist seam of a knit dress with heavy skirt: 10 mm clear elastic at 95 % of the waist line.
- Kangaroo pocket openings, zip openings and button plackets: fusible interfacing or tricot facing.

---

## 4. Garments

For each garment: what it is, how to recognise it, pieces and cut counts, draft, sewing order, finish,
faults.

### 4.1 T-shirt (crew neck)

**Recognise:** pullover, short or long sleeve, crew neck band 1.2 to 2 cm (visible as a rib or self-fabric
band with a coverstitch line), shoulder seams, side seams, narrow hem with two parallel rows of stitching.

**Pieces (cut counts):** front x1 (on fold), back x1 (on fold), sleeve x2 (mirror), neckband x1,
stay tape for shoulders (optional). Total 5 plus tape.

**Draft:**

1. Draw the block from 2.5 with moderate stretch, F = 3 % on the body or ease 4 to 8 cm full round for a
   relaxed tee.
2. Armhole depth: body armhole depth + 2 to 3 cm for a tee with ease. Sleeve cap height 10 to 13 cm,
   cap ease 0 to 1 cm.
3. Neckline: front depth 7 to 8 cm, back depth 2 cm; neck width 8 to 9 cm half; band opening length
   measured on the neckline curves (front + back) with the tape on edge.
4. Hem allowance 2 cm; sleeve hem allowance 2 cm.
5. Band: length from 3.1 (typical 85 % jersey, 75 % rib), width 2 x 1.5 + 2 x 0.7.

**Sewing order:** stabilise shoulders; sew shoulder seams; sew the band ring; attach the band to the neck;
topstitch the neck; set the sleeves flat (before the side seams); sew side seams and sleeve seams in one
continuous pass; hem.

**Faults and fixes:**

| Fault | Cause | Fix |
|---|---|---|
| Neckline gapes | Band too long or neck too wide | Shorten the band 5 %; reduce the neckline by 1 cm at the shoulder |
| Neckline flips up (wave) | Band too short | Lengthen the band by 3 to 5 % |
| Drag lines from the bust to the underarm | Bust width too small, or armhole too shallow | Add 1 to 2 cm of width at the side seam; lower the underarm 1 cm |
| Shoulder seam rolls forward | No stay tape, shoulder too long | Add tape; move the seam back 1 cm |
| Side seam twists | Fabric not on grain, or front and back unequal | Re-cut on grain; check side seam lengths |

### 4.2 Polo shirt (placket and rib collar)

**Recognise:** short-sleeved knit with a front opening of 10 to 12 cm with 2 or 3 buttons and a collar
of the same knit or a flat-knit collar; ribbed sleeve cuffs on many models.

**Pieces:** front x1 (with centre-front slit marked), back x1, sleeve x2, collar x2 (upper and under;
or flat-knit collar x1 ready-made), placket x1 (or 2 for a pieced placket), cuffs x2 (if rib), neck tape
x1 (for the back neck), interfacing for the placket and collar stand.

**Draft:**

1. Front block as 4.1 but neck drop 8 to 9 cm and CF cut open for the placket: opening length 10 to 12
   cm (adult), 8 to 9 cm (child). Shorter on women's polos (8 to 10 cm).
2. Placket (rectangular strip method): finished width 2.5 to 3 cm; cut width = 2 x finished + 2 x 1 cm; cut
   length = opening + 4 to 6 cm.
3. Collar length: measured neckline length from placket edge to placket edge (laps closed) x 0.97 to
   1.0 (collar is not stretched); collar height 7 to 9 cm total, folded; point shaped 8 to 10 cm long
   for the points; stand 2 to 3 cm.
4. Flat-knit collar: choose width 8 to 10 cm; cut the neckline to fit the collar; the collar length is
   fixed by the supplier's dimension (typically 36 to 42 cm).
5. Cuffs: rib 5 to 6 cm folded, ratio from 3.1.

**Sewing order:** stabilise shoulders; make the placket: slash the opening, sew the placket strip around
the slit, turn, topstitch; lay the right side over left (men's) or reverse (women's); close the bottom of
the placket with a box stitch; sew shoulders; collar attached with the placket closed; sew the sleeves
and cuffs; sew side seams; hem with a vent of 5 to 6 cm at each side.

**Faults and fixes:**

| Fault | Cause | Fix |
|---|---|---|
| Placket twists | Strip off-grain, or strip stretched during sewing | Cut on grain, interface the strip |
| Collar points curl | No collar stays | Add collar stays, or interface the upper collar |
| Collar stands away from the neck | Collar length too long | Cut the collar to 97 % of the measured neckline |
| Button strip bubbles | Ratio too tight in the placket | Do not stretch the placket; fuse it first |

### 4.3 Sweatshirt and hoodie

**Recognise:** loopback or fleece-backed jersey with a rib hem, cuffs and often neck; dropped shoulder
and a boxy or relaxed fit; hoodie has a hood with drawcord and a kangaroo pocket.

**Pieces:**

| Garment | Pieces and counts |
|---|---|
| Sweatshirt | Front x1, back x1, sleeve x2, neck rib x1, hem rib x1, cuff rib x2 |
| Hoodie | Front x1, back x1, sleeve x2, hood x2 (or 3 with centre panel), pocket x1, cuff rib x2, hem rib x1, drawcord x1, eyelets x2, stay tape |

**Draft (relaxed):**

1. Chest ease 12 to 20 cm full round for a relaxed fit; 24 and more for an oversize.
2. Dropped shoulder: shoulder end drops 3 to 7 cm and extends 2 to 6 cm; armhole depth = standard
   armhole depth + 3 to 6 cm; sleeve cap height reduced to 5 to 8 cm (flat cap).
3. Body length: waist to hem 20 to 28 cm below the waist, minus rib height.
4. Hem band: length = body hem width x 0.75 to 0.85 for rib; band height 5 to 7 cm finished.
5. Cuffs: length = sleeve opening x 0.65 to 0.75; height 5 to 7 cm finished.
6. Neck rib: ratio 0.70 to 0.80, width 2 to 3 cm.
7. Hood (two pieces): height 36 to 40 cm; depth (front edge to centre back) 27 to 32 cm; the joining
   seam at the neck equals the total front + back neckline length (measure on the garment: front neck
   curve + back neck curve), plus the front overlap (zero for a zipper, 1 cm for a pull-over). Hood
   front edge radius: slight curve 4 to 6 cm. Add a 2.5 to 3 cm channel allowance for the drawcord
   at the front edge (fold twice); eyelet or buttonhole 4 to 5 cm below the neck line at CF.
8. Kangaroo pocket: width at the top 28 to 36 cm, depth 18 to 22 cm, side openings angled 20 to 30
   degrees; top at 18 to 24 cm below the neckline at CF (above the waist); rib or self-binding on the
   openings (ratio 85 to 90 %); the pocket is stitched to the front along bottom and top edge.

**Sewing order (hoodie):** make the pocket; attach it to the front; stabilise shoulders; sew shoulders;
sew the hood centre seam; sew hood to the neck; bind or channel the front edge; set sleeves flat; sew
the underarm seams; attach the cuffs and the hem rib; thread the drawcord.

**Faults:** hood falls back (too deep or hood lining too wide): reduce the depth by 2 to 3 cm; hem band
flares (ratio too tight): lengthen by 5 %; pocket sags (stitching only at top): stitch around three
sides plus bar tack the corners.

### 4.4 Cardigan

**Recognise:** open front knit with buttons or none; front bands in rib or self-fabric; may have a
shawl or V-neck.

**Pieces:** front x2, back x1, sleeve x2, front band x2 (or one wrap band), neckband x1 (if separate),
pocket x2 (optional), cuffs x2, hem rib x1.

**Draft:**

1. Draw the T-shirt block with CF opened: add the band overlap as an extension at CF: button band width
   2.5 to 3.5 cm (buttons 1.2 to 2 cm).
2. Front band cut length = front edge length x 0.85 to 0.95 (bands that button: 0.90 to 0.95, because
   a tight band ripples); neck included if it is one continuous band: ratio 0.85.
3. Buttonhole side on the right for women and on the left for men; buttonhole spacing = band length / (n)
   with the first at 1.5 cm below the neck; buttonholes horizontal in rib, vertical in a stable knit.
4. Interface the button area.

**Sewing order:** pockets; shoulders (taped); bands to fronts; sleeves; side seams; neck/shawl band;
hem; buttonholes; buttons.

### 4.5 Bodycon dress

**Recognise:** close-fitting, mostly seamless side seam from bust to hem, stretchy fabric with 50 % and
more, often ruching or a cutout.

**Pieces:** front x1 (or 2 with CF seam), back x1 (or 2 with a CB zip-less seam), sleeve x2 (optional),
neckband or lining, hem band.

**Draft:**

1. Direct draft on body measurements with the reduction from 2.2: bust 5 to 10 %, waist 8 to 12 %, hip 8
   to 12 %, depending on fabric (Super 76 to 100 %).
2. Vertical: reduce front length 0 to 3 %; do not reduce the back length (the seat consumes the length).
3. Hem width at least hip x (1 - R) minus 6 to 10 cm when the skirt falls below the knee: add a back
   vent 12 to 20 cm, or reduce the hem sweep gradually from the hip to just above the knee by 2 to 4 cm
   each side.
4. Ruching: add 2 to 3 times the shortened length along the side seam; elastic or tape on the side seam
   with a drawstring; side seam length cut longer by 30 to 50 %.
5. Neckline: lining of the same fabric to avoid see-through; neck binding ratio 85 to 90 %.

**Sewing order:** stabilise the shoulders; sew the side seams on an overlock; attach neck binding; sleeve
or armhole binding; hem on coverstitch.

**Faults:** horizontal drag lines at the hip: the pattern is too small, or no vertical give; increase the
width 1 cm per side; vertical drag lines at the waist: too long, shorten at the waist 1 to 2 cm.

### 4.6 Turtleneck and mock neck

**Recognise:** a tall neck piece folded double (turtleneck, 8 to 12 cm folded) or a short band (mock
neck, 3 to 4 cm).

**Pieces:** front x1, back x1, sleeve x2, neck band x1 (a rectangle, folded), cuffs x2 (optional).

**Draft:**

1. Neckline: keep the T-shirt neckline, or narrow it by 1 to 2 cm at the shoulder and lift by 0.5 to 1 cm.
2. Neck circumference (total of front + back neck curves, measured along the seam line) = `N`.
3. Turtleneck band: finished height `h` (8 to 12 cm folded); cut length = `N x ratio + 2 SA`; cut
   width = `2h + 2 SA`.
   - Ratio: jersey 50 % stretch: 0.90 to 0.95; rib with elastane: 0.85 to 0.90; this is higher than a
     crew neck band (0.75 to 0.85) because the band is wide and must pass over the head.
   - Check: `band length x (1 + 0.8 x S) >= head girth 58 to 62 cm`, otherwise the band will not go
     over the head and must be widened or have a zip.
4. Mock neck: height 3 to 4 cm, ratio 0.85 to 0.90.
5. Wide band should be sewn as a folded double layer, with the raw edges inside; hem allowance of the
   fold is 0 (the fold is the top).

**Sewing:** join the band in a ring (right sides together, 1 cm), fold wrong sides together, match the
quarters, sew to the neckline through all layers, press the seam allowance down, topstitch if wanted.

**Faults:** band collapses (too soft, too wide): interface the band or use rib; neck feels tight when
pulled over the head: lengthen the band by 3 to 5 %; band stands away: shorten the band by 2 to 3 %.

### 4.7 Rib knit tops

**Recognise:** whole garment in rib (visible vertical ribs) with high stretch, in 1x1 or 2x2; looks
like a ribbed t-shirt, strap top or dress.

**Rules:**

- Rib has the highest horizontal stretch: 100 to 150 %, so the pattern reduction on the body is large
  (10 to 15 % at Super), but the vertical stretch is small (10 to 30 %): do not reduce lengths.
- The **natural width of rib** at rest is much less than when worn; the fabric is measured relaxed
  (rib is relaxed on a table, it contracts) and must be measured stretched to the comfortable limit,
  not relaxed.
- Pattern edges: rib frays and curls less than jersey; hem with coverstitch or leave raw if it has
  elastane.
- Hem and neck: bind with self-rib at ratio 0.75 to 0.85, or fold over elastic.

### 4.8 Hem and neck finishes: summary

| Finish | Cut | Stitching | Use |
|---|---|---|---|
| Overlocked hem, turned and coverstitched | 2.0 to 2.5 cm | Coverstitch, 6 mm gauge | T-shirts, dresses |
| Twin needle hem | 2.0 cm | 4 mm stretch twin needle | Domestic machine |
| Rolled hem overlock | 0.5 cm | 3-thread rolled hem | Light jersey, edges of scarves |
| Clean-finished neckband | Per 3.1 | Overlock + topstitch | Crew neck |
| Binding | 4x finished | Folder or two passes | Necklines, armholes, swim |
| Fold-over elastic (FOE) | Edge x 0.85 to 0.9 | Zigzag 3-step | Lingerie, swim |
| Stay tape | Edge x 0.95 | In the seam | Shoulders, necklines |

---

## 5. Lingerie

### 5.1 Bra sizing and the size chart

Measurements:

- **Underbust** (rib cage, snug): determines the band size. Round to the nearest 5 cm for EU sizes
  (65, 70, 75, 80, 85, 90, 95); in the UK/US, the band is the underbust in inches rounded to an even
  number (the "add 4 inches" method is outdated; use the underbust directly, as most modern fitters do).
- **Bust** (over the fullest point, tape level).
- **Cup letter** from the difference `bust - underbust` (EU, typical):

| Difference (cm) | 10 | 12 | 14 | 16 | 18 | 20 | 22 | 24 | 26 |
|---|---|---|---|---|---|---|---|---|---|
| EU cup | AA | A | B | C | D | E | F | G | H |
| UK cup | AA | A | B | C | D | DD | E | F | FF |

Each cup step is about 2 cm of bust girth difference. Sister sizes keep the cup volume: if the band goes
down one size (5 cm), the cup goes up one letter (e.g. 75C = 70D = 80B). The wire width also changes
across sister sizes, so the wire must be re-selected.

Additional measurements for drafting (Porcelynne and Bare Essentials methods use a wire and breast
measurements): breast base width, breast inner curve (from the middle to the apex), breast outer curve
(from the side to the apex), breast depth (projection), bust point to bust point, bust point to centre.
One worked example for a 75B: breast depth 8.5 cm; inner curve 9 cm; outer curve 10 cm.

### 5.2 Underwires

The underwire is selected first. It must follow the breast root (the fold line under the breast) and
fit around, not on, the breast tissue.

Typical underwire curve length ("size" along the wire, not straight): about 17 cm (70A), 18 to 19 cm
(75B), 19.5 to 20.5 cm (80C), 21 to 22 cm (85D), 23 cm (90E). One draft in the literature uses a
196 mm wire for a mid size. Wire widths and shapes vary by manufacturer (a "36 Long" is not a "44
Vertical"); always trace the actual wire. Do not take these numbers from a table: they are for sanity
checks only.

| Wire style | Shape | Use |
|---|---|---|
| Standard | Medium height, medium width | Full cup, three-piece |
| Plunge | Low at the gore, wider | Plunge, balconette |
| Balconette / demi | Low outer, medium height | Balconette |
| Full coverage | High at the outer | Full cup, minimiser |

Wire placement rules:

- The wire centre is a fulcrum: its inner end points to the base of the neck pit; its outer end points
  to the shoulder point (or the armpit crease).
- The wire is sprung: draft it 5 mm open at the lower edge, so that on the body it moves back into place.
- Trace the wire and add 8 mm at each end for the wire channel end (casing) and tip protection; casing
  seam allowance 1.0 to 1.2 cm from the wire.

### 5.3 Bra pieces and their names

| Piece | Description | Cut count |
|---|---|---|
| Cradle | The bottom front part under the cups, joining the gore to the wings; carries the wire | 2 (left and right), with a gore |
| Gore (centre front) | The piece between cups; height 3.5 to 4.5 cm standard; 2.5 to 3 plunge; 5 to 6 full cup | Part of the cradle or separate |
| Wings (side/back band) | The band from the cup side to the hooks | 2 (power net) + 2 (lining) |
| Power bar (side support/sling) | Firmer power-net strip from the lower cup side up to the strap, giving support | 2 |
| Strap extension | Part of the power bar that goes to the strap | included |
| Upper cup | Cup above the horizontal or diagonal seam | 2 |
| Lower cup | Cup below the seam | 2 |
| Cup lining / foam | Interlining of power net or foam | 2 each |
| Elastics | Under-band, top-edge, strap | cut lengths in 5.6 |
| Hook and eye tape | At the CB | 1 pair |
| Underwire channel (casing) | Fabric tube for the wire | 2 |
| Straps | Elastic 10 to 18 mm, adjusted with slider and ring | 2 |

### 5.4 Cup seams, how to recognise them, and when to use them

| Seam | Photo cue | Effect | Typical use |
|---|---|---|---|
| Seamless / moulded | No seams, smooth | Shapes by heat | T-shirt bra |
| Horizontal (2-piece) | One curved seam from side to centre across the cup | Lifts; easy to draft; a fabric with some stretch | Balconette, demi, lace bras |
| Vertical (2-piece) | One seam from the apex down to the wire | Centres and rounds; good for fuller cups | Full cup, minimiser |
| Diagonal | Seam from the outer wire to the neckline at the inner | Lift and cleavage | Plunge |
| Three-piece (Y seam, dream cup) | Two seams: a vertical or diagonal plus a horizontal | Maximum shaping, adjustable volume | Full cup, high support |
| Four-piece | Two vertical and one horizontal | Heavy support | Rare |
| Cradle and band | Cup sits in a separate cradle with its own wire line | Support from the band | Longline, sports |
| Frame | The structure of cradle + wing + power bar + strap | Support system | Support bras |

Shape rule: in a cup, **the volume is the projection**, and it is put into the seam lengths:

- The wire line (lower cup edge) must equal the wire length plus 1 to 1.5 cm of seam allowance
  at the ends; if shorter, the cup stretches over the wire.
- The horizontal seam: the lower cup top edge must equal the upper cup lower edge, a convex curve
  on the lower cup, 3 to 10 mm of curve depth.
- The apex (centre of the cup) is placed above the bust point, about 1 cm up from the line of the
  nipple for the average size.

### 5.5 Drafting a bra (steps)

1. Take the measurements: underbust, bust, breast base (the wire), breast depth, inner and outer curve.
2. Choose the wire (5.2) and trace it. Rotate the trace by the wire's spring: 5 mm opening at the bottom.
3. Draw the **cradle**: from the wire inner end, draw the gore line vertically, 3.5 to 4.5 cm high (CF);
   continue the wire line to the outer end, then draw the band's upper edge from the outer end of the
   wire horizontally to the side seam, then to the back; band height at the side: 7 to 9 cm; at CB: 4.5
   to 8 cm (2 or 3 hook rows).
4. **Band length** (relaxed): underbust x (1 - r), where r depends on the stretch of the band fabric;
   rule used by makers: 3 % reduction for each 10 % of power-net stretch, up to the stretch measured in
   the lengthwise direction (e.g. 60 % stretch = 18 % reduction). Typical finished band: underbust minus
   10 to 15 cm total with the hooks fastened. Hook and eye tape lengths: 2 hooks for AA to B, 3 for C to
   D, 4 for DD and larger; add 3 to 4 cm overlap at the CB on the hook side.
5. **Cup**: measure the wire seam on the cup (wire length). From the cup measurements, draft a 3-piece
   cup, or a 2-piece cup:
   a. Horizontal 2-piece: draw the lower cup with the wire line at the bottom, upper edge convex by 5 to
      10 mm, inner and outer ends at the neckline and strap respectively; draw the upper cup with the
      lower edge equal to the lower cup top edge.
   b. Vertical 2-piece: draw the inner cup (wire to apex to neckline) and the outer cup; both reach the
      apex; the seam from the apex to the wire at the wire's low point.
   c. 3-piece: lower cup, upper inner and upper outer; the inner seam from wire to the neckline, the
      outer seam from the wire's outer third to the strap point.
6. **Volume check**: total volume is adjusted after a mock-up. In published examples (home drafts of
   Bare Essentials and Porcelynne methods), the volume was often right but in the wrong place
   (too much at the inner cup and too little at the apex); correct by moving volume between pieces
   (slash and spread at the apex, remove from the inner cup), not by changing the overall size.
7. **Upper cup top edge**: finished with elastic or lace; length 90 to 95 % of the edge for lace without
   stretch: at the top edge, a stable cup edge is sewn without ease; a stretch edge uses elastic at 95 %.
8. Add straps: attach at the apex line, 1 cm from the power bar, or at the outer third of the cup top;
   centre-back straps for a racer back.
9. Add seam allowances: 0.6 to 1.0 cm on joins; wire channel 1.0 to 1.2 cm; elastic edges per elastic
   (0.3 to 0.6 cm).
10. Cut and sew a test bra; adjust.

**Sewing order:** lower cup to upper cup; cup lining; cup to cradle (cradle over cup, topstitched);
gore to cradle; wire channel; side seams (wing to cradle); power bar; elastics (under-band, top edge);
straps; hook and eye; insert wires; bar tack the wire ends.

**Faults:**

| Fault | Cause | Fix |
|---|---|---|
| Cup wrinkles at the top | Cup volume too large or cup edge too long | Reduce volume; shorten the top edge by 2 %; elastic at 95 % |
| Gaping at the top of the cup | Volume too large, or outer cup too shallow | Reduce cup depth; add a power bar |
| Wire digs into the breast | Wire too small or too narrow | Larger wire; check tilt |
| Band rides up | Band too long or stretch too high | Shorten the band by 2 to 3 cm; use higher power net; the cup volume is too small |
| Wire pokes up at the gore | Gore too high or the wire too wide | Lower the gore; use a plunge wire |
| Quadraboob (spill over the top) | Cup volume too small or cup too shallow | Add 1 cup size or a deeper upper cup |

### 5.6 Bralette and soft cup

A bralette has no wire and little or no padding; the shape comes from the fabric.

- Pieces: cup x2 (triangle or 2-piece), band x1 or x2 (power net), straps x2, elastic under-band, top
  edge elastic, closure.
- Triangle cup: width at the base = bust width / 2 + 0.5 cm; height = distance from the bust point to
  the top; lining x2; elastic 85 to 95 %.
- Band: under-bust x 0.80 to 0.85 (relaxed); width 5 to 8 cm; the closure is a hook and eye.
- No wire: increase the structure by wider elastic under the cup (15 to 25 mm), or by a stiffer band.

### 5.7 Briefs, knickers, thongs

**Recognise:** lightweight stretch, a gusset (a double layer in the crotch), leg openings finished with
elastic or lace; brief variants differ in the leg cut and rise.

**Pieces:** front x1, back x1, gusset x1 (outer) + 1 (lining), waist elastic x1, leg elastics x2. Total
3 fabric pieces (gusset doubled).

**Drafting a basic brief (typical):**

1. Hip: measure the fullest part; the pattern hip width = hip x (1 - R) where R is 10 to 15 % for a
   fabric with 50 to 80 % stretch (commercial briefs are drafted at about 70 to 85 % of body hip in 75 %
   stretch jersey).
2. Draw a rectangle of half the hip width and rise length.
3. Front rise (CF) 15 to 20 cm; back rise (CB) 22 to 28 cm for a full brief; low-rise: front 10 to 14 cm,
   back 17 to 22 cm.
4. Crotch: width at the crotch (gusset) 7 to 8 cm; length of the gusset 12 to 14 cm, rounded at both
   ends.
5. Leg curve: from the crotch point, curve up to the side seam at 5 to 8 cm above the hip line; front
   curve shallower; back curve deeper (the back is rounder); for a high-cut leg the highest point is 8
   to 10 cm above the crotch line at the side seam.
6. Back width at the gusset is 9 to 11 cm; front width at the gusset is 7 to 8 cm.
7. Waist: a straight line from CF to the side seam, curved slightly at the hip; waist circumference =
   (waist x (1 - R)) or the hip.
8. Elastic cut lengths (typical): leg elastics = leg opening length x 0.85 to 0.95; waist elastic =
   waist edge x 0.85 to 0.90. Published methods vary: one swim approach sets 1:1 at the front and 3/4 at
   the back of the leg (the back gathers slightly); a patent for legless panties limits gathering to
   about 62.5 % of the free length; sewists often reduce the length by only 5 % for a stretchy elastic,
   more for non-stretch fabric. Treat 0.85 to 0.95 as the starting range and verify on a sample.
9. Elastic width 6 to 12 mm (leg), 10 to 25 mm (waist); plush-back, picot edge or fold-over elastic.

**Sewing order:** gusset assembled (outer + lining, stitched at the front end), attached to the back
(or front) first; sew the sides; attach the gusset to the front; add leg elastics; add waist elastic.

**Variants:**

| Style | Difference |
|---|---|
| Bikini | Low rise, narrow side (5 to 8 cm), leg curve high |
| Brief | Full coverage, mid rise |
| Boyshort | Leg length 5 to 10 cm, leg opening wider |
| Hipster | Low rise, wide side |
| French cut/ high cut | Leg curve high, side 3 to 5 cm |
| Thong | Front triangle + back strip of 1.5 to 2.5 cm; gusset 5 to 6 cm; leg elastics continue to the waist |
| G-string | Front triangle + back strip of 1 cm |

**Thong drafting:** take the brief draft; trim the back to a narrow strip: the back at the crotch is
4 to 5 cm wide, tapering to 1.5 to 2 cm at the waist; the leg curve rises to meet the waist at 9 to 11
cm from the CB; the gusset width at the crotch is 5 to 6 cm. The elastic around the whole contour is
cut at 0.85 to 0.90.

**Faults:** leg elastic cuts into the thigh (too short): lengthen the elastic by 3 %; leg opening
gapes (elastic too long): shorten by 3 %; back sags: raise the back rise by 1 to 2 cm; crotch rides:
gusset too long, shorten it.

### 5.8 Slips and bodysuits

**Slip:** woven or satin fabric cut on the bias, or a stretch fabric.

- Bias-cut slip: ease 4 to 8 cm full round at the bust and hip (the bias gives); length from the shoulder to
  mid-thigh or knee; strap 6 to 10 mm.
- Pieces: front x1, back x1, strap x2, facing x1 (for the top edge), optional lace at the hem.
- Hang in the bias: hang the cut pieces for 24 hours before hemming, because bias pieces drop up to 3 cm.

**Bodysuit:** a one-piece top and brief with a gusset closure.

- Pieces: front x1, back x1, gusset x1 (outer) + 1 (lining), neck/armhole elastic or binding, snaps.
- Torso length `T`: measure from the shoulder (neck point) down the front, between the legs, up the back
  to the same shoulder point: the total circumference of the torso loop. For the pattern, sum of
  front length (shoulder to crotch) + back length = `T x (1 - V)`, with V = vertical reduction 3 to 5 %
  for fabric with 50 to 70 % vertical stretch (see 2.2).
- Ease: add 2 to 4 cm to the torso length at the crotch for a woven fabric bodysuit.
- Crotch width 8 to 10 cm with snaps; overlap of 2.5 to 3 cm at the closure.

### 5.9 Corsetry and overlaps

Corsets are made in non-stretch coutil, not in knits. These are overlap and reduction references used
in lingerie and corsetry patterns:

| Item | Typical value |
|---|---|
| Hook and eye closure overlap on a bra | 2.5 to 4 cm |
| Corset back lacing gap (closed) | 2 to 5 cm |
| Busk overlap on each side of the front | 1.5 to 2.5 cm |
| Waist reduction in a starter corset | 5 to 10 cm below the natural waist |
| Waist reduction in a trained corset | 10 to 15 cm |
| Bone channel width | 8 to 12 mm (for 6 mm flat steel) |
| Seam allowance on corsetry | 1.0 to 1.5 cm |
| Modesty panel width | 8 to 10 cm, 3 cm overlap under the lacing |
| Overbust corset bust gore | 3 to 4 cm higher than the bra gore |
| Waist tape | 2 cm wide, at the waist, stitched through all layers |
| Spring steel (bones) | 6 to 8 mm flat at the seams; 4 to 5 mm spiral at curves |

Corsets are shaped by many panels (6 to 14), with a hip spring of 4 to 8 cm and a bust gore; these are
not stretch patterns and are outside this sheet's scope beyond the overlap reference.

---

## 6. Swimwear and activewear

### 6.1 Negative ease for swim Lycra

Swim fabric: nylon (or polyester) 80 / elastane 20, stretch 70 to 100 % in W, 50 to 80 % in L (4-way).

| Item | Typical reduction on body |
|---|---|
| Horizontal bust | 5 to 8 % (cups hold shape) |
| Horizontal waist | 10 to 15 % |
| Horizontal hip | 8 to 12 % |
| Vertical torso length (one piece) | 5 to 10 % |
| Leg opening, neckline, armhole | edge elastic at 85 to 95 % |
| Leg elastic | 90 % of the leg edge (front 95 %, back 85 %: gathers more at the back) |
| Absolute check | Pattern full round about 2.5 to 7.5 cm (ASG) up to 8 to 13 cm (other swim sources) under the body; higher stretch allows more |

A common single rule for 4-way stretch with 20 % elastane: pattern at 90 % of the body (10 % reduction).
American Sewing Guild sources target no more than 2.5 to 7.5 cm of negative ease; other sources use 8 to
13 cm for swimwear. Stretch of the fabric rules: higher stretch means more reduction; test a swim
sample. 15 % is an extreme and is verified only on a test suit. Fabric should stretch at least 50 % in
both directions; a 15 cm reach that snaps back to 10 cm indicates a good swim fabric.

### 6.2 One-piece swimsuit

**Recognise:** a one-piece with a lined body, a bust (cups or lining), leg openings with elastic, straps
or a halter neck, and sometimes a back cutout.

**Pieces and cut counts:** front x1 (or 2 with a CF seam), back x1 (or 2 with a CB seam), crotch/gusset
x1, front lining x1, back lining x1, crotch lining x1, cups x2 (foam, optional), straps x2 (or 1),
elastic for neck, armholes, legs, back.

**Drafting:**

1. Measure the torso loop `T` (shoulder, front, crotch, back, shoulder).
2. Pattern torso length = `T x (1 - V)`; typical `V` 5 to 10 %, halved on the front and back.
3. Width: bust, waist, hip reduced by the percentages in 6.1.
4. Crotch width: 7 to 9 cm (gusset width); crotch seam length 11 to 14 cm.
5. Leg line (cut): the highest point at the side seam is 10 to 14 cm above the crotch level for a low
   leg; 14 to 18 cm for a high cut; the leg curve is deeper at the back for a high cut and flatter for a
   low cut. Front leg curve is lower than the back.
6. Back coverage: full, moderate, or cheeky (seat covered by only 60 %).
7. Neckline and armholes: use binding or elastic (width 6 to 10 mm) at 85 to 90 %.
8. Bust: with foam cups (sewn in the lining), or a lining only; the cups are placed 2.5 to 3 cm apart.
9. Lining: cut the lining as the outer; lining stretch should match; the bottom lining may be 1 to 2 %
   smaller so it does not wrinkle.

**Elastic placement:**

| Edge | Elastic width | Cut ratio | Placement |
|---|---|---|---|
| Leg | 8 to 12 mm | 0.90 (front 0.95, back 0.85) | Folded to inside, sewn with 3-step zigzag |
| Armhole | 6 to 8 mm | 0.85 to 0.90 | Folded to inside |
| Neckline | 6 to 8 mm | 0.85 to 0.90 | Folded to inside |
| Back | 6 to 10 mm | 0.85 | Folded to inside |
| Under-bust (shelf) | 10 to 12 mm | 0.80 to 0.85 | In the lining |

**Sewing order:** sew the lining to the outer at the neck (or sew together raw edge); assemble front and
back (side seams); attach gusset; elastic to legs, neck, armholes (in that order); apply straps; insert
cups.

**Stitching:** 3-step zigzag (or wide zigzag), ball-point needle 75/11, polyester or nylon thread;
coverstitch for hems and elastic.

**Faults:**

| Fault | Fix |
|---|---|
| Gaping at the leg | Shorten leg elastic by 5 % |
| Bust gap | Reduce neckline length; add elastic at 85 %; reduce bust width |
| Back sagging | Shorten torso length by 1 to 2 cm |
| Wrinkles at the crotch | Gusset too long: shorten by 1 cm; torso length too short |
| Straps fall | Move strap attachment inward 1 cm |
| Fabric visible/transparent | Add lining |

### 6.3 Bikini

**Pieces:** top x2 triangles (or a bandeau x1), bottom: front x1, back x1, gusset x1 (+ lining), ties or
straps, elastic.

**Top draft:** triangle with a base (bust width, ~ 14 to 17 cm), a height (12 to 16 cm) and a side
length; tie lengths 40 to 70 cm; elastic around the bust; lining; foam optional.

**Bottom draft:** as a brief (5.7) with swim ratios; side width 3 to 8 cm for a tie-side; the leg
curve high; crotch width 7 to 8 cm, double layer.

### 6.4 Leggings with gusset

**Recognise:** close-fitting trousers in 4-way stretch fabric with a diamond-shaped gusset at the crotch
and a wide waistband, flatlock or overlock seams.

**Pieces:** leg x2 (left, right; each a front-back combination or front and back separately),
gusset x1 (or 2 for the diamond), waistband x1 (cut 1 on fold or 2), optional pocket.

**Drafting:**

1. Body measurements: waist, high hip, hip, thigh, knee, calf, ankle, rise, inseam, outseam.
2. Use R from 2.2 or 6.1: typical for 50 to 75 % stretch: 10 to 15 % horizontally; for 76 to 100 %:
   15 to 20 %.
3. Vertical: inseam x (1 - 0.03 to 0.05); rise x (1 - 0.03 to 0.05).
4. Draft a straight block: half the girth at hip, thigh, knee, calf and ankle (front and back each
   quarter), with CF and CB rise curves. The crotch seam is set with the leg lines at the same angle.
5. Waistband: length = waist x (1 - 0.10 to 0.20), height 4 to 6 cm when folded (cut 8 to 12 cm + 2
   SA); or elastic 25 to 40 mm at 85 to 90 % of the waist.
6. Gusset: a diamond 8 to 10 cm wide (~ 12 to 15 cm long) inserted at the crotch where the four seams
   meet; this removes the four-way seam bulk and improves movement.
7. Add 1 cm seam allowance, 2 cm hem allowance, or a coverstitch.

**Sewing order:** sew the crotch seam of each leg (flatlock or overlock); sew the inseam; insert the
gusset; side seams; waistband; hem.

**Faults:** camel toe (gusset too wide or rise too short): lengthen the crotch curve; knees bag: knee
width too big; horizontal wrinkles at the back of the knee: lengthen the back leg by 1 to 2 cm; the
waistband rolls: use a wider elastic or interface.

### 6.5 Sports bra

**Recognise:** a stretchy bra for exercise; low, medium or high impact. Features: wide straps, a wide
under-band, racerback, front zip, cup pocket or seams.

| Impact | Structure |
|---|---|
| Low | Pullover, compression, soft lining |
| Medium | Compression + shaping, wider band, thicker straps |
| High | Encapsulation (individual cups) + compression, wide straps, firm band, often adjustable |

**Pieces:** front x1 (or 2 with CF seam), back x1, front lining x1, back lining x1, straps x2, under-band
elastic x1, top-edge elastic x1, optional cups x2.

**Drafting:**

1. Band length: underbust x 0.80 to 0.85 (relaxed), with elastic 25 to 40 mm at 0.80 to 0.85.
2. Bust compression: the bust width is reduced by 10 to 15 %, using a double layer of fabric.
3. Strap width 15 to 25 mm for low/medium impact; 30 to 40 mm for high impact; the racerback straps
   meet at the centre back at a Y or T point 8 to 12 cm below the neck; the strap length is shortened by
   5 to 10 %.
4. Neckline depth: 8 to 14 cm front; 3 to 5 cm back.
5. Hem and armhole: elastic at 0.85 to 0.90.

**Faults:** bounce: increase compression, wider band; straps dig: widen or pad the straps; band rides
up: shorten the band and raise the stretch of the elastic.

### 6.6 Compression garments

**Recognise:** very close, graduated pressure leg or body; compression tights, calf sleeves, shapewear.

**Pressure model (Laplace):** `P = T / r`, with `P` in pascals, `T` the fabric tension per unit width in
N/m and `r` the radius of the limb in m. 1 mmHg = 133.3 Pa. Example: T = 60 N/m, r = 0.08 m gives
P = 750 Pa = 5.6 mmHg.

Consequences for patterning:

- For the same fabric elongation, pressure is higher on a smaller radius (ankle) than on a larger radius
  (thigh), which is what graduated compression is built on.
- Use the same pattern reduction in all places to get graduated pressure automatically, or increase the
  reduction at the ankle to increase pressure.
- Reduction for compression: 15 to 25 % at limbs on a fabric with 100 to 150 % stretch; verify with a
  pressure tester; for medical compression use certified garments, not a pattern.
- Do not exceed `u` = 0.5 of the fabric's stretch (see 1.3).

### 6.7 Activewear construction notes

- Flatlock seams where bulk or chafing matters; 4-thread overlock elsewhere.
- Waistband elastics: 25 to 50 mm wide, cut at 85 to 90 % of the waist.
- Gussets at the crotch and underarm improve movement.
- Mesh inserts: use power mesh with 100 % stretch; cut with the grain on the stretch direction.
- Bonded seams and heat-seal where stitching would chafe.

---

## 7. CLO3D notes

- Mesh size (particle distance): about 8 mm for fitted knits; 4 to 6 mm for small pieces and tight
  elastic edges; the default 20 mm is too coarse for skin-tight garments and the skin pokes through.
- Added collision thickness: 0 for all pieces (fabrics carry their own thickness). A raised value pushes
  the cloth away from the body and breaks close fits.
- Fabrics: use a measured knit preset (CLO "Fabric Kit" values), not a woven. Ensure the weft and warp
  stretch values reflect the measured `S_w` and `S_l` (see 1.1); a woven preset on a stretch pattern
  will not shrink to the body.
- Negative ease: the pattern itself carries the reduction (no scaling); if the garment looks too
  loose, check the fabric stretch before reducing the pattern again.
- Elastic: sew the elastic edge with the elastic tool at the ratio of the cut length (0.85 to 0.95
  for swim), or set the seam's "Elastic" ratio; the cloth will gather automatically.
- Check by strain or stress map: the cloth should not exceed `u` = 0.5 of the stretch (red areas
  indicate overstretch).
- Bands: model the band as a separate rectangle with a lower stretch ratio (rib), sew it to the neckline;
  the band is shorter than the neckline and the simulation stretches it.
- Lingerie: the wire can be approximated by a curve with a stiff, thin bar (internal line with
  high bending stiffness); the cup volume can be viewed by the avatar's contour.
- Simulation of lining and double layers: set the layer order (outer above lining) before simulating.

---

## 8. Quick checklists

**Before drafting a stretch garment:** measure stretch W and L; pick the category; choose the fit
(skim, close, compression); compute the reductions; list the bands and their ratios; decide the seams
and finishes.

**After the first toile:** check horizontal drag lines (too small), vertical drag lines (too long),
wavy seams (differential feed), band behaviour (flat, gaping, collapsing), and recovery after wearing
for an hour.

**Cut counts reminder:** every body piece is cut as a pair (left and right) unless drafted on the fold;
bands, linings and gussets are listed separately; specify "cut 2 mirror" for sleeves and cups.

---

## Sources

- Stretch Basics for Patternmaking 2: Blocks, dresspatternmaking.com (stretch categories and body
  reduction table): https://dresspatternmaking.com/blog/stretch-basics-for-patternmaking-2-blocks
- Reduction in Width for Stretch Blocks, dresspatternmaking.com:
  https://dresspatternmaking.com/blog/reduction-in-width-for-stretch-blocks
- Study and analysis of pattern reduction method for garment by Penelope Watkins (stretch factor
  tests, wale and course): https://www.revistas.udesc.br/index.php/modapalavra/article/view/19654
- Threads Magazine, Adapt Woven Patterns for Knits:
  https://www.threadsmagazine.com/2021/10/27/adapt-woven-patterns-for-knits
- University of Fashion, Knit Stretch Reductions (module structure only; content paywalled):
  https://www.universityoffashion.com/lessons/knit-stretch-reductions-sleeve-slopers/
- Chalk & Notch, neckband ratios by fabric stretch: https://www.chalkandnotch.com/?p=29187
- Siemacht Sewing, How to sew a knit neckband (70 to 80 % rib, 80 to 90 % fabric bands):
  https://siemachtsewingblog.com/2020/12/how-to-sew-a-knit-neckband/
- Seamwork, How to sew a perfect neckband (70 %):
  https://www.seamwork.com/sewing-tutorials/how-to-sew-a-perfect-neckband
- Crafting Fashion, Determining length and width of rib:
  https://www.craftingfashion.com/2015/08/determining-length-and-width-of-rib.html
- Sewing With Numbers, turtleneck collar (structure only; paywalled):
  https://sewingwithnumbers.substack.com/p/how-to-draft-and-sew-a-turtleneck
- Sewing With Numbers, Draft Bikini Briefs (negative ease multiplier, gusset width 7 cm; paywalled):
  https://sewingwithnumbers.substack.com/p/how-to-draft-bikini-briefs
- Doctor T Designs, Adventures in Bra Sewing (wire, band, volume placement notes):
  https://doctortdesigns.com/2024/01/19/adventures-in-bra-sewing-another-bra-draft/
- Cloth Habit, Adjusting your bra band (band reduction by stretch):
  https://clothhabit.com/adjusting-your-bra-band-with-math/
- Bra and Corset Supplies, the trouble with elastics (elastic stretch standard):
  https://www.braandcorsetsupplies.com/the-trouble-with-elastics
- Seamwork, Swimwear sewing secrets: https://www.seamwork.com/sewing-tutorials/swimwear-sewing-secrets
- Cashmerette, What is negative ease and how does it work:
  https://blog.cashmerette.com/2019/02/what-is-negative-ease-and-how-does-it-work.html
- Jennifer Lynne Matthews-Fairbanks, Bare Essentials: Bras and Underwear (Porcelynne method); Winifred
  Aldrich, Metric Pattern Cutting for Women's Wear (stretch fabrics); Julie Cole, Patternmaking with
  Stretch Knit Fabrics; Armstrong, Patternmaking for Fashion Design; Müller & Sohn, Pattern
  Construction. These books were not available online; values attributed to them are standard
  industry ranges and must be checked against the edition used.

Not verified online: the 85 to 95 % leg elastic range for briefs and swimwear (only the 1:1 / 3/4,
62.5 % and 95 % figures above were found), the cup-letter table beyond the common EU 2 cm steps, the
wire curve lengths, the placket dimensions and the corsetry values. Treat them as starting points.
