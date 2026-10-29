# Sleeves, cuffs, collars and necklines

Technique sheet. All values in cm, women's size 38 (EU) unless stated, taken as **typical starting values**.
Textbook systems differ by 0.5 to 1.5 cm on most constants. Never trust a constant over a measurement:
every sleeve is checked by measuring the cap against the armhole, every collar by measuring its neck edge
against the neckline. A toile settles the rest.

Conventions used below:
- `AH_f`, `AH_b`: front and back armhole length, measured on the seamline of the finished bodice, from the
  underarm point to the shoulder point (curved, use a tape on edge or a curve measurer).
- `AH = AH_f + AH_b`. Typical size 38 woven block: AH 43 to 46 cm.
- `AD`: armhole depth, vertical distance from the shoulder point level to the underarm (bust) line.
  Typical size 38: 20 to 22 cm. Rule of thumb: AH is about 2.1 x AD.
- `CH`: sleeve cap height, `SL`: sleeve length (shoulder point to wrist, arm slightly bent), `BW`: bicep width
  of the flat sleeve, `WW`: wrist width of the flat sleeve.
- `N`: neckline length on the seamline, measured separately for each half, CB to CF.
- SA: seam allowance. Drafting is on the seamline; allowances are added last (see `finishes.md`).
- Notch convention of this skill: one notch front, two notches back, one notch at the cap top
  (see `finishes.md`).

Cross references: block and ease values in `blocks.md` and `ease.md`, slash-and-spread in
`transformations.md`, CLO3D export and fabric setup in `clo3d.md`.

---

# PART 1 - SLEEVES

## 1.1 Sleeve vocabulary and the armhole relationship

| Term | Meaning |
|---|---|
| Sleeve cap / head | Curved top of the sleeve that fits the armhole. |
| Cap height (CH) | Vertical distance from the cap top to the bicep line. |
| Bicep line | Horizontal line at the underarm level, perpendicular to the grain line. |
| Elbow line | Horizontal line at elbow level, about SL/2 + 2.5 to 3 cm below the cap top. |
| Cap ease | Cap length minus AH. Fullness eased into the armhole between the notches. |
| Pitch | Forward rotation of the sleeve in the armhole. Controls where the sleeve hangs. |
| Balance notches | Front notch and back notches. They fix the pitch. |
| Hindarm / forearm seam | Back and front seam of a two-piece sleeve. |
| Sleeve slope | Angle of the sleeve axis to the horizontal, for kimono, dolman and raglan. |

Cap height decides the trade-off between fit and mobility:

| Cap height / AD | CH, size 38 | Look and use |
|---|---|---|
| 0.70 to 0.78 | 15 to 16.5 | Tall cap, narrow bicep. Tailored jacket, coat. Clean shoulder, limited arm lift. |
| 0.62 to 0.70 | 13.5 to 15 | Standard fitted woven blouse, dress, light jacket. |
| 0.52 to 0.60 | 11 to 13 | Shirt sleeve. Wider bicep, more lift, more folds under the arm. |
| 0.35 to 0.50 | 7 to 10.5 | Drop shoulder, sportswear, oversized, many knits. |

Cap height can also be computed as about 1/3 of AH (43 cm gives 14.3 cm); both rules give the same result on
a normal block. Freesewing-type parametric drafts expose it as 40 to 60 percent of a reference depth.

Relationships to remember (all approximate, verify by measuring):
- Raising CH by 1 cm lengthens the cap curve by 0.6 to 0.7 cm if the bicep width stays the same.
- Widening BW by 1 cm on one side lengthens the cap by 0.6 to 0.7 cm.
- A higher cap with the same cap length needs a narrower bicep. A lower cap needs a wider bicep.
- Bicep width: `BW >= bicep circumference + ease`. Ease at the bicep: 4 to 5 fitted, 6 to 8 jacket in woven,
  10+ shirt, 2 to 3 stretch knit.

---

## 1.2 Set-in sleeve, one piece

**What:** sleeve sewn into the armhole circle of the bodice, with the seam at the arm root.
**Recognize:** a seam running from the shoulder point round the armhole; the sleeve has a convex cap and a
smooth sleeve head without a gather unless the style is puffed.
**Pieces:** sleeve x2 (one left, one right, mirrored). Optional sleeve head (see finishes). Cuff or hem facing separate.

### Cap ease by fabric

Total ease is distributed between the notches. It is measured as `cap length - AH` on the seamlines.

| Fabric | Cap ease (cm) | Note |
|---|---|---|
| Shirting cotton, poplin, with flat-felled seam | 1.5 to 2.5 | Low cap, shirt set-in flat. |
| Light crepe, georgette, silk | 2 to 3 | Eases and shrinks with steam. |
| Tailored wool, flannel, worsted suiting | 3 to 5 | 4 to 5 for a canvassed jacket with a sleeve head. Tall cap. |
| Tweed, boiled wool, bouclé (loose structure) | 4 to 5 | Wool shrinks well. |
| Linen, heavy cotton, denim, twill | 1.5 to 3.5 | Stiff, shrinks poorly. Keep low. |
| Woven stretch (2 to 3 percent elastane) | 1 to 2 | |
| Knit (jersey, interlock) | 0 to 1 | Pattern drafted close to AH. |
| Sweater knit, rib | 0 | Often negative: sleeve a little shorter than the armhole. |
| Leather, coated, vinyl, bonded | 0 to 1 | Cannot be shrunk. Raise the shoulder point instead. |

Sources agree that 3 to 4.5 cm is standard for a fitted tailored sleeve and that shirt sleeves take roughly
half that. Percentage check: 3 to 6 percent of AH for woven, under 2 percent for knits.

### Drafting steps (woven, fitted)

Inputs: AH_f, AH_b, AD, SL, bicep and wrist measurements, planned ease E (table above).

1. **Axis.** Draw a vertical line. Mark A = cap top. B = A + CH (bicep line level). Hem point H = A + SL
   (sleeve length measured from the shoulder point).
2. **Bicep line.** Draw a horizontal line through B.
3. **Elbow line.** Draw a horizontal line at `SL/2 + 2.5 to 3` below A. Mark it.
4. **Cap width points.** From A, swing an arc to the bicep line on the front side: point F with
   `A-F = AH_f + e_f`. On the back side: point K with `A-K = AH_b + e_b`.
   - Typical split of E: `e_f = 0.3 E`, `e_b = 0.7 E`, or `e_f = 0 to 0.5` and `e_b = 1 to 1.5` for small E.
   - These are straight chords. The curve will be longer. Keep E small in the chord stage (about half of the
     final E) and correct after step 6.
5. **Check width.** `F-K >= bicep + ease`. If narrower, the chord stage gave too little: raise the ease share
   rather than lowering the cap.
6. **Cap curve.** Draw the curve through guide points, front half first.
   - Front chord A-F: divide into 4. At the first quarter from A, square out **1.8 to 2.0**. At the midpoint
     the curve crosses the chord (front notch zone). At the third quarter, square in **1.0 to 1.3**. The curve
     meets F tangent to a line square to the grain at the underarm (no angle at F).
   - Back chord A-K: divide into 3 parts. At the first third from A, square out **1.2 to 1.5**. At the end of
     the second third, square in **0.5 to 1.0**. Curve meets K the same way.
   - Draw with a French curve or a hip curve; keep a flat spot of 4 to 5 cm at the top (not a point).
7. **Measure.** Measure the curve with a tape on edge. Required: `cap = AH + E`.
   - If cap is too long: reduce CH by `delta / 0.65`, or narrow F and K equally.
   - If cap is too short: increase the same way.
   - Do not correct by flattening the curve guide points beyond +/- 0.5 cm.
8. **Underarm seam lines.** Join F to the front wrist corner and K to the back wrist corner.
   - Hem width: `WW = wrist + 3 to 4` (fitted), `+5 to 6` (hand must pass if no opening, check hand circumference 21 to 24).
   - Hem is symmetrical about the axis: `H-F' = H-K' = WW/2` in a straight sleeve.
9. **Notches.**
   - Top notch at A (on the axis), matches the shoulder seam. Pitch is neutral.
   - Front notch single, where the sleeve cap meets the front bodice balance notch. Transfer by distance along
     the curve from F: `armhole distance underarm-to-front-notch`.
   - Back notches double, same method from K.
   - Mark the **no-ease zone**: the lowest 5 to 6 cm of each side from F and K. Ease only between the
     notches. Test with a measure: bodice notch distance vs sleeve notch distance, front and back, difference
     within 0.3 cm.
10. **Pitch.** To rotate the sleeve forward (more arm-forward posture, typical for tailored sleeves),
    move the top notch 1 to 1.5 cm toward the front of the shoulder seam when setting, and add the same to
    the hem front wrist. Match with the pitch of the shoulder.
