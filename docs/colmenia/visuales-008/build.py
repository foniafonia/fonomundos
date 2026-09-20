"""Genera las cinco piezas de la Nº 8."""
import pathlib
from hexlib import hex_path, cluster, cluster_size, field, GRANO

FONDO, MIEL, CREMA, APAGADO = "#161210", "#E8A93A", "#F5E6C4", "#8A7350"


def panal(w, h, r=46, seed=7, dense=0.5, color=MIEL, clase="panal",
          mask="linear-gradient(to left, #000 0%, transparent 72%)"):
    """Campo de hexágonos. Ahora sí se ve: es la marca, no un fondo de pantalla."""
    celdas = "".join(
        f'<path d="{hex_path(cx, cy, r)}" fill="none" stroke="{color}" '
        f'stroke-width="1.6" opacity="{o:.2f}"/>'
        for cx, cy, o in field(w, h, r, seed, dense)
    )
    return (f'<svg class="{clase}" style="-webkit-mask-image:{mask};mask-image:{mask}" '
            f'width="{w}" height="{h}" xmlns="http://www.w3.org/2000/svg">{celdas}</svg>')


def encendidas(puntos, r=46, color=MIEL):
    """Celdas vivas con halo. El brillo es lo que le faltaba a las piezas planas."""
    defs = ('<defs><filter id="halo" x="-120%" y="-120%" width="340%" height="340%">'
            '<feGaussianBlur stdDeviation="16"/></filter></defs>')
    cuerpo = ""
    for cx, cy, fuerza in puntos:
        d = hex_path(cx, cy, r)
        cuerpo += (f'<path d="{d}" fill="{color}" opacity="{0.55 * fuerza:.2f}" filter="url(#halo)"/>'
                   f'<path d="{d}" fill="{color}" opacity="{0.20 * fuerza:.2f}"/>'
                   f'<path d="{d}" fill="none" stroke="{color}" stroke-width="2.2" '
                   f'opacity="{fuerza:.2f}"/>')
    return defs + cuerpo


def badge(n=8, oscuro=False):
    c = FONDO if oscuro else MIEL
    return (f'<div class="badge"><svg width="62" height="70" viewBox="-33 -36 66 72">'
            f'<path d="{hex_path(0, 0, 32)}" fill="none" stroke="{c}" stroke-width="2"/>'
            f'</svg><span>Nº {n}</span></div>')


BASE = """
@import url('fonts/brand-fonts.css');
:root { --fondo:#161210; --miel:#E8A93A; --crema:#F5E6C4; --apagado:#8A7350;
        --tenue:rgba(245,230,196,.42); }
* { box-sizing:border-box; margin:0; padding:0; }
html, body { overflow:hidden; }
body { background:var(--fondo); color:var(--crema); position:relative;
       font-family:'Andika',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
.panal, .grano, .halo, .vineta { position:absolute; pointer-events:none; }
/* Grano de película. Sin esto los degradados oscuros se ven a bandas y todo
   queda con ese aire plano de plantilla. */
.grano { inset:0; width:100%; height:100%; opacity:.16; mix-blend-mode:overlay; }
.vineta { inset:0; box-shadow:inset 0 0 220px 90px rgba(0,0,0,.55); }
.halo { border-radius:50%;
        background:radial-gradient(circle, rgba(232,169,58,.22), transparent 66%); }
.etiqueta { font-family:'IBM Plex Mono',monospace; font-weight:500;
            text-transform:uppercase; color:var(--miel); }
.titular { font-family:'Jost',sans-serif; font-weight:400; line-height:1.03;
           letter-spacing:-.018em; }
.titular em { font-style:normal; color:var(--miel); }
.regla { background:var(--miel); border:0; }
.firma { font-family:'IBM Plex Mono',monospace; color:var(--tenue);
         text-transform:uppercase; }
/* Sello de edición: hexágono con el número. Va en las cinco piezas. */
.badge { position:absolute; display:grid; place-items:center; }
.badge svg { grid-area:1/1; }
.badge span { grid-area:1/1; font-family:'IBM Plex Mono',monospace; font-weight:500;
              font-size:15px; letter-spacing:.06em; color:var(--miel); }
"""


def escribir(nombre, css, cuerpo):
    pathlib.Path(f"{nombre}.html").write_text(
        f'<!doctype html><meta charset="utf-8">\n<style>{BASE}\n{css}</style>\n{cuerpo}\n'
    )


