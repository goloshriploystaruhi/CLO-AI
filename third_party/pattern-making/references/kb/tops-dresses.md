# Tops, dresses and necklines

Entry-per-garment database (format in `FORMAT.md`). Methods and block logic are in
`../techniques/bodices-dresses-tops.md` (section numbers such as "sheet 9.2" refer to it); this file is the
lookup layer: what each garment is, which pieces it has, where its anchors are, which edge sews to which.

Reading conventions used in every entry:

- Notation: CF/CB centre front/back, NP neck point (neckline meets shoulder), SP shoulder point, AU underarm
  (bottom of armhole, where front and back armholes meet the side seam), BP bust point (apex), UB underbust line,
  W waist, H hip, B full bust, a ease, SA seam allowance, L length. Metric, half pattern (one side of CF/CB)
  unless stated. "x1 on fold" = one piece placed on a fold; "x2" = mirrored pair.
- Bodice anchors (front, CF on the left, drawn upright): A = neck at CF, N = NP, S = SP, U = AU, W1 = waist at the
  side seam, W0 = waist at CF, then hem points. The back mirrors it with CB. Front shoulder N-S sews to back
  shoulder N-S; front armhole S-U and back armhole S-U sew to the sleeve cap (front notch single, back notch
  double); side seam U-W1-hem of the front sews to the back side seam of equal length.
- Typical ease (full circumference): close-fitting 4 to 8 at the bust, blouse 10 to 14, shirt 14 to 20, oversized
  20 to 40, knit 0 to -15 percent. Detailed blocks: `#close-fitting-bodice-block`, `#easy-fitting-block`,
  `#knit-block`, `#shirt-block`, `#dress-block`.
- No outline in this file was read from a drawn pattern by the author. "Shape" therefore states the construction
  logic (which piece, which edge, which point) and marks outlines "unverified" unless a specific drawn or
  documented source is named. Numbers are typical textbook or workshop ranges (textbooks differ by 0.5 to 1 cm)
  and must be confirmed on a toile.

---

# TOPS

## Classic Blouse {#classic-blouse}

- **Aliases**: woven blouse, button-front blouse, dress blouse; fr: chemisier, blouse classique; de: Bluse
- **Family**: top, woven, from the close-fitting or blouse block
- **Recognize**: a lightweight woven top with a CF button opening, collar or neck facing, set-in sleeves (long with cuffs, or short), side or French bust dart, hem that is straight or slightly curved, often a back yoke or waist darts.
- **Pieces**: front x2 (pair, each with a grown-on button stand and facing, or a separate facing x2), back x1 on fold (or x2 with CB seam), sleeves x2, cuffs x4 (2 outer, 2 inner) or sleeve hem band/facing, collar x2 + stand x2 (or neck facing x2), optional back yoke x2, sleeve plackets x2, interfacing for collar, stand, cuffs and front band.
- **Shape**: Front (one half, CF on the right of the pattern): CF line N-hem is straight; a button stand extends 1.5 to 2 cm beyond CF with a facing foldline at CF + 1.5 to 2 and a second fold at about 3.5 cm further when grown-on. Neckline A-N curves from CF depth (neck width + 1.5 to 2 cm) to N; shoulder N-S slopes about 5 cm; armhole S-U is a deep S-curve passing the front notch; side seam U-hem runs straight to the hem, with the bust dart (1.5 to 3 cm intake) opening at the side seam 5 to 7 cm below U and ending 2.5 to 3 cm short of BP, or a French dart from the side seam above W. Hem points: CF hem is lowest, the side hem rises 1 to 2 cm (curved) or the hem is straight. Back: CB on fold, back neck depth 2 cm, shoulder N-S is 0.5 to 1 cm longer than the front (eased into the front or taken in a yoke), optional waist darts 1.5 cm or side shaping 1 to 2 cm. Sleeve: one-piece set-in sleeve, cap height about 13 to 15 cm, cap length = armhole + 1 to 2 cm ease, underarm seam sews to itself, the cuff or hem finish attaches at the wrist. Source: construction logic from the blocks, unverified as a drawn pattern.
- **Drafting**: 1. Close-fitting block with bust ease 10 to 14 (full) and armhole depth block + 1 to 2 cm. 2. Move the bust dart to the side seam or French position (sheet 2.2). 3. Length W + 5 to 7 cm (hip-skimming) or W + 20 cm (hip length). 4. Add the button stand (sheet 10.4), shape the neckline and facing (5 to 6 cm wide), curve the hem if wanted (sheet 10.5). 5. Sleeve from the block with cap ease 1 to 2 cm, wrist width = wrist + 4 to 6 cm before the cuff. 6. Collar and stand per sheet 10.6. All values typical.
- **Sewing order**: 1. Interface. 2. Darts and yoke. 3. Shoulder seams. 4. Collar and stand (or neck facing). 5. Sleeves set flat or in the round. 6. Side and underarm seams in one run. 7. Cuffs. 8. Hem. 9. Buttonholes (right front for women) and buttons.
- **Finishes and notions**: buttons 10 to 12 mm, buttonholes across the stand or along CF, hem 0.6 to 1 cm double turned, seams French or serged, light fusible on collar, stand, cuffs and front band.
- **Fabrics**: silk crepe, crepe de chine, georgette, viscose, poplin, voile. Drapey and sheer fabrics need French seams and a facing in self fabric; stiff poplin holds a crisp collar; sheers need narrower SA and rolled hems.
- **Fit faults**: gaping at the bust between buttons -> add a small dart or move buttons to the bust level and enlarge the bust dart; pulling at the armhole -> lower U by 1 cm and widen; collar stand gapes at CB -> shorten stand 0.5 to 1 cm; back wrinkles across shoulder blades -> add 0.6 to 1 cm shoulder-blade ease in the yoke.
- **Variants**: #womens-fitted-shirt, #shell-top, #pussy-bow-blouse, #peasant-blouse, #tie-front-blouse, #wrap-blouse, #oversized-shirt.
- **CLO3D**: build front, back, sleeves, cuffs, collar as separate patterns; sew shoulders, then armholes with the correct notch pairing, then side seams; a woven 80 to 120 g/m2 fabric with 5 mm particle distance at the collar and cuffs; place buttons by hand with the button tool along CF.
- **Confidence**: trade practice and the techniques sheet (9.1, 10.1 to 10.7). Dimensions typical; no drawn source.

## Pussy-Bow Blouse {#pussy-bow-blouse}

- **Aliases**: bow-neck blouse, tie-neck blouse, stock-tie blouse; fr: blouse à lavallière, chemisier à noeud; de: Schleifenbluse
- **Family**: top, woven, neck-tie variant of the blouse
- **Recognize**: a blouse whose neckline carries two long ribbon ends that tie in a soft bow at the throat; the neck is a band with a short stand or a high facing; the front may have a placket or be a pullover with a short slit.
- **Pieces**: front x2 (placket version) or x1 on fold with a slit (pullover), back x1 on fold, sleeves x2, neck band with integral ties: either one band piece per side x2 (each side band continuing into its own tie strip) or band x1 plus tie strips x2, cuffs x4, interfacing for the band and the cuffs.
- **Shape**: Body as #classic-blouse with the front neckline raised to a high round neck (neck depth about 2 to 3 cm lower than the back neck is common) and the neck edge length measured N-A-N. Neck band: a long strip whose length is the finished neck edge (about 36 to 40 cm for a woven blouse, measured on the pattern) plus the tie length at each end. Each tie end is the same width as the band and runs straight out from the band end, normally 40 to 70 cm long, usually cut as one long strip with the band in the centre, then folded in half lengthwise (right sides together), stitched, turned. Ends are cut straight or on an angle (swallow-tail) of 3 to 5 cm. The strip attaches along its folded long edge to the neckline of the blouse starting at CF and the band edge centred on the neck seam; the ties hang free below the CF opening. Source: construction logic, unverified as a drawn pattern. Tie width and length are style choices (typical strip width cut 8 to 10 cm, finished 3.5 to 5 cm).
- **Drafting**: 1. Draft the blouse with a high jewel neckline and a short CF slit (12 to 18 cm, with a facing) or buttons. 2. Measure the neckline (N-A) x 2 for the full seam length; cut band = seam length + 2 SA. 3. Cut the ties as extensions of the band at each end, or as separate strips sewn to the band ends. 4. Make the finished tie length 40 to 70 cm per side (typical) so that a bow of two loops and tails reaches below the collarbone. 5. If the fabric is slippery, cut the strip on the straight grain, not the bias, for control.
- **Sewing order**: 1. Make the tie/band strip: fold right sides together, stitch ends, turn, press. 2. Sew shoulders. 3. Sew the band to the neck edge (right side of the strip to the right side of the blouse), clip, press seam up. 4. Finish the inside of the neckline with a facing or a folded edge slip-stitched. 5. Sleeves, side seams, hem.
- **Finishes and notions**: narrow hem or rolled edge on the ties; a hidden snap at the top of the slit is optional; no interfacing on the tie ends for a soft bow, a light interfacing in the stand portion only.
- **Fabrics**: silk crepe, georgette, satin, light viscose. Slippery silks: use fine needle, tissue paper under the strip; keep the ties off the bias to avoid stretching.
- **Fit faults**: bow looks small -> lengthen ties by 10 to 15 cm; neckline stands away from the neck -> shorten the neck edge by 1 cm and add a stay tape; tie ends twist -> cut straight grain and press carefully.
- **Variants**: #classic-blouse, #tie-front-blouse.
- **CLO3D**: model the ties as long rectangles attached along the neck seam; simulate with the bow pre-tied by pinning or arranging the tie ends over the chest, or leave them hanging; particle distance 5 mm; the actual bow cannot be tied reliably in the simulator.
- **Confidence**: trade practice. Strip lengths from memory and style; no drawn source.

## Peasant Blouse {#peasant-blouse}