11. **Grain.** Along the axis. Add SA after verification.

### Sewing order (set-in)

1. Staystitch the armhole 0.3 cm from the seamline, front and back, to prevent stretch.
2. Close the sleeve underarm seam (or leave the sleeve open if setting flat on a shirt).
3. Ease stitch two rows (3.5 mm) between the notches, 0.6 and 1.0 cm from the raw edge. Pull the bobbins.
4. Pin right sides together: notches, then underarm, then shoulder, then ease evenly. Steam the cap over a
   tailor's ham to shrink out the fullness before stitching (wool).
5. Stitch sleeve side up. Trim to 0.7 cm and overlock, or bind.
6. Sleeve head strip (wool, canvased): bias or wadding strip 3 x 20 cm, set into the seam at the cap
   (see finishes). Press seam toward the sleeve, never open.

### Interfacing and finish

- Light woven: none, or a bias strip of fusible at the hem.
- Jackets: sleeve head (hair canvas or wadding, 1 to 1.5 cm over the seam), armhole stay tape on the bodice
  (cotton twill 1 cm, cut 1 cm short at the front, 0.5 short at the back).

### Common faults

| Symptom | Cause | Fix |
|---|---|---|
| Horizontal drag lines across the cap | Cap too low or too narrow | Raise CH by 1 cm, add width at F and K. |
| Puckers around the cap | Too much ease or uneven distribution | Reduce E, shift ease to the upper 2/3, shrink the cap with steam. |
| Diagonal folds from the cap to the front | Pitch too far back | Rotate the sleeve forward, move the notches. |
| Fold at the front armhole | Front cap too long | Take 0.5 cm off the front chord, add to back. |
| Wrinkle above the bicep when the arm is lowered | Cap too high or bicep too wide | Lower the cap 1 cm, narrow the bicep. |
| Sleeve rolls back | Pitch too forward | Rotate back 1 cm. |
| Cap sinks into the armhole | Cap too low, too much ease | Add height. |

**CLO3D:** sew sleeve to bodice with segment sewing, not free sewing, so the notches stay matched. Use the
Arrange (Alt+Click arrangement points) at the sleeve axis, rotate the sleeve slightly forward, then simulate.
Add the cap ease by sewing the longer cap segment to the shorter armhole in the Edit Sewing tool; do not rely on
stitch-ratio shortcuts. Shrink the cap with fabric `Shrinkage` only on wool presets that support it.

---

## 1.3 Shirt sleeve with low cap

**What:** set-in sleeve with a flat cap, wide bicep, sewn flat before the side seam closes. **Recognize:**
armhole seam is flat-felled or double-needle on a shirt; arm raises easily; folds fall under the arm; the
shoulder seam is dropped or extended.
**Pieces:** sleeve x2, cuff x2 (outer plus lining, or one folded), placket(s), optional sleeve head: none.

Draft as 1.2 with these changes:

| Parameter | Value |
|---|---|
| Armhole depth | Deepen the bodice armhole by 2 to 3 cm (men) or 1.5 to 2 cm (women) and extend the shoulder 1 to 2 cm. |
| CH | `0.52 to 0.60 x AD`. Men's shirt: 10 to 13 cm; women's blouse: 11 to 13 cm. |
| Cap ease | 1.5 to 2.5 (flat-felled), up to 3 when plain seam. |
| Bicep ease | 10 to 16 cm at men's shirt, 8 to 10 at women's blouse. |
| Cap shape | Flatter. First guide point out 1.2 to 1.5 instead of 1.8. |
| Sleeve length | Add 1 to 2 cm for the cuff pleat/drop over the cuff (blouse). |
| Wrist | Wrist circumference + 6 to 8 (pleats/gathers absorb the difference with the cuff). |

**Sewing order (shirt):** yoke and fronts, shoulders, press; sleeves set flat into the open armhole
(right sides together, then flat-fell or top-stitch), then close the side and the sleeve underarm in one run
(flat-felled), attach plackets before this, then cuffs.
**Fault:** sleeve too low and too tight: raise the cap, widen the bicep line.

---

## 1.4 Two-piece tailored sleeve

**What:** sleeve in two shaped pieces (top sleeve and under sleeve), joined by two seams at the
forearm (front) and hindarm (back), with a built-in elbow curve. **Recognize:** two curved seams on the
inner side of the sleeve; the sleeve hangs with a slight natural forward curve; on a jacket there is often a
vent or button cuff at the hem.
**Pieces:** top sleeve x2, under sleeve x2 (one pair mirrored), optional sleeve head x2, cuff vent or
facing at hem. Four main pieces.

### How the geometry works

Cut a one-piece sleeve along its axis: the underarm seam is where front and back edges meet. A two-piece
sleeve removes that seam. The pieces are:
- **Under sleeve:** a strip around the original underarm seam. It contains the lower third of the cap
  (underarm area). It is narrow at the elbow and flares gently at the hem.
- **Top sleeve:** the rest of the sleeve, with the axis and the cap top. It is the wider and longer piece.
Seams start at the notches on the cap: the forearm seam at the front notch, the hindarm seam a little
higher than the back notch (so that the seam is behind the arm line and hidden).

### Draft from a one-piece block (typical method)

Start with a one-piece fitted sleeve (1.2) with cap ease 3 to 4 cm, elbow line, and the front/back notches.

1. **Forearm line.** From the front notch on the cap, draw a line down to the hem. At the bicep line
   it sits **5 to 6 cm** in from the front edge of the block, at the hem it sits **4 to 5 cm** from the front
   hem corner. This line becomes the seam on both pieces.
2. **Hindarm line.** From a point 1.5 to 2 cm above the back notch, draw a line to the hem, **6 to 7 cm**
   in from the back edge at the bicep line, **5 to 6 cm** at the hem.
3. **Separate.** Trace the top sleeve as the center portion. The under sleeve is the front strip plus the
   back strip, rejoined along the original underarm seam (front edge to back edge) to form one piece. The
   strips are joined with matching points at the bicep line and the hem.
4. **Seam shift for hidden seams.** Move the top sleeve's front edge **1.5 to 2.5 cm** past the line toward the
   under sleeve at the cap and bicep line, and cut the under sleeve the same amount shorter. This puts the
   forearm seam on the underside of the arm. Do the same on the hindarm side if the sleeve is to be worn with
   a bent arm. Seam lengths remain equal.
5. **Elbow shaping.**
   - On the hindarm line of the top sleeve, make the elbow length longer than the matching under sleeve edge
     by **1.5 to 2.5 cm** between the elbow line +/- 6 cm: draw this as an elbow dart in the top sleeve or
     as a slash spread of 2 cm at the elbow line pivoting at the forearm line. The longer top sleeve edge is
     eased to the under sleeve when sewing (ease balance).
   - The forearm seam is kept straight or slightly curved concave. Under sleeve forearm edge may carry
     0.5 cm of ease at the elbow.
6. **Hem shape.** Curve the hem slightly: the front wrist corner is lifted 1 cm, the back wrist corner
   dropped 0.5 to 1 cm so the sleeve hangs naturally. The hem of the top sleeve is longer by 1 to 1.5 cm at
   the back.
7. **Pitch.** Move the hem front 1.5 to 2 cm forward of the axis. The sleeve then hangs forward; this is
   the pitch built into the draft. A top sleeve that pulls toward the front has too much pitch; one that
   falls back has too little.
8. **Vent and cuff.** Hem allowance 3 to 4 cm for jackets. Vent: top sleeve overlap extension 3 cm wide
   x 8 to 10 cm long, with a mitred corner at the hem.
9. **Notches.** Cap notches as 1.2. Elbow notches on each seam (one on forearm, two on hindarm) so the
   eased top sleeve edge matches the right section.
10. **Check.** Measure the finished cap on the seamlines of both pieces: `cap = AH + E`, E = 3 to 5 in wool.
    Measure the forearm seam on both pieces: equal within 0.3 cm. Measure the hindarm: top sleeve is longer by the
    elbow ease only.

### Sewing order

1. Interface the hem of both pieces (bias or woven 3.5 to 4 cm).
2. Sew the hindarm seam first (top sleeve on top, ease to the under sleeve between the elbow notches),
   press open on a sleeve board.
3. Make the vent, hem and any buttons.
4. Sew the forearm seam, press open.
5. Hem, set the sleeve, set the sleeve head.

### Common faults

| Symptom | Cause | Fix |
|---|---|---|
| Sleeve twists toward the front | Pitch too forward | Shift the hem 1 cm back. |
| Pulling at the elbow when the arm bends | No elbow ease | Add 2 cm elbow dart/ease on the hindarm. |
| Seam visible from the front | Seams not shifted underneath | Move the top sleeve 2 cm further under. |
| Under sleeve looks too wide at the hem | Under sleeve strip too wide at the hem | Narrow by 1 cm each side. |

