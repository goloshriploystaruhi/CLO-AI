# Design from a sketch

How to go from a fashion sketch, including one with sculptural volumes that no everyday garment has, to
a set of flat pieces that produce that shape on a body. For a photo of an existing garment, run
`reference-analysis.md` first; this sheet starts where that one stops, or replaces it when only a drawing
exists and nothing was ever sewn.

A sketch is an intention, not a specification. It shows an outline, a mood and a few lines. The agent
must turn it into numbers: which body landmarks the shape touches, how much fabric each region needs,
where it is cut, how it hangs. The method is: read, decompose, choose a technique, develop to flat,
simulate, compare, correct the pattern. Write each stage down (the construction sheet at the end of this
file) before drafting.

Facts quoted from authors and books were checked against the sources listed at the end. Where a source
could not be checked directly, the text says so. Numbers marked "starting value" are to be calibrated in
the simulation, not trusted.

## 1. Reading a sketch

### 1.1 Croquis proportions versus a real body

A fashion croquis is deliberately taller than a person. Real adults are about 7 to 7.5 heads tall;
fashion templates run 9 to 10 heads (sometimes 11), with the extra height going mostly into the legs and
the torso. The head, hands and feet stay about the same size, so the figure looks slender and long.

Consequences for the agent:

- **Never scale a sketch by one factor.** Lengths read from a croquis are fractions of the distance
  between body landmarks, not centimetres. A hem "at mid-calf" is a position between knee and ankle, not
  a height in heads.
- **Never read widths in absolute terms either.** The croquis body is narrow. A coat that is twice the
  hip width of the drawn body is twice the hip width of the real body, whatever the drawn body measures.
- **Keep the proportions the designer chose** (long torso, very long skirt) only when the person says the
  garment is for an exaggerated figure. For a real wearer, convert as below and tell the person the
  garment will look shorter or stockier than the drawing if the conversion shrinks a feature.

### 1.2 Landmarks and the length conversion

Mark these landmarks on the drawing, in order from the top, and read every garment feature as a position
relative to the two nearest landmarks.

| Landmark | Where it is on the drawing | Real body source |
|---|---|---|
| Neck base (nape / side neck point) | where neck meets shoulder line | `measurements.md` neck, back_length |
| Shoulder point | end of the shoulder line | `shoulder` |
| Armpit (underarm) | where arm meets torso | `armhole_depth` |
| Bust point | fullest part of the chest | `bust_depth` |
| Waist | narrowest point of the torso | back_length |
| High hip / hip | fullest part of the seat | `hip_depth` |
| Crotch | where legs part | `body_rise` |
| Knee | middle of the knee | trouser_length, tape from waist |
| Ankle | ankle bone | trouser_length, tape from waist |
| Floor | the ground line | height |

Conversion, one landmark pair at a time (piecewise linear):

```
position fraction f = (y_feature - y_upper_landmark) / (y_lower_landmark - y_upper_landmark)
real position       = real_upper_landmark + f * (real_lower_landmark - real_upper_landmark)
```

Worked example: hem drawn 40 % of the way from knee to ankle. Real knee 52 cm below the waist, ankle
102 cm below the waist. Hem = 52 + 0.40 x (102 - 52) = 72 cm below the waist.