- **Aliases**: gypsy blouse, bohemian blouse, Mexican blouse, Romanian blouse, smock blouse; fr: blouse paysanne, blouse à smocks; de: Bauernbluse
- **Family**: top, woven, gathered at the neck and sleeve
- **Recognize**: wide, softly gathered neckline held by a casing and elastic or drawstring, loose body, gathered sleeves ending in an elastic or a band, often a ruffle at the neck; may have an off-shoulder neck.
- **Pieces**: front x1 on fold, back x1 on fold, sleeves x2, neck casing or band (self-made strips x2 or folded edge), sleeve casing/bands x2, elastic or drawstring, optional neck ruffle x2 strips. Traditional variant: body rectangles x2, sleeves x2, square underarm gussets x2.
- **Shape**: Modern pattern: front and back are mirror pieces with a wide scoop or straight neck edge; the neck edge is lower and wider than a jewel neck (neck width 12 to 18 cm out from CF, depth 8 to 12 cm at the front) and has a turn-under for the casing (2 to 3 cm). Shoulder seam is short (about 4 to 6 cm) or the bodice is cut as one with the sleeve (see #kaftan-top for the T-shaped version). Sleeve: wide, cap gathered into the armhole between the front and back notches with a gather ratio 1.3 to 1.8 for the cap; the sleeve hem is cut 10 to 20 cm wider than the wrist and gathered into elastic or a band. Traditional pattern: front, back and sleeve are rectangles; the sleeve's underarm joins the body at a square gusset (typically 8 to 12 cm) set at the intersection of body and sleeve seams. Source: construction logic, unverified as a drawn pattern; traditional gusset layout from general knowledge.
- **Drafting**: 1. Take an easy-fitting block (bust ease 20 to 30). 2. Redraw the neckline: neck width 10 to 18 beyond the block neck, depth 8 to 12; add a casing allowance of 2.5 to 3. 3. Elastic length at the neck: the circumference of the head/shoulder line where the blouse should sit minus 2 to 6 cm, tested on a toile; typical finished neck circumference 60 to 85 cm for a shoulder-skimming blouse. 4. Sleeve: draft a straight sleeve and slash and spread 3 to 5 times for gathered fullness (add 8 to 14 cm across the cap and 6 to 12 cm across the hem). 5. Hem: straight or curved, rolled or 1.5 cm hem; no waist shaping, optionally a waist tie casing.
- **Sewing order**: 1. Shoulder seams (if separate). 2. Neck casing: fold and stitch, leaving a 2 to 3 cm opening, thread elastic. 3. Gather sleeve cap and set into the armhole. 4. Sleeve and side seams in one run. 5. Hem casing for the sleeve, thread elastic. 6. Hem.
- **Finishes and notions**: elastic 1 to 2 cm wide at the neck and sleeve, or a drawstring; French seams in light fabrics; embroidery bands if traditional.
- **Fabrics**: cotton voile, lawn, gauze, light viscose, crepe. Heavier fabrics need less gather ratio; very sheer fabrics need a lining or slip.
- **Fit faults**: neckline slides off the shoulders unevenly -> narrow neck by 2 to 3 cm or shorten the elastic; pits bunching -> raise U by 1 to 2 cm and reduce sleeve cap fullness; blouse feels like a bag at the waist -> add a waist casing at 2 cm above W.
- **Variants**: #off-shoulder-bardot-neckline, #smock-top, #peasant-dress, #kaftan-top.
- **CLO3D**: gathering via the Shirring/elastic setting: assign elastic strength on the neck casing seam line or use a narrow elastic pattern; particle distance 5 mm; heavy gathering needs a higher-quality simulation; verify neck circumference on the avatar.
- **Confidence**: trade practice. Numbers typical; traditional gusset layout from memory, no drawn source.

## Wrap Blouse {#wrap-blouse}

- **Aliases**: wrap top, crossover blouse, surplice blouse, kimono-wrap top; fr: blouse cache-coeur, haut portefeuille; de: Wickelbluse
- **Family**: top, woven or knit, wrap front
- **Recognize**: two fronts cross diagonally over the chest and tie at the waist or side, forming a V neckline whose edge continues down to the tie; back is plain.
- **Pieces**: front right x1 (overlap), front left x1 (underlap), back x1 on fold, sleeves x2, ties x2 (or one tie attached at the side seam and one through a slot or buttonhole), neck/edge facing or self-binding x2, interfacing for the edge.
- **Shape**: Each front is cut as a full-width piece (not on fold) from NP across CF to a point beyond CF. The overlap front: the wrap edge runs from N down to X, a point beyond CF at waist depth, located by the overlap O (typical 10 to 18 cm) at W; neckline depth at CF D_v = D_w x n / (n + O), with n = horizontal NP-to-CF distance (typical 7 cm) and D_w the depth from N to W (sheet 6.1, worked example n = 7, O = 10, D_w = 40 gives 16.5). The underlap front mirrors the line but ends at the opposite side seam and its inner edge is hidden. The bust dart moves into the wrap edge (neckline) or the waist. The hem follows the wrap edge or runs straight. Ties: one tie sewn into the side seam at W on the overlap side, the other tie sewn into the left front side seam, or the first tie threads through a slot at the right side seam. Source: sheet 6.1, derived from construction logic; unverified as a drawn pattern.
- **Drafting**: 1. Trace the front block full width. 2. Draw the wrap line from N to X, then curve it slightly (hollow 0.5 to 1 cm). 3. Shorten the wrap edge by 1 cm at the V (stay tape 0.5 to 1 cm shorter than the edge). 4. Move the bust dart into the wrap edge; add 3 to 5 cm of ease to the waist ties. 5. Add a facing 4 to 5 cm wide along the wrap edge. 6. Hem allowance 1 to 1.5 cm on a curved hem.
- **Sewing order**: 1. Interface the edge. 2. Shoulder seams. 3. Attach facing or binding along the wrap edge and neck. 4. Side seams with the tie caught in the seam. 5. Sleeves. 6. Hem.
- **Finishes and notions**: stay tape or woven bias tape along the neckline edge; inside hook or snap at the point where the V crosses to prevent gaping; tie ends narrow-hemmed.
- **Fabrics**: crepe, jersey, viscose, georgette; stretch jersey needs no zip and can use a self-binding. Woven: the wrap edge is on a bias and will stretch; stay tape is required.
- **Fit faults**: V gapes -> shorten the neck edge 1 cm and add a small stay tape; wrap slides open -> add a snap or inner tie; bust pulls open -> add length to the front at BP.
- **Variants**: #wrap-dress, #tie-front-blouse, #halter-top.
- **CLO3D**: model the two fronts as separate patterns on different layers; the overlap piece sits on top; sew side seams only; do not sew the wrap edge; simulate with pins at the tie; particle distance 5 mm.
- **Confidence**: trade practice and the techniques sheet (6.1). Numbers typical; no drawn source.

## Tie-Front Blouse {#tie-front-blouse}

- **Aliases**: knot-front shirt, tie-waist top, tie-hem blouse; fr: chemisier noué, haut à nouer; de: Knotenbluse
- **Family**: top, woven, front-tie variant of the blouse
- **Recognize**: a shirt or blouse whose two front hems extend into long ends that tie in a knot or bow at or above the waist; the front may be open or buttoned only to the bust.
- **Pieces**: front x2 (pair, each with an extended hem end), back x1 on fold, sleeves x2, collar or neck finish, front facings x2, optional tie strips x2 (if not cut as part of the front), interfacing for the facing.
- **Shape**: Front pair as #classic-blouse down to W. Below W the CF edge is extended straight or curved outward into a long rectangular end (the tie): width 6 to 10 cm finished (cut about twice that), length 50 to 90 cm, ending in a point or straight cut. The extension is cut as part of the front piece when the grain allows; otherwise it is a separate strip stitched to the front hem at CF. Grain along the tie is the front grain (parallel to CF). The front hem curves up from the tie root to the side seam. Source: construction logic, unverified as a drawn pattern; the tie length and width are style choices.
- **Drafting**: 1. Draft the blouse front pair with a straight or tapered CF. 2. Lower the hem 6 to 12 cm below the hem line at the knot position. 3. Extend the front below W by the tie length: draw a rectangle from the CF at W going down and out. 4. Check the total front length at the knot: the knot should sit at or just above W. 5. Hem the free edges narrow.
- **Sewing order**: 1. Sew the shoulder seams. 2. Make the neck finish. 3. Sleeves and side seams. 4. Hem, with the tie edges hemmed first. 5. Optional button or snap at the bust.
- **Finishes and notions**: narrow double-turned hem on the tie ends, a hidden snap at the bust if the front is meant to stay closed.
- **Fabrics**: cotton shirting, poplin, crepe, linen, viscose; knits for a casual T-shirt version.
- **Fit faults**: knot pulls the hem up -> lengthen the front by 3 to 5 cm; front gaps above the knot -> add snaps at the bust; knot too bulky -> thin or lighter fabric.
- **Variants**: #wrap-blouse, #classic-blouse, #crop-top.
- **CLO3D**: sew the tie extension as part of the front piece; the knot is not reliably tied in simulation, so model the ties hanging or use pins at the knot position.
- **Confidence**: trade practice and construction logic. Lengths typical; no drawn source.

## Shell Top {#shell-top}

- **Aliases**: shell, sleeveless blouse, sleeveless shell blouse, tailored shell; fr: haut sans manches, top ajusté; de: ärmelloses Top
- **Family**: top, woven, sleeveless, fitted
- **Recognize**: a simple sleeveless top with a jewel or low round neckline, armholes cut in at the shoulder, bust darts and often waist darts or princess seams, a hem at the hip or at the waist; worn under a jacket.
- **Pieces**: front x1 on fold (or x2 with CF placket), back x1 on fold or x2 with CB zip, neck facing x2 (front, back), armhole facings x2 (front, back) per side or bias binding, interfacing for the facings.
- **Shape**: Front: A at CF neck (lowered 1 to 3 cm from the block neck), N at NP (neck width narrowed 0.5 to 1 cm versus the block), S at SP (moved in 1.5 cm from the block SP), U at AU (raised 1 to 2 cm, so armhole depth = block - 1 to 2 cm). The armhole S-U is cut in 1 cm at the shoulder and curves to U. Shoulder N-S is shortened by the 1.5 cm taken at S. The bust dart sits at the side seam (5 to 7 cm below U) or in the French position; the waist dart (1.5 to 2.5 cm intake) points at BP and stops 3 to 4 cm below it (sheet 2.4). Hem straight or with a slight shirt-tail curve. Back: CB with or without zip, back neck depth 2 cm, back neck width narrowed to match the front, back waist dart 1.5 to 2.5 cm ending at scapula level. Front side seam sews to back side seam; front shoulder to back shoulder. Source: sheet 9.1, construction logic, unverified as a drawn pattern.
- **Drafting**: 1. Close-fitting block, bust ease 4 to 8 (full). 2. Raise U by 1 to 2 cm and cut the armhole in by 1 cm at the shoulder; narrow the shoulder by 1.5 cm in total. 3. Lower the neck 1 to 3 cm if wanted. 4. Move the bust dart to the side or leave it at the waist. 5. Length: W + 20 cm (hip length) or W + 5 to 7 cm (hip-skimming). 6. Draw facings by copying the neckline and armhole edges 5 to 6 cm wide, made 1 to 2 mm smaller than the garment edge so the seam rolls inward. All values typical.
- **Sewing order**: 1. Interface facings. 2. Darts. 3. Shoulder seams (garment and facings). 4. Join facings, understitch. 5. Side seams (garment and facings separately). 6. Hem. 7. Zip or buttons.
- **Finishes and notions**: understitched facing, 1 cm SA clipped on the curves, CB zip 35 to 40 cm (concealed), narrow hem 1 cm or 3 cm turned.
- **Fabrics**: crepe, gabardine, cotton sateen, linen, silk. Stretch wovens allow 1 to 2 cm less ease; thin silks need underlining or lining.
- **Fit faults**: armhole gapes at the front -> pivot 0.5 to 1 cm into the armhole dart; armhole digs into the arm -> lower U 1 cm and cut the curve less deep at the shoulder; shoulder slides -> narrow neck 0.5 to 1 cm.
- **Variants**: #camisole, #tank-top, #classic-blouse, #bustier-top.
- **CLO3D**: sew facings to the garment at neck and armhole, assign a stiffer fabric to the facing patterns as a second layer; mesh 5 mm; check armhole fit on the avatar.
- **Confidence**: trade practice and the techniques sheet (9.1, 4). Dimensions typical.

## Camisole {#camisole}

- **Aliases**: cami, camisole top, spaghetti-strap top, lingerie camisole; fr: caraco, débardeur à fines bretelles; de: Trägertop
- **Family**: top, woven or knit, sleeveless, strap
- **Recognize**: a sleeveless top held by thin straps (spaghetti or 6 to 15 mm wide), a straight or curved top edge near or above the bust, straight or slightly flared body, often bias-cut or lace-trimmed; a straight hem.
- **Pieces**: front x1 on fold (or x2 with CF seam), back x1 on fold (or x2 with CB seam), straps x2 (self bias tubes or ribbon), top-edge facing or bias binding x1, optional lace or elastic along the top edge, adjusters (ring and slider x2).
- **Shape**: Front: the top edge starts at the side seam about 3 to 6 cm above U, curves up over the bust to a high point 3 to 6 cm above BP at the strap anchor, and dips to a low point at CF (straight, curved or sweetheart). The strap anchor is 5 to 8 cm from CF along the top edge. Side seam U to hem: 6 to 10 cm of total ease at the bust for a loose camisole, none for a bias-cut or knit one. Bust: a 1.5 to 2 cm dart at the top edge pivoted to BP, or princess seams, or a gathered CF. Back: top edge lower than the front (5 to 8 cm below the back neck), straps anchored 4 to 6 cm from CB, hem straight. Each strap is a straight strip: finished 0.5 to 0.8 cm for a bias tube, or 10 to 15 mm folded for a flat strap. Front side seam sews to back side seam; strap ends are caught in the top edge finish. Source: sheet 9.3, unverified as a drawn pattern.
- **Drafting**: 1. Sleeveless block with ease 6 to 10 (full). 2. Draw the top edge as described. 3. Close the bust dart or move it to the top edge. 4. For a bias-cut camisole use ease 0 to 4 and mark the grain at 45 degrees. 5. Strap length = measured strap path + 2 to 4 cm for adjustment. 6. Hem 1 cm narrow or lace. All values typical.
- **Sewing order**: 1. Darts or princess seams. 2. Side seams. 3. Top-edge binding or facing with straps caught in. 4. Straps attached at the back with ring and slider. 5. Hem.
- **Finishes and notions**: French seams, bias binding, lace edging, rouleau or ribbon straps, optional silicone grip.
- **Fabrics**: silk charmeuse, satin, crepe de chine (bias cut); jersey and lace (negative ease). A bias camisole lengthens at CF and CB (see #slip-dress).
- **Fit faults**: top edge gapes -> shorten the top edge 1 to 1.5 cm or add elastic/grip; straps slide -> bring the strap anchor in 1 to 2 cm; drags at the bust -> add 1 to 2 cm to the front length; side seams swing -> balance front and back widths.
- **Variants**: #tank-top, #slip-dress, #shell-top, #bustier-top.
- **CLO3D**: sew straps as separate narrow patterns to the top edge; assign a bias grain for silk; mesh 5 mm; collision thickness 0.
- **Confidence**: trade practice and the techniques sheet (9.3). Values typical.

## Tank Top {#tank-top}

- **Aliases**: vest top, singlet, A-shirt, muscle tee, sleeveless top; fr: débardeur; de: Tanktop, Muskelshirt
- **Family**: top, knit (or woven), sleeveless, wide straps
- **Recognize**: a sleeveless top with straps wide enough to cover the shoulder (3 to 5 cm), a scooped neckline and armholes cut in towards the neck, bound with rib or turned and stitched; usually fitted in knit.
- **Pieces**: front x1 on fold, back x1 on fold, neck binding x1 (rib or self), armhole binding x2 (or turned edges). Woven version: front and back x1 on fold each, neck and armhole facings.
- **Shape**: Front: A at the lowered CF neck (depth 8 to 15 cm in a classic tank), N at the inner edge of the strap, S at the outer edge of the strap (strap width N-S typically 3 to 5 cm), U at AU raised 1 to 2 cm versus the block. The armhole S-U curves from S down to U, cut away 3 to 6 cm in from the original SP. The neckline curves from N down to A. The side seam U-hem is straight or slightly tapered; the hem is straight with an optional curve at the side. Racerback: the back armholes are drawn so that each strap narrows to 1.5 to 3 cm at the back neck, and the straps meet at a point 6 to 10 cm below the neck (T-back or Y-back); the back neck is a deep U. Back mirrors the front with the neck 2 to 4 cm lower than the block. Neck binding length = neckline length x 0.85 to 0.9 (knit); armhole binding = armhole length x 0.9 to 0.95. Front shoulder sews to back shoulder, front side seam to back side seam. Source: sheet 9.3 and 4, unverified as a drawn pattern.
- **Drafting**: 1. Knit block with ease 0 to -15 percent at the bust (see `#knit-block`) or woven block with ease 6 to 10. 2. Draw the strap width at the shoulder and the new armhole. 3. Keep N-S at the block shoulder slope. 4. Measure the armhole length for the binding. 5. Hem 2 cm with twin needle. 6. Check that the neckline stretches over the head and chest.
- **Sewing order**: 1. Shoulder seams. 2. Neck binding in the round (or flat before the second shoulder). 3. Armhole bindings. 4. Side seams. 5. Hem.
- **Finishes and notions**: rib binding 1x1 or 2x2, clear elastic 6 mm at shoulder seams, coverstitch or twin needle.
- **Fabrics**: single jersey, rib knit, interlock; 5 to 10 percent elastane. Woven: cotton poplin or linen with facings.
- **Fit faults**: strap slips off the shoulder -> move the neck-side of the strap out 1 cm, narrow the shoulder; armhole gapes -> shorten the armhole binding; neckline waves -> shorten the binding.
- **Variants**: #camisole, #halter-top, #shell-top, #crop-top.
- **CLO3D**: assign a jersey with the right warp/weft stretch; make the binding a thin pattern at 85 to 90 percent of the edge length and sew line to line; mesh 5 mm.
- **Confidence**: trade practice. Binding ratios typical.

## Halter Top {#halter-top}

- **Aliases**: halterneck top, halter, neck-strap top; fr: top dos nu à col, top licol; de: Neckholder-Top
- **Family**: top, woven or knit, strap behind the neck
- **Recognize**: a sleeveless top whose front is held by a strap that goes behind the neck, leaving shoulders and often the upper back bare; the armhole is cut in from the shoulder and raised at AU; the back is open, laced or tied.
- **Pieces**: front x1 on fold (or x2 with CF seam), back x1 on fold (high back) or back band x1 with ties, neck strap x1 (continuous around the neck, 2.5 to 5 cm finished) or x2 ties, front facing or lining x1, optional bone, interfacing.
- **Shape**: Front: the neckline is removed; the front is bounded by the top edge A-T (CF neckline to the strap root T), then the strap rises from T to the nape. T lies 7 to 9 cm from CF on the neckline (the strap is anchored on the neckline, not on the shoulder). The armhole is cut in at the shoulder by 3 to 6 cm and by 2 cm at AU, and U is raised 1 to 2 cm (sheet 4). The side seam runs from U to the hem, with waist shaping as in the block. The strap is a straight strip, often cut in one with the front (length = from T over the nape to the other T) or a separate band. Back: if open, the back is a narrow band (6 to 12 cm tall) at W or at the bra line with a tie or hook at CB; if high, the block back with the shoulder removed, the strap crossing at the nape. Front side seam sews to back side seam or band. Source: sheet 4 (halter row), unverified as a drawn pattern.
- **Drafting**: 1. Close-fitting block, ease 2 to 6 at the bust. 2. Pivot the gape of the cut-in armhole into the bust dart to prevent gaping (dresspatternmaking.com lowered necklines page: cut along the gape line to BP and pivot until the gape closes). 3. Draw the armhole from T, curving in at the top, then down to U raised 1 to 2 cm. 4. Strap width at T 2.5 to 5 cm. 5. Strap length measured on the person around the neck + adjustment 5 to 8 cm. 6. Make the neckline edge 1 cm shorter than the body so the neck strap carries the weight.
- **Sewing order**: 1. Darts. 2. Side seams. 3. Neckline and armhole facings, strap sewn in. 4. Closure behind the neck (hook, tie, button). 5. Back band or zip. 6. Hem.
- **Finishes and notions**: bias binding or facing, interfaced strap, hook and eye or tie, optional bone at CF.
- **Fabrics**: crepe, satin, cotton, jersey. Woven halter needs lining or interfacing to avoid sagging; jersey halter uses elastic in the neck edge.
- **Fit faults**: armhole gapes at the sides -> pivot 0.5 to 1 cm into the neckline and raise U; strap cuts into the neck -> widen the strap (4 to 5 cm); top slides down -> shorten the strap and the neck edge.
- **Variants**: #halter-dress, #camisole, #wrap-blouse, #tube-top.
- **CLO3D**: model the strap as an extension of the front piece; sew the two strap ends line to line behind the neck; mesh 5 mm.
- **Confidence**: trade practice and the techniques sheet (4). Numbers typical; gape correction cited from dresspatternmaking.com.

## Tube Top {#tube-top}

- **Aliases**: bandeau, bandeau top, boob tube, strapless top; fr: bandeau, top tube; de: Bandeau-Top
- **Family**: top, knit (or woven with boning), strapless
- **Recognize**: a strapless top that wraps the chest in a band; in knit it is a straight tube with elastic at the top edge; in woven it is a short boned bodice with darts or a gathered front.
- **Pieces**: Knit: body x1 on fold (folded to a tube, one side seam) or x2 (two side seams), top-edge elastic x1, optional lining x1. Woven: front x1 on fold, back x1 on fold, boning channels, interfacing, lining.
- **Shape**: Knit tube: a rectangle of height 12 to 20 cm (bandeau) or 20 to 30 cm (long tube top) and unstretched circumference = chest circumference x 0.80 to 0.90 (negative ease 10 to 20 percent). The side seam closes the tube; the top edge is folded 2 to 3 cm for an elastic casing or finished with a band. Woven bandeau: the top edge follows the bust line straight or with a slight bow at CF, the bottom edge follows the underbust or waist, bust darts or CF gathering give the bust shape, boning at CF, sides and CB. Source: construction logic, unverified as a drawn pattern.
- **Drafting**: 1. Measure the chest circumference A at the intended top-edge level (above the bust) and under the bust B. 2. Knit: cut width per half = A x 0.80 to 0.90 / 2 (fold), height as wished + SA; top casing 2.5 to 3 cm for 1.5 cm elastic. 3. Elastic length = A x 0.80 to 0.85. 4. Woven: top edge circumference = A + 0 to 2 cm (it must grip), bottom edge = underbust or waist + 1 to 2 cm, darts or princess seams for the bust, lining, bones in seams. All values typical.
- **Sewing order**: 1. Sew the side seam(s). 2. Fold the top edge and sew the casing, thread elastic, or apply a band. 3. Hem the bottom. 4. Woven: boning channels, lining, zip or hooks.
- **Finishes and notions**: elastic 1 to 2.5 cm, silicone grip tape, bones 5 to 6 mm in woven, zip or hooks at CB.
- **Fabrics**: stretch jersey, mesh, rib; satin and brocade for the woven version. Slippery fabrics need a stay.
- **Fit faults**: slips down -> shorten the elastic 1 to 2 cm or add grip tape; rolls at the top -> add a facing or wider elastic; bust flattened -> use darts or seam shaping instead of a plain tube.
- **Variants**: #bustier-top, #strapless-boned-dress, #off-shoulder-bardot-neckline.
- **CLO3D**: knit: a closed tube joined at the side seam(s), stretch fabric with negative ease via shrinkage; place on the avatar at the upper chest. Woven: add an interfacing layer and tune stiffness.
- **Confidence**: trade practice. Percentages typical; no drawn source.

## Peplum Top {#peplum-top}

- **Aliases**: peplum blouse, waist-flare top; fr: haut à basque, top à peplum; de: Schößchenbluse
- **Family**: top, woven or knit, waist seam with flare
- **Recognize**: a fitted top with a flared or gathered panel (peplum) sewn at the waist seam; the peplum is 10 to 25 cm long, circular, gathered or pleated; the top above is darted or princess seamed.
- **Pieces**: bodice front x1 on fold (or pair), bodice back x1 or x2 with zip, peplum front x1 on fold (or x2), peplum back x1 on fold (or x2), neck/armhole facings or sleeves, waist stay tape.
- **Shape**: Bodice as #shell-top or #classic-blouse cut off at W with the waist seam straight or slightly curved. Peplum: a ring segment. For a fraction f of a circle, inner radius r = Lw / (2 pi f), where Lw is the waist seam length of that piece, and outer radius R = r + peplum length. A half circle (f = 0.5) is a half annulus whose straight edges are the CF/CB or side seams; a quarter circle gives r = 2 Lw / pi (sheet 9.2). Rectangular gathered peplum: width = Lw x 1.5 to 2.5, height = peplum length. The peplum top (inner) edge sews to the bodice waist edge, notched at CF, side and CB; the hem edge is free. Source: sheet 9.2, geometry checked by computation.
- **Drafting**: 1. Bodice waist seamline Lw (with 1 to 2 cm ease, darts closed). 2. Choose f or gather ratio. 3. Compute r; draw the arc for each front/back piece; hem radius R = r + length. 4. Grain on CF/CB or the centre of each piece. 5. Add SA and a rolled or narrow hem (curved).
- **Sewing order**: 1. Sew the bodice. 2. Sew peplum seams. 3. Join peplum to bodice at the waist with a stay tape. 4. Hem. 5. Zip or closure.
- **Finishes and notions**: stay tape 1 cm at the waist, narrow or rolled hem on the curve, invisible zip 30 to 40 cm.
- **Fabrics**: crepe, ponte, jersey (circle), taffeta (stiff gather). Heavy fabrics hold the peplum out; draping fabrics fall in folds.
- **Fit faults**: peplum flips up at the hip -> reduce flare or shorten; peplum hangs limp -> stiffer interlining; waist seam ripples -> true the lengths and ease only 0.5 cm.
- **Variants**: #crop-top, #fit-and-flare-dress, #skater-dress, #half-circle-skirt.
- **CLO3D**: sew the peplum top edge to the bodice waist with equal seam lengths; circular pieces keep their grain; mesh 5 mm.
- **Confidence**: trade practice and the techniques sheet (9.2). Geometry verified by computation.

## Crop Top {#crop-top}

- **Aliases**: cropped top, short top, midriff top; fr: top court; de: bauchfreies Top
- **Family**: top, woven or knit, short body
- **Recognize**: a top whose hem falls between the underbust and above the natural waist, exposing the midriff; shapes range from a fitted band to a boxy cropped shirt.
- **Pieces**: as the full-length garment it shortens (T-shirt, blouse, shell): front x1 on fold, back x1 on fold, sleeves x2 or neck/armhole finishes, a hem band x1 if fitted.
- **Shape**: The block is shortened at a horizontal line. If the hem is at UB, the hem edge length of the full circumference equals the underbust circumference + 0 to 3 cm, the bust dart is closed and replaced by ease or shaping, and the side seam is U + 4 to 8 cm long. If the hem is at W, the waist dart stays. A boxy crop keeps ease 10 to 18 cm and a straight or slightly curved hem. A fitted crop needs a hem band (3 to 5 cm) or elastic to stay in place. Front side seam sews to back side seam. Source: sheet 9.5, unverified as a drawn pattern.
- **Drafting**: 1. Start from the chosen block or tee. 2. Mark the cropped length (UB, UB + 4 to 8, or W). 3. For a hem at UB, close the bust dart at the side seam and distribute 1 to 1.5 cm at the hem curve or pivot into the neckline. 4. Check the hem circumference against the underbust + 0 to 3. 5. Hem allowance 1.5 to 3 cm (knit), 1 cm (woven).
- **Sewing order**: as the base garment; hem band or elastic last.
- **Finishes and notions**: hem band 3 to 5 cm, elastic 1.5 cm, coverstitch hem.
- **Fabrics**: jersey, rib, poplin, linen. Stretch fabrics need less ease; stiff fabrics need a curved hem to avoid flipping.
- **Fit faults**: hem rides up at the bust -> add 2 to 3 cm to the front length; hem flares -> add a hem band; dart ends bubble -> convert to a seam.
- **Variants**: #tank-top, #bustier-top, #peplum-top, #oversized-shirt.
- **CLO3D**: reuse the base garment patterns trimmed to length; check the hem on the avatar at the underbust; mesh 5 mm.
- **Confidence**: trade practice and the techniques sheet (9.5). Numbers typical.

## Bustier Top {#bustier-top}

- **Aliases**: bustier, boned bustier, cupped bodice, strapless corset top; fr: bustier; de: Bustier
- **Family**: top, boned, fitted, strapless or with straps
- **Recognize**: a close-fitting top that extends from above the bust to the waist or hip, with seamed cups or princess seams, boning in seams, a CB zip or front hooks, and sometimes straps.
- **Pieces**: centre front x2, front side x2, side back x2, centre back x2 (zip), lining set of the same pieces, interlining/coutil layer, boning channels, waist stay, grip elastic. With cups: cup x2 (outer) + cup lining x2.
- **Shape**: Top edge straight or sweetheart, 3 to 6 cm above BP; princess seams run from the top edge past the bust apex (0.5 to 1 cm outside BP to avoid the nipple) to the waist; the side and side-back seams shape the waist; CB seam with zip or lacing. Top edge length is 1 to 2 cm less than the body so it grips; at bust level ease 0 to 2 cm, at W 1 to 2 cm. Bones sit in: CF (2), each princess seam (2 per side), side (1), CB each side of the zip (2); typical 7 to 9 bones. Bone length = seam length - 2.5 to 3.8 cm; channel 1.2 to 1.5 cm wide. Waist stay of 2.5 cm petersham. Each panel edge sews to the neighbouring panel edge of equal length (centre front to front side to side back to centre back). Source: sheet 7.1 and 7.3, unverified as a drawn pattern.
- **Drafting**: 1. Princess-seamed close-fitting block (sheet 3.1), ease 0 to 6. 2. Cut the top and lower edge. 3. Place bones at all seams. 4. Add the sweetheart or straight top edge. 5. Waist stay. 6. Duplicate the pattern for lining and interlining. 7. Hem the lower edge 1 to 1.5 cm or bind it.
- **Sewing order**: 1. Interline each piece. 2. Sew princess seams, press. 3. Make channels on seam allowances or tape, insert bones. 4. Sew lining. 5. Join outer and lining at the top edge, turn, topstitch. 6. Insert grip elastic. 7. Zip, waist stay.
- **Finishes and notions**: steel or plastic bones, coutil, silicone grip, 2.5 cm waist stay, concealed zip 25 to 30 cm.
- **Fabrics**: satin, duchesse, brocade, cotton drill with coutil. Heavy fabrics need no interlining; lightweight needs coutil.
- **Fit faults**: top slides down -> reduce top edge 1 cm, add grip; bunching at waist -> shorten length; cups collapse -> add a cup bone or wire.
- **Variants**: #corset-top, #strapless-boned-dress, #tube-top.
- **CLO3D**: represent bones as internal lines with a stiff strip fabric; set the top edge on the avatar; check bone length with the seam-length tool; mesh 5 mm.
- **Confidence**: trade practice and the techniques sheet (7.1, 7.3). Values typical.

## Corset Top {#corset-top}

- **Aliases**: corset-style top, corset bodice top, laced top, waist-cincher top; fr: haut corseté; de: Korsagenoberteil
- **Family**: top, boned, waist reduction, lacing
- **Recognize**: a fashion top with a corset-shaped body: many vertical panels, visible boning, lacing at CB or CF, often a busk at CF, a pronounced waist.
- **Pieces**: panels per side 3 to 8 (centre front, front side, side, side back, centre back), coutil layer, fashion layer, lining; busk x1 (or lacing at CF), lacing strips x2, eyelets, bone channels, waist tape x1.
- **Shape**: The top is divided into vertical panels with curved seams from top to bottom, each seam carrying a bone. Waist reduction R is typically 5 to 10 cm (comfort) up to 15 cm (training) from the body waist W; the sum of all panel widths at the waist (both halves) = W - R - G, where G is the lacing gap (2.5 to 5 cm). Width per panel at the waist = (W - R - G) / (2 n), n = panels per side. Hip spring (corset hip circumference) = H - 5 to 10 cm. Height: 12 to 17 cm above the waist (to under the bust) and 8 to 12 cm below. Busk 10 to 20 cm at CF; eyelets 1.5 to 2 cm apart at CB. Each panel sews to the neighbouring panel along a seam of equal length, the CB panels carrying the eyelets. Source: sheet 7.2; reduction ranges consistent with the FreeSewing Cathrin documentation; panel curves unverified.
- **Drafting**: 1. Measure W, H, underbust, bust. 2. Fix R and G. 3. Divide the waist circumference equally into panels. 4. Place panel seams. 5. Draw each panel as a gentle S-curve from top to bottom, narrowest at the waist, widest at the hip spring. 6. Check seam lengths equal at each pair. 7. Add 1.5 cm SA and bone channels.
- **Sewing order**: 1. Cut coutil, fashion fabric, lining. 2. Sew panels (CB first). 3. Insert busk. 4. Channels and bones. 5. Eyelets. 6. Bind edges. 7. Lace.
- **Finishes and notions**: spiral steel bones at curved seams, flat steel at busk and lacing, coutil, waist tape 2.5 cm, bias binding, lacing.
- **Fabrics**: coutil, satin, brocade, mesh over coutil, fashion lining.
- **Fit faults**: waist digs in -> loosen R; top gapes -> add a cup or shorten height; hips pinch -> add hip spring.
- **Variants**: #bustier-top, #strapless-boned-dress.
- **CLO3D**: stiff internal fabric for the coutil layer, bones as internal lines with narrow stiff strips, mesh 5 mm; the avatar waist must be the compressed waist.
- **Confidence**: trade practice and the techniques sheet (7.2); reduction ranges consistent with FreeSewing Cathrin; panel curves unverified.

## Bodysuit (top) {#bodysuit-top}

- **Aliases**: body, leotard-top, snap-crotch top, teddy (lingerie); fr: body; de: Body
- **Family**: top, knit, one-piece with crotch closure
- **Recognize**: a close-fitting stretch top that continues under the crotch as a thong, brief or full-seat leg opening and closes between the legs with snaps or hooks; neckline and sleeves vary (tank, long sleeve, turtleneck, scoop).
- **Pieces**: front x1 on fold, back x1 on fold, crotch lining/gusset x1 (double layer, with snap tape), neck binding or band x1, armhole bindings x2 or sleeves x2 + cuffs, leg opening elastic x2 (plush or fold-over), snap tape or hook-and-eye tape x1 pair.
- **Shape**: Front and back are the knit torso block extended downward past the hip to the crotch. Total vertical length (trunk length) is measured from NP (or the neck base) over the shoulder, through the legs, to the same point at the back; the knit pattern uses the body measurement with 0 to -2 percent ease vertically (stretch fabric) and 2 to 4 cm of extra at the crotch only for woven or low-stretch fabric. Front crotch: the front bottom edge is a short curved edge about 5 to 10 cm wide (half width on the fold 2.5 to 5 cm) at CF, flaring out to the leg-opening line; the back bottom edge is wider (10 to 14 cm total, half 5 to 7) because it covers the seat. The leg opening curve runs from the side seam at hip level (or higher for a high-cut leg) down to the crotch edge: a concave arc whose lowest point is the crotch edge and whose highest point at the side seam sets the leg cut (a high-cut leg rises 5 to 8 cm above the crotch line). Front and back are joined at the side seams and at the shoulders; front crotch edge and back crotch edge both sew to the crotch gusset (or the closure tape). Waist shaping: side seam taken in 1 to 3 cm at W in a fitted body. Source: construction logic, unverified as a drawn pattern (compare the leotard/swimsuit-body construction in knit block references).
- **Drafting**: 1. Take the knit block (stretch >= 40 percent, ease -5 to -15). 2. Extend the side seam from the hip line down to the crotch level (hip to crotch height 18 to 22 cm, measured on the person from the waist; sitting measure is more reliable). 3. Draw the leg opening curve from the hip-level side seam point to the crotch edge. 4. Set the crotch width: front 4 to 7 cm total, back 8 to 12 cm total, both with SA. 5. Make the gusset a rectangle of crotch width x (front crotch edge + back crotch edge + 2), double thickness with snap tape. 6. Neck and leg bindings: elastic length = edge length x 0.85 to 0.9. All values typical.
- **Sewing order**: 1. Shoulder seams. 2. Neckline and armholes (bindings or sleeves). 3. Side seams. 4. Leg opening elastic. 5. Gusset: sew to the front crotch edge, then to the back; snap tape on the inner layer. 6. Finish.
- **Finishes and notions**: snap tape 2 or 3 snaps, plush elastic 1 to 1.5 cm at the leg, coverstitch or zigzag, clear elastic at shoulders.
- **Fabrics**: cotton jersey with 5 to 8 percent elastane, rib, modal, power mesh. Low-stretch fabrics need extra torso length and side vents.
- **Fit faults**: pulls at the crotch -> lengthen the torso (1 to 2 cm) and the crotch width; gapes at the leg -> shorten the leg elastic by 1 cm; rides up at the back -> lengthen the back 1 to 2 cm and lower the back leg curve; bust pulls -> add length over the bust.
- **Variants**: #tank-top, #crop-top, #tube-top.
- **CLO3D**: build front, back, gusset; sew the crotch edges line to line; leg binding as a narrow pattern or elastic via the elastic setting; stretch fabric assigned; check the stress map on the torso and the crotch with the avatar standing and sitting poses if available.
- **Confidence**: trade practice and construction logic. Crotch widths typical; no drawn source.

## Tunic Top {#tunic-top}

- **Aliases**: tunic, long top, kurta-style top (when side-slit), tunic blouse; fr: tunique; de: Tunika
- **Family**: top, woven (or knit), long, loose
- **Recognize**: a long top that reaches the hip or upper thigh (L = H + 15 to 30 cm), loose through the body, side slits 10 to 15 cm, round neck with a short placket or keyhole, long or three-quarter sleeves.
- **Pieces**: front x1 on fold, back x1 on fold, sleeves x2, neck facing x2 (or placket x1), optional pockets, cuffs or sleeve hem x2, interfacing.
- **Shape**: Front: the block with bust ease 12 to 18 cm and hip ease 14 to 20 cm, no waist dart, side seam straight from U down to the hem and flared 2 to 3 cm per side at the hem. Hem is curved up 1 to 2 cm at the side. Slit: the side seam is left open from the hem up for 10 to 15 cm with SA 1.5 to 2 cm. The neckline is a round or keyhole; for a keyhole or placket, a CF slit 10 to 15 cm long is cut from the neckline with a facing. Back mirrors the front, shoulder 0.5 to 1 cm longer. Sleeves as the block. Front side seam sews to back side seam from U to the slit top. Source: sheet 9.4, unverified as a drawn pattern.
- **Drafting**: 1. Easy-fitting block, no waist dart. 2. Length: L = H + 15 to 30. 3. Straighten the side seam and add flare of 2 to 3 cm per side at the hem. 4. Add side slit 10 to 15 cm. 5. Neckline per style (placket sheet 10.4, round neck facing sheet 4). 6. Sleeves per block.
- **Sewing order**: 1. Neck placket or slit facing. 2. Shoulders. 3. Neck facing. 4. Sleeves. 5. Side seams to the slit, bar tack. 6. Hem.
- **Finishes and notions**: narrow hem 1 cm, topstitched slit, 2 to 4 buttons or loops, bar tacks at the slit tops.
- **Fabrics**: cotton lawn, voile, linen, viscose, crepe. Drapey fabrics hang best with less flare.
- **Fit faults**: hem swings forward -> balance side seam; too wide at the shoulder -> narrow the neck; slit gapes -> topstitch with a turned 1.5 cm facing.
- **Variants**: #classic-blouse, #kaftan-top, #smock-top, #shift-dress.
- **CLO3D**: front and back sewn at side seams to the slit top; mesh 5 mm; simulate with the sleeve hanging.
- **Confidence**: trade practice and the techniques sheet (9.4). Values typical.

## Smock Top {#smock-top}

- **Aliases**: smock blouse, smock, smocked top, gathered-yoke top, shirred top; fr: blouse à smocks, blouse smockée; de: Smokbluse
- **Family**: top, woven, gathered body on a yoke
- **Recognize**: a loose top with a plain yoke or a smocked/shirred panel at the chest and a gathered, flowing body below; sleeves are gathered at the cuff or the cap; the shape is full, not fitted.
- **Pieces**: yoke front x1 on fold, yoke back x1 on fold (or x2 with a doubled outer/inner yoke), body front x1 on fold, body back x1 on fold, sleeves x2, cuffs x2, neck binding/facing x1, optional smocked/shirred panel x1.
- **Shape**: The body pieces are rectangles or slightly flared trapezoids whose top edge is 1.5 to 2 times the width of the yoke bottom edge (gather ratio 1.5 to 2). The yoke is a shaped upper bodice from the neck/shoulder to a horizontal seam at 10 to 14 cm below NP (front), carrying the shoulder, neckline and armhole. The yoke bottom edge sews to the gathered top edge of the body (the gathers are distributed between two notches on each side of CF and between the side notches, with a flat 2 to 3 cm zone near CF). The sleeve cap is eased or gathered into the armhole. Traditional smock-frock (historical) is made of rectangular blocks and gussets; this layout was not checked in a drawn pattern. Source: construction logic, unverified as a drawn pattern.
- **Drafting**: 1. Draw the yoke on the easy-fitting block: seam 10 to 14 cm below NP front, 8 to 12 back. 2. Body top width = yoke bottom width x 1.5 to 2; body length = desired L - yoke depth. 3. Make the body trapezoid by adding 2 to 4 cm per side at the hem. 4. Sleeve per block, optionally gathered at the cap (cap ease 3 to 5 cm). 5. For a shirred panel: shirring rows at 1 to 1.5 cm spacing; the unshirred panel width = finished width x 2 to 2.5.
- **Sewing order**: 1. Gather the body top edge. 2. Sew yoke to body. 3. Shoulder seams. 4. Neck finish. 5. Sleeves. 6. Side seams. 7. Hem.
- **Finishes and notions**: gathering stitches 2 rows (3.5 mm length), elastic thread for shirring, French seams.
- **Fabrics**: cotton lawn, voile, crepe, linen, light viscose. Heavier fabrics need a lower gather ratio.
- **Fit faults**: yoke too tight -> widen yoke 1 to 2 cm; gathers bulky -> reduce ratio to 1.3 to 1.5; neckline gaps -> add elastic or a drawstring.
- **Variants**: #peasant-blouse, #smock-dress, #tunic-top.
- **CLO3D**: gather by assigning a seam with a shortened body edge; or via the shirring tool (set_shirring) on the shirred panel; mesh 5 mm.
- **Confidence**: trade practice. Ratios typical; traditional smock-frock cutting from memory, no drawn source.

## Kaftan Top {#kaftan-top}

- **Aliases**: kaftan blouse, caftan top, tunic kaftan, T-shaped top; fr: caftan, tunique caftan; de: Kaftanbluse
- **Family**: top, woven, T-shaped, one-piece sleeve
- **Recognize**: a wide, long top cut in a T-shape: the body and sleeves are cut as one with a shoulder fold line; the neckline has a keyhole or a V slit; the side seams may be open at the lower part; a loose silhouette without a waist.
- **Pieces**: front/back body-sleeve piece x2 (front, back), each with the shoulder on a fold or a shoulder seam; neck opening facing x1 (or binding), optional side-slit facing x2, optional gusset x2.
- **Shape**: Each piece is a T: a vertical body rectangle of width (B + 30 to 50 cm ease) / 2 and length L, with a horizontal sleeve extension from the shoulder line outward to the wrist (sleeve length measured from CB/CF shoulder fold: about 30 to 60 cm). The shoulder line is horizontal or drops 2 to 6 cm to the wrist for a steeper line. The neck opening is a hole at the centre of the shoulder fold: half width 8 to 12 cm, front depth 6 to 15 cm, back depth 2 to 3 cm; for a keyhole or V an extra slit 15 to 25 cm down CF. The underarm joins the body and sleeve with a gentle curve at the armpit (radius about 6 to 10 cm) to avoid a sharp right angle; the sleeve underarm seam and the side seam are one continuous seam from wrist to hem. Front sews to back along the shoulder (fold or seam), the wrist-underarm-side seam, up to the slit; the hem is straight or curved. Source: general T-tunic construction, unverified as a drawn pattern.
- **Drafting**: 1. Draw a rectangle of the body width and the length. 2. Mark the shoulder line at the top; extend it outward for the sleeve length. 3. Draw the neck hole and slit. 4. Curve the underarm; sleeve hem width = forearm + 10 to 16 cm. 5. Slits 10 to 25 cm at the side hem. 6. Facing copied from the neck hole.
- **Sewing order**: 1. Shoulder seams (if not a fold). 2. Neck facing. 3. Join sides from wrist to hem, leaving the slits. 4. Hem the sleeves and the bottom.
- **Finishes and notions**: bound neck, hand-rolled or narrow hems, frog or ties at the neck.
- **Fabrics**: silk crepe, chiffon, cotton voile, light viscose. A heavy fabric needs a reduced width.
- **Fit faults**: sleeve restricts arm lift -> deepen the armhole curve and add a gusset (6 to 10 cm); neck falls to the side -> reduce neck half-width by 1 cm.
- **Variants**: #peasant-blouse, #tunic-top, #kimono (see #kimono-block).
- **CLO3D**: build front and back as large T-shaped patterns; sew the shoulder seam, the sleeve-side seam; the neck facing as a ring; mesh 8 mm for soft fabrics.
- **Confidence**: trade practice. Dimensions typical; the T-shape is a common construction, no drawn source.

## Women's Fitted Shirt {#womens-fitted-shirt}

- **Aliases**: women's darted shirt, princess-seam shirt, fitted button-up, tailored women's shirt; fr: chemise femme cintrée; de: taillierte Damenbluse
- **Family**: shirt, woven, shaped for women (see also `#shirt-block`, `#button-down-shirt`)
- **Recognize**: a shirt with a collar and stand, front button placket, long or short sleeves with cuffs, bust darts and waist darts (or princess seams) for shaping, a back yoke and a curved hem. Women's shirts button right over left.
- **Pieces**: front x2 (with grown-on placket or separate placket x2), back x1 on fold (or x2 with princess seams), back yoke x2, sleeves x2, cuffs x4, sleeve plackets x2, collar x2, collar stand x2, interfacing. Princess version: front centre x2, front side x2, back centre x2, back side x2.
- **Shape**: Darted: as #classic-blouse, front bust dart to the side seam or French dart (1.5 to 3 cm), waist darts 1.5 to 2.5 cm ending 3 to 4 cm below BP, back darts or side shaping 1 to 2 cm. Princess: bust dart pivoted to the shoulder or armhole and joined to the waist dart through BP (sheet 3.1/3.2): front centre panel and front side panel meet along a curved seam from the shoulder (or armhole) through BP (kept 0.5 to 1 cm outside) to the hem; back princess seams from the shoulder or armhole to the hem. The front centre edge keeps the button stand (grown-on 1.5 beyond CF plus 3.5 facing fold per sheet 10.4). Back yoke 8 to 10 cm below the back neck. Shirt-tail hem rising 8 to 12 cm at the side seam. Women's right front has the buttonholes; the left front carries the buttons. Source: sheets 3, 10.1 to 10.6; unverified as a drawn pattern.
- **Drafting**: 1. Close-fitting block with bust ease 10 to 14, waist ease 6 to 12. 2. Move the bust dart to the shoulder/armhole (princess) or side seam (darted). 3. Add button stand, yoke, and hem curve. 4. Collar and stand per sheet 10.6; cuffs per 10.7. 5. Check that the front and back side seams are equal in length.
- **Sewing order**: as sheet 10.1: interface, collar, cuffs, yoke, front, sleeves flat, side and underarm in one run, collar attach, hem, buttons.
- **Finishes and notions**: 10 to 12 mm buttons, 6 to 8 buttons, collar stays optional, topstitch 0.6 cm.
- **Fabrics**: poplin, oxford, shirting stretch, silk, linen. Stretch shirting needs less waist ease; stripes and checks need matching at the front, pockets, yoke.
- **Fit faults**: gaping between buttons at the bust -> add ease at the bust or move buttons to BP; pull lines from the bust to the armhole -> enlarge the bust dart; shoulder seam pulls forward -> balance front and back.
- **Variants**: #classic-blouse, #oversized-shirt, #shirt-dress, #mens-dress-shirt.
- **CLO3D**: follow the shirt block build; collar stand and collar as separate patterns on different layers; button placement by hand on the placket; fabric thickness 0.3 to 0.5 mm; mesh 5 mm.
- **Confidence**: techniques sheet (10.1 to 10.7) plus trade practice. Numbers typical; the princess version from sheet 3.1/3.2.

## Oversized Shirt {#oversized-shirt}

- **Aliases**: boyfriend shirt, drop-shoulder shirt, boxy shirt, big shirt; fr: chemise oversize; de: Oversize-Hemd
- **Family**: shirt, woven, drop shoulder
- **Recognize**: a shirt with a wide body, shoulder seams that fall below the natural shoulder point, low armholes and wide sleeves; the hem is curved and long; the cuffs are wide.
- **Pieces**: front x2 (pair with placket), back x1 on fold with yoke x2, sleeves x2, cuffs x4, sleeve plackets x2, collar x2 + stand x2, optional pocket x1, interfacing.
- **Shape**: As the shirt block but with chest ease 20 to 40 cm (full), shoulder drop d 3 to 8 cm (the shoulder line is extended past SP by d, with slope reduced by 1 to 2 cm), armhole depth lowered 0.8 to 1.2 x d or more (8 to 14 cm for deep), side seam straight with the hem 8 to 12 cm wider; sleeve cap height reduced to 5 to 10 cm, sleeve width increased to 2 x armhole depth, sleeve length reduced by d (sheet 9.6). The front armhole sews to the sleeve cap front half, the back armhole to the back half; the underarm seam runs from the cuff to the hem in one line. Hem shirt-tail curve rising 8 to 12 cm. Source: sheet 9.6, unverified as a drawn pattern.
- **Drafting**: 1. Easy-fitting block with chest ease 20 to 40. 2. Extend the shoulder by d, lower U, redraw armhole. 3. Reduce the cap height and widen the sleeve. 4. Ensure the armhole length front + back is within 2 cm of the sleeve cap length (cap ease 0 to 1). 5. Add placket, yoke, collar. 6. Underarm angle 60 to 75 degrees for movement.
- **Sewing order**: as #womens-fitted-shirt; sleeves set flat before the side and underarm seams.
- **Finishes and notions**: buttons, topstitch 0.6 cm, French seams or flat-fell for a casual look.
- **Fabrics**: cotton poplin, linen, denim, flannel, twill; heavy fabrics hold shape, light fabrics drape.
- **Fit faults**: sleeve restricts arm lift -> deepen armhole or add gusset; shoulder falls too low -> reduce d; excess fabric at the front -> shorten front or add a pleat.
- **Variants**: #womens-fitted-shirt, #tunic-top, #crop-top.
- **CLO3D**: set the armhole seams carefully; simulate with a posed avatar; mesh 8 mm.
- **Confidence**: techniques sheet (9.6) and trade practice. Values typical.

---

# DRESSES

Dress conventions: bodice anchors as above; skirt anchors as in `bottoms.md` (A waist at CF, B waist at side seam,
C hip at side seam, D hem at side seam, E hem at CF). Where there is no waist seam the front is one piece from
the neckline to the hem and W is only a level. Waist-to-hip depth typical 18 to 22 cm; total dress length is
stated from NP (nape-to-hem for the back) or from the waist.

## Sheath Dress {#sheath-dress}

- **Aliases**: fitted dress, column dress, fourreau, pencil dress; fr: robe fourreau; de: Etuikleid
- **Family**: dress, fitted, no waist seam (darts or princess seams)
- **Recognize**: a close-fitting dress from the neckline to the knee in one piece with long fish-eye darts through the waist, side seams close to the body, narrow hem often with a back vent, CB zip.
- **Pieces**: front x1 on fold, back x2 (CB seam with zip and vent) or x1 on fold, neck and armhole facings (or lining) x2 sets, CB zip, optional sleeves x2, lining pieces.
- **Shape**: Front: A at CF neck, N, S, U (as the close-fitting block), bust dart at the side seam or French position (3 to 4 cm intake), a long fish-eye waist dart: top point 3 to 4 cm below BP (or at UB), widest at W (width = front waist suppression, typically 2.5 to 4 cm), lower point 14 to 20 cm below W. The side seam runs U-W-C: the block side seam, then C to D tapering inward below the hip (D is 2 to 3 cm inside the vertical through C for a pencil line). Back: CB with zip from the neckline to below the hip, a fish-eye dart whose top point is 4 to 6 cm below the chest line (scapula) with the widest part at W (2 to 3.5 cm) and the lower point 16 to 22 cm below W; the vent is an extension of 3.5 to 4.5 cm on the left back, 15 to 25 cm long, at the CB hem. Front side seam sews to back side seam; front shoulder to back shoulder. Source: sheet 8.2, unverified as a drawn pattern.
- **Drafting**: 1. Join the close-fitting bodice block and the skirt block with continuous side seams (dress block, `#dress-block`). 2. Align bodice and skirt waist darts and extend them into long fish-eye darts. 3. Side suppression 1 to 2 cm per side; hip ease 4 to 6 cm in total (full). 4. Taper the hem 2 to 3 cm per side; hem width not less than 85 to 90 cm unless a vent or a stretch fabric is used. 5. Hem allowance 3.5 to 4 cm. 6. Neck and armhole facings 5 to 6 cm wide.
- **Sewing order**: 1. Interface facings. 2. Darts. 3. Shoulders. 4. CB seam to the zip stop, zip. 5. Side seams. 6. Facings. 7. Vent and hem.
- **Finishes and notions**: concealed zip 50 to 55 cm, hook and eye at the neck, lining 2 to 3 cm shorter, clean-finished darts pressed toward CF.
- **Fabrics**: crepe, wool crepe, ponte, double cloth, stretch cotton sateen. A stretch fabric allows hip ease down to 0 to 2.
- **Fit faults**: pull lines at dart points -> extend the dart; bubble at the dart end -> blend with a softer curve; horizontal drag at the hips -> add 1 to 2 cm of ease at the hip; vent flips -> interface and widen to 4.5 cm.
- **Variants**: #shift-dress, #princess-line-dress, #bodycon-dress, #shirtwaist-dress.
- **CLO3D**: build front, back pieces with sewn darts; sew the CB seam to the vent top; mesh 5 mm near the vent; assign a woven fabric with low stretch (or stretch woven weights); check hip pull on the avatar.
- **Confidence**: techniques sheet (8.2) and trade practice. Dart lengths typical; no drawn source.

## Shift Dress {#shift-dress}

- **Aliases**: chemise dress, sack dress (loose), straight dress; fr: robe droite, robe chemise; de: Hängerkleid
- **Family**: dress, loose, no waist seam
- **Recognize**: a loose, straight or slightly flared dress with no waist seam and little or no waist definition; darts are small or absent; often sleeveless with a jewel neckline, faced armholes.
- **Pieces**: front x1 on fold, back x1 on fold (or x2 with CB zip), neck facing x2, armhole facings x2 pairs (or lining), pockets x4 optional.
- **Shape**: Front: block with bust ease 8 to 12 (full) and hip ease 8 to 12; the bust dart is moved to the side or French position and kept small (1.5 to 2 cm) or removed through ease; waist darts left at 1 to 1.5 cm or none. The side seam runs from U straight down to the hem (parallel to CF) for a shift, or flares 1.5 to 3 cm per side at the hem for an A-line shift. Hem curved square to the side seam. Back: block back, shoulder dart or none, neck depth 2 cm, CB zip or an opening through the neckline of 8 to 10 cm, side seam same length as the front. Front side seam sews to back side seam. Source: sheet 8.3, unverified as a drawn pattern.
- **Drafting**: 1. Block with bust ease 8 to 12 and hip ease 8 to 12. 2. Move the bust dart to the side; remove or reduce waist darts. 3. Straighten the side seam from U to the hem; for an A-line add 1.5 to 3 cm per side by slash and spread from the hem to the bust. 4. CB zip or loose neck opening. 5. Add 5 to 8 cm at the hem for walking if narrow. 6. Hem 3.5 to 4 cm.
- **Sewing order**: 1. Darts. 2. Shoulders. 3. CB seam and zip. 4. Facings. 5. Side seams. 6. Hem.
- **Finishes and notions**: facings or lining, hook and eye, optional pockets in the side seams.
- **Fabrics**: wool crepe, linen, cotton, double knit, brocade. Stiffer fabrics hold the shape; drapey fabrics follow the body.
- **Fit faults**: bunching under the arm -> raise U 1 cm; rides up at the back -> shorten the front 1 cm, lengthen the back; collapses at the bust -> add small bust dart.
- **Variants**: #a-line-dress, #sheath-dress, #trapeze-dress, #tunic-top.
- **CLO3D**: low-ease patterns drape from the shoulders; simulate with collision thickness 0 and check the shoulder width on the avatar; mesh 8 mm.
- **Confidence**: techniques sheet (8.3). Ease values typical.

## A-Line Dress {#a-line-dress}

- **Aliases**: A-line frock, flared dress, trapeze-lite; fr: robe trapèze, robe évasée; de: A-Linien-Kleid
- **Family**: dress, flared from shoulders or waist
- **Recognize**: a dress whose side seams widen continuously from the bust or waist to the hem, outline forming a capital A; may be waist-seamed with an A-line skirt, or cut in one piece with princess seams.
- **Pieces**: Without waist seam: front x1 on fold, back x1 on fold or x2, facings x2 sets. With waist seam: bodice front x1, bodice back x2, skirt front x1 on fold, skirt back x2 (zip), facings.
- **Shape**: One-piece: as #shift-dress but the flare begins at U or BP: the side seam from U runs straight to a hem point D that lies 6 to 12 cm (per side) outside the vertical through the hip for a pronounced A, 2 to 6 cm for a light A. The hem D-E curves down toward the side seam to be square at the side. The bust dart stays at the side or French; waist dart reduced or removed. With waist seam: bodice from the block, skirt as #a-line-skirt (flare 2 to 15 cm per quarter), waist seam straight. Source: sheet 8.3 and `#a-line-skirt`, unverified as a drawn pattern.
- **Drafting**: 1. Trace the dress block. 2. Slash from the hem to the bust dart (or to the waist) in 2 or 3 places and spread so each quarter adds the flare; 3. redraw the hem as a curve square to CF and the side seam; 4. check the side seam lengths front and back; 5. hem 1 to 1.5 cm if curved.
- **Sewing order**: darts, shoulders, zip, facings, side seams, hang 24 h, level, hem.
- **Finishes and notions**: concealed zip, facings or lining, narrow hem, optional pockets.
- **Fabrics**: twill, gabardine, linen, crepe, jacquard. Bias at the side seams drops: allow extra length at the side.
- **Fit faults**: hem dips at the sides -> bias drop; re-level after hanging; drag lines from the bust -> add dart; flare collapses -> heavier fabric or interfacing at the hem.
- **Variants**: #trapeze-dress, #shift-dress, #skater-dress, #fit-and-flare-dress.
- **CLO3D**: use a grain line parallel to CF; simulate with gravity; mesh 8 mm.
- **Confidence**: techniques sheet (8.3) and `#a-line-skirt`; values typical.

## Princess-Line Dress {#princess-line-dress}

- **Aliases**: princess seam dress, princess dress; fr: robe princesse; de: Prinzesskleid
- **Family**: dress, shaped by vertical seams
- **Recognize**: a dress whose bodice and skirt are cut in four panels each (front, back) with vertical curved seams running from the shoulder or armhole over the bust to the hem, giving the shaping without darts.
- **Pieces**: front centre x1 on fold, front side x2, back centre x2 (CB zip) or x1 on fold, back side x2, neck and armhole facings (or lining), CB zip. Total 6 to 8 panels plus facings.
- **Shape**: Front centre panel: CF on the fold, outer edge is the princess seam, running from the shoulder (4 to 6 cm from NP) or the armhole (6 to 10 cm above U) via a point 0.5 to 1 cm toward the side of BP (not on the nipple) to the waist, then continuing into the skirt as a straight or flared line to the hem. Front side panel: includes the armhole, the side seam and the other side of the princess seam; the princess seam of the side panel is convex at the bust and concave at the waist, equal in length to the centre panel seam (the difference at BP is 0.3 to 0.5 cm for ease). Back panels: back centre with the CB (zip) and the back princess seam from the shoulder or armhole through the scapula to the waist and hem; back side panel with the side seam. Side seams front-to-back are sewn as in the block. Hem width: flare 1 to 3 cm per panel seam. Source: sheet 3.1, 3.2 and 8.4, unverified as a drawn pattern.
- **Drafting**: 1. Pivot the bust dart to the shoulder (or armhole) and join the dart point to the waist dart point through BP shifted 0.5 to 1 cm outward. 2. Extend the line to the hem. 3. Cut the pattern apart on the princess lines, close the dart in the centre panel, add notches at BP level and waist. 4. Flare each panel seam 1 to 3 cm at the hem if wanted. 5. True the seam lengths and curves.
- **Sewing order**: 1. Join centre to side panels (convex edge on top, clip the concave edge, press toward CF). 2. Shoulders. 3. CB seam and zip. 4. Side seams. 5. Facings. 6. Hem.
- **Finishes and notions**: concealed zip, lining, hem 3 to 4 cm (straight) or 1 to 1.5 cm (flared).
- **Fabrics**: crepe, wool, double cloth, sateen, brocade.
- **Fit faults**: seam sits on the nipple -> move outward 1 cm; pulling over the bust -> add 0.3 to 0.5 cm to the side piece at BP; gaping at the waist -> reduce 0.3 cm.
- **Variants**: #sheath-dress, #a-line-dress, #fit-and-flare-dress.
- **CLO3D**: sew centre to side panels line to line; notch BP and waist; mesh 5 mm.
- **Confidence**: techniques sheet (3.1, 3.2, 8.4). Positions typical.

## Empire Dress {#empire-dress}

- **Aliases**: empire-waist dress, Regency dress; fr: robe empire; de: Empirekleid
- **Family**: dress, high-waist seam
- **Recognize**: a dress with a horizontal seam just under the bust and a loose A-line or gathered skirt below; a short bodice above the seam with darts or gathers.
- **Pieces**: bodice front x1 on fold (or pair), bodice back x2 (zip), skirt front x1 on fold, skirt back x2, neck and armhole facings (or sleeves), waist stay.
- **Shape**: Empire seam line drawn horizontal 3 to 6 cm below BP (or at UB + 1 cm) on the front and back. Front bodice: neck, shoulder, armhole, side seam to U, then horizontal to CF at the empire line; the bust dart is pivoted into the empire seam (it closes and the seam gains a slight curve upward at the apex); the seam length of the bodice = underbust + ease (2 to 4 cm total) / 2 per half. Skirt: top edge length equals the bodice empire seam (gather ratio 1 for A-line, 1.3 to 2 for gathered), side seam straight or flared. Bodice seam sews to skirt top; side seam of bodice to side seam of skirt. Source: sheet 3.5 and 8.7, unverified as a drawn pattern.
- **Drafting**: 1. Draw the empire line; 2. pivot the bust dart into it; 3. skirt: slash and spread from the empire line to the hem; hem width 2 to 3 x seam length for a gathered skirt; 4. skirt length measured from the empire line.
- **Sewing order**: 1. Bodice darts. 2. Skirt. 3. Join at the empire seam with a stay tape. 4. Shoulders, facings. 5. CB zip. 6. Side seams, hem.
- **Finishes and notions**: stay tape 1 cm in the empire seam (elastic 1 cm in a casing when gathered), concealed zip.
- **Fabrics**: chiffon, crepe, light cotton, jersey (draped). Lightweight fabrics need lining.
- **Fit faults**: seam rides up at the front -> lengthen the bodice front 1 to 2 cm; gapes at the bust -> add ease at the seam; skirt too full -> reduce ratio.
- **Variants**: #babydoll-dress, #wrap-dress, #tiered-dress, #fit-and-flare-dress.
- **CLO3D**: sew the empire seam line to line with the gathered skirt top via a shortened bodice-side seam or the shirring tool; mesh 5 mm.
- **Confidence**: techniques sheet (3.5, 8.7). Positions typical.

## Wrap Dress {#wrap-dress}

- **Aliases**: wraparound dress, crossover dress, surplice dress; fr: robe portefeuille, robe cache-coeur; de: Wickelkleid
- **Family**: dress, wrap front
- **Recognize**: a dress whose front crosses diagonally over the chest and continues as an overlapping skirt, tied by a waist tie at the side or CF; V neckline, waist seam usual.
- **Pieces**: bodice front right (overlap) x1, bodice front left (underlap) x1, bodice back x1 on fold, skirt front right x1, skirt front left x1, skirt back x1 on fold (or x2), sleeves x2, ties x2 (one attached at the right side seam, one passing through a slot or hidden), neck/edge facing or bias binding.
- **Shape**: Bodice fronts as #wrap-blouse (edge from N to X at overlap O beyond CF, 10 to 18 cm at W; D_v = D_w x n/(n+O)). Skirt: the right front continues the wrap line as an edge running from X to the hem point H1 located 15 to 25 cm beyond CF at the hem (the wrap overlap at the hem), so the edge is a line from the V through X to H1; the left front skirt is the underlap and reaches the right side seam. The hem is curved up toward the wrap edge to keep a smooth line. Waist seam: front bodice to skirt with equal lengths, notches at CF, side and wrap edge. Tie: one tie sewn to the left side seam at W goes around the back and through a slot (buttonhole) in the right side seam, or both ties are sewn at the right front and left side. Source: sheet 6.1, unverified as a drawn pattern.
- **Drafting**: 1. Bodice as #wrap-blouse. 2. Skirt front: full-width (not on fold) from the block; draw the wrap line from X to the hem; add the overlap; shape the hem curve square to the edge. 3. Add facings 4 to 5 cm along the edge. 4. Waist ease 2 to 4 cm; hem width as an A-line or flared skirt. 5. Hem 1 to 1.5 cm on the curve.
- **Sewing order**: 1. Interface the edge. 2. Bodice darts. 3. Shoulders, facing along the wrap edge. 4. Waist seam. 5. Side seams (tie caught). 6. Sleeves. 7. Hem.
- **Finishes and notions**: stay tape on the V (0.5 to 1 cm shorter than the edge), snap at the crossing point, narrow hem.
- **Fabrics**: jersey, crepe, silk, viscose. Bias edges stretch: stay tape required.
- **Fit faults**: V gapes -> shorten the neck edge 1 cm; skirt opens when walking -> increase overlap at the hem or add a snap; waist tie too short -> lengthen to 120 to 160 cm.
- **Variants**: #wrap-blouse, #shirt-dress, #skater-dress.
- **CLO3D**: place the right front over the left front on different layers; sew side seams only; pin or sew the tie line to line.
- **Confidence**: techniques sheet (6.1). Overlap values typical.

## Shirt Dress {#shirt-dress}

- **Aliases**: shirtwaister (see also #shirtwaist-dress), button-front dress, camp dress; fr: robe chemise; de: Hemdblusenkleid
- **Family**: dress, shirt block extended
- **Recognize**: a dress with shirt-style collar, button placket down CF to the hem or the waist, shirt sleeves with cuffs, a back yoke and often a belt, knee or midi length.
- **Pieces**: front x2 (with placket), back x1 on fold, yoke x2, sleeves x2, cuffs x4, collar x2 + stand x2, pockets x1 to x2, belt x1 (and carriers), sleeve plackets x2, interfacing.
- **Shape**: The shirt block extended to the hem; CF placket runs the full length (grown-on or separate); back yoke 8 to 10 cm below the neck; waist suppression by side shaping of 2 to 3 cm per side, back darts or a belt; the skirt part flares as an A-line with a side seam flare of 2 to 4 cm per side; for a long dress add a wrap-free hem width of at least 15 to 20 cm walking ease. The hem is straight or shirt-tail. Front and back sew at the shoulder (yoke) and the side seam. Source: sheet 8.6 and 10.1, unverified as a drawn pattern.
- **Drafting**: 1. Shirt block (women's) with bust ease 10 to 14. 2. Extend the side seam to the hem and flare 2 to 4 cm per side. 3. Add the placket and button spacing (first button at the neck stand, second at 7 to 8 cm, then every 8 to 10 cm). 4. Waist: side shaping and belt carriers. 5. Hem straight or curved 1 cm.
- **Sewing order**: shirt order (sheet 10.1) then the long side seams, the hem and the belt.
- **Finishes and notions**: 8 to 12 buttons, belt buckle or fabric belt, interfaced collar and cuffs.
- **Fabrics**: poplin, linen, chambray, denim, silk twill, viscose.
- **Fit faults**: gaping at the bust -> move the button to the apex and enlarge the bust dart; hem rides up when sitting -> add 2 to 3 cm at the hips; waist shapeless -> side shaping or belt.
- **Variants**: #shirtwaist-dress, #womens-fitted-shirt, #oversized-shirt, #wrap-dress.
- **CLO3D**: shirt block build; the belt as a separate pattern; buttons by hand.
- **Confidence**: techniques sheet (8.6, 10). Values typical.

## Slip Dress {#slip-dress}

- **Aliases**: bias-cut dress, bias slip, cami dress, negligee dress, 1930s bias dress; fr: robe nuisette, robe en biais; de: Slipkleid
- **Family**: dress, bias cut, light fabric
- **Recognize**: a close-fitting dress cut on the bias, with spaghetti straps, a cowl or V bust, no darts, diagonal folds and a hem that hangs unevenly.
- **Pieces**: front x1 (CF seam if cut on the bias on a fold of the wrong grain; otherwise a single piece), back x1 (CB seam), straps x2 (bias tubes), self-bias binding or facing along the top edge, optional cowl pieces.
- **Shape**: Front and back are flared pieces, the dress block with the darts closed at the side seam and the side seam flared, with a hem sweep of 15 to 25 cm per half (full circumference about 120 to 160 cm). The grain line is at 45 degrees to CF, so the CF and CB seams lie on the true bias and the side seams run near the straight grain (less stretch). Drop allowance: extra length of 2 to 5 percent of the dress length at the CF/CB bias hem, because the bias drops most there. Top edge: a straight or curved neckline across the bust, 3 to 6 cm above BP; straps anchored at the top edge 5 to 8 cm from the CF. Bust ease 0 to 4, hip ease 0 to 6. Front side seam sews to back side seam (both near the straight grain, equal length). Source: sheet 8.5, unverified as a drawn pattern; True Bias Ogden cami for hanging the hem 24 h.
- **Drafting**: 1. Block with ease reduced to 0 to 4 at the bust and 0 to 6 at the hip. 2. Close the bust dart at the side seam; 3. Draw the grain line at 45 degrees; 4. Flare 15 to 25 per half at the hem; 5. Add drop allowance 2 to 5 percent; 6. Straps: bias strips 3 to 3.5 wide, finished 0.6 to 0.8, length = measured + 2 cm.
- **Sewing order**: stay-stitch the neckline and hem 0.5 cm from the edge; let the pieces relax 24 h after cutting; French seams or 6 mm seams; hang 24 h; level the hem; narrow-hem (rolled 3 to 5 mm).
- **Finishes and notions**: French seams, bound top edge, rouleau straps, hand-rolled hem, optional concealed side zip.
- **Fabrics**: silk charmeuse, satin, crepe de chine, viscose crepe. Bias-cut silk shrinks and stretches; pre-test.
- **Fit faults**: uneven hem -> always, level after hanging; stretched neckline -> stay tape; seams sag -> do not hang by the straps during construction.
- **Variants**: #camisole, #cowl-neck, #maxi-dress.
- **CLO3D**: set the fabric grain at 45 degrees on the grain line, not by rotating the piece; use a longer simulation for relaxation; mesh 8 mm; collision thickness 0; level the hem after simulation.
- **Confidence**: techniques sheet (8.5); True Bias source for hanging; numeric values typical.

## Babydoll Dress {#babydoll-dress}

- **Aliases**: baby-doll dress, yoke dress, trapeze mini; fr: robe babydoll; de: Babydoll-Kleid
- **Family**: dress, high-yoke or empire, short, flared
- **Recognize**: a short, loose dress with a high seam just above or at the bust, a flared or gathered body, short or puffed sleeves, and a round or square neckline.
- **Pieces**: bodice (yoke) front x1 on fold (or pair), bodice back x2 (zip) or x1 on fold, skirt front x1 on fold, skirt back x2 or x1 on fold, sleeves x2, neck facing or binding.
- **Shape**: Yoke front: neck, shoulder, armhole, side seam to U, then a horizontal seam at 2 to 4 cm above BP (high babydoll) or at UB (empire babydoll); bust shaping by a dart closed into the yoke seam (the seam gets a gentle curve) or by ease. Skirt: a trapezoid whose top edge equals the yoke seam length (flat) and the hem width 1.5 to 2 times the seam length, or a rectangle gathered with ratio 1.5 to 2; length 35 to 50 cm from the seam for a mini. The yoke lower edge sews to the skirt top edge; the skirt side seam is sewn to the back. Source: sheet 3.5 and 8.7 logic, unverified as a drawn pattern.
- **Drafting**: 1. Draw the yoke line on the block; 2. close the bust dart into the yoke seam; 3. skirt: trapezoid from the seam length with a hem flare of 15 to 25 cm per side or rectangle with gather; 4. sleeves per block, optionally puffed.
- **Sewing order**: 1. Yoke darts. 2. Gather skirt top. 3. Join yoke and skirt. 4. Shoulders, neck. 5. Sleeves. 6. Side seams. 7. Hem.
- **Finishes and notions**: concealed zip or buttons at the CB yoke, lining optional, hem narrow 1 cm.
- **Fabrics**: cotton lawn, voile, crepe, light viscose, eyelet.
- **Fit faults**: yoke rides up -> lengthen the yoke front 1 cm; skirt too wide -> reduce hem; bunching at the underarm -> raise U.
- **Variants**: #empire-dress, #smock-dress, #trapeze-dress.
- **CLO3D**: gather via shortened yoke seam or the shirring tool; mesh 5 mm.
- **Confidence**: trade practice. Positions typical.

## Smock Dress {#smock-dress}

- **Aliases**: smocked dress, shirred dress, gathered-yoke dress, tiered smock; fr: robe smockée, robe à smocks; de: Smokkleid
- **Family**: dress, loose, gathered or shirred bodice
- **Recognize**: a loose dress hanging from a yoke or a shirred/smocked chest panel, with a gathered body that falls in soft folds, often straps or puffed sleeves, knee to midi length.
- **Pieces**: Yoke version: yoke front x1 on fold, yoke back x1 on fold (doubled for a lined yoke), body front x1 on fold, body back x1 on fold, sleeves x2 or straps x2, neck finish. Shirred version: body front x1 on fold, body back x1 on fold, straps x2, elastic thread.
- **Shape**: Yoke version: as #smock-top with the body extended to dress length; body top edge is 1.5 to 2 times the yoke bottom edge (gather ratio), the body width at the hem adds 10 to 20 cm per side (A-line trapezoid). Shirred version: front and back are rectangles; unshirred width = finished body circumference (bust + 4 to 10 cm stretched) x 2 to 2.5 / 2 per half; shirring rows of 1 to 1.5 cm spacing covering 12 to 20 cm above and below the bust line, then the body falls straight or flared with 15 to 25 cm of extra width at the hem. The side seam is one straight seam; straps sewn at the top edge 6 to 10 cm from CF. Source: construction logic, unverified as a drawn pattern.
- **Drafting**: 1. Yoke: seam at 10 to 14 cm below NP (front), 8 to 12 back; 2. body width at the seam = yoke bottom width x gather ratio; 3. add flare at the hem; 4. shirred: elastic thread on the bobbin, spacing 1 to 1.5 cm, stitch length 3 to 3.5 mm; steam to shrink; 5. hem 1 to 1.5 cm.
- **Sewing order**: 1. Gather. 2. Join yoke. 3. Shoulders. 4. Sleeves or straps. 5. Side seams. 6. Hem.
- **Finishes and notions**: elastic thread, bobbin winding by hand, French seams, narrow hem.
- **Fabrics**: cotton lawn, voile, light viscose, crepe, gauze. Slippery fabrics need a stay tape at the yoke seam.
- **Fit faults**: shirring not shrinking enough -> steam more or use a tighter bobbin; yoke too tight -> widen; body hangs too wide -> reduce gather ratio.
- **Variants**: #smock-top, #peasant-dress, #babydoll-dress, #tiered-dress.
- **CLO3D**: use the shirring setting on the shirred panel patterns; or model a rectangle of reduced width; mesh 5 mm.
- **Confidence**: trade practice. Ratios typical.

## Trapeze Dress {#trapeze-dress}

- **Aliases**: trapezoid dress, flare dress, swing dress (1950s to 60s), Trapeze line (Dior, 1958); fr: robe trapèze; de: Trapezkleid
- **Family**: dress, loose, flares from the shoulder
- **Recognize**: a dress that is narrow at the shoulders and widens continuously to the hem in a straight diagonal line, with no waist definition; the outline is a trapezoid.
- **Pieces**: front x1 on fold, back x1 on fold, neck facing x2, armhole facings x2 pairs (or sleeves x2), optional pocket x2.
- **Shape**: Front: A at the neck CF, N, S the shoulder; the armhole is cut as in a shift; the side seam is a straight diagonal line from U (or from SP in the most extreme version) to the hem point D lying 12 to 30 cm outside the vertical line through U (per side), so that the hem width is about U-width + 2 x (12 to 30). Hem D-E curved square to the side seam and to the CF. Bust dart removed through the flare: slash from the hem to the bust dart apex and spread, closing the dart (the dart value opens in the hem sweep). Back mirrors the front with the same flare; side seams equal length. Front side seam sews to back. Source: construction logic from sheet 8.3, unverified as a drawn pattern.
- **Drafting**: 1. Trace the shift front and back. 2. Draw the new side seam from U to D. 3. Close the bust dart and spread the pivot at the hem. 4. Add the same spread to the back via a neck or shoulder dart closed (optional). 5. Check the walking width. 6. Hem curve square to the side seam, 1 to 1.5 cm.
- **Sewing order**: 1. Darts (if any). 2. Shoulders. 3. Facings. 4. Side seams. 5. Hang 24 h and level the hem. 6. Hem.
- **Finishes and notions**: facings, narrow hem, optional zip at CB or side.
- **Fabrics**: wool crepe, double cloth, cotton twill, brocade, crepe. Stiff fabrics hold the trapeze; drapey fabrics hang with folds.
- **Fit faults**: hem uneven (bias at the side seam) -> re-level; front hangs away from the bust -> add a bust dart or shorten the front; neckline gapes -> pivot to the shoulder.
- **Variants**: #tent-dress, #a-line-dress, #shift-dress.
- **CLO3D**: grain parallel to CF; simulate with gravity; mesh 8 mm.
- **Confidence**: trade practice. Flare values typical; the silhouette name (Dior 1958) is historical.

## Tent Dress {#tent-dress}

- **Aliases**: tent line, A-frame dress, circus dress (voluminous), cocoon (different), Mu'umu'u (loose); fr: robe tente; de: Zeltkleid
- **Family**: dress, very loose, wide triangle
- **Recognize**: a dress cut as a wide triangle that falls from the shoulders without shaping, with a hem that is much wider than the shoulders; the opening is a neck hole; side seams can be open or have vents.
- **Pieces**: front x1 on fold (or two panels with CF seam), back x1 on fold, neck facing x1 (front + back), armhole facings x2 pairs or sleeves, optional side gores.
- **Shape**: Front: a triangle or trapezoid from the neck/shoulder line (width at the shoulder = neck-to-armhole width + 8 to 12 cm) widening to the hem. The side seam runs from the armhole bottom (or SP) straight to D, 20 to 50 cm outside the vertical through U on each side; the hem is curved up at the side seam by 2 to 3 cm to look level. Dolman or cut-in-one sleeves are common: the sleeve is cut with the body along the shoulder line and the T line is not horizontal but sloped. Slits at the side seams 15 to 25 cm. Front side seam sews to back side seam; shoulders sew along the line N-S. Source: construction logic, unverified as a drawn pattern.
- **Drafting**: 1. Draw the shoulder line and neck hole. 2. Draw the side seam diagonally from the armhole bottom to the hem. 3. Hem width = chosen (150 to 250 cm total typical). 4. Check that the arms can move: the underarm angle 60 to 75 degrees if there is a sleeve. 5. Neck facing 5 to 6 cm.
- **Sewing order**: 1. Shoulders. 2. Facing. 3. Side seams leaving slits. 4. Hem curved with rolled finish.
- **Finishes and notions**: rolled hem for curved edges; neck facing; optional ties.
- **Fabrics**: cotton, linen, wool crepe, light denim, rayon. Drapey fabrics create heavy folds on the bias; use stable fabrics.
- **Fit faults**: shoulder slides -> narrow the neck; excessive fabric at the bust -> reduce the shoulder width; hem uneven -> hang and level.
- **Variants**: #trapeze-dress, #kaftan-top, #smock-dress.
- **CLO3D**: grain at CF; mesh 8 mm; collision thickness 0.
- **Confidence**: trade practice. Hem widths typical.

## Tiered Dress {#tiered-dress}

- **Aliases**: ruffle-tier dress, gypsy dress, layered dress; fr: robe à volants, robe étagée; de: Stufenkleid
- **Family**: dress, gathered tiers on a bodice
- **Recognize**: a skirt made of horizontal tiers, each wider than the one above and gathered into it, with visible horizontal seams; the top is a fitted or loose bodice.
- **Pieces**: bodice (any), tiers 3 to 5 each cut as a rectangle (width x height), optionally the tiers cut on the fold/with side seams, elastic at the waist (optional).
- **Shape**: Each tier is a rectangle whose top edge is gathered onto the edge above it. Tier 1 is gathered onto the waist seam (length Lw, the bodice hip or waist seam), so tier 1 is cut Lw x r wide; tier 2 is gathered onto the lower edge of tier 1, so it is cut (width of tier 1) x r wide; and so on. Typical ratio r = 1.5 for voluminous, 1.3 for light fabrics. Tier heights increase toward the hem (e.g. 0.25, 0.32, 0.43 of the skirt length) because each tier appears shorter when gathered. Each tier is a straight rectangle (a flared tier is cut as a trapezoid with the same top width); tiers sew right sides together, notches at the side seam. If the widest tier exceeds the fabric width, it is cut in 2 to 3 panels joined at the side seams. Source: sheet 8.8; example is arithmetic from the formula, not from a drawn pattern. Example (computed): Lw 80 cm, r = 1.5: tier 1 cut 120 cm wide, tier 2 cut 180 cm, tier 3 cut 270 cm.
- **Drafting**: 1. Skirt length L (from the waist seam to the hem). 2. Choose the number of tiers n and heights h_i with sum = L + (n-1) x 1.5 cm for the seams. 3. Compute widths: width_k = width_(k-1) x r, with width_0 = Lw. 4. Check fabric width against the widest tier and split if necessary.
- **Sewing order**: 1. Make each tier (side seams). 2. Gather (2 rows, 3.5 mm stitch) or use a ruffler. 3. Sew each tier to the tier above. 4. Attach the top tier to the bodice. 5. Hem 1 cm.
- **Finishes and notions**: overlock or French seams, rolled hem, stay tape at the waist, elastic casing at the waist optional.
- **Fabrics**: cotton lawn, voile, crepe, chiffon, gauze; heavy fabrics need r around 1.2.
- **Fit faults**: tiers too bulky -> lower r; tiers droop -> stabilise with interlining; waist seam weighs down -> stay tape.
- **Variants**: #smock-dress, #maxi-dress, #peasant-dress.
- **CLO3D**: gather via shortened seams (top of each tier at 1/r of the lower edge) or the shirring/gather tool; mesh 5 mm; heavy simulation.
- **Confidence**: techniques sheet (8.8); the example numbers are computed from the formula.

## Skater Dress {#skater-dress}

- **Aliases**: circle-skirt dress, flared knit dress; fr: robe patineuse; de: Skaterkleid
- **Family**: dress, knit bodice and flared skirt
- **Recognize**: a fitted knit bodice joined at the waist to a short, flared circular skirt (half or three-quarter circle), often sleeveless or long-sleeved, with a round or V neck.
- **Pieces**: bodice front x1 on fold, bodice back x1 on fold, skirt front x1 on fold, skirt back x1 on fold (or the skirt cut as a half-circle in two pieces), neck binding x1, sleeves x2 or armhole binding.
- **Shape**: Bodice: knit block with ease 0 to -10 percent, no darts; neckline per style; the waist edge W is straight. Skirt: a circle segment (see `#skater-skirt`, `#half-circle-skirt`, `#full-circle-skirt`): with fraction f of a circle, waist radius r = seam length / (2 pi f), where the seam length is the bodice waist edge (stretched ease included); hem radius R = r + skirt length; front and back each cover half of the circle fraction. The bodice waist edge sews to the skirt inner arc; the side seams join front to back along the bodice and the skirt radius line. Source: geometry from `#skater-skirt` and sheet 9.2; example (computed): waist seam 68 cm, f = 0.5 gives r = 21.6 cm.
- **Drafting**: 1. Knit bodice block. 2. Waist seam length. 3. Compute r from f; draw the quarter arcs; 4. Add hem length; 5. For a three-quarter circle f = 0.75. 6. Mark the grain at CF/CB; the side seams are on the bias, so the hem drops: hang before hemming. 7. Hem 1 cm twin-needle or rolled.
- **Sewing order**: 1. Shoulders. 2. Neck binding. 3. Sleeves. 4. Side seams (bodice and skirt together). 5. Waist seam (stretched slightly). 6. Hem.
- **Finishes and notions**: clear elastic in the waist seam, twin needle hem, neck binding 85 to 90 percent of the neckline length.
- **Fabrics**: ponte, scuba, jersey, light interlock; 4-way stretch bodice. Woven skater dresses need a zip.
- **Fit faults**: waist seam stretches out -> clear elastic; skirt hem uneven -> hang and level; skirt flips up -> shorten by 3 cm or choose a lower f.
- **Variants**: #fit-and-flare-dress, #peplum-top, #a-line-dress.
- **CLO3D**: circle pieces with the grain on CF; knit fabric; mesh 5 mm; the hem circle needs a fine mesh.
- **Confidence**: trade practice and geometry; computed example.

## Fit-and-Flare Dress {#fit-and-flare-dress}

- **Aliases**: fitted and flared dress, swing-skirt dress, 1950s dress; fr: robe ajustée évasée; de: Kleid in A-Form mit Taille
- **Family**: dress, fitted bodice, flared skirt
- **Recognize**: a fitted bodice with darts or princess seams, a waist seam, and a skirt that flares from the waist (gathered, pleated, circle or gored).
- **Pieces**: bodice front x1 on fold, bodice back x2 (zip), skirt front x1 on fold, skirt back x2, neck and armhole facings (or sleeves), waist stay, zip.
- **Shape**: Bodice: close-fitting block with waist darts or princess seams; waist edge straight. Skirt: gathered rectangle (ratio 1.5 to 2.5 times the waist seam), pleated (pleats consuming 2 d each), half circle, or gored (6 to 8 gores); top edge length equals the bodice seam, notches at CF, side, CB, dart lines. Bodice and skirt darts align vertically. Front waist seam sews to skirt front, back to skirt back, side seams continuous. Source: sheet 8.1 and `#skirt-block`, unverified as a drawn pattern.
- **Drafting**: 1. Bodice block with darts. 2. Skirt with the chosen fullness. 3. Check seam lengths and ease 2 to 4 cm at the waist. 4. Waist stay. 5. Hem 3 to 4 cm (straight) or 1 to 1.5 cm (curved).
- **Sewing order**: darts, shoulders, facings, waist seam with stay, CB zip, side seams, hem.
- **Finishes and notions**: concealed zip, waist stay tape 1 cm, lining optional, petticoat optional.
- **Fabrics**: cotton sateen, poplin, crepe, taffeta, jacquard.
- **Fit faults**: waist seam not level -> check bodice lengths; skirt too stiff or limp -> choose the right interlining; waist wrinkles -> adjust the length.
- **Variants**: #skater-dress, #princess-line-dress, #ball-gown.
- **CLO3D**: skirts with gathers via shirring or shortened seam; mesh 5 mm.
- **Confidence**: techniques sheet (8.1) and trade practice; values typical.

## Bodycon Dress {#bodycon-dress}

- **Aliases**: body-con, stretch tube dress, fitted knit dress; fr: robe moulante; de: Etuikleid aus Jersey (eng anliegend)
- **Family**: dress, knit, negative ease
- **Recognize**: a skin-close stretch dress with few seams, no darts, negative ease at every circumference, short to midi length.
- **Pieces**: front x1 on fold, back x1 on fold, neck binding or lining x1, sleeves x2 (optional), side seams, optional CB zip (for low-stretch fabric).
- **Shape**: Front and back are the knit block lengthened to the hem; there are no darts. The bust shaping comes from negative ease of 5 to 15 percent at each level; waist shaping from side seams that go in at the waist and out at the hip by the difference of the circumferences (bust minus waist) / 2 x (1 - negative ease). Vertical ease 0 to -2 percent. Neckline per style; hem 1 cm extra for recovery. Front side seam sews to back side seam. Source: sheet 8.10, unverified as a drawn pattern.
- **Drafting**: 1. Measure the fabric stretch (`ease.md`): at least 40 percent. 2. Ease -5 to -15 percent circumference. 3. Remove all darts. 4. Side shaping. 5. Hem allowance 2 cm. 6. Neck binding length = neckline x 0.85.
- **Sewing order**: shoulder seams, neck binding, sleeves, side seams, hem; serge at 1 cm, clear elastic 6 mm in shoulders.
- **Finishes and notions**: ballpoint needle, narrow zigzag or stretch stitch, twin-needle hem.
- **Fabrics**: jersey, ponte, rib, power mesh, bandage knit. Low-stretch fabrics need darts and a zip.
- **Fit faults**: drag at the bust -> add 1 to 2 cm of length over the bust; wrinkles at the back waist -> shorten the back 1 to 2 cm; hem rolls -> interface the hem.
- **Variants**: #sheath-dress, #tube-top, #bodysuit-top, #bodysuit (lingerie).
- **CLO3D**: mesh 8 mm for fitted knit; collision thickness 0; assign real stretch fabric parameters; check the stress map at the bust and hips.
- **Confidence**: techniques sheet (8.10). Values typical.

## Maxi Dress {#maxi-dress}

- **Aliases**: floor-length dress, long dress, ankle-length dress; fr: robe longue, robe maxi; de: Maxikleid
- **Family**: dress, long (any silhouette)
- **Recognize**: a dress whose hem reaches the ankle or the floor; the silhouette can be A-line, straight, empire, tiered, wrap or bias.
- **Pieces**: as the base silhouette; skirt pieces extended; slits or vents when narrow.
- **Shape**: Length from the waist to the hem measured barefoot, plus the shoe allowance (heel height). Walking width: an unvented straight skirt needs a hem circumference of at least 100 to 110 cm; a narrower hem needs a vent or slit of 20 to 35 cm; A-line skirts need none. Bias and heavy skirts drop 3 to 5 percent in length. The hem edge is curved square to the seams. Source: sheet 8.9, unverified as a drawn pattern.
- **Drafting**: 1. Draft the bodice. 2. Skirt length L = waist-to-floor (barefoot) - shoe allowance if pair of shoes is lower. 3. Check hem circumference >= 100 cm or add a vent. 4. Hem 1.5 to 3 cm (rolled for chiffon). 5. Consider a lining 3 to 5 cm shorter.
- **Sewing order**: as the base silhouette; hang 24 h; level the hem.
- **Finishes and notions**: hem facing or horsehair braid for volume (optional), lining, concealed zip 50 to 60 cm.
- **Fabrics**: viscose, crepe, chiffon, satin, cotton.
- **Fit faults**: hem catches under the heel -> shorten 1 to 2 cm; skirt restricts steps -> add vent or width; hem uneven -> hang.
- **Variants**: #tiered-dress, #slip-dress, #sundress, #ball-gown.
- **CLO3D**: the avatar should wear shoes or the dress should be placed with a floor offset; mesh 8 mm.
- **Confidence**: techniques sheet (8.9); values typical.

## Sundress {#sundress}

- **Aliases**: summer dress, strappy dress, shirred sundress; fr: robe d'été, robe à bretelles; de: Sommerkleid, Trägerkleid
- **Family**: dress, sleeveless, light, strap
- **Recognize**: a sleeveless summer dress with straps or a shirred bodice, light fabric, a gathered or A-line skirt, knee to midi length.
- **Pieces**: fitted version: bodice front x1 on fold, bodice back x2 (zip), skirt front x1 on fold, skirt back x2, straps x2, top-edge facing x2 sets. Shirred version: front x1, back x1 (rectangles), straps x2, elastic thread.
- **Shape**: Fitted: bodice with princess seams or darts, top edge straight or sweetheart above BP, the straps anchored 6 to 10 cm from CF on the top edge and 5 to 8 cm from CB at the back, a waist seam; skirt A-line or gathered. Shirred: front and back rectangles as in #smock-dress; the shirred panel covers the chest area; the straps (self-fabric or ribbon) are attached at the top edge. Side seams join front to back. Source: construction logic, unverified as a drawn pattern.
- **Drafting**: 1. Bodice block, top edge drawn 2 to 5 cm above BP; strap width 1.5 to 3 cm finished; 2. skirt gather ratio 1.5 to 2 or A-line flare; 3. shirred: unshirred width = circumference x 2 to 2.5; 4. hem 1 to 1.5 cm.
- **Sewing order**: darts, side seams, top edge facing with straps, waist seam, zip, hem.
- **Finishes and notions**: concealed zip, strap adjusters, lining optional.
- **Fabrics**: cotton lawn, poplin, linen, rayon, seersucker.
- **Fit faults**: straps slide -> move anchors in by 1 to 2 cm; top edge gapes -> shorten 1 cm or add elastic; waist seam sits low -> shorten the bodice.
- **Variants**: #halter-dress, #smock-dress, #babydoll-dress, #pinafore-dress.
- **CLO3D**: straps as separate narrow patterns; shirring via the shirring tool; mesh 5 mm.
- **Confidence**: trade practice; values typical.

## Halter Dress {#halter-dress}

- **Aliases**: halterneck dress, neck-strap dress; fr: robe dos nu; de: Neckholder-Kleid
- **Family**: dress, halter neckline
- **Recognize**: a sleeveless dress with a strap around the neck, bare shoulders and upper back, with a fitted bodice and a skirt of any shape.
- **Pieces**: bodice front x1 on fold (or with princess seams), back bodice (low back) x1 or x2, neck strap x1 or x2, skirt front/back, facings or lining, zip.
- **Shape**: Bodice front as #halter-top: the strap root T is 7 to 9 cm from CF on the neckline; the armhole is cut in 3 to 6 cm at the shoulder and 2 cm at U, U raised 1 to 2 cm; the neckline edge is 1 cm shorter than the body. The back is cut low (backless to the waist) or high; at CB there is a zip or ties; the side seams join the front bodice to the back at U. The skirt is joined at the waist seam or continues without a seam (sheath). Front side seam sews to back side seam. Source: sheet 4 (halter row), unverified as a drawn pattern.
- **Drafting**: 1. Close-fitting block, pivot the gape into the bust dart. 2. Draw the halter neckline and armhole. 3. Strap length from T over the nape. 4. Low back: cut the back at the desired depth, keep the CB length for the zip. 5. Skirt per style.
- **Sewing order**: darts, side seams, facings with straps, zip, waist seam, hem.
- **Finishes and notions**: hook and eye at the neck, concealed zip, lining, interfaced strap.
- **Fabrics**: crepe, satin, jersey, cotton. Woven halter needs facing or lining.
- **Fit faults**: armhole gapes -> pivot into the neckline and raise U; strap cuts into the neck -> widen it; back slips -> add a back elastic or button.
- **Variants**: #halter-top, #sundress, #strapless-boned-dress, #maxi-dress.
- **CLO3D**: strap sewn behind the neck line to line; mesh 5 mm.
- **Confidence**: techniques sheet (4); values typical.

## Strapless Boned Dress {#strapless-boned-dress}

- **Aliases**: strapless dress, bustier dress, boned bodice dress, bandeau dress; fr: robe bustier; de: trägerloses Kleid, Bustierkleid
- **Family**: dress, structured, strapless, boned bodice with skirt
- **Recognize**: a dress with a straight or sweetheart top edge and no straps, held by a boned, fitted bodice; CB zip or lacing; visible princess seams; skirt of any shape from the waist seam.
- **Pieces**: bodice: centre front x1 on fold or x2, front side x2, side back x2, centre back x2 (zip), plus the same set in lining and in interlining/coutil (3 layers), waist stay x1, boning channels (or tape), silicone grip elastic along the top edge; skirt per style (gathered, A-line, sheath, circle), skirt lining, zip.
- **Shape**: Bodice as #bustier-top (sheet 7.1): princess seams from the top edge through the bust to the waist; top edge 3 to 6 cm above BP, 1 to 2 cm smaller than the body at the top (a negative top edge keeps it up); at bust level ease 0 to 2 cm, at W ease 1 to 2 cm. Bones: CF (2 in a cup seam), each princess seam (2 per side), side seam (1), back at both sides of the zip (2); typical 7 to 9 bones, bone length = seam length minus 2.5 to 3.8 cm (stops at least 1.2 cm from top and bottom, tips rounded), channel 1.2 to 1.5 cm wide. Waist stay of 2.5 cm petersham. The bodice waist edge sews to the skirt top edge (notches at CF, sides, CB, dart/princess seam lines); for a sheath skirt the panels are continuous. Source: sheet 7.1 and 8.1, unverified as a drawn pattern.
- **Drafting**: 1. Princess-seamed close-fitting block (ease 0 to 6). 2. Draw the top edge (straight or sweetheart); 3. place bones; 4. skirt per style, top edge = bodice waist seam length; 5. lining and interlining patterns; 6. hem 3 to 4 cm (straight) or 1 to 1.5 cm (curved).
- **Sewing order**: 1. Interline each bodice piece. 2. Sew princess seams, press. 3. Channels and bones. 4. Lining. 5. Join outer and lining at the top edge, turn, topstitch. 6. Grip elastic inside the top edge. 7. Waist stay. 8. Join skirt. 9. Zip. 10. Hem.
- **Finishes and notions**: steel or plastic bones, coutil, silicone grip, concealed zip 40 to 50 cm, hook and bar, waist stay tape.
- **Fabrics**: satin, duchesse, taffeta, crepe with coutil, brocade; lightweight fabrics need underlining.
- **Fit faults**: top slides down -> reduce top edge 1 cm and add grip elastic; bunching at the waist -> reduce the bodice length at the waist or add a stay; cups collapse -> add a cup bone or wire.
- **Variants**: #bustier-top, #corset-top, #ball-gown, #mermaid-dress.
- **CLO3D**: represent bones with internal lines plus a stiff strip fabric; confirm the top edge sits on the avatar; the bodice may need a stiffer fabric assignment on its interlining layer; mesh 5 mm.
- **Confidence**: techniques sheet (7.1, 8.1). Values typical.

## Mermaid Dress {#mermaid-dress}

- **Aliases**: fishtail dress, fitted-and-flared gown, mermaid gown; fr: robe sirène; de: Meerjungfrauenkleid
- **Family**: dress, fitted to the knee, flaring below
- **Recognize**: a dress close-fitting through the bust, waist and hip and thigh down to about the knee, where it flares dramatically (godets, gores or a ruffle) to a floor-length hem, usually with princess seams and CB zip.
- **Pieces**: bodice front centre x1 on fold, front side x2, back side x2, back centre x2 (zip), skirt panels in matching seam lines, godets or flare panels x4 to x8, bodice and skirt lining, interlining, optional boning.
- **Shape**: Fitted section: the princess line continues from the bodice past the hip as straight (or slightly tapered) seams to the flare point K at about knee height (in a mermaid dress K sits at the knee or just above; the knee-to-floor section then carries the flare). Below K, each panel seam has a godet (a pie-shaped wedge) or is itself widened with a flare of 20 to 40 cm per seam, bringing the hem circumference to a typical 250 to 400 cm. A godet: top point at K, length from K to the hem, hem width 40 to 80 cm (style), edge curve at the hem; its two long edges sew to the two panel edges that are slit open at K. Hem is curved. Hip ease 2 to 4 cm (full) so the fitted section can be sat in, with a lower slit or the flare giving the walking width. Panels: front centre, front side, side back, back centre with a CB zip and the slit gored at K in the back. Source: godet construction (thecreativecurator.com and Threads godet skirt tutorials: apex at about knee height, wedge with free hem width); mermaid panel layout unverified as a drawn pattern.
- **Drafting**: 1. Princess line dress block to K (measure from the waist, typical 55 to 65 cm for a knee-level K). 2. Straighten the seams from the hip to K, taper them 0 to 3 cm per panel at K. 3. Slit each seam at K to the hem, insert a godet or spread the panels at the hem by 10 to 20 cm each. 4. Length to the floor with the shoe allowance. 5. Lining as the fitted section only, or as the full shape.
- **Sewing order**: 1. Bodice and skirt panels, join as a princess dress. 2. Insert godets: slit the seam, pin the godet along the slit edges, stitch with the godet on top and the slit stitched to the apex. 3. CB zip. 4. Hem (rolled or faced with horsehair braid for stiffness).
- **Finishes and notions**: horsehair braid at the hem, lining in the fitted part, concealed zip 50 to 60 cm, optional bone.
- **Fabrics**: crepe, satin, stretch lace, mikado; stretch fabrics allow the fitted part to be 2 to 4 cm tighter.
- **Fit faults**: restricts walking at K -> raise the flare point 5 to 8 cm or widen the fitted section; godet apex puckers -> stitch the apex with a short stitch and reinforce; flare collapses -> add horsehair or interlining.
- **Variants**: #trumpet-dress, #princess-line-dress, #godet, #strapless-boned-dress.
- **CLO3D**: build the godets as separate wedge patterns sewn to the slit edges; mesh 5 mm; heavy flares need a high-quality simulation; hem stiffness via a hem facing pattern.
- **Confidence**: trade practice and godet drafting from web sources. Panel counts, flare widths and K height typical; no drawn mermaid pattern read.

## Trumpet Dress {#trumpet-dress}

- **Aliases**: trumpet gown, trumpet-line dress, flared-hem sheath; fr: robe trompette; de: Trompetenkleid
- **Family**: dress, fitted, flaring from mid-thigh
- **Recognize**: like a mermaid dress, but the flare starts higher (mid-thigh) and is gentler, so the skirt looks like a trumpet bell; usually also with princess seams.
- **Pieces**: as #mermaid-dress: front centre x1, front side x2, side back x2, back centre x2, godets or flare panels, linings.
- **Shape**: Fitted section to K, K at mid-thigh (about 20 to 30 cm below the hip line rather than at the knee); below K, the panels are widened continuously (flare 8 to 20 cm per seam at the hem), typical hem circumference 180 to 260 cm. Seam lengths are equal in pairs; godets (if used) have their apex at K and a shorter free width than in a mermaid. Source: unverified as a drawn pattern; compare commercial patterns.
- **Drafting**: as #mermaid-dress with K at mid-thigh and a smaller flare.
- **Sewing order**: as #mermaid-dress.
- **Finishes and notions**: as #mermaid-dress.
- **Fabrics**: crepe, satin, lace, stretch woven; the fabric should hold the bell.
- **Fit faults**: bell collapses -> stiffer fabric or interlining; restricts steps -> raise K 5 cm or widen.
- **Variants**: #mermaid-dress, #sheath-dress.
- **CLO3D**: as #mermaid-dress.
- **Confidence**: trade practice; the K difference between mermaid (knee) and trumpet (mid-thigh) is a general convention, not tied to one source.

## Ball Gown {#ball-gown}

- **Aliases**: ballgown, full-skirted gown, princess gown, evening gown (full skirt); fr: robe de bal; de: Ballkleid
- **Family**: dress, structured bodice with very full skirt and petticoat
- **Recognize**: a gown with a fitted, usually boned bodice (strapless or with sleeves) and a very full skirt reaching the floor, held out by underskirts (tulle petticoat, crinoline or hoops).
- **Pieces**: bodice: as #strapless-boned-dress (3 layers); skirt: gathered rectangles or circle skirt segments (panels x4 to x8), lining skirt, petticoat layers (tulle tiers x2 to x4, or a hooped crinoline), waist stay, zip, optional train x1.
- **Shape**: Bodice waist seam length Lw. Skirt: gathered rectangles of total width Lw x 2 to 3 (ratio) giving a hem circumference 3 to 6 m, length from the waist to the floor + shoe allowance; or a circle segment with fraction f (full circle f = 1, r = Lw / (2 pi)), or a pleated skirt (box or knife pleats; each pleat consumes 2 d for the depth d). The skirt top edge is gathered or pleated between notches (CB zip gap and bodice side seams) and sewn to the bodice waist seam, notched at CF, side seams and CB. The petticoat is a separate garment: a waistband carrying 2 to 4 gathered tulle tiers (tier ratio 2 to 3, widths growing toward the hem, see #tiered-dress) or a hooped crinoline of 3 to 6 hoops; it sits under the skirt and is not sewn to it. A train extends the back panels with a trapezoid or circle segment adding 20 to 60 cm. Source: sheet 7.1 and 8.8; skirt geometry from the circle and gather formulas; unverified as a drawn pattern.
- **Drafting**: 1. Boned bodice per #strapless-boned-dress. 2. Choose the skirt type and ratio; compute the width from Lw; 3. allow 2 to 4 pocket slits; 4. petticoat tiers sized to hold the hem out; 5. waist stay 2.5 cm; 6. lining and interlining panels.
- **Sewing order**: 1. Make the bodice. 2. Make the skirt panels, gather or pleat. 3. Join skirt to bodice at the waist, stay tape. 4. Zip. 5. Hem the skirt after hanging (and with a petticoat in place). 6. Make the petticoat.
- **Finishes and notions**: horsehair braid or hem facing, stay tape, concealed zip 50 to 60 cm, hooks and bars, waist stay, hoop steel or boning for the crinoline.
- **Fabrics**: duchesse satin, taffeta, tulle, organza, mikado, velvet. Stiff fabrics hold a wide silhouette; chiffon needs a lining.
- **Fit faults**: bodice slides -> bones and grip elastic; waist seam bulky -> grade seam allowances; skirt too heavy -> reduce ratio; petticoat shows -> shorten by 3 cm.
- **Variants**: #strapless-boned-dress, #fit-and-flare-dress, #tiered-dress.
- **CLO3D**: model the petticoat as a separate garment with its own pattern layers; simulate the petticoat first; the dress over it on a different layer; heavy gathers need shirring or shortened seams; mesh 5 mm.
- **Confidence**: trade practice and sheet 7.1 / 8.8. Ratios typical.

## One-Shoulder Dress {#one-shoulder-dress}

- **Aliases**: asymmetric dress, single-strap dress, toga-style dress; fr: robe asymétrique à une bretelle; de: One-Shoulder-Kleid
- **Family**: dress, asymmetric neckline
- **Recognize**: a dress with one shoulder covered by a strap or sleeve and the other bare; the neckline runs diagonally across the chest from the covered shoulder to the opposite side seam under the arm.
- **Pieces**: bodice front x1 (cut full width, not on fold), back x1 (full width), shoulder strap or sleeve x1, neckline facing or lining x1, skirt per style, zip.
- **Shape**: Front: on the covered side the shoulder N-S and armhole S-U are as the block; on the bare side the shoulder, armhole and neck are removed. The neckline is a line T-V: T on the strap's inner edge at the neckline (about 2 to 4 cm from NP), V on the opposite side seam 3 to 8 cm above U (the line may curve slightly over the bust for a sweetheart-like edge). The bust dart is closed and replaced by the side dart or the diagonal seam. Back: mirrors the neckline with a straight or curved top edge. Side seam on the bare side sews to the back; the strap on the covered side may be a straight strip 4 to 7 cm wide or a full sleeve. Source: construction logic, unverified as a drawn pattern.
- **Drafting**: 1. Trace the close-fitting block, full width. 2. Draw the diagonal neckline from T to V; 3. keep the top edge 1 to 2 cm smaller than the body on the bare side (it must grip); 4. add boning or elastic along the diagonal edge; 5. check balance: the dress hangs asymmetrically, so grain and seam lengths must be even. 6. Skirt per style.
- **Sewing order**: 1. Interface the edge. 2. Darts. 3. Side seams. 4. Neck edge facing or lining. 5. Strap. 6. Zip. 7. Skirt, hem.
- **Finishes and notions**: grip elastic or bones along the diagonal edge, concealed side zip, lining.
- **Fabrics**: crepe, satin, jersey, chiffon with lining.
- **Fit faults**: bare side slips -> shorten the edge by 1 cm and add grip elastic; strap twists -> interface; dress rotates -> secure the side seam at the waist.
- **Variants**: #strapless-boned-dress, #cut-out-dress, #halter-dress.
- **CLO3D**: full-width front piece (asymmetric); check the diagonal edge sits on the avatar; mesh 5 mm.
- **Confidence**: trade practice; edge heights typical.

## Cut-Out Dress {#cut-out-dress}

- **Aliases**: cut-away dress, keyhole dress, peek-a-boo dress, open-back dress; fr: robe à découpes; de: Kleid mit Cut-outs
- **Family**: dress, openings in the body
- **Recognize**: a dress with one or more openings (keyhole, side waist, underbust, back, chest) bridged by bands or straps; edges are finished with facings, binding or stay tape.
- **Pieces**: dress pieces as the base style (front, back, skirt), shaped facings for each opening x1 per opening, bridge pieces/bands, stay tape, interfacing; optional lining.
- **Shape**: The opening is drawn on the front or back pattern with a rounded outline (corner radius at least 0.8 cm) and is kept at least 2 cm from any seam. It is not cut out of the pattern as a hole when it touches a seam: the opening is formed by leaving a seam open, or the pattern is divided into an upper and a lower piece joined by a bridge. The facing is a shaped patch 3 to 4 cm wider than the opening on all sides, traced from the opening; edge stability by 6 to 10 mm twill tape or stay tape. For tension (an unsupported cut-out) the area above is supported by seams or bones; bridge bands are interfaced. Bust gape: a cut-out near the chest needs the gape pivoted into the dart. Source: sheet 6.4, unverified as a drawn pattern.
- **Drafting**: 1. Draw the opening on the dress block, keeping 2 cm from seams. 2. Trace the facing patch. 3. Add tape to the opening edge (cut 1 to 2 mm shorter than the edge, no stretch). 4. Add boning or a stiff interfacing to the bridge if it is load-bearing. 5. Check the closed opening does not pull when sitting.
- **Sewing order**: 1. Interface and stay-tape the opening edge. 2. Sew the facing right sides together, clip the curves and corners, turn and understitch. 3. Topstitch if wanted. 4. Join other seams. 5. Zip, hem.
- **Finishes and notions**: stay tape or twill tape, understitching, bar tack at stress points, rings and straps as bridges.
- **Fabrics**: crepe, ponte, jersey with stretch recovery, scuba. Fabrics that fray need facings; stretch needs elastic tape.
- **Fit faults**: opening gapes -> shorten edge with tape; edge stretches -> use stay tape; bridge digs in -> widen it.
- **Variants**: #one-shoulder-dress, #keyhole-neckline, #halter-dress.
- **CLO3D**: model the opening by drawing an internal shape and cutting it (convert shape and delete) or as separate pieces; facings as second layer; mesh 5 mm.
- **Confidence**: techniques sheet (6.4); dimensions typical.

## Pinafore Dress {#pinafore-dress}

- **Aliases**: pinafore, apron dress, jumper (US), bib dress; fr: robe chasuble, robe tablier; de: Trägerkleid, Latzkleid
- **Family**: dress, sleeveless, worn over a blouse or top
- **Recognize**: a sleeveless dress with a bib front, a high or square neckline, wide straps that button or cross at the back, and a skirt (A-line, gathered, pleated); worn over a blouse or sweater.
- **Pieces**: bib front x1 on fold (or with waist seam), back x1 on fold or x2, straps x2, neck/armhole facings or full lining x1, skirt front/back, pockets x2, button/buckle hardware.
- **Shape**: Front bib: the neckline is high round or square with width 8 to 12 cm each side of CF; the shoulder is replaced by a strap (width 4 to 6 cm finished) sewn into the bib top at the strap root and buttoning or crossing at the back; the armhole is cut deeper and wider than a shell (armhole depth block + 1 to 2 cm, ease 8 to 14 cm at the bust for the layer underneath), U raised 0 to 1 cm; waist seam or princess seams; skirt per style. Back: straight top edge or shaped; straps attached with buttons on the back top, or crossed at the back and attached at the waist; CB zip or side zip. Front side seam sews to back side seam. Source: construction logic, unverified as a drawn pattern.
- **Drafting**: 1. Easy-fitting block, armhole deeper by 1 to 2 cm, shoulders removed. 2. Draw the bib and the strap root. 3. Skirt per style. 4. Cut the facing or lining from the shell. 5. Straps 4 to 6 cm finished, length = path over the shoulder to the back top + adjustment.
- **Sewing order**: 1. Darts. 2. Waist seam. 3. Straps. 4. Facing at the top edge. 5. Side zip. 6. Hem.
- **Finishes and notions**: buttons, buckles, side zip 20 to 25 cm, pockets, topstitching.
- **Fabrics**: corduroy, denim, twill, wool flannel, linen.
- **Fit faults**: straps slide off -> shorten and move the root in 1 cm; armhole too deep -> raise U 1 cm; bib gapes -> add a dart or elastic.
- **Variants**: #jumper-dress (the UK knit meaning), #sundress, #shirt-dress.
- **CLO3D**: straps with a button trim by hand; mesh 5 mm; place the underlying top on the avatar first.
- **Confidence**: trade practice; strap and ease values typical.

## Shirtwaist Dress {#shirtwaist-dress}

- **Aliases**: shirtwaister, shirt-frock, 1950s shirt dress, button-front fit-and-flare; fr: robe chemisier; de: Hemdblusenkleid (klassisch)
- **Family**: dress, shirt bodice with waist seam and full skirt
- **Recognize**: a fitted bodice with a shirt collar and a button front to the waist, set-in sleeves, a waist seam with a belt, and a flared, gathered or pleated skirt.
- **Pieces**: bodice front x2 (pair with plackets), bodice back x1 on fold (or x2 with yoke), yoke x2, skirt front x2 or x1 on fold, skirt back x1 on fold or x2, sleeves x2, cuffs x4 (or hem bands), collar x2 + stand x2, belt x1, belt carriers x2, pockets x2 optional.
- **Shape**: Bodice as #womens-fitted-shirt down to W (darts or princess seams, shirt collar with stand); the front opening continues through the skirt in a placket (full-length) or stops at the waist (skirt opens with a side zip). The waist seam joins the bodice to the skirt: the skirt top length equals the bodice waist length with ease; skirt gathered (ratio 1.5 to 2.5), pleated, circle, or A-line. Skirt side seam continuous with the bodice side seam. Source: sheet 8.1, 8.6 and 10.1, unverified as a drawn pattern.
- **Drafting**: 1. Bodice per #womens-fitted-shirt cut at W. 2. Skirt per #fit-and-flare-dress. 3. Placket continues if full-length. 4. Belt width 3 to 4 cm and length W + 20 cm.
- **Sewing order**: shirt order for the bodice, then the skirt, then the waist seam with a stay tape, hem, belt.
- **Finishes and notions**: 8 to 12 buttons, waist stay, belt buckle, side zip optional.
- **Fabrics**: cotton poplin, chambray, shirting, linen, silk twill.
- **Fit faults**: waist gape between buttons -> add a button at the waist; skirt too full -> reduce ratio; bodice rides up -> lengthen.
- **Variants**: #shirt-dress, #fit-and-flare-dress, #coat-dress.
- **CLO3D**: bodice per shirt build; the skirt with shirring or shortened seams; belt as a separate pattern.
- **Confidence**: trade practice and the techniques sheet; values typical.

## Coat Dress {#coat-dress}

- **Aliases**: redingote dress, dress coat (period), button-through coat dress; fr: robe-manteau; de: Mantelkleid
- **Family**: dress with coat construction
- **Recognize**: a dress cut and finished like a light coat: a notched or shawl lapel or collar, a single or double-breasted button front, structured shoulders, a lining, a waist belt, hem to knee.
- **Pieces**: front x2 (with facing x2), back x1 or x2 (with CB seam), side back x2, sleeves x2 (1 or 2 pieces), upper collar x1 + under collar x1 (and collar stand), pockets, belt x1, lining pieces, interfacing set (front, collar, hem, cuffs).
- **Shape**: Body from the close-fitting block with ease 8 to 12 (more than a dress, less than a coat); front opening with a button stand of 2.5 to 3 cm (single) or 6 to 8 cm (double-breasted); the lapel roll line from the neck to the first button; princess seams or darts for shape; the skirt flares from the waist 2 to 4 cm per side; shoulder pads 0.6 to 1.2 cm optional; sleeve cap ease 2.5 cm (sheet 1). The facing is cut to the front edge 8 to 10 cm wide. Front side seam sews to back; shoulders sew; sleeve to armhole. Source: construction logic from `#close-fitting-bodice-block` and tailoring sheets, unverified as a drawn pattern.
- **Drafting**: 1. Dress block with a coat-weight ease. 2. Add the button stand and lapel (see `#blazer-womens` for lapel drafting). 3. Princess seams for shaping. 4. Skirt flare and vents. 5. Belt and lining. 6. Interface front, lapel, collar, hem.
- **Sewing order**: tailoring order: interface, darts/princess seams, pockets, shoulders, collar and lapel facing, sleeves, lining, hem.
- **Finishes and notions**: buttons 18 to 25 mm, interfacing weights, shoulder pads, lining, hem tape.
- **Fabrics**: wool crepe, gabardine, twill, double cloth, light denim, ponte.
- **Fit faults**: lapel rolls open -> shorten the roll line by 0.5 to 1; neck gaps -> reduce the collar stand length; skirt swings -> true the side seams.
- **Variants**: #shirtwaist-dress, #blazer-womens, #pinafore-dress.
- **CLO3D**: lapel and collar as separate patterns; fabric thickness 1 mm; mesh 5 mm; fold lines by internal lines.
- **Confidence**: trade practice; lapel details referenced to the tailoring entries.

## Jumper Dress {#jumper-dress}

- **Aliases**: sweater dress, knit dress, long jumper, knitted dress; (US jumper = #pinafore-dress); fr: robe pull; de: Strickkleid, Pulloverkleid
- **Family**: dress, knit, loose to fitted
- **Recognize**: a dress made like a sweater: rib neckband, rib cuffs, rib hem or straight hem, fitted or loose, hem at thigh to midi.
- **Pieces**: front x1 on fold, back x1 on fold, sleeves x2, neckband x1, cuffs x2, hem band x1 (optional), side seam pockets optional.
- **Shape**: Front and back as the knit block with ease 5 to 20 percent (fitted) or 15 to 30 percent (loose); shoulders 0 to 3 cm dropped; sleeves set in with cap ease 0 to 1; the body flares or tapers from the hip; the neckband is cut at 85 to 90 percent of the neck length; the hem band at 85 to 90 percent of the hem circumference. Front side seam sews to back side seam; shoulders sew. Source: `#knit-block`, construction logic, unverified as a drawn pattern.
- **Drafting**: 1. Knit block with chosen ease. 2. Extend to the dress length; flare 0 to 4 cm per side. 3. Neckband and cuffs as rib rectangles. 4. Hem band length = hem circumference x 0.85 to 0.9.
- **Sewing order**: 1. Shoulder seams. 2. Neckband. 3. Sleeves set flat. 4. Side and underarm seams. 5. Cuffs, hem band.
- **Finishes and notions**: 1x1 or 2x2 rib, clear elastic in shoulders, overlock seams.
- **Fabrics**: sweater knits, wool jersey, ponte, french terry, brushed knit; heavy knits drop in length.
- **Fit faults**: neckband flares -> shorten; sleeves too long -> shorten; dress drops -> shorten 3 to 5 cm.
- **Variants**: #bodycon-dress, #shift-dress, #tunic-top.
- **CLO3D**: knit fabric with real weight; rib parts as separate patterns with a high stretch; mesh 5 mm.
- **Confidence**: trade practice; ease values typical.

## Peasant Dress {#peasant-dress}

- **Aliases**: gypsy dress, boho dress, Mexican dress, smocked peasant dress; fr: robe paysanne, robe bohème; de: Bauernkleid
- **Family**: dress, gathered neck and sleeves
- **Recognize**: a dress with a wide, elasticated neckline, puffed or gathered sleeves, a gathered body that is loose or tiered, and often an elastic or tied waist.
- **Pieces**: bodice front/back x1 on fold each, sleeves x2, neck casing or band, waist casing or tie, skirt tiers (optional) x2 to x4, elastic or drawstring; pockets optional.
- **Shape**: As #peasant-blouse for the upper part (casing at the neck, gathered sleeve caps, elastic at the wrist), extended to the dress length; the body is a trapezoid or a gathered rectangle with hem flare 15 to 30 cm per side; the waist is shaped by an elastic casing at the waist (2 to 3 cm) or a tie belt. Tiers per #tiered-dress. Front side seam sews to back; sleeve underarm and side seam in one run. Source: construction logic, unverified as a drawn pattern.
- **Drafting**: 1. Peasant blouse pieces. 2. Extend body to the length; flare. 3. Waist casing: elastic length = waist - 5 to 10 cm (tested on a toile). 4. Tiers optional.
- **Sewing order**: 1. Neck casing. 2. Sleeves. 3. Side seams. 4. Waist casing. 5. Hem.
- **Finishes and notions**: elastic 1 to 2 cm, drawstring, narrow hem, embroidery trim.
- **Fabrics**: cotton voile, lawn, gauze, crepe.
- **Fit faults**: neck slips -> shorten elastic; dress too wide -> narrow waist elastic; sleeves bulky -> reduce gather.
- **Variants**: #peasant-blouse, #smock-dress, #tiered-dress.
- **CLO3D**: elastic settings on casings; mesh 5 mm.
- **Confidence**: trade practice; values typical.

---

# NECKLINES

Neckline entries describe a change to the neck area of a bodice block (front, back, facing). Common rules: keep
the NP height, keep the right angle with CF and CB, join front and back shoulders and check that the neck curve is
smooth across the shoulder seam; a neckline lowered or widened beyond the block gapes unless the gape is pivoted
into the bust dart (sheet 4). In "Pieces", the pieces named are those affected on a top or dress.

## Cowl Neck {#cowl-neck}

- **Aliases**: draped neckline, cowl, waterfall neckline (front variant), back cowl; fr: col bénitier, col drapé; de: Wasserfallausschnitt, Cowl-Kragen
- **Family**: neckline, draped
- **Recognize**: soft symmetrical folds of fabric hanging at the neckline in a catenary curve, front or back, formed by excess length of the neck edge; ridge horizontal across the chest.
- **Pieces**: front x1 (cut flat on a fold or with a CF seam), back x1 on fold, front facing/self facing x1, back facing x1; in knit the cowl can be self-lined; in woven a facing or lining is essential.
- **Shape**: Front: the neckline edge is cut much longer than the finished neck opening. Method (sheet 5): choose a cowl depth D (distance from the straight neckline at CF to the lowest fold): shallow 6 to 10 cm, medium 12 to 18 cm, deep 20 to 28 cm. Drape-tape check: a tape from NP to NP dropped to the wanted depth has length T; each front half must carry a neckline edge T / 2 long. Total spread S = T / 2 - L0 (L0 = the current half neckline length from NP to CF at the original point). Slash lines: three lines from the new (lowered) neckline edge to the shoulder (two) or to mid-armhole (one), spaced equally along the neckline, cut to but not through the shoulder or armhole; spread each by S / 3 at the neckline (typical 4 to 8 cm each for soft, up to 10 cm for deep). CF is trued back to the original CF line (a straight fold or seam) and the neckline curve meets CF at a right angle. The base neckline at CF is D + 3 cm. Facing: a copy of the neckline folded back to 6 cm below the neckline so the top edge lies flat. Front shoulder N-S sews to back shoulder N-S; the facing sews to the neckline edge only (not to the armhole). Source: sheet 5 (drape-tape method from Threads "How to create a draped cowl neckline", slash and spread from Lovenotions); worked outline unverified as a drawn pattern.
- **Drafting**: 1. Lower the neckline to D + 3 at CF. 2. Draw three slash lines; 3. spread each by S / 3; 4. true CF; 5. redraw the neckline smoothly; 6. cut the facing; 7. grain: knit CF on the straight grain fold; woven cut on the true bias (CF at 45 degrees) or the cowl will not drape. Alternative (close the dart): close the shoulder or side bust dart; the intake opens along the neckline (softer drape in stretch fabric). Back cowl: same with D_back 10 to 25 cm; a weighted pocket in the facing stabilises it.
- **Sewing order**: 1. Stay-stitch the neckline. 2. Shoulder seams. 3. Join the facing at the neckline edge only. 4. Understitch. 5. Hang before hemming (woven bias).
- **Finishes and notions**: weights or a cowl stay for woven, stay tape at the shoulder, narrow hem.
- **Fabrics**: jersey, matte jersey, crepe de chine (bias), satin (bias), viscose crepe; a straight-grain woven will not drape.
- **Fit faults**: cowl collapses -> insufficient spread or wrong grain; neckline gapes at NP -> pivot 1 cm; cowl twists -> asymmetric spread, check slash lines identical.
- **Variants**: #slip-dress, #wrap-blouse, #sweetheart-neckline.
- **CLO3D**: sew the cowl neckline line to line with the facing; simulate under gravity; knit cowl needs mesh 8 mm for folds; set bias on the piece grain line, not by rotating the pattern.
- **Confidence**: techniques sheet (5), verified against the Threads and Lovenotions descriptions of the method; numbers typical.

## Keyhole Neckline {#keyhole-neckline}

- **Aliases**: keyhole opening, keyhole neck, teardrop opening; fr: décolleté goutte, ouverture goutte; de: Schlüssellochausschnitt, Tropfenausschnitt
- **Family**: neckline, small opening at the front or back neck
- **Recognize**: a high or jewel neckline with a small opening shaped like a keyhole (circle at the top, narrow slit below) at CF or CB; closed at the neck by a button, loop, hook or tie.
- **Pieces**: front (or back) x1 on fold or pair, keyhole facing x1 (shaped patch), neck facing or band, interfacing patch, button and loop.
- **Shape**: The opening sits on the CF (or CB) line: width 2 to 3 cm (the opening is the circle or teardrop top plus slit), length 5 to 8 cm measured from the neck edge. The top is rounded and the slit tapers to a point or a narrow slot. The facing is a shaped patch 3 to 4 cm wider than the opening on each side, traced from the opening; the opening edge is stay-stitched and slashed to within 2 mm of the end. The neck edge crosses the opening: the two sides of the opening are joined by a button loop at the top edge. The back of the dress has no corresponding opening. Source: sheet 4 (keyhole row), unverified as a drawn pattern; the facing patch logic is trade practice.
- **Drafting**: 1. Draw the opening on CF at the chosen length and width. 2. Trace the facing patch; 3. interface the patch; 4. mark the end points; 5. finish the neckline with the facing or binding; 6. reinforce the corners.
- **Sewing order**: 1. Interface. 2. Stay-stitch the opening. 3. Sew the facing around the opening, pivoting at the end point. 4. Slash to the corner. 5. Turn, press, understitch. 6. Neck facing or binding. 7. Button loop.
- **Finishes and notions**: bar tack at the slit end, loop or button at the neck edge, stay tape.
- **Fabrics**: woven crepe, satin, jersey (with a stabiliser), light twill. Fraying fabrics need interfaced facings.
- **Fit faults**: opening gapes -> shorten the opening or add a loop; corners tear -> reinforce with stay-stitching; facing flips out -> understitch.
- **Variants**: #cut-out-dress, #plunging-v-neckline, #sweetheart-neckline.
- **CLO3D**: build the opening as an internal shape cut out of the front piece with a facing layer; mesh 5 mm.
- **Confidence**: techniques sheet (4). Dimensions typical; no drawn source.

## Sweetheart Neckline {#sweetheart-neckline}

- **Aliases**: heart neckline, sweetheart neck, cupid neckline; fr: décolleté en cœur; de: Herzausschnitt
- **Family**: neckline, shaped over the bust
- **Recognize**: a neckline made of two convex curves, one over each breast, that meet in a point or cusp at CF.
- **Pieces**: front x1 on fold (or with CF seam), back (usually straight or high), facing x1, boning optional, stay tape.
- **Shape**: Two curves from the strap points (or NP) to a CF cusp. The CF cusp lies at depth 6 to 10 cm below the neckline level at CF (typical); the apex of each curve sits above BP (the highest point of each lobe is at about the x-position of BP, 1 to 3 cm above BP), so the edge arcs over the bust and falls to the cusp. The curve is drawn 1 to 2 cm inside the bust curve for fit. For strapless: top edge 3 to 6 cm above BP, curve and cusp, boning at the cusp. Seams: the neckline edge sews to a shaped facing with the same outline; the cusp is clipped to the corner and pivoted; tape (6 mm) along the curve. A princess seam bodice naturally aligns the sweetheart curves with the princess seams. Source: sheet 4, with web tutorials (sewguide.com sweetheart neckline: curves over the bust meeting at a centre point; facing wider than the neckline); drawn outline unverified.
- **Drafting**: 1. Trace the front block (with princess seams if strapless). 2. Mark the cusp at CF; mark the lobe apexes above BP; 3. connect NP/strap point, lobe apex, cusp with smooth curves; 4. check symmetry; 5. cut the facing (5 to 6 cm) with a corner at the cusp; 6. stay-tape the curves, 0.5 to 1 cm shorter.
- **Sewing order**: 1. Interface and stay tape. 2. Sew the facing right sides together, stitching to the cusp, pivot with a short stitch. 3. Clip to the corner. 4. Turn, press, understitch. 5. Boning at the cusp if strapless.
- **Finishes and notions**: bone at CF, grip elastic (strapless), widened seam allowance at the cusp.
- **Fabrics**: satin, crepe, lace (mounted), jersey (with elastic).
- **Fit faults**: cusp gapes -> raise it 1 to 2 cm and shorten the neck edge; lobes flatten -> boning or shaped cups; edge stretches -> stay tape.
- **Variants**: #strapless-boned-dress, #square-neckline, #bustier-top, #plunging-v-neckline.
- **CLO3D**: two arcs on the front piece, facing as a second layer; mesh 5 mm.
- **Confidence**: techniques sheet (4) and web tutorials; depth values typical.

## Plunging V-Neckline {#plunging-v-neckline}

- **Aliases**: deep V, plunge neckline, low V-neck; fr: décolleté plongeant en V; de: tiefer V-Ausschnitt
- **Family**: neckline, deep V
- **Recognize**: a V-shaped neckline that falls 20 to 35 cm below NP, exposing the chest; the edge is straight or slightly hollow.
- **Pieces**: front x1 on fold (or with a CF seam/wrap), back x1, front facing or binding x1, stay tape, optional bust support.
- **Shape**: V: the lines run from NP (or from points 2 to 5 cm out from NP) straight to the CF point at depth 20 to 35 cm; straight or hollowed 0.5 to 1 cm. Gape control (sheet 6.3): before drawing, pivot 1 to 2 cm of the neckline into the bust dart so the plunge edge is 1 to 2 cm shorter than the front body; the dart is moved to the waist or armhole. The edge is on a bias, so stay tape of 1 cm shorter than the edge is sewn on it; the CF can have an inner modesty bar or a hidden dart. Facing: 5 to 6 cm wide, miter at the point. Source: sheet 4 and 6.3, unverified as a drawn pattern.
- **Drafting**: 1. Trace the block with the bust dart. 2. Close 1 to 2 cm of the gape into the dart; 3. draw the V; 4. cut the facing; 5. stay tape 1 cm shorter; 6. optionally add a CF seam to allow shaping.
- **Sewing order**: 1. Stay tape. 2. Sew the facing, pivot at the V. 3. Clip, turn, understitch. 4. Shoulders. 5. Close the facing to the shoulder.
- **Finishes and notions**: stay tape, bar tack inside the V, fashion tape.
- **Fabrics**: crepe, jersey, satin; stretch fabrics need a stabiliser.
- **Fit faults**: V gapes -> shorten the edge by 1 cm; V stretches -> stay tape; V slides to one side -> balance the shoulders.
- **Variants**: #wrap-dress, #keyhole-neckline, #sweetheart-neckline.
- **CLO3D**: sew facing to the V line; set the V as a stiff stay (use a thin stiff strip) to avoid stretch.
- **Confidence**: techniques sheet (4, 6.3). Depths typical.

## Boat Neck {#boat-neck}

- **Aliases**: bateau neckline, Breton neckline, slash neck, wide neckline; fr: encolure bateau; de: U-Boot-Ausschnitt
- **Family**: neckline, wide and shallow
- **Recognize**: a wide, shallow neckline that follows the collarbone from shoulder to shoulder, nearly horizontal at front and back.
- **Pieces**: front x1 on fold, back x1 on fold, facings x2 (or bias binding), stay tape.
- **Shape**: Front: the neckline begins at the shoulder at a point 3 to 4 cm (minimum) from SP and runs to CF in a very shallow curve of depth 2 to 4 cm at CF (to 6 for a deeper one). The neck is widened by moving the neck point out along the shoulder by 7 to 10 cm (relative to the NP) while keeping at least 3 to 4 cm of shoulder at SP. The ends are taken in 1 to 1.5 cm to avoid slipping off the shoulders; the neck edge is 1 cm shorter than the body or sewn with a stay tape. Back: the same width and a depth of 1 to 2 cm. Front shoulder (now a short seam) sews to back shoulder. Facing: copy of the neck edge 5 cm wide. Source: sheet 4 (boat row), unverified as a drawn pattern.
- **Drafting**: 1. Mark new NP on the shoulder 7 to 10 cm outward from the block NP. 2. Mark CF depth 2 to 4 cm. 3. Draw a smooth shallow curve. 4. Pivot 0.3 to 0.6 cm of the gape into the bust dart; 5. check the shoulder seam length is at least 3 to 4 cm; 6. take in 1 to 1.5 cm at the ends.
- **Sewing order**: 1. Stay tape. 2. Shoulder seams. 3. Facing. 4. Understitch. 5. Tack the facing at the shoulder.
- **Finishes and notions**: stay tape, facing, bias binding, shoulder tape.
- **Fabrics**: jersey, interlock, ponte, light wool, cotton. Stretch fabrics need less take-in.
- **Fit faults**: neckline slides off the shoulder -> take in the ends or narrow the neck; neckline gapes at CF -> pivot gape; shoulders feel loose -> add a shoulder tape.
- **Variants**: #off-shoulder-bardot-neckline, #square-neckline, #tank-top.
- **CLO3D**: facing as a second layer; stay tape as a narrow pattern; mesh 5 mm.
- **Confidence**: techniques sheet (4). Numbers typical.

## Off-Shoulder (Bardot) Neckline {#off-shoulder-bardot-neckline}

- **Aliases**: Bardot neckline, off-the-shoulder, bare-shoulder neckline, elasticated Bardot; fr: encolure bardot, épaules dénudées; de: Carmen-Ausschnitt
- **Family**: neckline, elasticated casing across the upper arms
- **Recognize**: a neckline that sits below the shoulders, across the upper arms or the upper chest, held by elastic in a casing or by a snug edge; the shoulders are bare; can have a ruffle at the top edge.
- **Pieces**: front x1 on fold (or pair), back x1 on fold, sleeves x2 (optional), top-edge casing/self ruffle strips x1 pair, elastic x1 (1.5 to 2.5 cm wide).
- **Shape**: The pattern is widened at the top: the front/back top edge runs straight across from the side seam (about U + 6 to 10 cm up) to CF/CB, at a level 3 to 8 cm below SP, or across the upper bust. The bodice has no shoulder seam in a classic Bardot; the top edge is a horizontal line with the casing folded over (2.5 to 3 cm for 1.5 to 2 cm elastic). The finished edge is held by elastic cut to the snug circumference of the body (over-arm or upper chest) at that level; the pattern top edge width before gathering = elastic length x 1.3 to 2 (casing gather). A sleeve may be a bishop sleeve or an elasticated cuff. The side seams join front to back. Source: web tutorials differ on the elastic length; a documented layout exists in the Sew Magazine Sophia Bardot top (2.5 cm wide elastic); elastic length is typically 0.8 to 0.9 of the circumference measured on the body (from the techniques sheet), and a toile is mandatory. Outline unverified as a drawn pattern.
- **Drafting**: 1. Measure the circumference at the intended edge level over the arms (over-arm) or across the upper chest. 2. Elastic length E = circumference x 0.8 to 0.9 (confirm on the body; some tutorials use the snug measure). 3. Pattern top width per half = E x ratio / 2. 4. Cut the top edge as a straight line with the casing allowance. 5. Shape the side seam from the top edge (at least 6 cm wide) to U; 6. pivot a small gape into the bust dart; 7. hem as the base garment.
- **Sewing order**: 1. Side seams. 2. Fold and sew the casing, leaving a gap. 3. Thread the elastic, join, close the gap. 4. Sleeves (optional). 5. Hem.
- **Finishes and notions**: elastic 1.5 to 2.5 cm, casing stitched 3 to 4 cm from the edge, optional silicone grip.
- **Fabrics**: cotton poplin (crisp ruffle), voile, viscose, light jersey (no casing needed, use elastic edge). Heavy fabrics need more tension; light silks ripple if too tight.
- **Fit faults**: edge slides down -> shorten elastic 1 to 2 cm or move the edge up; cuts into arms -> lengthen elastic; bust area gaps -> pivot dart into the waist.
- **Variants**: #boat-neck, #tube-top, #peasant-blouse.
- **CLO3D**: elastic in the casing via the set_elastic (elastic tool) on the top-edge seam line with the strength tuned; verify the edge sits on the upper arms; mesh 5 mm.
- **Confidence**: techniques sheet (4) and web tutorials; web sources conflict on the elastic length, so values are typical and require a toile.

## Square Neckline {#square-neckline}

- **Aliases**: square neck, squared scoop; fr: encolure carrée, décolleté carré; de: eckiger Ausschnitt, Karree-Ausschnitt
- **Family**: neckline, geometric
- **Recognize**: a neckline with two vertical edges and a horizontal bottom edge meeting at right-angle corners; the corners may be sharp or slightly rounded.
- **Pieces**: front x1 on fold, back x1 on fold (usually round or square), front facing x1, back facing x1, interfacing, stay tape.
- **Shape**: Front: the vertical edges rise from the bottom corners to the shoulder at x = the neck half-width, 7 to 9 cm from CF for a narrow square (the straps remain at least 4 cm wide), up to 10 to 12 cm for a wide one; the horizontal edge is at depth 8 to 15 cm below the shoulder-neck level and runs across CF; the bottom corners are exactly 90 degrees (or rounded with radius at most 0.5 cm). The neck seam is mitred at the corners: the facing is cut with a mitred corner, clipped to the corner, and understitched. A stay tape (6 mm) is sewn along the vertical edges, which are partly on the bias. The back is usually shallower (depth 2 to 8 cm) and may mirror the same width. Source: sheet 4 (square row), unverified as a drawn pattern.
- **Drafting**: 1. Trace the front block. 2. Mark vertical lines at the half width x. 3. Mark depth D and draw the horizontal edge; 4. verify corner angles; 5. pivot 0.3 to 0.6 cm of the gape into the dart for D > 8 cm; 6. cut the facing with the corners.
- **Sewing order**: 1. Stay tape. 2. Sew the facing with pivoting at each corner. 3. Clip diagonally to the corner. 4. Turn, press, understitch. 5. Tack the facing at shoulders.
- **Finishes and notions**: stay tape, mitred corners, topstitching.
- **Fabrics**: crepe, cotton, linen, ponte; stiffer fabrics hold a clean corner.
- **Fit faults**: corners pucker -> clip to the stitching and press; vertical edges gape -> shorten 0.5 to 1 cm with stay tape; neckline does not sit flat -> pivot the gape into the dart.
- **Variants**: #sweetheart-neckline, #boat-neck, #pinafore-dress.
- **CLO3D**: sharp corners need a fine mesh (3 to 5 mm) at the corners; facing as a second layer.
- **Confidence**: techniques sheet (4). Dimensions typical.

## Sources

Techniques sheets and conventions used in this file:

- `references/techniques/bodices-dresses-tops.md` (sheets 1 to 11): dart manipulation, princess seams, necklines, cowl, wrap, strapless and corset, dresses, tops, shirts. The "sheet X.Y" numbers in the entries refer to its sections.
- `references/kb/bottoms.md` (skirt anchors, `#skater-skirt`, `#a-line-skirt`, `#half-circle-skirt`), `references/kb/lingerie-swim-sleep-kids.md` and `references/kb/menswear-workwear-sport.md` (shirt block, `#button-down-shirt`, `#mens-dress-shirt`), for cross references only.

Consulted online (limited detail; numbers marked typical come from textbook conventions, not re-verified page by page):

- Dresspatternmaking, "Lowered necklines" (https://dresspatternmaking.com/garment-elements/low-necklines): gape correction on lowered necklines and cut-away armholes by pivoting into the bust dart.
- Threads, "How to create a draped cowl neckline" (https://www.threadsmagazine.com/2013/11/18/how-to-create-a-draped-cowl-neckline) and Lovenotions, "How to modify a cowl neckline" (https://www.lovenotions.com/how-to-modify-a-cowl-neckline): drape-tape depth and slash and spread method.
- Threads, "Make a custom godet skirt" (https://www.threadsmagazine.com/2020/02/28/make-a-custom-godet-skirt) and The Creative Curator, "How to draft a godet" (https://www.thecreativecurator.com/how-to-draft-a-godet/): godet wedge apex near the knee and free hem width.
- True Bias, "Ogden cami bias slip dress tutorial" (https://truebias.com/blogs/blog/ogden-cami-bias-slip-dress-tutorial): hanging a bias hem, stay-stitching.
- FreeSewing, "Cathrin corset" (https://docs.freesewing.org/docs/designs/cathrin): reduction and panel parameters of a corset.
- Sew Magazine, "Sophia top" (https://www.sewmag.co.uk/free-sewing-patterns/sophia-top): a Bardot pattern that uses 2.5 cm wide elastic; WeAllSew "Off-the-Shoulder Ruffle Top Tutorial" (https://weallsew.com/diy-off-shoulder-ruffle-top/): casing and elastic method; elastic length advice differs between tutorials.
- SewGuide, "Sweetheart neckline" (https://sewguide.com/sweetheart-neckline/) and Ellie and Mac, "Adding a sweetheart peek-a-boo neckline" (https://ellieandmac.com/blogs/blog/adding-a-sweetheart-peek-a-boo-neckline): two curves meeting at a centre point, facing wider than the edge.

Textbooks used as convention reference (not accessible online; values reproduced from standard practice and to be confirmed on a toile):
Winifred Aldrich, Metric Pattern Cutting for Women's Wear; Helen Joseph Armstrong, Patternmaking for Fashion Design;
Müller & Sohn (System Müller Schnittkonstruktion); Esmod and Bunka course conventions.

No outline in this file was copied from a drawn commercial pattern; "Shape" fields marked "unverified" describe construction logic only.