**CLO3D:** keep two sleeve pieces and sew the forearm seam, then the hindarm seam with an ease ratio
(top sleeve longer). Use Fold Arrangement on the elbow curve to bend the arm; arrange sleeve pitch with the
avatar arm at a relaxed pose.

---

## 1.5 Raglan sleeve

**What:** sleeve whose seam runs diagonally from the neckline to the underarm; there is no set-in cap and no
shoulder point. **Recognize:** diagonal seam from neck to underarm on front and back; sleeve appears to take
the shoulder.

| Type | Seams | Pieces | Use |
|---|---|---|---|
| Classic one-piece raglan with shoulder dart | Diagonal front and back raglan seams, dart at shoulder | Front x2, Back x1 or x2, Sleeve x2 | Coats, knitwear, outerwear |
| Two-piece raglan (with top seam) | Diagonal seams plus a seam along the sleeve top from neck to wrist | Sleeve x4 (front/back halves), body x3 | Sportswear, knits, tailored coat |
| Saddle | Yoke extension runs along the top of the sleeve | Yoke-sleeve extension x2 | Casual, knit |
| Hampton / semi-raglan | Raglan seam ends near mid-armhole | Variant | Shirts |

### Draft (classic raglan with shoulder dart)

1. **Raglan line on the bodice.**
   - Front: start on the neckline **3 to 5 cm** from the shoulder neck point (SNP). End on the armhole **3 to 4 cm**
     above the underarm point. Join with a slightly concave curve (1.0 to 1.5 cm in).
   - Back: start on the back neckline **3 to 5 cm** from SNP. End on the armhole **3 to 4 cm** above the underarm point.
     Curve like the front.
2. **Cut away.** The piece between the raglan line and the armhole (including the shoulder) is removed from
   the bodice and attached to the sleeve.
3. **Sleeve block with a lowered cap.** Use the fitted sleeve (1.2) but lower the cap: the raglan sleeve
   cap is 3 to 4 cm lower, with a bicep line lowered by 1.5 to 2 cm and narrower sleeve slope. Mark the axis
   and the sleeve centre line.
4. **Attach the cut-away pieces.**
   - Lay the front piece with its underarm point on the front underarm point of the sleeve, the shoulder
     point **1.5 to 2.5 cm** from the cap top.
   - Lay the back piece on the back underarm point the same way. The shoulder edges leave a gap at the top;
     the gap is a shoulder dart or seam of **2 to 3 cm** at the shoulder tip.
   - The lines of the raglan seam on the sleeve are the same as on the bodice (lengths equal).
5. **Shoulder dart.** Close the gap with a sleeve-top dart of 2 to 3 cm width, 12 to 18 cm long, pointing
   toward the elbow. This is how the one-piece raglan keeps the shoulder shape.
6. **Sleeve slope.** The sleeve axis slopes at 30 to 40 degrees below horizontal. The steeper the slope,
   the less arm lift and the more drag at the underarm; flatter slope = more fold under the arm.
7. **Underarm.** Underarm sleeve and body seam curved with a 2 to 3 cm gusset-type notch (a small curved
   notch where the raglan seams reach the underarm) to allow arm movement.
8. **Two-piece raglan.** Slash the sleeve along the axis and open to a straight top seam, or draw the seam
   shifted forward by 1.5 cm; this seam takes the elbow ease on the hindarm.
9. **Notches.** Front raglan: single notch; back raglan: double. Match at the neck, at 1/3 of the seam, and
   at the underarm.
10. **Check.** Each raglan seam on sleeve = same seam on bodice (within 0.3 cm). Cap ease is 0 on raglan (set
    flat, with slight ease of 0.5 to 1 cm near the shoulder dart).

### Sewing order

1. Sew shoulder darts. 2. Sew front raglan seams (sleeve to front), 3. back raglan seams, 4. close sleeve
and side in one seam, 5. neckline finish (ribbing, facing), 6. hem.

### Common faults

| Symptom | Cause | Fix |
|---|---|---|
| Diagonal drag from neck to underarm | Raglan line too high or short | Lower the start point 1 cm, lengthen the seam. |
| Shoulder bulge | No shoulder dart | Add 2 cm dart or ease. |
| Armpit pulls up | Sleeve slope too steep | Flatten slope by 5 degrees, add underarm gusset. |

**CLO3D:** raglan sleeves are easiest as a single flat shape sewn to body pieces with matching notches. Set
the avatar arm at the A-pose and check pulling at the armpit.

---

## 1.6 Kimono and dolman sleeves

**What:** sleeve cut in one with the bodice. Kimono is a straight extension; dolman has a deep curved armhole
with a wide upper arm tapering to the wrist.
**Recognize:** no armhole seam; the shoulder line continues into the sleeve; horizontal folds under the arm.
**Pieces:** front x1 on fold or x2, back x1 or x2, optional gusset x2, cuff or hem band.

### Sleeve slope and arm lift

| Slope (below horizontal) | Gusset | Arm lift | Comment |
|---|---|---|---|
| 0 to 15 degrees | Required | 90 degrees | T-shape tunic; gusset 10 to 12 cm |
| 20 to 30 degrees | Recommended | 60 to 70 degrees | Wrap tops |
| 35 to 45 degrees | Optional, none for light fabric | 40 to 50 degrees | Light knits, fitted look |

### Draft (kimono with gusset)

1. Start from the bodice block (front and back). Draw the shoulder line and extend past the shoulder point
   by the sleeve length minus the shoulder width.
2. **Slope.** Draw the sleeve top line at **20 to 30** degrees below the extended shoulder line (flatter =
   more lift but more drag).
3. **Underarm.** From the side seam at the bust line (or 2 to 3 cm lower), draw the underarm line parallel
   to the sleeve top, offset by the sleeve width (bicep + ease, divided by 2). Fit rounding: curve the join
   between the sleeve underarm and the side seam with a 3 to 5 cm radius.
4. **Gusset slash.** Cut a slash at the underarm of the bodice, from the point where the sleeve meets the
   side seam inward along the underarm line for **8 to 12 cm**.
5. **Gusset.** A diamond (or square on point) with side **8 to 12 cm** is inserted in the slash. The sides
   of the diamond equal the slash lengths; the diamond is cut on the bias or on grain parallel to the sleeve
   axis.
6. **Hem.** Hem at wrist or cuff. Gusset corners seamed with a reinforced stitch.
7. **Neckline and shoulder.** Lower the shoulder tip by 1 cm to avoid a ridge at the shoulder line.

### Draft (dolman / batwing)

1. Slope **35 to 45** degrees below horizontal.
2. Underarm curve lowered **15 to 25 cm** below the bust line, ending in a rounded curve at the waist or hip.
3. The sleeve width at the arm = bicep + 12 to 20 (drape ease).
4. The side seam joins the sleeve underside in a smooth curve; no gusset because the depth supplies the lift.
5. Knit fabric: a cuff or rib hem, wrist width = wrist + 4.

**Sewing order:** shoulder/top sleeve seam, then underarm/side seam as one continuous seam, finish the
curve with clipped seam or bias tape. Insert gusset with the intersection points sewn as the last two
stitches, pivoting at each corner.

**Fault:** drag lines from neck to underarm: too steep slope or no gusset: flatten slope or add gusset.
Armpit folds: shorten the underarm curve and lower its point.

**CLO3D:** kimono and dolman patterns drape well. Use the T-pose if the gusset is large; check the
avatar arm raise.

---

## 1.7 Drop shoulder sleeve

**What:** shoulder seam extended past the shoulder point, armhole lowered, sleeve cap flattened.
**Recognize:** armhole seam hangs on the upper arm; the sleeve is fuller and straight.
**Pieces:** sleeve x2.

Draft:
1. Extend the shoulder line by `D = 3 to 8 cm` past the shoulder point; lower the shoulder point accordingly
   (slope of 1 to 2 cm).
2. Lower the underarm by `D`: new AD = AD + D (reduces the arm lift).
3. Cap height `CH = 0.35 to 0.50 x new AD` (about 7 to 11 cm). Cap ease **0 to 1.5**.
4. Bicep width = bicep + 10 to 20 (oversize).
5. Draw the cap curve nearly straight (guide points out 1.0 to 1.2).
6. Notches as for set-in.

Faults: side seam too tight when the arm lifts: add 1 to 2 cm of ease to the sleeve width. Sleeve too short:
the lowered armhole shortens the sleeve; add D to the sleeve length.

---

## 1.8 Cap sleeve