Typical heights above the floor for a 168 cm woman, to sanity-check a conversion when real values are
missing (replace them by the wearer's measurements): shoulder point 138, bust 122, waist 104, fullest hip
85, crotch 78, knee 47, ankle 8. For a man or another height, scale by height/168.

A feature drawn outside the body (a hem that hovers, a train, a hat) is measured from the nearest body
landmark, in drawing units converted with the local scale: sketch units per cm of real body between the
two nearest landmarks.

### 1.3 Widths and the conversion to circumferences

A front view gives a width, not a circumference. Convert in three steps.

1. **Reference width.** Measure the drawn body width at the same level (shoulder points, bust, waist,
   hip). Call it `wb` in sketch units. Measure the garment width there, `wg`. The ratio `k = wg / wb` is
   the design ratio at that level.
2. **Real front width.** Real body flat widths, typical for a size 38 woman (replace if measured):
   shoulder point to point 38 to 40, bust 29 to 31, waist 24 to 26, hip 34 to 36 (cm, front view).
   `Wg = k x Wb_real`.
3. **Circumference.** The garment cross-section is not a rectangle. Assume an ellipse with half width
   `a = Wg / 2` and half depth `b`. Without a side view, take `b = 0.8 a` for torso volumes that stand off
   the body (coats, cocoons), `b = a` for round volumes (balloons, bubbles, puffs), and `b = 0.6 a` for
   flat panels (pleated screens, wings). Ramanujan's approximation of the circumference:

```
C = pi * ( 3(a + b) - sqrt( (3a + b) (a + 3b) ) )
```

Example: coat drawn 1.6 times the hip width, body flat hip width 34. `Wg = 54.4`, `a = 27.2`,
`b = 0.8 x 27.2 = 21.8`, `C = 154 cm`, against a body hip of 100: design ease of about 54 cm.

When the side view exists, read `b` from it with the same landmark method (depth ratio to the body depth).
Real body flat depths: bust 22 to 24, waist 18 to 20, hip 24 to 26.

### 1.4 Reading lines

Classify each drawn line before deciding the pieces.

| Line in the sketch | Likely meaning | What it changes in the pattern |
|---|---|---|
| Solid line crossing the garment, ends at a point or edge | seam, or a dart if it ends in the body | piece split; check whether it follows a landmark |
| Short tapered line pointing at a landmark | dart, or ease absorbed by the iron | dart or gathered area |
| Fine parallel lines, short, regular | gathers, shirring, smocking, pleats | fullness ratio 1.5 to 3; ask which |
| Parallel lines, long, sharp, same direction | pleats (knife, box, sunburst, accordion) | pleat plan, width consumed 2:1 or more |
| Dashed line | topstitching, hidden seam, fold line, or an inside layer | ask if unclear |
| Double line along an edge | hem, facing, binding, or a thick edge | finish and width |
| Curved lines wrapping a limb or torso diagonally | twist, spiral seam, bias drape, wrap | grain on the bias; spiral piece |
| Lines radiating from one point | tension folds (fabric pulled to a point) | drape toward that point: a tuck, a pivot or a gathered point |
| Lines hanging from a high point, parallel to gravity | gravity folds, flare, godets, circle | slash and spread, circle panels |
| Wavy, overlapping edge | layered ruffle, flounce, spiral hem | circle or spiral flounce (section 3.4) |
| Hatching or shading inside a shape | volume, depth, or a second layer | note and ask |
| Arrow | direction of drape, twist or movement | note the direction |

Rules for the lines:

- A closed region bounded by drawn seam lines is a piece (as in `reference-analysis.md`).
- A line that stops in mid-garment is a dart, a placket end or a slit, never a ghost; decide which.
- Lines that cross at a landmark (bust, waist, hip, shoulder point) are shaping seams. Lines that float
  between landmarks are decoration or fabric width seams; check with section 2.4.
- Silhouette corners are information: a sharp corner means structure (boning, interfacing, cut edge); a
  round corner means soft fabric.

### 1.5 Stiffness and fabric hints

Read the fabric from how it behaves in the drawing.

| Sign in the drawing | Fabric behaviour | Typical fabrics |
|---|---|---|
| Few folds, sharp angular edges, shape stands off the body | stiff, holds a form alone | taffeta, organza (crisp), duchesse satin, neoprene, scuba, heavy wool felt, interfaced cotton |
| Folds that start at tension points and end softly | soft with some body | crepe, wool crepe, medium silk, gabardine |
| Many long vertical folds, fluid | drapes, fluid | silk charmeuse, viscose, jersey, georgette |
| Round, soft, quilted look | padded or filled | wadding between layers, down |
| Volume that looks like it floats | stiff net, horsehair, boning, wire or a structure underneath | tulle, crinoline, hoops |
| Visible diagonal stretch lines | bias, or a knit | any woven cut on the bias, jersey |
| Visible pleats in narrow set | pleated fabric, heat set | polyester pleating, mikado |

Fabric changes the amount of volume. A balloon drawn standing 12 cm off the body needs a stiffer fabric
or a stiffening layer than the same shape drawn collapsing. If the drawing says "stiff" and the person
names a fabric that cannot do it, say so before drafting and offer an interlining or underlayer.

### 1.6 Views

- **Front, back, side, three-quarter.** One front view with no back is the usual case. Do not assume the
  back mirrors the front. List the back as an open question or declare the assumption (the back is a
  plain version of the front, with a centre back seam and the same side seams).
- **Side view** gives the depth (`b` above), the position of seams at the side, hang of the hem front to
  back, and where the volume sits (forward, back, or all round). If the side is missing, state the
  depth assumption.
- **Three-quarter view** shows how a volume turns around: use it to verify the assumed depth against the
  front width.
- **Sleeves**: note the arm position. Arms down against the body hide the sleeve volume; an arm raised
  shows the underarm and the gusset.
- **Symmetry.** Unless drawn otherwise, assume the left and right are symmetric.

### 1.7 What is missing and must be decided or asked

At minimum, write down: fabric (type, weight, width, stretch), closure (where, what type), lining or
underlayer, the back, the exact length at CF and CB, the sleeve length, neckline depth, the hem finish,
and who wears it (measurements, height, shoes). The questions list is at the end of this file. Anything
that changes a seam, a piece count or a cut dimension by more than 5 cm, or the feasibility of the
shape, must be asked; anything smaller is a stated assumption.

## 2. Decomposition

### 2.1 Silhouette and volume map

1. **Trace the outline** from the sketch and overlay a body at the same scale (landmark method of 1.2).
2. **List the contact points**: regions where the garment touches or follows the body (shoulder, waist,
   bust, hip). They are the anchors: the garment is cut to fit there, and volume is built between anchors.
3. **List the free zones**: regions where the garment stands off the body (the balloon, the sleeve head,
   the cocoon belly). For each, record: stand-off distance at maximum (cm), where it is maximal, front,
   back and side, and the direction of the surface at the edge.
4. **Mark the type of each volume** (section 2.3): added width, fullness, structure, padding, layer.
5. **Produce the volume map**: a table of levels from top to bottom, with a row per landmark and for
   each: body circumference, garment circumference, difference (design ease), and how that difference is
   produced. This map drives every later decision.

| Level | Body C | Garment C | Design ease | Produced by |
|---|---|---|---|---|
| shoulder width | ... | ... | ... | ... |
| bust | 92 | ... | ... | ... |
| waist | 72 | ... | ... | ... |
| hip | 100 | ... | ... | ... |
| hem | ... | ... | ... | ... |

### 2.2 Which block to start from

| Shape | Start from |
|---|---|
| Fitted at one region, free elsewhere | block of that region, the rest drafted directly |
| Skirt-like, any silhouette | skirt block, or a circle / rectangle for pure volume |
| Top, dress or coat with a fitted shoulder | bodice block, with extra ease by garment (`ease.md`) |
| Dropped or extended shoulder, kimono, cocoon | bodice block, then slash the shoulder and arm line (section 3.10) |
| Trousers with volume | trousers block |
| Shape with no body relation (a screen, a tube, a cape) | direct drafting from geometry; the block only gives the neck and shoulder anchors |
| Draped, bias, cowl | bodice or dress block with the darts closed into the drape; or drape on the stand |

Start from the block that matches the contact points, not the silhouette. A cocoon coat touches the body
at shoulder and neck, so it starts from a coat bodice, not from a barrel.

### 2.3 Where volume comes from

| Source | Flat pattern operation | Look | Typical amount, starting value |
|---|---|---|---|
| Added width | add to side seam, centre, or both, redraw seams | straight, boxy, oversize | 5 to 25 cm total per level |
| Slash and spread, parallel | cut along grain, spread parallel | straight volume, even flare, boxy | 2 to 6 cm per slash |
| Slash and spread, fan | cut from hem to a pivot, spread at the free edge only | flare, skirt, bell sleeve | 10 to 40 cm total at the free edge |
| Circle / partial circle | fraction f of a circle, radius from waist | flounce, cape, bias fall | f from 1/4 to 1 |
| Pleats | fabric per pleat = visible + hidden | ordered volume, folded | 1.5:1 to 3:1 fabric to finished |
| Gathers | width = finished x ratio | soft puff, ruffle | ratio 1.5 (thick) to 3 (fine) |
| Darts converted to fullness | open dart over the length and gather, or leave as tucks | released volume at the bust, hip | the dart value |
| Godets and gussets | triangle or diamond inserted in a slashed seam | flare at hem, underarm room | 20 to 50 cm wide at hem |
| Cut-outs | remove a shape and finish the edges | openings, windows | free |
| Padding | stuffing between layers, or a pad piece | rounded, quilted, inflated | 1 to 5 cm thick |
| Boning, wire | channel on seam, sewn to a piece | holds a shape alone | per design |
| Interlining, horsehair, buckram | fusible or sewn layer | stiffness, holds an angle | per design |
| Layers | piece over piece with different lengths | depth, transparency | per design |
| Crinoline, hoops | separate underskirt of tapes or boning | silhouette from the floor up | rings spaced 20 to 35 cm vertically |

Volume is produced by only a few real mechanisms; everything else is a combination:

1. **Extra length, constrained at the ends**, gives a bulge. A panel longer than the distance between its
   attachments (waist and hem) bulges outward. See section 3.11 for the formula.
2. **Extra width, constrained at the ends**, gives gathers or pleats, hence fullness.
3. **Stiffness** gives a shape independent of the body.
4. **Fabric tension** (diagonal pulls, wraps) gives drape.

### 2.4 Seam placement

Seams do three jobs. Place each seam deliberately, never by convention alone.

1. **Shape.** Seams through a landmark (princess seams through the bust) take curvature out of the flat
   fabric. A seam that is not through a landmark does not shape.
2. **Fabric width.** A piece wider than the usable fabric width (selvedge to selvedge, minus about 2 cm for
   selvedges) must be split. Choose the seam where it is least visible or where it can become a design line:
   at a hem it can be a godet seam, at a skirt it becomes a gore seam.
3. **Design line.** The sketch shows it.

Placement rules:

- A seam ending at the body (shoulder, side seam) runs along the body's silhouette plane, front to back.
- Keep seams on grain where possible; a seam on the bias stretches and needs stay tape.
- A very long curved seam (a spiral) needs notches every 15 to 25 cm.
- A seam that joins a longer edge to a shorter one (cap to armhole) has an ease or gathers amount
  recorded in the construction sheet.
- Never put a seam through the apex of a volume that must read as one smooth surface; put it where the
  surface is flat or hidden by a fold.
- If the sketch shows no seam and the shape is clearly not a single piece, add the minimum number of
  seams and say so.

## 3. Techniques for unconventional volume

The following are real methods used by pattern makers. For each: what it is, how it works in flat terms,
and when to use it. Authors' names are for orientation; reproduce no text from their books, only the
method.

### 3.1 Draping on the stand and transfer to flat

Draping builds the shape directly on a body form or mannequin with muslin, then flattens the result.
Useful when the shape cannot be foreseen by calculation (cowls, wraps, asymmetric folds).

1. Mark the form with tape at centre front, centre back, side seams, waist, bust and hip.
2. Cut muslin larger than the intended piece. Draw the grain (a vertical centre line for front and back,
   a horizontal balance line at bust or hip).
3. Pin the grain lines to the form's tapes. Let the fabric fall or fold as the design requires, pinching
   away excess as darts, tucks, pleats or gathers.
4. Mark seams, darts, notches and fold lines on the muslin on the form.
5. Remove the muslin, lay it flat, and true the lines with rulers and curves. True means connect and
   smooth, and match seam lengths.
6. Pin the trued muslin back on the form and check; correct and repeat.
7. Transfer to paper, add allowances, notches and grain.

The agent has no stand. It replaces draping by: (a) a simulation in CLO3D of a coarse first piece as a
drape probe; (b) flat-pattern equivalents (slash and spread with pivots, dart moves); (c) asking the
person to drape a muslin and photograph it, when the shape is truly open-ended. Read the fold pattern of
the simulation as a tool: the tension lines show where the pattern needs a dart, a pivot or an added
length.

### 3.2 Japanese pattern-cutting methods

**Tomoko Nakamichi, Pattern Magic (volumes 1 to 3).** Sculptural shapes derived from a basic sloper
(Bunka style) by geometric manipulation: slashing and spreading, rotating darts into the shape, adding
planned excess length or width at selected lines, cutting and folding to form cylinders, circles, squares,
triangles, accordions, drapes and optical illusions. Contents of the books include forms such as
balloon, circle, square and triangle volumes, circular and square accordion, a circular sleeve and
curved surfaces. The method:

1. Start from a flat sloper with darts closed or moved to a single place.
2. Define the design lines on the sloper, often parallel or radial.
3. Cut along them and spread or overlap by planned amounts (the geometry sets the amount, for example the
   difference between the straight and the curved length).
4. Redraw the edges smooth after the spread.
5. Accept that the shape appears when it is sewn on the body; test on a toile. Many of these shapes only
   read correctly on a body or with specified fabric.

The key principle: the pattern is a diagram of where fabric is added and where it is held back. Write the
added and held lengths as numbers before drafting.

**Shingo Sato, Transformational Reconstruction (TR).** Darts are treated as movable and are absorbed into
seams, folds or layers rather than kept as darts. The method combines flat and draped work. Published
description of the process (via a pattern publisher): make a toile from the basic pattern, sew all darts
closed, pin it to the form, draw the new style lines by hand, mark notches carefully on curved seams, cut
along the new lines, discard the old seams and darts, then add allowances. Some of his work uses
origami-type folds that run in one piece. The flat-pattern equivalent: close the darts (pivot), draw the
style lines on the closed pattern, cut, and re-open the darts into the cut lines. Use TR when a shape
should come out of continuous curved lines (a vortex, a wrap, a spiral) rather than from separate
conventional parts.

Useful practice from the secondary teaching sources: unite the darts of the block first; number layers or
spikes in order; use notches to track alignment on curves; keep a narrow seam allowance (about 0.7 cm) on
small curved seams.

### 3.3 Subtraction Cutting (Julian Roberts)

Roberts's method (named about 2002, described in the free publication Free Cutting) makes garments
mostly by removing fabric and working from the hollow the body occupies, rather than building a shape
around the body. Characteristics:

- The pattern is made on the body or with the body as a guide, with few numerical measurements.
- The tunnel technique starts from a fabric tube (rectangles sewn into tubes, large enough for the body
  or a limb to pass through, on the order of twice the length of the part), folds it in ways the fabric
  suggests, and cuts holes or circles through which arms, legs and head pass. The remaining fabric
  becomes the garment.
- Other lessons in the series: plug and displacement techniques.
- The shape is found by experiment, then recorded as a pattern.

How the agent uses it: it cannot cut on a body, so it models the logic. Decompose the garment as tubes and
holes: each tube is a rectangle, each hole is a circle or ellipse sized from the limb's circumference
(`C` of the limb plus movement ease, circle diameter `d = C / pi`, plus 2 to 6 cm of ease), each fold sets
where two holes align. Tubes are simulated in CLO3D with holes placed as internal shapes or cut edges,
and the person is asked to place the pieces by hand when they thread through each other (section 5). This
technique is the reference for garments where a body passes through several holes of one fabric.

Note: the method's steps could not be read from Free Cutting itself during checking of this sheet (the
file is a large PDF); the description above comes from Roberts's published statements and workshop
reports. Check the PDF when a project depends on the details.

