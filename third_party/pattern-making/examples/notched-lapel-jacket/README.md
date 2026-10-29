# Worked example: notched-lapel jacket, lined

Two specs for the `garment` command (`references/garment-spec.md`), women 38:

```
python ../../scripts/pattern.py garment jacket_fitted.json --out out_fitted
python ../../scripts/pattern.py garment jacket_oversize.json --out out_oversize
python ../../scripts/sheet.py out_oversize/pieces_38.json --title "Jacket" --px 15 --width 2700
```

- `jacket_fitted.json`: darts, notched lapel (break 22 cm), two-piece sleeve with a 10 cm vent, patch pockets,
  lining with a jump pleat and a centre back pleat.
- `jacket_oversize.json`: boxy (no waist shaping, bust dart reduced into the hem), shoulder 3.5 cm wider with
  1.5 cm pads, deeper armhole, break lowered to 36 cm (deep V), same sleeve, pockets and lining.

Lessons kept from building it by hand first:

- Collar drafted in place on the front: new neckline parallel to the roll line, collar stand line rotated by the
  spring, centre back squared. Its neck edge equals back neck + front neckline + gorge up to the notch.
- Turn of cloth on the top collar: offset the outer edge and the end edge perpendicular to themselves.
- Two-piece sleeve from a one-piece: the base keeps parallel underarm sides, the taper goes into the forearm and
  hindarm seams; elbow ease by turning the lower top sleeve about the forearm elbow point.
- Unfitted jacket: the removed part of the bust dart becomes hem shaping so the side seams still match.

Values are trade practice inside the knowledge base ranges; outlines not yet compared to a published draft.