**What:** a very short sleeve covering only the shoulder. **Recognize:** a small curved piece over the shoulder
point; the hem does not reach the arm's circumference.
**Pieces:** sleeve x2 (or a bodice extension).

Draft from the sleeve block:
1. Cut the sleeve at **5 to 8 cm** below the cap top (hem line); the cap curve is unchanged.
2. Hem is curved with the shape of the arm. To prevent the sleeve from flaring: pivot at the underarm
   to close **1.5 to 2.5 cm** at the hem, so the sleeve sits close to the arm.
3. Raise the armhole at the underarm by **1 to 1.5 cm** and narrow the shoulder.
4. Cap ease **0 to 2** (cap sleeves rarely take much ease).
5. For the extended-shoulder cap variant: extend the bodice shoulder 4 to 6 cm from the shoulder point, round
   the corner.

Fault: cap sleeve gapes away from the arm. Fix: reduce hem width, close the pivot at the underarm.

---

## 1.9 Puff sleeves (top, bottom, both)

**What:** a sleeve gathered at the head, the hem, or both to create volume.
**Recognize:** gathers at the cap; blousing over the cuff; balloon outline.
**Pieces:** sleeve x2, cuff or band x2 (or elastic), optional lining or net x2 for support.

### Fullness and length

| Parameter | Value |
|---|---|
| Gather ratio | 1.5 to 2.0 x for fine fabrics, 1.25 to 1.5 x for heavy ones |
| Extra length at the head | 2 to 4 cm (raised cap) for a high puff |
| Extra length at the hem (blouson) | 2 x desired drop (cm), typical 6 to 10 cm for a 3 to 5 cm drop |
| Cuff width | wrist + 3 to 4, height 4 to 7 |

### Types

1. **Top puff (head puff).**
   - Draw 5 vertical lines from the cap to the hem (spacing equal).
   - Slash from the cap to 2 cm from the hem. Pivot and spread each by **2.5 to 3.5 cm** at the cap,
     for a total of **10 to 18 cm** extra cap length.
   - Raise the cap: add **3 to 4 cm** at the top, redrawn as a smooth arc.
   - The cap ease becomes the gather: 12 to 20 cm. Mark gather points on the notches. Keep the
     underarm 4 to 5 cm flat (no gather).
2. **Bottom puff (hem puff).**
   - Slash lines from hem to the cap, spread at the hem by **6 to 10 cm** per line (total 20 to 40 cm).
   - Add length at the hem: `blouse allowance = 2 x drop`.
   - Attach to a band or elastic casing. The cap stays as in the set-in sleeve.
3. **Top and bottom puff (full puff).**
   - Combine both: slash and spread at the cap and the hem; add length for hem drop; cap raised.
   - The shape is a bell: wide at both ends, narrow in the middle.
   - A sleeve lining of net or a cap form (padding) keeps the head up.

### Sewing

1. Gather the head with two rows of long stitches (4 mm) between the notches, pull to fit the armhole.
2. Gather the hem the same way and attach to the band (or thread elastic in the casing).
3. Insert the sleeve; add a seam on the underarm with a band or elastic, press the head over a ham.

Faults: sleeve collapses: add net/horsehair lining, use stiffer fabric, increase the cap raise. Gathers
not even: use 3 rows of stitching, even tension.

---

## 1.10 Bishop sleeve

**What:** long sleeve fitted at the shoulder, with fullness gathered at the cuff. **Recognize:** a soft balloon
at the lower arm and a drop over a narrow cuff.
**Pieces:** sleeve x2, cuff x2, placket (one slit or continuous lap).

Draft:
1. Fitted sleeve block (1.2); draw the elbow line.
2. Slash from the hem to the elbow line (stop 1 cm from the cap seam). Spread **10 to 20 cm** in total at the
   hem (3 to 5 slashes).
3. Add length: **5 to 8 cm** blouson over the cuff.
4. Hem curved up at the centre: drop at the back wrist 2 cm.
5. Cuff: barrel cuff (1.19), length wrist + 4 to 6.
6. Placket in the hindarm slit (see 1.20).

Fault: balloon too low: raise the spread zone (start spread at the bicep line instead of the elbow).

---

## 1.11 Leg-of-mutton (gigot) sleeve

**What:** full, high sleeve head tapering to a fitted forearm. **Recognize:** a large puff at the shoulder, then
a tight tube from the elbow down.
**Pieces:** sleeve x2 (often made in two sections), lining x2 (net or interlining for the head).

Draft:
1. Fitted sleeve block, elbow line marked.
2. Draw slash lines: axis, 4 to 5 lines above the elbow line at equal spacing from the cap to the elbow.
3. Slash from the cap to the elbow line; spread to **12 to 25 cm** total width at the bicep line; the width at the
   elbow stays as the block (fitted).
4. Raise the cap **4 to 8 cm** (head height). Use a high smooth arc with a 3 cm flat top.
5. Cap ease becomes gather: 10 to 20 cm over the cap, none in the lowest 6 cm.
6. Lengthen the front/back side seams at the bicep to keep the line balanced.
7. Forearm: narrow tube, wrist closed with a slit (hindarm) and buttons, or a zipper.

Fault: head droops: net lining; raise the cap more; add a sleeve head.

---

## 1.12 Lantern sleeve

**What:** sleeve fitted at the shoulder and wrist, gathered full in the middle. **Recognize:** a balloon at the
elbow area bound at two levels.
**Pieces:** upper sleeve x2, lower sleeve x2 (or one piece with a ruched casing and elastic), band x2.

Draft:
1. Fitted sleeve; divide at the elbow line.
2. Upper part: from the cap to about 5 cm above the elbow. Lower part: from there to the wrist.
3. Slash both parts into 4 to 5 vertical strips and spread by **3 to 4 cm** each at the join line (total 12 to 16 cm).
4. Add **4 to 6 cm** length for the blouse.
5. Join with a gathered seam to a band, or draw channels for elastic at the top and bottom of the bulge.

Fault: elbow bulge looks stiff: use a soft fabric and a 1.5 gather ratio.

---

## 1.13 Bell and flared sleeve

**What:** sleeve widening toward the hem. **Recognize:** hem circumference much larger than the wrist.
**Pieces:** sleeve x2; optionally a hem facing (circular).

| Type | Where flare starts | Hem circumference |
|---|---|---|
| Soft bell | Elbow or higher | 1.5 to 2 x bicep |
| Trumpet | Mid-forearm | 1.5 x wrist at flare start |
| Angel / full circle | Entire sleeve | Calculated from radius |
| Flared cuff | At the wrist | Extra piece, circle section |

Draft: from the fitted sleeve, slash from the hem to the elbow line (4 to 6 lines), spread so the hem opens
to **30 to 60 cm** total (width measured flat). Keep the cap and the elbow width. Redraw the hem as a smooth
curve: the flared hem edge is longer and must be corrected (re-true the lines). The hem allowance is
narrow (0.5 to 1 cm) rolled or bias faced.

Circle-based hem: a full circle of radius `r` gives a hem circumference `2 pi r`; a half circle gives `pi r`.
For a target hem circumference `C`, `r = C / (2 pi)` (full) or `C / pi` (half). The hem of a circle cut
stretches on the bias, so hang it 24 hours before hemming.

Fault: hem hangs in points: cut the hem on a curve and let hang before hemming (bias drop).

---

## 1.14 Flutter sleeve

**What:** a soft circular ruffle over the armhole, no sleeve tube. **Recognize:** a floating frill at the arm;
no seam under the arm.
**Pieces:** frill x2 (circular), armhole facing or bias binding x2.

Circle geometry: the inner edge length `L` equals the armhole length (AH) minus 0 to 3 cm. For a circular
sector of angle `theta`, inner radius `r = L / theta` (theta in radians).

| Fullness | Angle | Inner radius for L = 43 |
|---|---|---|
| Half circle | 180 degrees | 13.7 |
| Three-quarter | 270 degrees | 9.1 |
| Full circle | 360 degrees | 6.8 |

Draft: draw the ring with inner radius `r`, outer radius `r + width` (width 14 to 25 cm). Cut x2 (or fold in
two layers for a double flutter). Seam the inner edge to the armhole. Hem with narrow roll hem (0.6 cm) or
a lettuce edge on knit.

Faults: flutter stands out: bias grain at the inner edge; fall fold uneven: cut the circle in one piece.

---

## 1.15 Petal / tulip sleeve

**What:** two overlapping curved panels forming a petal shape at the cap. **Recognize:** hem overlaps at the
front and curves round the arm.
**Pieces:** front panel x2, back panel x2 (mirrored pairs).

