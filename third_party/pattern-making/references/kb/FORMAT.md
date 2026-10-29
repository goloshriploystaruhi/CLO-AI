# Knowledge base format

Every file in `references/kb/` is a list of entries in this exact format, so the engine can index them
(`python scripts/pattern.py kb search <words>`). One entry per garment, piece or technique.

```
## <Name in English> {#<id>}

- **Aliases**: other English names; French names (fr: ...); other languages if usual
- **Family**: garment family or technique family
- **Recognize**: how to tell it on a photo or a drawing (seams, folds, shapes, closures)
- **Pieces**: piece name (cut count), piece name (cut count) ...
- **Shape**: for each non-trivial piece, its outline in words AND numbers: overall proportions (width /
  height), named anchor points (A, B, C... or descriptive), notches, slits, holes, curves and where they
  are, which edge is sewn to which edge of which piece. State the source of the shape: "drawn pattern:
  <source>" when taken from a real pattern drawing, otherwise "unverified".
- **Drafting**: numbered steps with measurements and formulas in cm or mm (typical values marked)
- **Sewing order**: numbered
- **Finishes and notions**: seam types, hems, facings, interfacing, closures
- **Fabrics**: suitable fabrics and how they change the pattern (ease, stretch, nap, grain)
- **Fit faults**: fault -> pattern fix
- **Variants**: related constructions and how they differ (link ids with #id)
- **CLO3D**: how to build it there (pieces, seams, mesh size, layers, what the user must place by hand)
- **Confidence**: verified (source) / trade practice / from memory, per section when it differs
```

Rules:

- Ids are lowercase with dashes, unique across the whole base (`bolton-thumb`, `circle-skirt`).
- Metric units. Plain technical English. No emojis.
- Never invent a shape or a number to fill a field: write "unverified" or "not known" instead.
- Each file ends with `## Sources` listing books, published patterns and URLs used.