### 3.4 Geometric cutting: circles, squares, triangles, cocoons

Basic shapes give predictable volumes because their relation between edge length and surface is known.

- **Circle / partial circle.** Inner radius `r = inner edge length / (2 pi f)` for the fraction `f` of a
  circle; outer radius `R = r + length`. A full circle skirt has `r = waist / (2 pi)`. A half circle has
  `r = waist / pi`, a quarter `r = 2 waist / pi`. See 4.1 for the slope of the surface.
- **Spiral circle** (spiral flounce): a circle cut in a spiral band gives a long ruffle with no seams;
  the band width is constant and the inner edge is the shorter, gathered edge. Total length of the
  band = the length of the spiral measured at its centreline.
- **Square**: a square with a centre hole becomes a cowl, a poncho or a collar. Hole circumference =
  neck or opening circumference.
- **Triangle**: a triangle's long edge on the bias gives a drape ending in a point.
- **Cocoon**: an ellipse in cross-section, widest low, closed in at the hem. Cut by side seams that
  bow out between shoulder and hip then come in to the hem; the hem circumference sets whether you can
  walk (minimum about 100 cm round without a vent, in a medium fabric).

### 3.5 Zero-waste cutting

Zero waste means the pattern pieces fit together on the width of the fabric like a jigsaw, with no
leftover. Rissanen and McQuillan present it as a design method: the pattern is designed with the layout,
not laid out afterwards. Practical consequences for the agent:

- The fabric width sets the piece widths. A zero-waste size is limited by the width, so the width must be
  known before drafting. Use the actual usable width (selvedge to selvedge minus selvedge and print
  margins).
- Common devices: rectangles and trapezoids tessellated; leftover shapes become other parts (pocket,
  gusset, facing); an armhole removed from the side of a rectangle becomes a sleeve head elsewhere; the
  gap left by a neck hole becomes a collar.
- Selvedge waste is the main loss; use the selvedge as a design edge (unhemmed) or fold it in.
- The shape is not predictable before the pieces are cut; it depends on the fabric. Always simulate.
- A zero-waste layout with a tight fit on curves is hard; use it with loose, geometric or draped shapes.

### 3.6 Twisted and spiral seams

A seam that spirals round a limb or the torso changes the grain from vertical to diagonal along its length.

1. Draw the spiral on the form (a line from a point on the shoulder, round the body, down to the opposite
   hip, for instance).
2. Treat it as a seam: the garment is split along it into two pieces (or one piece with a cut).
3. Flatten each piece: each is a long curved band; cut with the grain along the average direction of the
   band or on the bias.
4. Check lengths with the `piece` command and sew with notches every 15 to 25 cm.
5. Simulation shows the twist: a wrong twist reads as a crease line at the wrist or knee; correct by
   changing the spiral angle in the pattern.

### 3.7 Origami folds and pleats

- **Pleats** store fabric in a fold. Define the pleat by visible width `p` (finished width per pleat) and
  hidden width `u` (underlay). Fabric needed per pleat = `p + u`. For `u = p` the ratio is 2:1. Examples:
  16 knife pleats at p = 2.5 cm use 16 x 5 = 80 cm of fabric to give 40 cm finished width.