Draft from the fitted sleeve block:
1. Cut the block at the axis.
2. Shift each half across the axis by **4 to 8 cm** so they overlap at the centre.
3. Draw the hem as a convex curve falling **1.5 to 3 cm** at the overlap point.
4. Seam the two panels at the top (3 to 4 cm) at the cap; the overlap edge hangs free, hemmed or faced.
5. Cap ease 0.5 to 1.5; sleeve cap curved as 1.2.

Faults: panels gape at the overlap: increase overlap, tack at the shoulder. Hem curls: fine hem with
bias facing.

---

## 1.16 Juliet sleeve

**What:** a short puffed upper sleeve over a fitted lower sleeve. **Recognize:** a separate puffed cap with a
band, below it a tight sleeve.
**Pieces:** puff x2, lower sleeve x2, band x2 (optional), net or lining x2, cuff closure.

Draft:
1. Fitted sleeve; mark a join line at **10 to 14 cm** below the bicep line (about 2/3 of the way to the elbow).
2. Upper puff: from cap to the join line. Slash and spread **3 to 4 cm** each, 5 lines (total 15 to 20 cm). Raise the
   cap **3 to 4 cm**.
3. Lower sleeve: fitted tube from the join line to the wrist (wrist closure with a slit and buttons).
4. The puff is gathered into the lower sleeve (ratio 1.5 to 2) or into a band.
5. Lined with net to hold shape.

Fault: puff sags: net lining.

---

## 1.17 Cold-shoulder sleeve

**What:** a cutout over the shoulder; the sleeve is attached below and a strap or the neckband remains.
**Recognize:** skin visible at the top of the shoulder with sleeve starting below.
**Pieces:** front x1, back x1, sleeve x2, strap or insert x2, elastic or binding x2.

Draft:
1. From the bodice, define an oval cutout centred on the shoulder point: length **9 to 12 cm** along the shoulder,
   depth **5 to 8 cm** below the shoulder line.
2. Leave a strap at the neck of **3 to 5 cm** width.
3. Cut the sleeve cap by the same cutout: remove the top **4 to 8 cm** of the cap and match it to the opening.
4. Finish the opening with bias binding, narrow facing, or elastic casing (elastic cut at 90 percent of the edge).
5. Sleeve ease 0 to 1 since the cap is shortened.

Faults: gapes at the arm: add an elastic, tack the strap, reduce the opening width.

---

## 1.18 Sleeveless armhole finishes

**What:** armhole without a sleeve. **Recognize:** edge at the arm with a facing, binding or lining.
**Pieces:** front/back armhole facing x2 each, or bias binding strip x2, optional stay tape.

Modify the bodice for sleeveless:
- Raise the underarm **1.5 to 2.5 cm**.
- Cut the shoulder point in **1 to 2.5 cm** (narrower), more for a tank.
- Cut the front armhole in a further **0.6 to 1.2 cm** to remove gape; keep the back as the block.
- Draw the armhole as a smooth curve, passing the shoulder tip perpendicularly.

Finishes:

| Finish | Dimensions | Notes |
|---|---|---|
| Armhole facing | 4 to 6 cm wide, shape traced from the armhole | Understitch 0.2 cm; interface; join at the side seam; tack at the seams. |
| Bias binding (single) | cut width 4 x finished width; finished 0.6 to 1.0 | Cut 1.5 to 3 percent shorter than the edge on a concave curve. |
| French binding | cut width 6 x finished | Double fold; clean finish. |
| Lining bagging out | Armhole seam sewn with lining | Full lining; turn through shoulder. |
| Stay tape | 0.8 to 1 cm | Cut 1 cm short at the front, 0.5 cm short at the back. |

Faults: armhole gaping: remove 1 cm with a front dart or stay-tape; edge rolls out: understitch.

---

## 1.19 Cuffs

| Type | Finished height | Length | Pieces |
|---|---|---|---|
| Barrel (single) | 5 to 6.5 (men 6 to 7) | wrist + 3 to 4 ease + 2.5 to 3 overlap | Outer x2 + lining x2, or one folded x2 |
| French / double | 6.5 to 8 folded | wrist + 4 to 5 + overlap | One piece x2, cut height 4 x folded height + 2 SA |
| Band (placket-less) | 3 to 5 | wrist + 4 | x2; opens by a zip or loop |
| Elastic | casing 1.5 to 3 | elastic = 16 to 19 cm | Sleeve hem only |

**Barrel cuff**
1. Rectangle: length = wrist circumference + 3 to 4 ease + overlap 2.5 to 3. Height = 2 x finished + 2 SA (folded).
2. Round the front corner (radius 1.5 to 2) or square it; the button at 1.5 cm from the edge.
3. Interface the outer layer (woven fusible, 20 to 30 g/m2).
4. Sew: cuff outer to the sleeve hem, wrap the lining, topstitch 0.1 or 0.6 cm from the edge.
5. Buttons: two positions (adjustable) at 1.5 cm and 3 cm.

**French cuff:** same draft, height `4 x folded height + 2 SA`, no button; opened with a cufflink and
four holes in the overlap. Fold in half, then in half again.

**Elastic cuff:** hem allowance = 2 x elastic width + 1.5 cm; thread elastic through; length 16 to 19 cm for
a loose cuff (the stretched cuff must pass hand circumference of 21 to 24 cm).

Fault: cuff too tight: add 1 to 2 cm of overlap; too loose: add the second button.

---

## 1.20 Sleeve plackets

| Type | Slit length | Strip width | Notes |
|---|---|---|---|
| Tower / shirt placket (two pieces) | 9 to 12 (women 8 to 10) | Over placket 3.5 to 4 cut; under placket 2.5 to 3.5 | Pointed end on the over placket; length = slit + 3 to 4 |
| Continuous lap | 8 to 11 | Strip 2.5 to 3 cut, length 2 x slit + 3 | Bias or straight; finished 0.6 to 1.0 |
| Faced slit | 8 to 10 | Facing patch 3 x (slit + 3) | Facing turned and topstitched; for jackets: 3 cm overlap with mitred vent |

**Tower placket**
1. Mark the slit on the hindarm side of the sleeve, 4 cm from the seam, length per table.
2. Cut the slit; sew the under placket to the back edge of the slit; fold; topstitch.
3. Sew the over placket to the front edge; fold the point; stitch an X or a box at the top to anchor.
4. Make the cuff pleats; set the cuff.

**Continuous lap**
1. Cut the slit; clip at the end.
2. Stitch the strip to the slit, right side to wrong side, raw edges even. Pivot at the end.
3. Fold the strip to the right side, topstitch; fold the overlap and stay it.

**CLO3D note (cuffs and plackets):** model the placket as a separate pattern with the right layer; use
fabric layers and the buttonhole function; test the closure on the avatar wrist.

---

# PART 2 - COLLARS AND NECKLINES

## 2.0 Collar vocabulary

| Term | Meaning |
|---|---|
| Neck edge / stand edge | Edge sewn to the garment neckline. Length = neckline length. |
| Outer edge / fall edge | Free edge of the collar. |
| Stand | Part of the collar that rises from the neck to the roll line. |
| Fall | Part that turns over the stand to the outer edge. |
| Roll line | Fold between stand and fall. |
| Break point | The point on the front edge where the lapel folds (first button). |
| Gorge line | Seam joining collar to lapel. |
| Spring / swing | The curvature of the neck edge: more curve means the collar lies flatter against the neck and the fall is bigger. |
| Shoulder overlap | Overlap of front and back shoulder seams at the neck point when drafting a flat collar. |

The general law: the more curved the neck edge, the flatter the collar lies; the straighter the edge, the
more the collar stands. The outer edge of a collar is always longer than the neck edge. Curving the neck
edge increases the outer edge length by roughly `curve angle (radians) x collar width`.

Typical numbers: for a half collar with a neck edge of 20 cm, a neck edge sagitta of 2.5 cm and a width of 4.5 cm,
the outer edge is about **4 cm longer** than the neck edge.

Standard neckline measurements: `N` is measured on the stitching line of the finished neckline, never on
the raw edge, from CB to CF. The stand lower edge equals the neckline length.

---

## 2.1 Flat collars (Peter Pan, sailor, Eton)

**What:** collar that lies flat or with a small roll on the garment. **Recognize:** rounded or pointed collar
covering the neckline; no stand; the collar edge sits on the chest and shoulders.
**Pieces:** upper collar x2 (or x1 on fold), under collar x2 (x1 on fold), interfacing x2; neckline facing or
bias binding.

### Shoulder overlap rule

Draft on the front and back pieces: trace the neckline of the bodice; lay front on back with the shoulders
overlapping at the neck point. The overlap determines the roll (stand) of the collar.

