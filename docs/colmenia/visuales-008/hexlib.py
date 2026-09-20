"""Panales en SVG. Hexágono de lado plano arriba (flat-top)."""
import math

SQ3 = math.sqrt(3)


def hex_path(cx, cy, r):
    pts = []
    for i in range(6):
        a = math.radians(60 * i)
        pts.append(f"{cx + r * math.cos(a):.1f},{cy + r * math.sin(a):.1f}")
    return "M" + "L".join(pts) + "Z"


def cluster(n, r, rows, x0=0, y0=0):
    """Coordenadas de n hexágonos empaquetados en columnas de `rows` de alto."""
    out = []
    for i in range(n):
        col, row = divmod(i, rows)
        cx = x0 + r + col * r * 1.5
        cy = y0 + r * SQ3 / 2 + row * r * SQ3 + (r * SQ3 / 2 if col % 2 else 0)
        out.append((cx, cy))
    return out


def cluster_size(n, r, rows):
    cols = math.ceil(n / rows)
    return (2 * r + (cols - 1) * r * 1.5, rows * r * SQ3 + r * SQ3 / 2)


def field(w, h, r, seed=7, dense=0.55):
    """Retícula decorativa: hexágonos sueltos con opacidad pseudoaleatoria.
    Es la textura que faltaba — a un 5% no se veía y la marca es una colmena."""
    cols = int(w / (r * 1.5)) + 2
    rows = int(h / (r * SQ3)) + 2
    out = []
    s = seed
    for c in range(cols):
        for rw in range(rows):
            s = (s * 1103515245 + 12345) % 2147483648
            v = s / 2147483648
            if v > dense:
                continue
            cx = c * r * 1.5
            cy = rw * r * SQ3 + (r * SQ3 / 2 if c % 2 else 0)
            out.append((cx, cy, 0.05 + v * 0.5))
    return out


GRANO = """<svg class="grano" xmlns="http://www.w3.org/2000/svg"><filter id="g">
<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
<feColorMatrix type="saturate" values="0"/></filter>
<rect width="100%" height="100%" filter="url(#g)"/></svg>"""