- **Types**: knife (one direction), box (two folds toward each other, one box = 2 folds), inverted box,
  sunburst (pleats fan out, narrow at the waist, wide at the hem; cut as a circle sector), accordion
  (evenly spaced, small), shadow pleats (two layers).
- **Pressed or permanent**: pleats set with steam hold; stiff fabrics keep them, soft fabrics need
  topstitching.
- **Fan pleats** open: pleat width constant at the waist and increases to the hem; the pattern is a sector
  (trapezoid) wider at the hem. The fabric per pleat at the hem is `p_hem + u_hem`.
- **Origami**: parallel folds in a flat piece that create three-dimensional volume without darts (the
  Sato origami bodice, vortex or bamboo). Pattern: draw fold lines on the flat piece, offset them by a
  volume amount (about 4 to 6 cm for a bodice, not exactly measured), mark mountain and valley folds, press
  the folds, and sew the fold ends into seams. The piece size is the flat piece before folding.

### 3.8 Bias draping

Cut on the bias (45 degrees to the grain), a woven stretches and drapes in a fluid way; it has no
dimensional stability.

- Allow the garment to hang for 24 hours before levelling the hem; the length grows (several percent) and
  the width narrows.
- Reduce ease: a bias dress drapes close with 6 to 10 cm of bust ease where a straight-grain one needs
  more.
- Use narrow seams (about 1 cm), stay the shoulder and neck with tape, and sew with a slightly looser
  tension.
- Cowls: the folds of a cowl hang from two points because the bias gives; use section 6.4.
- Two bias pieces sewn along the same grain direction mirror well; sewn with the grain crossing they
  twist.

### 3.9 Inflated and padded shapes

Volume made by stuffing, quilting or an inflated layer.

- **Quilted channels**: two layers stitched at regular intervals with padding between. Each channel is a
  small tube of width `w` stitched flat; finished width of the panel is `n x w` and the cut width is
  `n x (w + t)`, where the take-up `t` is about 20 to 50 % of `w` depending on the filling (starting
  value). Test it on a sample.
- **Ball / sphere** (a puff, a pouf): a sphere can be made from `n` gores. Radius `rho`, `n` gores of equal
  width: gore length from pole to pole = `pi rho`, gore width at distance `s` from a pole =
  `(2 pi rho / n) x sin(s / rho)`. Example: rho = 10 cm, n = 6: gore length 31.4 cm, maximum width 10.5 cm.
  For a stuffed shape add 1 to 2 cm to rho for the thickness of the filling.
- **Pad on a piece**: a separate piece sewn to the outside, stuffed after sewing, positioned by its
  centre line.
- **CLO3D**: padding is simulated as a thick, stiff fabric or with pressure in the pattern properties of
  CLO3D. Check what the API exposes; if pressure cannot be set, ask the person to set it.

### 3.10 Exaggerated sleeves and shoulders

- **Puff or leg-of-mutton**: slash from the cap down to a hinge at the bicep line and fan the cap; raise
  the cap; the sleeve head is then gathered into the armhole (worked example 6.3).
- **Dropped or extended shoulder**: lower the armhole seam below the shoulder point, widen the sleeve and
  the bodice to meet, and shorten the sleeve cap height (a flat cap).
- **Kimono / dolman / cocoon sleeve**: the sleeve and the bodice are one piece; the sleeve line starts at
  the shoulder neck point; the underarm is a gusset or a deep curve. Width at the arm (bicep) set by the
  design; add a gusset when the arm needs to be raised.
- **Bishop and bell sleeves**: fan spread from wrist or hem; a bishop is gathered at the wrist cuff.
- **Structured shoulder (padded, extended)**: raise the shoulder line over a pad, enlarge the cap to
  match.
- **Balance**: a large sleeve moves the armhole; the bodice armhole stays on the body unless the sleeve is
  one piece with it.

### 3.11 Cocoon and balloon shapes

A cocoon is wide in the middle and narrow at the ends; a balloon is the same with a gathered or tucked end.
They share one rule: extra surface length between two fixed edges bulges.

For a panel of straight length `L` between two attachments, with a surplus `E` (extra length of fabric),
the bulge height (stand-off) `s` is approximately:

```
E = 8 s^2 / (3 L)         so         s = sqrt( 3 L E / 8 )
```

(circular arc approximation for small E/L). Example: L = 55 cm, E = 7 cm gives `s = 12 cm` of stand-off (6.2 uses the reverse calculation).
Real fabric stiffness reduces it: soft fabric collapses, so cut the surplus larger or add a stiffer
underlayer.

For the horizontal direction the same rule applies for the surplus width held at the ends by gathers or
pleats.

**The two surpluses must agree.** If the widest circumference of the bulge is `W`, its radius is
`W / (2 pi)`. The stand-off `s` is that radius minus the radius of the chord between the two
attachments at the same level. Compute `E` from this `s`. If `E` comes out different from the length the
sketch implies, the drawing is not consistent: decide which one the sketch shows (side view first) and
tell the person.

### 3.12 Asymmetry

- Draft both sides separately (never on the fold) once the garment is asymmetric in cut.
- Keep the symmetric anchors (neck, shoulder points, centre front, centre back) as the references; the
  asymmetry is built between them.
- An asymmetric hem needs the grain direction decided for each piece: a hem rising to one side hangs
  differently from the opposite; test the hang.
- If the asymmetry is in volume (a one-sided puff), balance it with weight on the other side or ask whether
  the piece is meant to tilt.

### 3.13 Layering and cut-outs

- **Layers**: draft each layer from the same block with different lengths or ease; each layer has a facing
  or is finished at its edge. The attachments of layers are at a common seam or at offset seams.
  Number layers from the body outward and keep the order in the construction sheet.
- **Cut-outs**: a window cut into a piece needs a facing or a binding. Edge treatment by shape: curved
  hole, facing; sharp inside corner, reinforced with a patch or a stay stitch to the corner.
  A cut-out at a stress point (underarm, waist) needs a fixed edge (a reinforcement).
- **Transparent layers** (organza over opaque): layers are separate in simulation, so set the layer
  order in CLO3D.

### 3.14 Structured and architectural pieces

Pieces that hold a shape through construction.

- **Interfacing** (fusible or sew-in): adds stiffness to a region such as a collar or a peplum; cut it
  from the same piece minus the seam allowance (or 0.5 cm smaller).
- **Horsehair braid**: a stiff woven strip sewn into a hem edge to hold a curve out. Add the strip width to
  the hem.
- **Boning**: channels sewn on seam allowances or on the lining; channel width = bone width + 3 mm. Place
  along vertical seams for a corset, radially for a cone.
- **Wire**: sewn into a channel along an edge to hold a curve (hoop, cone, wings). Cut the wire 1 cm
  shorter than the channel; finish ends.
- **Foam and wadding**: for a sculpted pad, cut foam in the 3D shape, then pattern a cover from it by
  development (section 4).
- **Hoops and crinolines**: rings of boning or wire in tapes at heights `h1, h2, ...`. Ring circumference
  `C_i` given by the silhouette at that level (`C = pi x d` for a round ring); tapes at each level have a
  length `C_i + 2 cm` hem. Space rings 20 to 35 cm apart.
- Stiffening changes the thickness and the weight; the CLO3D fabric properties must reflect it (thickness,
  bending stiffness).

## 4. From 3D to 2D

### 4.1 Development of surfaces