| Overlap at the neck point | Result |
|---|---|
| 0 | Dead flat collar; may lift at the shoulder; looks stiff; for thin fabrics and sailor collars. |
| 0.5 to 1 | Flat with a slight roll at the back |
| 1.5 to 2 | Standard Peter Pan: small stand of about 1 cm at the neck, soft roll |
| 2.5 to 3.5 | A visible stand of 1.5 to 2 cm, collar rises at the neck (rolled collar) |

The overlap shrinks the neck edge of the collar relative to the outer edge. Overlap at the shoulder tip is
zero (pivot at the armhole side).

### Peter Pan (draft)

1. Trace the front neckline from SNP to CF and the back neckline from SNP to CB. Overlap the shoulders at the
   neck point by 1.5 to 2 (see table), pivot at the shoulder tip.
2. The traced neck edge now has a different curve and length. Check: `neck edge = N - overlap effect`; this is
   fine; it is the correct collar neck edge length.
3. Measure the collar width from the neck edge: **6 to 8 cm** (children 4 to 5). Draw the outer edge parallel
   at that distance, round the front tip with a radius 3 to 4; ends at CF can meet (0 gap) or leave a gap of
   up to 1 cm.
4. Mark notches: SNP (1 notch), CB (fold or notch).
5. Under collar: same shape but narrower at the outer edge by **0.2 to 0.3 cm** (the "turn of cloth") so the
   seam rolls underneath. Use the same neck edge.
6. Interface the under collar (light fusible, bias or straight).
7. Seam allowance: 1 on the neck edge, 0.6 on the outer edge.

### Sailor collar

- The front is a V: neckline deepened to **18 to 25 cm** from the SNP (lower for a deeper V).
- The back is a large square or rounded flap: width at CB **15 to 25 cm**, shoulder overlap 0 to 1 cm.
- Draft the collar on the V front with the shoulders overlapped 0 to 1 cm; front collar edge along the V from
  SNP to the point, then the collar returns in a point or square.
- Pieces: upper x2 (back pieces joined at CB), under x2, often with a bound edge or top stitch.

### Eton collar

- A wide soft flat collar with a rounded or pointed front tip.
- Width **7 to 9 cm**, shoulder overlap **0 to 1 cm**, neck edge curved, spread front, often worn open over a
  jacket (originally the stiff white collar of schoolboys).
- Draft as Peter Pan but with larger width and a tapering front end.

### Sewing

1. Interface the under collar; place the upper and under collars right sides together.
2. Sew the outer edge, trim, clip curves, turn, press with the seam rolled to the under side.
3. Baste the neck edge. Stitch the collar to the neckline between the notches, collar upper side down.
4. Attach the neckline facing (or bias binding) over the collar; understitch; turn.
5. Hand-tack the facing at the shoulder seams.

### Faults

| Symptom | Cause | Fix |
|---|---|---|
| Collar stands up like a stand collar | Overlap too large | Reduce overlap by 1 cm. |
| Collar lies flat but sticks out at the back | Overlap zero and neck edge too short | Increase overlap to 1 cm. |
| Collar edges curl | Outer edge too short or seam not rolled | Increase the under collar difference; press seam under. |
| Front tips do not meet | Neckline CF measured wrongly | Recheck N. |

**CLO3D:** set the collar fabric stiffness slightly higher than the body; layer the collar on top and
adjust "Fold Angle" at the roll if needed.

---

## 2.2 Stand collars (mandarin, band, funnel, mock neck)

**What:** collar that rises from the neckline as a band. **Recognize:** upright band, no fall.
**Pieces:** collar x2 (outer + lining), interfacing x1 or 2 (or x1 on fold).

### Mandarin / band collar (woven)

1. Neckline length N (per half, CB to CF). If the opening is at CF with an overlap, add the button extension
   (1.5 to 2).
2. Draw a horizontal line of length N. Mark CB at one end.
3. At the CF end, curve the lower edge **upward 1.5 to 2.5 cm** (stand collars that fit the neck).
   - Straight rectangle (rise 0) = loose cylindrical stand; the more rise, the more the collar cups the neck.
4. Height: **3 to 4 cm** (1.5 to 2.5 for a low stand collar).
5. The upper edge: parallel to the lower edge at CB, then flatten the curve toward the CF end (rise of only
   1 to 1.5 cm), so the top edge is shorter and the collar tapers toward the head. Round the front corners
   (radius 1.5 to 2).
6. Check the neck edge measured on the seamline equals N.

### Funnel collar

- Tall (5 to 8 cm), cut with the neck edge nearly straight: the collar falls into a cone shape;
- Draft as a rectangle with a slight flare: top edge 2 to 4 cm longer than the neck edge. Often cut on bias for
  drape.
- Closing: concealed zip at CB, loop at the front.

### Mock neck in knits

- Neckband (ribbing) = height **4 to 6 cm** folded, length = neckline x **0.85 to 0.90** (see 2.13).
- A folded collar of double thickness; the band's raw edges are sewn into the neckline.

### Sewing

1. Interface the outer collar.
2. Sew the collar to the lining along the upper edge and the short ends; trim, turn.
3. Attach the outer collar to the neckline right sides together, with notches matched, sew.
4. Fold the lining down; stitch in the ditch or hand-sew the lining to the seam.
5. Buttonhole at the front, button on the other end.

### Faults

| Symptom | Fix |
|---|---|
| Collar pops away from the neck | Increase the lower edge rise by 0.5 cm and shorten the top edge. |
| Collar chokes | Raise the CF neckline by only 0.5 cm; lengthen N by 0.5 to 1 cm. |
| Collar lies in a cylinder | Add curve; cut on straight grain with a fusible stiffener. |

**CLO3D:** simulate the stand collar with sewing to the neckline; check no penetration at the neck.

---

## 2.3 Shirt collar with separate stand

**What:** collar in two parts: the stand (band) and the fall (collar), joined by a seam. **Recognize:** shirt
collar with a band that is visible under the fall at the back; the fall covers the stand seam.
**Pieces:** stand x2 (outer + inner, or x1 on fold), fall x2 (upper + under; under collar slightly smaller),
interfacing for stand and for fall; collar stays x2.

### Draft

Inputs: N (neckline, CB to CF seamline), button overlap.

**Stand**
1. Draw a horizontal line of length **N + 1.5 to 2** (the extension past CF for the button).
2. Heights: **CB 3.0 to 3.5** (men), 2.5 to 3 (women); **CF 2.5** (stand end).
3. Lower edge: curve upward at the front end by **1.5** (range 1 to 2) above the baseline (the stand curve).
4. Upper edge: parallel curve at the stand height; slightly less curved so the top edge is shorter than the
   lower edge by **0.5 to 1 cm** over the length.
5. Round the front end (radius 1.5 to 2.5).
6. The stand is joined to the collar on the upper edge.

**Collar (fall)**
1. Collar neck edge length = stand upper edge length (CB to a point **1 to 1.5 cm** short of the stand front end).
2. Draw a straight baseline of that length. At the front end, raise the neck edge to form the **spring**:
   **1.5 to 2.5 cm** (range 1 to 3; a deeper spring makes the collar lie flatter and closer).
3. Collar height at CB = **stand + 1 to 1.5** (4 to 4.5 cm men; 4 to 5 women) so the fall covers the stand.
   The height at the collar points (front) = CB height or 0.5 more.
4. Points: length **7 to 8 cm** (men), **5.5 to 7 cm** (women); angle at the point **75 to 95 degrees**;
   spread (distance between the points at the neck) **8 to 12 cm** depending on style.
5. Outer edge from CB to the point as a smooth curve. Check: outer edge approx **3.5 to 5 cm** longer than
   the neck edge per half.
6. Under collar: cut **0.2 to 0.3 cm** smaller at the outer edge and the points.
7. Collar stays: pockets 6 to 7 cm long on the under collar at the points.

### Sewing order

1. Interface the fall (upper) and the outer stand; collar stays inserted.
2. Sew the upper collar to the under collar along the points and outer edge; trim, turn, press with the
   seam to the under side; topstitch 0.5 cm.
3. Sandwich the collar between the stand layers; sew the upper edge of the stand; turn, press.
4. Attach the outer stand to the neckline, then sew the inner stand over the seam by hand or stitch in the
   ditch from the right side.
5. Buttonhole on the stand end and button on the other stand end.

### Faults

| Symptom | Fix |
|---|---|
| Stand shows above the fall | Increase the collar height at CB by 0.5 to 1 cm. |
| Points curl up | Increase the under collar difference to 0.3 and use stays; shorten the point angle. |
| Collar gapes at the front | Increase the spring by 0.5 cm or raise the stand curve. |
| Collar strangles | Increase N by 0.5 to 1 cm; check the placket overlap. |