# ───────────────────────────────────── 1. portada de artículo 1200×627
luz = [(1020, 150, 1.0), (1090, 270, .55), (950, 300, .7), (1160, 100, .4), (1020, 420, .5)]
escribir("1-portada-articulo", """
body { width:1200px; height:627px; display:flex; flex-direction:column; justify-content:center;
       padding:0 84px; }
.panal, .luz { right:0; top:-60px; }
.luz { position:absolute; }
.halo { width:760px; height:760px; right:-140px; top:-190px; }
.etiqueta { font-size:15px; letter-spacing:.34em; margin-bottom:30px; }
.titular { font-size:60px; max-width:730px; }
.regla { width:70px; height:3px; margin:38px 0 24px; }
.sub { font-size:20px; line-height:1.5; max-width:600px; color:rgba(245,230,196,.72); }
.firma { position:absolute; left:84px; bottom:38px; font-size:12px; letter-spacing:.24em; }
.badge { right:74px; bottom:48px; }
""", f"""
{panal(560, 760, 46, 7, .52)}
<svg class="luz" width="560" height="760">{encendidas([(x-640, y+60, f) for x, y, f in luz])}</svg>
<div class="halo"></div>{GRANO}<div class="vineta"></div>
<p class="etiqueta">Cuaderno de laboratorio</p>
<h1 class="titular">Mientras buscas el gesto,<br><em>la sesión se para.</em></h1>
<hr class="regla">
<p class="sub">Una maestra de AL me pidió una herramienta para eso.</p>
<p class="firma">ColmenIA · José Aserraf</p>
{badge()}
""")

# ───────────────────────────────────── 2. vertical 1080×1920
luz2 = [(250, 190, 1.0), (360, 320, .6), (140, 360, .75), (470, 150, .45)]
escribir("2-portada-vertical", """
body { width:1080px; height:1920px; display:flex; flex-direction:column; justify-content:center;
       padding:0 92px; }
.panal, .luz { left:0; top:0; }
.luz { position:absolute; }
.halo { width:1100px; height:1100px; left:-220px; top:-340px; }
.etiqueta { font-size:23px; letter-spacing:.34em; margin-bottom:44px; }
.titular { font-size:124px; }
.regla { width:100px; height:4px; margin:56px 0 36px; }
.sub { font-size:35px; line-height:1.45; color:rgba(245,230,196,.72); }
.buscador { margin-top:88px; border:2px solid rgba(232,169,58,.5); border-radius:9px;
            padding:26px 30px; font-family:'IBM Plex Mono',monospace; font-size:31px;
            color:var(--miel); display:flex; gap:15px; align-items:center; width:420px; }
.cursor { width:3px; height:35px; background:var(--miel); }
.firma { position:absolute; left:92px; bottom:96px; font-size:20px; letter-spacing:.26em; }
.badge { right:80px; bottom:92px; transform:scale(1.5); }
""", f"""
{panal(1080, 620, 58, 3, .5, mask='linear-gradient(to bottom, #000 0%, transparent 88%)')}
<svg class="luz" width="1080" height="620">{encendidas(luz2, 58)}</svg>
<div class="halo"></div>{GRANO}<div class="vineta"></div>
<p class="etiqueta">Cuaderno de laboratorio</p>
<h1 class="titular">Mientras<br>buscas el gesto,<br><em>la sesión<br>se para.</em></h1>
<hr class="regla">
<p class="sub">Una maestra de AL me pidió<br>una herramienta para eso.</p>
<div class="buscador">comer<span class="cursor"></span></div>
<p class="firma">ColmenIA · José Aserraf</p>
{badge()}
""")

# ───────────────────────────────────── 3. la frase — invertida, crema
escribir("3-cita-tesis", """
body { width:1080px; height:1080px; background:var(--crema); color:var(--fondo);
       display:flex; flex-direction:column; justify-content:center; padding:0 86px; }
.panal { right:-60px; bottom:-80px; }
.grano { opacity:.10; mix-blend-mode:multiply; }
.vineta { box-shadow:inset 0 0 200px 70px rgba(122,92,30,.13); }
.etiqueta { font-size:18px; letter-spacing:.32em; color:#9A6A12; margin-bottom:40px; }
.titular { font-size:78px; color:var(--fondo); letter-spacing:-.022em; }
.titular em { color:#B37B14; }
.segunda { font-size:34px; line-height:1.36; margin-top:40px; color:rgba(22,18,16,.72);
           font-family:'Andika',sans-serif; max-width:820px; }
.regla { width:80px; height:3px; background:#B37B14; margin:52px 0 26px; }
.firma { font-size:17px; letter-spacing:.26em; color:rgba(22,18,16,.45); }
.badge span { color:var(--fondo); }
.badge { right:78px; top:74px; }
""", f"""
{panal(620, 620, 52, 11, .45, color=FONDO,
       mask='radial-gradient(circle at 100% 100%, #000 0%, transparent 74%)')}
{GRANO}<div class="vineta"></div>
<p class="etiqueta">Lo que me llevo de esta semana</p>
<h1 class="titular">La IA que sirve este curso <em>no conversa con el alumnado.</em></h1>
<p class="segunda">Le devuelve al profesional, en dos segundos, lo que le costaba veinte minutos.</p>
<hr class="regla">
<p class="firma">ColmenIA · Cuaderno de laboratorio</p>
{badge(oscuro=True)}
""")

# ───────────────────────────────────── 4. quién hay dentro — panal de unidades
GRUPOS = [("Logopedas y fonoaudiólogas", 36, MIEL),
          ("Maestras y maestros de AL", 15, MIEL),
          ("Psicología, pedagogía, estudiantes y familia", 6, MIEL),
          ("Sin perfil rellenado", 26, APAGADO)]