A surface can be laid flat without distortion only if it is **developable**: a cylinder, a cone, or any
surface made of straight lines that does not curve in two directions at once. Fabric does not stretch
much, so any piece that is not developable must be made from darts, seams or gathers.

**Cylinder**: a flat rectangle, width = circumference, height = height. A tube with a different top and
bottom circumference is not a cylinder but a cone frustum.

**Cone and truncated cone (frustum)**: unrolls to a sector of an annulus.

```
top circumference Ct, bottom circumference Cb, slant height h (measured along the surface)
sector angle (rad)  theta = (Cb - Ct) / h
inner radius        R_top = Ct / theta  = h x Ct / (Cb - Ct)
outer radius        R_bottom = R_top + h
```

For a pointed cone (Ct = 0) the sector angle is `360 deg x (base radius / slant length)`.

The surface of a fraction `f` of a circle forms a cone whose side is at angle `alpha` from the vertical
axis with `sin(alpha) = f`:

| Fraction f | Angle of the surface from vertical | Look |
|---|---|---|
| 1/4 | 14.5 deg | nearly straight tube |
| 1/2 | 30 deg | classic half circle skirt |
| 3/4 | 48.6 deg | wide flare |
| 1 (full) | 90 deg | flat disc if stiff, falls in folds if soft |
| > 1 | not a cone | ruffled, wavy edge |

This holds for a stiff fabric. A soft fabric falls under its weight into folds below the geometric cone
(flutes), so the real flare is lower than the geometric cone. Slant height is measured along the
surface: vertical drop `= h cos(alpha)`.

Worked example (stiff peplum, section 6.5): waist 73, surface at 70 deg from vertical, so `f = sin 70 deg =
0.940`, `theta = 2 pi f = 338 deg`, `r = 73 / 5.905 = 12.4 cm`, `R = 12.4 + 15 = 27.4 cm`.

### 4.2 Double curvature

Bust, shoulder blade, seat, knee, elbow and any sphere-like volume have curvature in two directions
(positive Gaussian curvature). They cannot be flattened without removing or adding fabric. Tools:

| Tool | Effect |
|---|---|
| Dart | removes a wedge; ends at the apex of the curvature |
| Princess seam, split seams | spreads the removal over a long seam |
| Gathers, ease | collect extra length into a shorter edge |
| Gores | n panels meeting at the pole (football) |
| Stretch, bias, shrinking with steam | the fabric moulds itself (limited, about 5 to 8 % on a woven) |
| Cut and sew several pieces | more seams = better fit to the shape |

Quantity to remove: for a spherical cap of radius `rho` covered up to a distance `s` along the surface from
the pole, the flat circle of radius `s` has circumference `2 pi s`, the sphere only `2 pi rho sin(s/rho)`.
The total to remove (all darts together) is:

```
removed = 2 pi ( s - rho sin(s / rho) )
```

Example: a ball of radius 10 cm covered up to 15 cm from the pole: `2 pi (15 - 10 sin 1.5) = 31.6 cm`,
for instance 6 darts of 5.3 cm, or 6 gores. For a small cap, the removal is small: that is why a small
bust needs a small dart and a large bust a large one.

Rules:

- The more cap is covered, the more is removed: past a hemisphere (`s > pi rho / 2`) use seams or gores,
  not darts.
- Place darts or seams at the apex and radiate them; the apex is a landmark (bust point, elbow, shoulder
  blade, hip bone).
- Several small darts give a smoother surface than one large dart.
- A dart that ends before the apex by 2 to 3 cm avoids a point. (Same rule as `transformations.md`.)
- Alternatives to a dart: a style seam through the apex, a gathered or eased region, a pivot to a seam
  that already exists (the waist or the side).

Studies of flattening 3D garment shapes show that dart location, length and amount change the match
between the flat piece and the surface, and that cones and cylinders can be unrolled exactly while
body-shaped double curvature always needs an approximation; divide the surface into developable regions
along well-chosen seams, and use darts or gathers only where the distortion is large.

### 4.3 Flattening a drawn 3D shape into pieces

Procedure for a shape that has no block.

1. **Represent the volume** as a solid made of simple surfaces: cylinders, cones, spheres, a sum of
   rings. Sketch the profile (side view) as a curve `r(z)` (radius against height) for each region.
2. **Divide the profile** into zones where the profile is nearly straight (cone or cylinder) or nearly
   an arc.
3. **For each straight zone**, develop as a cone frustum (4.1): inputs `Ct`, `Cb`, `h`.
4. **For each curved zone** (a belly, a balloon), approximate the curve by several short cone segments
   (3 to 6), develop each, join the sectors along their common arcs; the joint arcs become curved edges
   of the pieces. Or use gores for a sphere-like zone (3.9).
5. **Split** the developed sectors into the number of panels the design needs (n gores): divide the
   sector angle by n and add a seam allowance. A panel's centre line is along the grain.
6. **Check** the edge lengths of every seam against the neighbouring piece with the `piece` command; a
   mismatch above 1 cm needs an ease note or a correction.
7. **Map to the body**: the garment touches the body at the contact points (section 2.1); add the
   fitted regions from the block.

### 4.4 Grain placement

Grain controls hang, stretch and appearance.

| Grain | Effect | Use |
|---|---|---|
| Lengthwise (parallel to selvedge) | stable, hangs straight | body, trouser leg, most pieces |
| Crosswise | a little more give, folds hang horizontally | yokes, borders, special effect |
| Bias (45 deg) | stretch, drape, twist | cowls, slip dresses, spiral seams, binding |
| Along the seam of a pleat | pleat holds | pleats |

Rules:

- The grain line is along the centre line of the volume, vertical for a hanging piece.
- Circles and partial circles have bias at the edges: see the 24 hour hang rule.
- A sleeve puff has the grain along the arm; the cap is bias at the front and back and has more ease.
- Plaids, stripes and prints must be matched at seams; state it in the sheet because it changes the width
  consumed.
- Stiff fabrics (crisp) can be cut off-grain to use a width; soft fabrics cannot.

### 4.5 Fabric width limits

Fabric is sold in widths roughly 110 cm (older Asian and American convention), 140 to 150 cm (the usual
European width) and up to 160 cm for some knits. Usable width = selvedge to selvedge minus 2 cm.

| Piece width | Action |
|---|---|
| fits within the usable width | cut as one piece |
| 1 to 1.4 x the usable width | cut with one seam, or turn the fabric (crosswise) |
| more than 1.4 x | add a seam in a design line, or use two lengths |
| cut on a fold | the unfolded width (twice the folded piece) must be within the usable width |

Examples with 150 cm wide fabric: a bubble skirt shell of 140 cm plus 3 cm for the seam is 143 cm: it
fits as one length. A full circle of 51 cm diameter fits easily. A circle skirt of outer radius 60 cm
needs a diameter of 120 cm: one half-circle per piece on a fold of 150 cm fits, but not on 110 cm
fabric; add a centre back seam.

Plan the layout for the actual width; a 110 cm fabric changes the amount of fabric by 30 % or more.

## 5. Iterative validation

Do the first pass in a simulated toile: coarse and fast. Do the second pass with the real fabric
properties.

### 5.1 Loop

1. **Draft** a first version from section 6 style steps. Mark every assumption.
2. **Send** it to CLO3D with the pieces, seams and a fabric close to the intended one
   (`clo3d.md`). Set the mesh size to the fit (loose volumes can keep the default).
3. **Simulate** until stable. Pause if a piece is placed wrong; see 5.4.
4. **Capture** the same views as the sketch: front, back, side, three-quarter, at the same camera angle,
   height and framing, with the avatar in the same pose. Always capture before and after a change
   (`clo3d.md`).
