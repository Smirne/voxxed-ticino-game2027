#!/usr/bin/env python3
"""
Turn the Palazzo dei Congressi 1:200 PDFs in plans/ into what the game builds on:

  plans/ground-floor.png, plans/first-floor.png   the drawing, world-oriented, 20 px/m
  plans/trace-ground.json, plans/trace-first.json every vector line of the drawing, in metres

World frame (docs/venue.md): +x east along the building (Sala A west, Sala E east),
+y south (lake/park side at the top, main entrance at the bottom), metres, origin at
the drawing's corner. The PDF page is a portrait sheet with the plan drawn on its side;
in its point space (x_pt, y_pt) the world point is

    X = (PAGE_H_PT - y_pt) * M_PER_PT,   Y = x_pt * M_PER_PT

M_PER_PT is exact for a true 1:200 sheet (1 pt = 25.4/72 mm on paper = 70.556 mm on
site) and is checked against the drawing's own scale bar: one 2 m block is 28.346 pt.

Needs: python3, poppler-utils (pdftocairo, pdftoppm), Pillow. Run from the repo root:
    python3 tools/plans/extract.py
"""
import json, os, re, subprocess, sys, tempfile

M_PER_PT = 25.4 / 72 / 1000 * 200  # 0.0705556 m
PAGE_W_PT, PAGE_H_PT = 1053, 1786  # the sheet as displayed (portrait)
PX_PER_M = 20
FLOORS = {'ground': 'PCL_PT_Planimetria_1-200.pdf', 'first': 'PCL_P1_Planimetria_1-200.pdf'}


def world(x, y):
    return ((PAGE_H_PT - y) * M_PER_PT, x * M_PER_PT)


def paths(svg):
    body = svg[svg.find('</defs>'):]  # skip the glyph definitions: text is not geometry
    for m in re.finditer(r'<path\b([^>]*)/>', body):
        a = m.group(1)
        d = re.search(r' d="([^"]*)"', a).group(1)
        tm = re.search(r'transform="matrix\(([^)]*)\)"', a)
        T = [float(v) for v in tm.group(1).split(',')] if tm else [1, 0, 0, 1, 0, 0]
        stroked = 'stroke-width' in a
        fill = re.search(r'fill="([^"]+)"', a)
        filled = bool(fill) and fill.group(1) != 'none'
        black = filled and fill.group(1) == 'rgb(0%, 0%, 0%)'
        toks = re.findall(r'[MLCZ]|-?[\d.]+', d)
        polys, poly, k = [], [], 0
        P = lambda x, y: (T[0] * x + T[2] * y + T[4], T[1] * x + T[3] * y + T[5])
        while k < len(toks):
            t = toks[k]
            if t == 'M':
                if len(poly) > 1:
                    polys.append(poly)
                poly = [P(float(toks[k + 1]), float(toks[k + 2]))]; k += 3
            elif t == 'L':
                poly.append(P(float(toks[k + 1]), float(toks[k + 2]))); k += 3
            elif t == 'C':  # curves (door swings, columns) kept as their chord end points
                poly.append(P(float(toks[k + 5]), float(toks[k + 6]))); k += 7
            elif t == 'Z':
                if poly:
                    poly.append(poly[0])
                k += 1
            else:
                k += 1
        if len(poly) > 1:
            polys.append(poly)
        for p in polys:
            yield ('fill' if black and not stroked else 'line' if stroked else 'tint'), p


def main():
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    plans = os.path.join(root, 'plans')
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None
    with tempfile.TemporaryDirectory() as tmp:
        for floor, pdf in FLOORS.items():
            src = os.path.join(plans, pdf)
            svg = os.path.join(tmp, floor + '.svg')
            subprocess.run(['pdftocairo', '-svg', src, svg], check=True)
            out = {'units': 'm', 'frame': 'x east (Sala A -> Sala E), y south (lake -> main entrance)',
                   'source': pdf, 'm_per_pt': M_PER_PT, 'lines': [], 'fills': []}
            for kind, p in paths(open(svg).read()):
                if kind == 'tint':
                    continue
                pts = [[round(c, 2) for c in world(x, y)] for x, y in p]
                out['lines' if kind == 'line' else 'fills'].append(pts)
            with open(os.path.join(plans, f'trace-{floor}.json'), 'w') as f:
                json.dump(out, f, separators=(',', ':'))
            # Raster: pdftoppm at the dpi that gives PX_PER_M, then turn it to the world frame.
            dpi = PX_PER_M * M_PER_PT * 72
            base = os.path.join(tmp, floor)
            subprocess.run(['pdftoppm', '-r', f'{dpi:.4f}', '-png', '-singlefile', src, base], check=True)
            im = Image.open(base + '.png').convert('L').transpose(Image.Transpose.ROTATE_270)
            im.save(os.path.join(plans, f'{floor}-floor.png'), optimize=True)
            print(floor, len(out['lines']), 'lines', len(out['fills']), 'fills', im.size)


if __name__ == '__main__':
    sys.exit(main())