**CLO3D:** model the stand and the fall as separate pieces layered; set the fall interfacing as a thicker
fabric layer; use arrangement so the collar wraps around the neck.

---

## 2.4 Convertible collar

**What:** one-piece shirt collar with a built-in stand, can be worn open or closed (camp collar, Hawaiian,
Cuban collar). **Recognize:** open-neck collar rolling from the neck with no separate stand.
**Pieces:** collar x2 (upper and under), interfacing x2.

Draft:
1. Neckline measured N. At the front, the neckline is lowered to a V at the first button (18 to 22 cm).
2. Draw the roll line: from the first button position to the neck, passing through a point **2 to 2.5 cm**
   beyond SNP on the extended shoulder line.
3. Collar: neck edge length = N; CB height **7 to 8 cm** with the stand part **3 to 3.5**; the neck edge is
   curved with spring **2.5 to 3.5 cm**.
4. Collar points **7 to 9 cm**, spread wide.
5. Under collar is 0.2 to 0.3 smaller; stands uninterfaced at the lower part for softness.

Fault: the collar flops: add fusible interfacing to the stand portion; roll line steaming.

---

## 2.5 Roll collars

**What:** a collar folded over itself (turtleneck, polo neck, roll neck). **Recognize:** soft tube round the neck,
folded at the top.
**Pieces:** collar band x1 (cut in a tube) or x2, lining none.

| Type | Draft | Fabric |
|---|---|---|
| Knit roll neck | Rectangle, length = neckline x 0.85 to 0.90, height = 2 x finished + 2 SA (finished 6 to 12) | Jersey, rib |
| Woven roll neck | Curved band, cut on bias or with a curved neck edge, finished height 6 to 10 | Fine wool, crepe; a slit or zip required |
| Cowl roll | See 2.9 | Drape fabrics |

Woven roll neck: the neck edge curve rises 2 to 3 cm to fit the neck. The finished opening must pass the head:
circumference at least **58 cm** after stretch (knit) or a closure for woven.

Fault: roll collapses: use a firmer rib; increase the height; or cut a curved band with the lower edge
tapered.

---

## 2.6 Shawl collar

**What:** collar and lapel cut in one with the front, no notch. **Recognize:** smooth continuous curve from the
neck to the lapel point; no gorge notch.
**Pieces:** front x2, back x1 (or x2), upper collar and facing in one x2 (CB seam), under collar x2 (CB seam),
interfacing on fronts, under collar, facing.

Draft (jacket):
1. Mark the break point (first button, level with the waist or bust line) and the CF line with the overlap
   (1.5 to 2.5 each side of CF for single-breasted).
2. **Roll line.** From the break point, draw to a point on the shoulder line extended **2 to 2.5 cm** beyond the
   shoulder neck point.
3. **Lapel edge.** Draw the lapel edge parallel to the roll line at the lapel width: **8 to 11 cm** at the
   shoulder, curving into a rounded shape; extend the curve to the CB.
4. **Fold the lapel.** Reflect the lapel shape across the roll line to obtain the collar shape on the front
   (symmetry).
5. **Collar neck edge.** The collar neck edge length equals the back neckline measured from the SNP
   extended point to CB; draw the collar in parallel to the roll line with the neck edge following the back
   neckline, spring 2 to 3 cm at CB to rotate the collar around the roll.
6. **CB seam.** The under collar and the upper collar/facing have a CB seam at the centre back; the upper collar is
   cut in one with the front facing.
7. Add **0.3 to 0.5 cm** "turn of cloth" to the facing at the roll line so the facing does not pull.

Sewing: interface fronts; baste roll line with tape (cotton twill 1 cm, cut 0.5 to 1 cm short); sew the under
collar CB seam; attach to the neckline between the SNP (on the back); sew the upper collar/facing to the
under collar along the outer edge; turn; press the roll line over a ham.

Faults: collar stands away from the neck: shorten the neck edge 0.5 cm, increase the spring; lapel pulls:
add turn of cloth.

---

## 2.7 Notched lapel collar (tailored)

**What:** two-piece collar and lapel creating a notch at the gorge line. **Recognize:** a V-shaped notch between
the collar and the lapel; the collar stands at the back and folds over.
**Pieces:** front x2, facing x2, upper collar x1 (CB seam optional) or x2, under collar x2 (bias or straight,
CB seam), interfacing for the front (canvas), the under collar (hair canvas), lapel (padstitched).

### Terms

| Term | Definition |
|---|---|
| Break point | Point on the front edge where the lapel folds (first button level). |
| Roll line / break line | Straight line from the break point to the neck stand point; the lapel folds along it. |
| Crease | The pressed fold; for a pressed lapel it is the roll line; a rolling lapel has a soft crease. |
| Gorge line | Seam joining the collar to the lapel; ends at the notch. |
| Stand | The part of the collar between the neck seam and the roll line (2.5 to 3.5 cm). |
| Fall | The part of the collar folded over the stand (3.5 to 4.5 cm). |

### Draft (front lapel)

1. Fronts: mark CF with overlap (single-breasted 2 cm each side; double-breasted 6 to 8).
2. Break point on the front edge at the top button level.
3. **Roll line.** From the break point to a point **2 to 2.5 cm** beyond SNP on the extended shoulder line
   (this is the collar stand height). The roll line is straight.
4. **Lapel width.** Perpendicular to the roll line, mark **7 to 9 cm** (women), **8 to 10 cm** (men) for the lapel
   edge. Draw the lapel edge from the break point curving to the lapel point, then up to the gorge.
5. **Gorge line.** From the neck point on the roll line (SNP) draw toward the lapel edge. The gorge is
   **90 to 100 degrees** to the roll line, ending at the lapel at a distance of **2 to 3 cm** from the neck
   point. Notch depth **2.5 to 3.5 cm**, notch width 3 to 4.
6. The lapel angle (peak, notch) is decided by style: notched 90 degrees, peaked 55 to 70.

### Draft (collar)

1. Draw a line parallel to the roll line, offset by the stand height (2.5 to 3.5), starting from the extended
   shoulder point.
2. On this parallel, measure the back neck length (SNP to CB on the seamline) = collar neck edge length.
3. At the end of the neck edge, square out the CB line: collar height at CB = stand + fall = **6.5 to 8**
   total (stand 3, fall 3.5 to 4.5).
4. **Spring.** Rotate the neck edge away from the roll line by a swing of **2 to 3.5 cm** at the CB end
   (the lower neck edge curves). More swing = collar wraps tighter to the neck.
5. Draw the outer edge from the CB to the gorge point, forming the notch. Join the collar to the lapel along the
   gorge line.
6. **Under collar.** Cut on the **true bias** (45 degrees to the grain) with a CB seam; or on straight grain
   with a CB seam and stretched. The under collar is **0.3 to 0.5 cm** smaller on the outer edge. The stand portion
   of the under collar has the neck edge slightly shorter.
7. **Upper collar.** Cut on straight grain with the CB on the fold or with a CB seam; outer edge **0.3 to
   0.5 cm** larger than the under collar for the turn of cloth.
8. **Facing.** The front facing is shaped along the lapel and the shoulder; the facing at the roll line is
   0.3 to 0.5 larger (turn of cloth).

### Handling

1. Pad stitch the lapel and under collar with hair canvas; the roll line is taped (twill 1 cm cut
   0.5 to 1 short).
2. Stretch the outer edge and shrink the neck edge of the under collar with steam over a ham to form the
   collar curve.
3. Sew the collar to the neckline first (under collar to garment, upper collar to facing), then join the
   gorge line, then the outer edge.
4. Press the roll line, tack the lapel to the canvas.

### Faults

| Symptom | Fix |
|---|---|
| Collar stands off the neck | Increase the swing/spring 0.5 to 1 cm, shorten neck edge, steam-shrink. |
| Lapel does not roll | Add turn of cloth, move the break point 1 cm up, restitch with tape. |
| Gorge line gapes | Shorten the gorge line, re-seam. |
| Collar twists | Under collar off grain; re-cut on bias. |

**CLO3D:** a complete tailored collar is heavy to simulate; use the fold arrangement at the roll line, and
set the under collar interfaced layers.

---

## 2.8 Tie and bow collars

**What:** a band collar with long ties tied in a bow. **Recognize:** soft stand band at the neck with long
tails.
**Pieces:** collar-and-tie x2 (or x1 with ties in one), interfacing at the band only.

Draft:
1. Neck edge = N. Band height finished **3 to 4 cm** (cut 2 x + 2 SA).
2. Add the ties: width finished **4 to 6 cm** (cut double), length **60 to 90 cm** per side (total tie of
   120 to 180 cm).
3. Cut on the bias for softness, or straight with a seam at the CB.
4. Taper the tie ends in points or squares.