5. **Compare** with the sketch (5.2).
6. **Correct the pattern** (5.3), not the simulation.
7. **Repeat** until every measure in 5.2 is within tolerance, or until the remaining difference is a
   fabric difference that the person must decide.

### 5.2 What to measure on screenshots

Measure from images at the same scale as the sketch. Use the avatar's shoulder point to point (or the
hip width) as the unit of scale, the same unit as the sketch.

| Measure | Compare with | Tolerance |
|---|---|---|
| Silhouette width at shoulder, bust, waist, hip, hem | the design ratio `k` read from the sketch | within 10 % for volumes, 5 % for fitted parts |
| Level of widest point | drawn level (as a landmark fraction) | within 3 cm |
| Hem height at CF, CB, side | drawn | within 2 cm (more for bias before hang) |
| Stand-off of a volume from the body (side view) | drawn side view | within 15 % |
| Neckline depth and width | drawn | within 1 cm |
| Number and direction of main folds | drawn | same direction and similar count |
| Symmetry | drawn | visual |
| Penetration: body through cloth, clipping | none | zero |
| Stability: the shape at rest, not still moving | none | stable |

Procedure for widths: read the silhouette boundary row by row in the image (a pixel column per row at the
landmark levels); width in pixels divided by the avatar's width at that row gives `k`. The sketch's `k` at the same level is the target.

Check for the following and name them in the report: stretch (fit maps), strain, penetration, the cloth
resting on the pelvis or shoulders where it should stand off.

### 5.3 Symptom to pattern change

| In the simulation | Pattern change |
|---|---|
| Volume too small | add to the spread (more width or length), reduce a gather ratio, or add stiffness |
| Volume too large | reduce spread; check fabric weight |
| Volume collapses, folds in on itself | fabric too soft: add interlining, horsehair, or an underlayer; or cut the pattern with less surplus |
| Shape stands wrong direction (up, not out) | change the pivot point; change the hem curve |
| Hem rises at the sides | hem curve is too concave; redraw the hem so it meets the seams at 90 degrees |
| Hem drags at the back | back is too short or the front too long; check balance |
| Drag lines from the bust to the side | not enough width or length at the bust; add dart value |
| Pulls at the shoulder | shoulder slope or neck too tight; ease the neck |
| Armhole pulls, sleeve twists | sleeve cap and armhole mismatch; check lengths and notches |
| Folds in the wrong place | slash lines are in the wrong place; move the pivot |
| Seam crosses itself | invert the seam direction in CLO3D |
| Piece not placed on the avatar | hand over (5.4) |

The rule: change the pattern lines (point coordinates), then re-send. Do not use the simulation to hide a
pattern error (a stronger gravity, a clipping offset, an added collision thickness) except when the
person asks for a specific effect. Fabric choice is part of the design and may be changed with the
person's agreement.

### 5.4 When the user places or drags a piece

Automatic placement is limited to avatar arrangement points (`clo3d.md`). Hand over to the person when:

- pieces thread through each other (tunnel dresses, a sleeve that passes through a hole in a bodice);
- layers are nested (a skirt over a petticoat over a crinoline) and the order is not obvious;
- a piece begins inside the body or wraps around two body parts (a wrap, a scarf);
- a spiral piece must be wound around a limb;
- a rigid structure (hoop, wire) needs a start pose;
- two attempts have failed.

Handover: save the project, state which pieces need moving and where they must end up, wait for the
person's confirmation, then read back the new positions before any further action.

## 6. Worked examples

All use a size 38 woman: height 168, bust 92, waist 72, hip 100, nape to waist 40.5, hip depth 20,
back width 38. Fabrics: 150 cm wide. Numbers in cm are starting values.

### 6.1 Cocoon coat

**Sketch**: knee-length coat, narrow shoulders, widest at hip level (1.6 times the body hip width),
hem pulled in to about 70 % of the maximum, set-in sleeves with a slight curve, collar-less, one button.

1. **Anchors**: neck and shoulder points. Everything else is free.
2. **Volume map**: shoulder: close to the body; bust ease 24; hip circumference 154 (section 1.3);
   hem circumference 112 (70 % of 154 is 108; use 112 so the wearer can walk).
3. **Start**: coat bodice block with bust ease 24 (`ease.md`), length down to knee (row 6 of the map).
4. **Add the hip volume**: the coat is 154 cm round at the hip level: front and back pieces each 77 cm
   wide at hip level. Half pieces on the fold: 38.5 each at the hip.
5. **Draw the side seam** as a curve from the underarm (bust ease 24 gives 29 cm at the half piece) out
   to 38.5 at the hip level, then in to 28 at the hem (112/4 = 28 per half piece). Use `smooth`.
6. **Hem**: redraw the hem as a curve meeting the centre line and the side seam at 90 degrees. Run the
   `piece` command: front and back side seams must have the same length, and the hem must come out level
   when the seam is closed.
7. **Sleeve**: from the sleeve block, add 6 cm at the biceps, lower the underarm by 3 cm, keep the cap
   length equal to the armhole plus ease 2 to 3.
8. **Pieces**: front (on fold or with button stand), back (on fold), sleeve x2, front facing, back
   neck facing, pocket if any. Longest piece length: 100 cm. Width: 38.5 + front stand. Fits on 150.
9. **Fabric**: stiff enough to hold: boiled wool or heavy double crepe. Interface the facings; the
   side seams may need a flat tape at the widest point.
10. **Check**: simulate; side view should show the belly of the cocoon at the same landmark fraction as
    the sketch; if the coat collapses inward, raise the stiffness.

### 6.2 Balloon (bubble) skirt

**Sketch**: knee-length skirt, fitted at the waist, puffs from the waist to the hem, hem tucked inside to
a band.

1. **Landmarks**: waist, hem (55 cm below the waist). The whole length is a free zone.
2. **Lining**: straight skirt block, length 55, hem circumference 90, sewn to a waistband and a hem band.
3. **Width of the shell**: the sketch shows the widest point at 1.4 times the body hip width; with a
   100 cm hip, widest circumference `W = 140` (from section 1.3, round section).
4. **Stand-off**: radius at the widest point `140 / (2 pi) = 22.3`. The chord between the waist (73 / 2 pi
   = 11.6) and the hem band (90 / 2 pi = 14.3) has radius about 13 at mid-length, so `s = 22.3 - 13 = 9.3`.
5. **Surplus length** (section 3.11): `E = 8 s^2 / (3 L) = 8 x 86.5 / (3 x 55) = 4.2 cm`.
6. **Shell**: a rectangle gathered at both ends.
   - Width = 140 + 3 (seam) = 143. Gathered at the waist to 73 (ratio 1.92, medium fabric).
   - Gathered at the hem band to 90 (ratio 1.56).
   - Length = 55 + 4.2 + 1.5 (waist seam) + 1.5 (hem band seam) = 62 cm.
7. **Pieces**: shell 143 x 62 (1 cut, centre back seam), lining front and back, waistband, hem band
   (90 + seam allowances), zip or elastic at CB.
8. **Fabric**: crisp (taffeta, silk faille). A soft fabric gives a smaller puff: interline the shell hem
   with net or add 3 to 5 cm to `E`.
9. **CLO3D**: sew shell top to the lining waist and shell bottom to the hem band; the shell gathers
   because its edges are longer. Mesh size 10 mm. Compare the widest level and width with the sketch (5.2).

### 6.3 Exaggerated puff sleeve

**Sketch**: sleeve puffs at the head 14 cm above the shoulder line, fitted from elbow to wrist.

1. **Block**: sleeve block, cap height 14.5, biceps width 32, length 60, wrist width 24; armhole
   length 47 (so cap length = armhole + ease = 50).
