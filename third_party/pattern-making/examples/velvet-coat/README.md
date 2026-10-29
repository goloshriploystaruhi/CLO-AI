# Worked example: floor-length velvet coat, lined

Drafted from one runway photo (front only), women 38, then checked in CLO3D on an avatar.

```
python ../../scripts/pattern.py garment coat.json --out out
python ../../scripts/sheet.py out/pieces_38.json --title "Velvet coat"
python ../../scripts/pattern.py clo3d out/clo3d/clo3d_38.json --assemble --mesh 10
```

Construction read from the photo (`references/reference-analysis.md`, checklist): armhole princess seams front and
back, no waist seam; flare from the waist on every vertical seam, hem about 6 m, on the floor; **16 cm wrap, right
over left**, concealed fly to the hip, fronts free below; funnel stand collar 13 cm, its ends overlapping; square
extended shoulders with 2.5 cm pads; two-piece sleeves 14 cm longer than the arm for the ruching; in-seam pockets;
free-hanging lining. The back was not visible: princess seams and a centre back seam are assumed.

What went wrong the first time and is now built in: the wrap was missed (a 4 cm fly, sewn closed in 3D: a closed
dress); a facing narrower than the princess front panel left a 3 cm lining strip (the facing is now the whole
front panel, and the engine flags pinched pieces).
