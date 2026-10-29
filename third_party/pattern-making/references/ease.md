# Ease

Ease is the difference between the body measurement and the finished garment measurement, on the full
round. There are two distinct kinds:

- **Wearing ease**, to move, breathe and sit. It is included in the blocks.
- **Design ease**, which gives the intended volume. It is added later by transformation.

## Script defaults, full round in cm

| Key | Women | Men | Children | Role |
|---|---|---|---|---|
| `bust` | 8 | 10 | 8 | bodice |
| `bodice_waist` | 4 | 6 | 6 | bodice |
| `skirt_waist` | 1 | 1 | 2 | skirt |
| `skirt_hip` | 4 | 4 | 6 | skirt |
| `trouser_waist` | 1 | 1 | 2 | trousers |
| `trouser_hip` | 4 | 6 | 6 | trousers |
| `sleeve_cap` | 2.5 | 1.5 | 1.5 | sleeve cap ease |
| `wrist` | 8 | 10 | 8 | width at the sleeve hem |
| `shoulder` | 0.8 | 0.6 | 0.5 | back shoulder ease |

## Guide values by garment, bust ease on the full round

| Garment | Ease |
|---|---|
| Fitted dress, bustier | 4 to 6 |
| Fitted blouse | 8 to 10 |
| Classic shirt | 12 to 16 |
| Tailored jacket | 10 to 14 |
| Coat | 16 to 24 |
| Loose, oversize garment | 25 and more |

At the hip, allow 2 to 4 cm for a fitted straight skirt and 4 to 8 cm for city trousers.

## Stretch fabrics

In a knit, ease often becomes negative: the garment is smaller than the body.

1. Measure the stretch: stretch 10 cm of fabric without forcing and note the length reached.
2. Choose the reduction for the fit:
   - Low-stretch knit, up to 20 %: ease 0 to 4 cm, darts can stay.
   - Medium-stretch knit, 20 to 50 %: ease from 0 to minus 5 %, darts removed.
   - High-stretch knit, beyond 50 %: minus 5 to minus 15 % for leggings or a bodysuit.
3. Remove the darts by moving their value to the side seam, and reduce the sleeve cap ease to 0.

Negative ease is passed directly to the script, for example `"ease": {"bust": -4}`.

## Ease in seams

- **Sleeve cap**: 1 to 1.5 cm for a shirt, 2 to 3 cm for a set-in jacket sleeve, almost 0 in a knit.
- **Back shoulder**: 0.5 to 1 cm, shrunk away with the iron or by a small dart.