Sewing: fold wrong sides together, sew the edges leaving the neck edge open, turn; press; attach the band to
the neckline between the notches; secure the ends with a hidden snap.

Fault: ties twist: cut on the bias; weight tie ends.

---

## 2.9 Cowl neck

**What:** soft folds at the neckline falling from the neck to the chest. **Recognize:** draped neckline with
horizontal folds.
**Pieces:** front x1 (on bias fold), back x1, facing or neck binding.

Draft:
1. Front block with shoulder neck. Draw the neckline at the desired width (4 to 6 cm lower than SNP).
2. Draw 3 slash lines from the neckline to the side seam (spaced 4 to 5 cm).
3. Slash from the neckline to near the side seam; pivot the CF upward by **8 to 15 cm** drop depth (total
   spread), spread equally on the lines (each 3 to 5 cm).
4. Redraw the neckline smoothly; the cowl depth is the fold below the neckline.
5. Cut the front on the true bias (grain line at 45 degrees) or with CF on the fold.
6. Neckline finish: a facing cut 4 to 5 cm wide sewn to the neck edge and tacked inside; or a self-fabric
   binding.

Faults: cowl collapses: use a softer, finer fabric; add weight at the side; check the drop depth.

**CLO3D:** cowl is a drape problem; use fine fabric properties, simulate with high-quality cloth settings.

---

## 2.10 Hoods

**What:** head covering attached at the neckline. **Recognize:** pointed or rounded cap behind the neck.
**Pieces:** two-piece hood: x2 (mirrored), lining x2. Three-piece hood: sides x2, centre panel x1, lining x3.

### Two-piece hood

Adult measurements: **hood height** (vertical, from the neck seam at the shoulder level to the top of the head)
**33 to 36 cm**, **hood depth** (horizontal, face edge to CB) **28 to 32 cm**, face opening **30 to 38 cm** along the
face edge. Neck edge = neckline length (CF to CB).

1. Draw a rectangle H x W (H = height 33 to 36, W = depth 28 to 32).
2. The neck edge (bottom): length = N (CB to CF); the front edge extends 0 to 1.5 cm past CF to cover the neck.
3. Round the top back corner with radius **10 to 14 cm**; the CB seam runs from the top to the neck.
4. Optionally dart 2 to 3 cm at the neck CB for fit.
5. Face edge: finished with a facing, binding, or drawstring channel (2 cm).
6. Cut x2 (mirrored); sew along the CB seam (top and back) and attach to the neckline.

### Three-piece hood (centre panel)

1. Take the two-piece hood; remove a strip of **4 to 6 cm** from the top of each side piece along the head
   curve (half of the centre panel width).
2. Centre panel: width **8 to 12 cm** at the top, tapering to **5 to 8** at the nape; length = the length of
   the top curve of the side pieces (forehead to nape), measured on the seamline.
3. Sew the panel to both side pieces, easing evenly; CB seam of the side pieces below the panel.
4. Gives a deeper hood that stands off the head.

Faults: hood falls back: reduce the depth or add a dart; hood gapes at the front: shorten the face edge 1 cm;
bulk at the neck: reduce the neck edge ease.

**CLO3D:** hood simulation: attach to the neckline, place the avatar's head; check the collision layers.

---

## 2.11 Bias bindings and facings for necklines

**Bias binding**

| Parameter | Value |
|---|---|
| Strip cut width | 4 x finished width (single-fold binding), 6 x (double or French) |
| Finished width | 0.6 to 1.0 cm (neckline), 1.2 to 1.5 (decorative) |
| Length | Neckline length minus **1.5 to 3 percent** on concave curves (scoop); equal on straight lines |
| Join | Join strips on the straight grain at 45 degree angle; press open |

Method: stitch the strip to the neckline right sides together at the first fold line, fold over the edge, topstitch
or hand-sew the second edge.

**Facing**

| Parameter | Value |
|---|---|
| Width | 5 to 7.5 cm |
| Shape | Trace the front and back neckline, add shoulder seam, CF on fold |
| Edge | Facing outer edge cut **0.2 cm** smaller at the neckline (turn of cloth); finished with overlock or a turned edge |
| Interfacing | Light fusible on the whole facing |

Steps: sew shoulders of the facing; sew the facing to the neckline; trim and clip curves; understitch 0.2 cm
from the seam; turn; press; tack the facing to the shoulder seams.

Faults: neckline gapes: stay tape 1 cm at the neckline, cut 0.5 to 1 cm short at the front; facing flips
out: understitch and tack.

---

## 2.12 Rib neckbands for knits

**What:** a band of ribbing or self-fabric forming the neckline of a knit. **Recognize:** a narrow band
around the crew neck.
**Pieces:** neckband x1 (a loop) or x2 (with seams).

**Length ratio:** band length = neckline length x ratio.

| Fabric | Ratio |
|---|---|
| Rib 1x1 or 2x2 with 100 percent stretch | 0.70 to 0.75 |
| Rib with 60 to 70 percent stretch | 0.80 to 0.85 |
| Jersey self-fabric (40 to 50 percent stretch) | 0.85 to 0.90 |
| Stable knit (interlock, ponte) | 0.90 to 0.95 |

Use the table, then test: stretch a sample of the band to the neckline; it must lie flat without gaping or
waving. The neckline opening (stretched) must pass the head:
at least **58 to 60 cm** circumference.

Draft:
1. Measure the neckline N total (full circle, seamline).
2. Band length `= N x ratio`; add 2 x SA for the seam if closed in a loop.
3. Width = 2 x finished width + 2 SA. Finished: **1.5 to 2.5 cm** (crew), 2.5 to 3.5 (wider rib), 4 to 6
   (mock neck).
4. Cut with the stretch along the length.

Sewing: close the band into a loop (SA 0.7), fold in half wrong sides together; divide the band and the neckline
into 4 equal parts (CB, CF, shoulders) and pin; stretch the band to fit; sew with a stretch stitch or overlock;
press the seam toward the body; topstitch with a twin needle.

Faults: neckline gapes: ratio too high; use a shorter band. Neckline too tight: ratio too low; measure over the
head. Wavy neckline: stay tape at the shoulder seams.

**CLO3D:** simulate the rib band with a smaller length in the sewing and fabric with high stretch; set
Strain and Bending to stretchy values.

---

## Sources

Reference books (drafting conventions and typical values; constants are textbook-typical, check against the
edition in hand):
- Winifred Aldrich, Metric Pattern Cutting for Women's Wear, and Metric Pattern Cutting for Menswear
  (Blackwell / Wiley): sleeve block, cap height, shirt and jacket collar, raglan, kimono.
- Helen Joseph-Armstrong, Patternmaking for Fashion Design (Pearson): sleeve and collar chapters, raglan,
  cowl, hoods.
- M. Müller & Sohn, Systematische Schnittkonstruktion (women's and men's systems): tailoring sleeves and
  lapels.
- Gilewska, Teresa, Pattern-Cutting for Clothing Using CAD (Woodhead).
- Kopp, Rolfo, Zelin, Gross, Designing Apparel Through the Flat Pattern (Fairchild).
- Esmod and Bunka Fashion College garment design series: drafting conventions for sleeves and collars.

Web checks performed (this session):
- Threads magazine, "How to draft a two-piece jacket sleeve from a one-piece pattern" (elbow spread unequal
  between top and under sleeve, longer top sleeve eased to the under sleeve):
  https://www.threadsmagazine.com/2015/11/06/how-to-draft-a-two-piece-jacket-sleeve-from-a-one-piece-pattern
- Threads magazine, "Draft a two-piece collar with a stand":
  https://www.threadsmagazine.com/project-guides/fit-and-sew-tops/draft-a-two-piece-collar-with-a-stand
- Dress Pattern Making, sleeve ease and sleeve cap curve (appeared in search results, not fetched):
  https://dresspatternmaking.com/patternmaking-basics/terminology/ease-sleeves
  https://dresspatternmaking.com/blog/understanding-the-sleeve-part-2
- Minerva Patterns blog articles on two-piece sleeves and collar types (search summaries only; pages
  returned 403 on fetch):
  https://minervapatterns.com/blog/drafting-a-two-piece-tailored-sleeve
  https://minervapatterns.com/blog/creating-a-collar-pattern-types-and-drafting-principles
- Freesewing documentation (parametric cap height range 40 to 60 percent):
  https://docs.freesewing.org/docs/designs/bent/options
- Fashion-Incubator sleeve drafting tutorial: https://fashion-incubator.com/sleeve_drafting_tutorial/

What was not independently confirmed on the web: exact Aldrich constants (cap curve guide offsets, raglan
start points, notch depths). They are given as typical ranges. Confirm them against the book and a toile.