2. **Slash lines**: centre grain line plus two each side, from the cap to a hinge at the biceps line,
   about 18 cm below the underarm.
3. **Spread**: fan, 4.5 cm at the cap each, giving 18 cm total width added at the cap.
4. **Raise**: pivot so the cap rises 8 cm; redraw the cap as a smooth curve.
5. **Cap length** check: the new cap length is about 70 (block 50, plus 18 and curve). Gather ratio
   against the armhole of 47: 70 / 47 = 1.49, within the 1.5 to 3 range for a crisp fabric.
6. **Gathers**: gather between the notches from front to back, none at the underarm (the last 4 cm each
   side are eased).
7. **Support**: add a sleeve-head tape of horsehair, net or a pad, 25 cm long, in the seam allowance
   so the puff stands. Without it, a soft fabric collapses.
8. **Hem**: the fitted lower part is the block's.
9. **Check**: simulate with the shoulder in place; compare the puff height with the sketch and adjust
   the raise (pattern) not the simulation.

### 6.4 Draped cowl dress

**Sketch**: bias slip dress, cowl neckline falling to the bust, thin straps, ankle length.

1. **Fabric**: silk charmeuse or satin-backed crepe; bias; 140 cm wide.
2. **Base**: dress block with bust ease 6 (bias hangs close), darts closed into the waist or removed (the
   bias takes the shape).
3. **Cowl**: a neckline that is cut wider than the body edge and folds in on itself.
   - Front bodice: slash from the neckline to the waist or side, 3 to 4 lines; at the neck, spread each by
     5 cm (starting value). The neckline gets longer by the total spread (about 15 to 20 cm).
   - Fold depth (drop of the cowl at CF) is about half to two thirds of the total spread (starting value;
     calibrate in the simulation).
   - Redraw the neck edge as a smooth curve.
4. **Straps**: set at the shoulder points, narrow (1.5 cm).
5. **Skirt**: the bias fall; two panels with a CF and a CB seam, narrow hem curve; grain at 45 degrees
   (bias) with the CF/CB line as the centre.
6. **Check**: the cowl must reach the sketch's depth with the cloth lying on the body, not on the
   straps only. If it falls lower, shorten the neck edge or add a drawcord inside the cowl hem.
7. **Hang**: let the garment hang for 24 hours before levelling the hem.

### 6.5 Sculptural peplum (stiff)

**Sketch**: fitted jacket, peplum standing out from the waist at about 70 degrees from vertical, 15 cm
long, edge level.

1. **Geometry**: the peplum is a cone frustum with the top circumference equal to the waist of the jacket:
   `Ct = 73`. Slant `h = 15`. Surface angle 70 degrees: `f = sin 70 = 0.940`.
2. **Development**: sector angle `theta = 2 pi f = 338 deg` (so slightly less than a full circle).
   Inner radius `r = 73 / (2 pi x 0.940) = 12.4`; outer radius `R = 27.4`; outer edge `= 161.6 cm`.
3. **Pieces**: a single ring with a slit (or a seam) at the centre back, or two halves. Inner edge 73, outer
   edge 161.6, height 15. Add a seam at the waist (sewn to the jacket waist seam).
4. **Structure**: the fabric must be stiff: heavy double-faced wool, interfaced silk, scuba. A soft fabric
   falls lower and into folds. Add horsehair braid at the hem to hold the edge; add fusible interfacing 1/2
   of the height at the waist.
5. **Hem**: the outer edge is a bias: let it hang before levelling; with a stiff fabric it holds.
6. **Fit**: waist seam eased 0.
7. **Check in CLO3D**: set the peplum fabric stiffness high, mesh 8 mm; compare the angle in the side
   view with the sketch; adjust `f` (a lower `f` gives a lower flare, a higher `f` a more horizontal one).
   If soft behaviour is unavoidable, choose `f` for the fall observed.

### 6.6 Asymmetric pleated top

**Sketch**: sleeveless top; a pleated panel crosses the front from the left shoulder to the right hip,
pleats fanning toward the hem.

1. **Base**: bodice block with ease 8 to 10; the pleated panel is a separate piece laid over the base.
2. **Panel geometry**: a trapezoid from the neck/shoulder line (finished width 40) to the right hip (finished
   width 56); length along its centre 55.
3. **Pleats**: 16 knife pleats, `p = 2.5` at the top, `p = 3.5` at the hem; underlay `u = p`.
   Fabric at top: `16 x 5 = 80`. Fabric at hem: `16 x 7 = 112`. Both fit on 140.
4. **Pattern**: draw the panel as a trapezoid with width 80 at the top and 112 at the hem, and draw the 16
   fold lines from the top to the hem (fanning).
5. **Pressing**: all pleats fall the same way (toward the right hip); stitch the pleats flat for 6 cm
   from the top; press or heat set the rest.
6. **Base**: on the base piece, the panel's outline is drawn as an internal line; the top of the panel
   is sewn into the shoulder seam and the hem into the hem seam.
7. **Fabric**: polyester crepe or satin that will hold pleats; natural fibres need pleating by a
   specialist or topstitching.
8. **Grain**: along the centre line of the panel.
9. **Check**: the pleats must not open under gravity: if they do, shorten the unstitched length or stitch
   the underlay.

### 6.7 Pattern Magic style volume: a square with a neck hole

**Goal**: a volume from pure geometry, in the spirit of the square and circle forms of the Pattern
Magic books (not a copy of any design). A square cape: no darts, no shaping, the shape comes from the
square hanging from the shoulders.

1. **Neck hole**: neck circumference 38 + 6 ease = 44, so a circle of radius `44 / (2 pi) = 7.0`
   in the middle of the square. Add a 1 cm seam allowance for a facing.
2. **Square**: side 120 (half side 60). Grain parallel to the sides.
3. **Orientation**: worn straight, an edge at the front and one at the back: centre front length from
   the neck circle = `60 - 7 = 53`; the corners fall over the arms, their distance from the neck circle =
   `60 x sqrt(2) - 7 = 77.8` along the diagonal, so the corners hang lower than the edges and point
   downward over the arms. Worn as a diamond (rotate 45 degrees), the points are at CF and CB (length 77.8)
   and the sides are 53.
4. **Shoulder slope**: the fabric over the shoulders turns down, so the real hanging length is shorter than
   these figures by the shoulder drop (about 4 to 5 cm at the shoulder point, more over the arm). State it.
5. **Slit and closure**: a slit from the neck circle to one edge (length 60 - 7 = 53) allows putting it on;
   close with a button or a hook at the neck.
6. **Edges**: the edges are on grain at the sides of the square and on the bias at the corners; hem with a
   narrow rolled hem or a facing; a crisp fabric holds the points.
7. **Fabric**: 150 cm wide, so the square of 120 fits with 30 cm spare; length 120 per cape.
8. **Variants by geometry**: replace the square by a circle (full circle, outer radius 60) for even folds,
   or by a triangle with the neck at one corner for an asymmetric drape. Each is the same method.
9. **Check**: simulate; compare the points and drop with the sketch; widen the hole or lengthen the
   square rather than changing the simulation.

## 7. Construction sheet and questions

### 7.1 Construction sheet (fill before drafting)