R, FILAS = 15, 2
bloques = ""
for etq, n, col in GRUPOS:
    w, h = cluster_size(n, R, FILAS)
    celdas = "".join(
        f'<path d="{hex_path(cx, cy, R - 2.2)}" fill="{col}" opacity="{.92 if col == MIEL else .6}"/>'
        for cx, cy in cluster(n, R, FILAS))
    bloques += (f'<div class="grupo"><div class="cab"><span class="nom">{etq}</span>'
                f'<span class="num" style="color:{col}">{n}</span></div>'
                f'<svg width="{w:.0f}" height="{h:.0f}">{celdas}</svg></div>')

escribir("4-quien-hay-dentro", """
body { width:1080px; height:1080px; display:flex; flex-direction:column; justify-content:center;
       padding:0 86px; }
.panal { right:-40px; top:-40px; }
.halo { width:820px; height:820px; right:-260px; top:-250px; }
.etiqueta { font-size:17px; letter-spacing:.32em; margin-bottom:16px; }
.titular { font-size:62px; margin-bottom:18px; }
.fuente { font-family:'IBM Plex Mono',monospace; font-size:15px; letter-spacing:.1em;
          color:var(--tenue); margin-bottom:52px; }
/* Cada hexágono es una persona. La identidad la da la posición del grupo y su
   etiqueta, no el color: con una marca de tres tonos, cuatro colores
   categóricos no llegan a separarse ni con visión normal. */
.grupo { margin-bottom:30px; }
.cab { display:flex; align-items:baseline; gap:16px; margin-bottom:13px; }
.nom { font-size:21px; color:rgba(245,230,196,.88); }
.num { font-family:'Jost',sans-serif; font-weight:500; font-size:30px; }
.pie { margin-top:14px; font-size:20px; color:rgba(245,230,196,.62); }
.badge { right:78px; top:72px; }
""", f"""
{panal(520, 520, 44, 5, .45, mask='radial-gradient(circle at 100% 0%, #000 0%, transparent 76%)')}
<div class="halo"></div>{GRANO}<div class="vineta"></div>
<p class="etiqueta">Quién hay dentro</p>
<h1 class="titular">83 perfiles, uno a uno.</h1>
<p class="fuente">18 de septiembre de 2026 · cada hexágono es una persona</p>
{bloques}
<p class="pie">España, Venezuela, Bolivia y Argentina. Hoy somos 88.</p>
{badge()}
""")

# ───────────────────────────────────── 5. la línea de los 14
FILAS_L = [("13", "El límite de la IA de voz con la que me estrellé", "Por su propia normativa"),
           ("14", "Cataluña, orientaciones del curso del 8 de septiembre", "IA de propósito general, uso autónomo"),
           ("14", "Euskadi, guía repartida a los centros", "Chatbots")]
filas = "".join(
    f'<div class="fila"><div class="cifra">{a}</div><div class="txt">{b}<span>{c}</span></div></div>'
    for a, b, c in FILAS_L)

escribir("5-la-linea", """
body { width:1080px; height:1080px; display:flex; flex-direction:column; justify-content:center;
       padding:0 86px; }
.panal { left:-70px; bottom:-90px; }
.halo { width:900px; height:900px; left:-300px; bottom:-330px; }
.etiqueta { font-size:17px; letter-spacing:.32em; margin-bottom:16px; }
.titular { font-size:60px; margin-bottom:46px; }
.fila { display:flex; align-items:center; gap:34px; padding:20px 0;
        border-top:1px solid rgba(245,230,196,.14); }
/* Escala: la cifra es el mensaje. A tamaño de miniatura es lo único que se lee. */
.cifra { font-family:'Jost',sans-serif; font-weight:500; font-size:132px; line-height:.86;
         color:var(--miel); min-width:196px; letter-spacing:-.04em; }
.txt { font-size:24px; line-height:1.34; color:rgba(245,230,196,.9); }
.txt span { display:block; font-family:'IBM Plex Mono',monospace; font-size:14px;
            letter-spacing:.14em; text-transform:uppercase; color:var(--tenue); margin-top:8px; }
.aviso { margin-top:40px; border-left:3px solid var(--miel); padding-left:24px;
         font-size:24px; line-height:1.4; color:rgba(245,230,196,.84); }
.badge { right:78px; top:72px; }
""", f"""
{panal(560, 560, 46, 13, .45, mask='radial-gradient(circle at 0% 100%, #000 0%, transparent 76%)')}
<div class="halo"></div>{GRANO}<div class="vineta"></div>
<p class="etiqueta">Tres caminos, la misma pared</p>
<h1 class="titular">Todos hemos llegado<br><em>al mismo número.</em></h1>
{filas}
<p class="aviso">Son orientaciones y recomendaciones. No una prohibición.</p>
{badge()}
""")

print("5 piezas generadas")