```
GARMENT
  Name:                       Sketch source (file / views):
  Wearer: height / bust / waist / hip / back length / other:
  Fabric: type / weight g/m2 / width cm / stretch % / hand (crisp, fluid):
  Lining / interlining / underlayer / padding / boning:

VIEWS
  Front: yes / no     Back: yes / no (assumption: ...)    Side: yes / no (assumption: ...)

LANDMARK MAP
  Landmark / sketch y / fraction between two landmarks / real position cm
  (shoulder, armpit, bust, waist, hip, crotch, knee, ankle, hem CF, hem CB)

VOLUME MAP
  Level / body C / garment C / design ease / produced by
  (shoulder, bust, waist, hip, hem)

LINES
  Each line in the sketch: seam / dart / gathers / pleats / fold / topstitch / edge; evidence; confidence

PIECES
  Name / count / cut / on fold? / grain / source block or construction / notes

SEAMS
  Edge to edge, ease or gather ratio, notches count, type

VOLUME TECHNIQUE
  Chosen technique / formula / numbers / reference section

STRUCTURE
  Interfacing / horsehair / boning / wire / padding: where and size

CLOSURE
  Type / position / length / opening width (can the garment be put on?)

FABRIC LAYOUT
  Widest piece / fits the width? / seam added for width / layout notes

ASSUMPTIONS
  List, each with what happens if wrong

OPEN QUESTIONS
  List, each with the impact on the pattern
```

Check before drafting: the garment can be put on (opening circumference at the head, shoulder, hips is at
least the body circumference there, with a closure if not); the wearer can sit and walk (hem width, rise,
length); every seam edge pair has an agreed length or ease; every gathered edge has a ratio; every piece
fits the fabric width.

### 7.2 Questions to ask when the sketch is ambiguous

Ask only what changes the pattern; put the rest in the assumptions. Offer a default with each question.

1. **Fabric**: what fabric, weight and width? Crisp, fluid, stretch? (Default: medium woven, 150 cm.)
2. **Wearer**: measurements and height, or a standard size? Heels? (Default: size 38, 168 cm.)
3. **Back view**: is there one? Is it a plain version of the front? Centre back seam, zip, buttons?
4. **Side view or depth**: how far does the volume project, front and back? (Default: depth 0.8 x width.)
5. **Closure**: where and what? Can the garment go over the head?
6. **Length**: at centre front and centre back; sleeve length; hem finish.
7. **Volume**: stand-off distance, and whether it should hold or soften. Is padding or a structure
   acceptable (boning, horsehair, wire, foam)?
8. **Seams**: are the lines in the sketch seams, folds or surface decoration? Is a seam allowed where the
   fabric width requires one?
9. **Lines of unknown kind**: gathers, pleats or tucks? How many? Which direction?
10. **Layers**: how many layers, which lengths, transparent or opaque, lining colour?
11. **Movement**: must the wearer walk, sit, raise the arms, dance? (Sets hem width, gussets, ease.)
12. **Fit versus drawing**: should the garment follow the drawing's exaggerated proportions or be adapted
    to the wearer's body?
13. **Asymmetry**: is it exact (mirror in the other direction) or is a side free?
14. **Reference**: does the sketch copy a known piece (a book, a collection)? If yes, ask for the source.
15. **Production**: one-off or series? Allowances, grading, finishing level.

If the person cannot answer, state the default, mark it in the construction sheet, and continue; flag the
parts that the default makes uncertain.

## Sources

Checked during the writing of this sheet (web, October 2026). Where a primary source could not be read,
the text says so.

- Fashion croquis, 9 to 10 heads against 7 to 7.5 heads for a real body: Vizcom, "Fashion croquis"
  (https://vizcom.com/blog/fashion-croquis); Riverside Secondary, "The Art of Drawing Fashion Design
  Figures" handout
  (https://myriverside.sd43.bc.ca/jcollins/2021/04/30/1-the-art-of-drawing-fashion-design-figures).
- Julian Roberts, Subtraction Cutting and Free Cutting (free PDF, Creative Commons Attribution): Royal
  College of Art research record, https://researchonline.rca.ac.uk/3060/ ; British Council note on
  Subtraction Cutting, https://design.britishcouncil.org/blog/2012/sep/27/subtraction-cutting ;
  Free Cutting at the Internet Archive, https://archive.org/details/free-cutting-julian-roberts ;
  workshop reports (Cutting Class, https://www.thecuttingclass.com/subtraction-pattern-cutting-with-julian-roberts/).
  The tunnel technique steps were taken from these descriptions and workshop reports, not from the PDF
  itself.
- Tomoko Nakamichi, Pattern Magic 1 to 3 (Laurence King): publisher listings and contents (for example
  https://www.hachette.co.uk/titles/tomoko-nakamichi/pattern-magic-2/9781856697064/ ). The exact
  instructions of individual designs were not available to read; the principles above are general
  slash-and-spread geometry and are labelled as such.
- Shingo Sato, Transformational Reconstruction: Müller and Sohn, "Cutting art with Shingo Sato"
  (https://muellerundsohn.com/en/allgemein/cutting-art-with-shingo-sato); The Shapes of Fabric, "Advanced
  TR cutting techniques" (https://www.theshapesoffabric.com/2020/05/24/advanced-tr-cutting-techniques);
  Vogue Fashion Institute overview
  (https://www.voguefashioninstitute.com/understanding-tr-cutting-in-the-world-of-fashion/). Secondary
  sources; no primary text was read.
- Timo Rissanen and Holly McQuillan, Zero Waste Fashion Design (Bloomsbury, first edition about 2016, new
  edition 2018): publisher and library listings
  (https://www.boffinsbookshop.com.au/books/9781350094833/zero-waste-fashion-design); McQuillan's
  process notes (https://hollymcquillan.com/2010/02/17/instructions-for-pattern-process); Iowa State
  digital press papers on zero-waste and minimal-waste design
  (https://iastatedigitalpress.com/itaa/article/2496/galley/2369/view).
- Circle skirt radius formulas (waist divided by 2 pi for a full circle, 2C/(2 pi) half, 3C/(2 pi) third,
  4C/(2 pi) quarter): The Creative Curator (https://www.thecreativecurator.com/circle-skirt-formula/);
  Minerva Patterns
  (https://minervapatterns.com/blog/drafting-a-circle-skirt-and-calculating-the-radius). The cone
  development formulas, the sin(alpha) = f rule, the stand-off formula for a bulge, the spherical-cap
  removal formula and the Ramanujan ellipse approximation are standard geometry, derived here and checked
  numerically; they are not from a pattern-making text.
- Developable surfaces and flattening, darts as a way to reduce the mismatch of double curvature: Au and
  Ma, developable-surface garment design (https://sites.ualberta.ca/~yongshen/index_files/%5BCiI%20Au&Ma%202010a%20Paper%5D.pdf);
  "Energy-based optimal darted pattern for garment design"
  (https://www.emeraldinsight.com/insight/content/doi/10.1108/IJCST-10-2012-0063/full/html); Rhino
  developing-surfaces notes (https://wiki.mcneel.com/rhino/developingsurfaces).
- Draping on the form and transfer to flat (truing, notches, return to the form): standard draping course
  handouts and Helen Armstrong, Draping for Apparel Design (not read in full for this sheet).
- Fabric widths (110 cm older convention, 140 to 150 cm European, up to 160 cm for some knits): Tissus
  Print (https://www.tissus-print.com/en/blog/fabrics-materials/what-does-fabric-width-mean-in-sewing-and-why-is-it-essential-before-printing-your-fabric).
- Slash and spread, sleeve fullness with a hinge to keep the cap: Seamwork
  (https://www.seamwork.com/articles/how-to-slash-and-spread-a-pattern).

Typical body and landmark values (flat widths, depths, heights above the floor), the gather ratios, the
starting values for cowl depth and ease, and the tolerances in section 5.2 are working values from general
pattern-making practice, not from a single source. Calibrate them with the wearer and the simulation.
