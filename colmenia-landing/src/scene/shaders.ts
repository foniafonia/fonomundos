/**
 * Dirección de color, en una frase:
 *   estructura fría (la máquina) + vida cálida (el criterio humano).
 *
 * La retícula es cian/acero. Las siete celdas vivas son ámbar. El contraste
 * frío/cálido es lo que hace que la escena no parezca un fondo de pantalla
 * genérico de IA, y además dice lo que el proyecto defiende: la IA es la
 * estructura, lo humano es lo que está encendido dentro.
 */

export const COLORS = {
  deep: [0.014, 0.034, 0.056],
  cold: [0.40, 0.78, 0.98],
  coldDim: [0.07, 0.19, 0.30],
  warm: [1.0, 0.62, 0.18],
  warmCore: [1.0, 0.90, 0.66],
  flash: [0.82, 0.96, 1.0],
} as const

/**
 * Luz clave. Sin una dirección de luz la esfera no tiene volumen: todas las
 * celdas emiten lo mismo y el resultado es una pelota de golf. Viene de
 * arriba-izquierda-delante, que es donde el ojo espera la luz.
 */
export const KEY_LIGHT = [-0.52, 0.62, 0.58] as const

const COMMON = /* glsl */ `
  float cubicOut(float t){ float f = t - 1.0; return f*f*f + 1.0; }
  float hash11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
`

/* ------------------------------------------------------------------ celdas */

export const cellVertex = /* glsl */ `
  attribute float aCellId;
  attribute float aRim;
  attribute float aSeed;
  attribute float aWave;
  attribute float aLive;

  uniform float uTime;
  uniform float uReveal;
  uniform float uRadius;
  uniform float uHoverId;
  uniform vec3  uHoverDir;
  uniform float uHoverAmt;

  varying float vRim;
  varying float vLive;
  varying float vSeed;
  varying float vHover;
  varying float vProx;
  varying float vFlash;
  varying float vAppear;
  varying vec3  vNormalW;
  varying vec3  vViewDir;

  ${COMMON}

  void main() {
    // Entrada radial: cada celda nace cuando el frente de onda la alcanza.
    float appear = smoothstep(aWave, aWave + 0.10, uReveal);
    float flash  = appear * (1.0 - appear) * 4.0;

    float hover = 1.0 - clamp(abs(aCellId - uHoverId), 0.0, 1.0);
    float prox  = smoothstep(0.935, 1.0, dot(normal, uHoverDir)) * uHoverAmt;

    // Respiración: solo las celdas vivas, cada una con su desfase.
    float breathe = aLive * (0.5 + 0.5 * sin(uTime * 0.7 + aSeed * 6.2831));

    vec3 center = normal * uRadius * 1.004;
    vec3 offset = position - center;

    float scale = cubicOut(appear) * (1.0 + hover * 0.10 * uHoverAmt + prox * 0.03);
    float lift  = (hover * 0.16 * uHoverAmt + breathe * 0.02 + flash * 0.10) * uRadius * 0.06;

    vec3 p = center + offset * scale + normal * lift;

    vec4 world = modelMatrix * vec4(p, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - world.xyz);

    vRim    = aRim;
    vLive   = aLive;
    vSeed   = aSeed;
    vHover  = hover * uHoverAmt;
    vProx   = prox;
    vFlash  = flash;
    vAppear = appear;

    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

export const cellFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3  uLight;
  uniform vec3  uDeep;
  uniform vec3  uCold;
  uniform vec3  uWarm;
  uniform vec3  uWarmCore;
  uniform vec3  uFlash;

  varying float vRim;
  varying float vLive;
  varying float vSeed;
  varying float vHover;
  varying float vProx;
  varying float vFlash;
  varying float vAppear;
  varying vec3  vNormalW;
  varying vec3  vViewDir;

  ${COMMON}

  void main() {
    if (vAppear <= 0.001) discard;

    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    float nv = dot(N, V);

    // Cuánto mira esta celda hacia cámara. Firmado a propósito: la cara
    // trasera queda casi apagada y se intuye a través del cristal, que es
    // lo que hace que esto parezca un cuerpo y no una pelota.
    float front = smoothstep(-0.30, 0.34, nv);

    // Silueta: el anillo de luz del borde de la esfera.
    float limb = pow(1.0 - clamp(nv, 0.0, 1.0), 3.2);

    // Luz clave. Da un lado iluminado y otro en sombra.
    float key = clamp(dot(N, uLight), 0.0, 1.0);
    float fill = 0.10 + 0.90 * pow(key, 1.4);

    // Filo fino en el borde de la celda, no un degradado gordo: el interior
    // es cristal oscuro, la luz corre por las juntas.
    float rim = pow(vRim, 5.0);

    vec3 col = uDeep * (0.35 + 0.85 * fill);
    col += uCold * rim  * (0.18 + 0.75 * fill);
    col += uCold * limb * 0.45 * front;

    // Racimos vivos: brasa ámbar que respira.
    //
    // Aquí el degradado se invierte respecto a las celdas muertas. La celda
    // apagada es cristal con el filo iluminado; la viva está encendida por
    // dentro, así que brilla en el centro y se apaga hacia el borde. Sin esa
    // inversión las siete celdas parecen pegatinas amarillas pegadas encima.
    float soft = pow(1.0 - vRim, 1.5);
    float breathe = 0.55 + 0.45 * sin(uTime * 0.62 + vSeed * 6.2831);
    float ember = vLive * (0.42 + 0.58 * breathe) * soft;
    float core = pow(vLive, 3.0) * (0.5 + 0.5 * breathe) * soft;

    col = mix(col, uWarm, clamp(ember * 1.05, 0.0, 1.0) * front);
    col += uWarmCore * core * 0.75 * front;

    // Reacción al puntero.
    col += uCold * vProx * 0.40;
    col = mix(col, uWarmCore, vHover * 0.75);

    // Chispa del nacimiento.
    col += uFlash * vFlash * 1.1;

    // Muy transparente a propósito: si la cara cercana es opaca, la esfera
    // se convierte en una superficie. Viendo la retícula del fondo a través
    // del cristal es cuando empieza a leerse como un cuerpo.
    float alpha =
        0.018 + 0.030 * fill
      + rim   * 0.26
      + limb  * 0.22
      + ember * 0.40
      + core  * 0.40
      + vHover * 0.35
      + vProx  * 0.12
      + vFlash * 0.45;

    alpha *= mix(0.26, 1.0, front) * vAppear;

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`

/* ------------------------------------------------------------------- aristas */

export const edgeVertex = /* glsl */ `
  attribute float aCellId;
  attribute float aSeed;
  attribute float aWave;
  attribute float aLive;

  uniform float uTime;
  uniform float uReveal;
  uniform float uRadius;
  uniform float uHoverId;
  uniform vec3  uHoverDir;
  uniform float uHoverAmt;

  varying float vLive;
  varying float vSeed;
  varying float vHover;
  varying float vProx;
  varying float vFlash;
  varying float vAppear;
  varying vec3  vNormalW;
  varying vec3  vViewDir;

  ${COMMON}

  void main() {
    float appear = smoothstep(aWave, aWave + 0.10, uReveal);
    float flash  = appear * (1.0 - appear) * 4.0;

    vec3 n = normalize(position);
    float hover = 1.0 - clamp(abs(aCellId - uHoverId), 0.0, 1.0);
    float prox  = smoothstep(0.935, 1.0, dot(n, uHoverDir)) * uHoverAmt;

    vec3 center = n * uRadius * 1.006;
    vec3 offset = position - center;
    float scale = cubicOut(appear) * (1.0 + hover * 0.10 * uHoverAmt);
    float lift  = (hover * 0.16 * uHoverAmt + flash * 0.10) * uRadius * 0.06;

    vec3 p = center + offset * scale + n * lift;
    vec4 world = modelMatrix * vec4(p, 1.0);

    vNormalW = normalize(mat3(modelMatrix) * n);
    vViewDir = normalize(cameraPosition - world.xyz);

    vLive   = aLive;
    vSeed   = aSeed;
    vHover  = hover * uHoverAmt;
    vProx   = prox;
    vFlash  = flash;
    vAppear = appear;

    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

export const edgeFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3  uLight;
  uniform vec3  uCold;
  uniform vec3  uColdDim;
  uniform vec3  uWarm;
  uniform vec3  uWarmCore;
  uniform vec3  uFlash;

  varying float vLive;
  varying float vSeed;
  varying float vHover;
  varying float vProx;
  varying float vFlash;
  varying float vAppear;
  varying vec3  vNormalW;
  varying vec3  vViewDir;

  void main() {
    if (vAppear <= 0.001) discard;

    vec3 N = normalize(vNormalW);
    float nv = dot(N, normalize(vViewDir));

    // La cara oculta de la colmena se insinúa, no compite. La caída es
    // agresiva a propósito: es lo que separa un cuerpo de una retícula.
    float front = smoothstep(-0.28, 0.30, nv);
    float key = clamp(dot(N, uLight), 0.0, 1.0);
    float fill = 0.14 + 0.86 * pow(key, 1.3);

    float breathe = 0.55 + 0.45 * sin(uTime * 0.62 + vSeed * 6.2831);

    vec3 col = mix(uColdDim, uCold, fill);
    col = mix(col, uWarm, vLive * (0.60 + 0.40 * breathe));
    col += uCold * vProx * 0.55;
    col += uWarmCore * vHover * 0.9;
    col += uFlash * vFlash * 1.4;

    float alpha = (0.09 + 0.30 * fill + vLive * 0.55 * breathe + vHover * 0.6 + vProx * 0.28)
                * mix(0.10, 1.0, front) * vAppear;

    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`

/* -------------------------------------------------------------------- pulsos */

export const pulseVertex = /* glsl */ `
  attribute float aArcId;

  uniform float uReveal;

  varying float vT;
  varying float vArcId;
  varying vec3  vNormalW;
  varying vec3  vViewDir;

  void main() {
    // TubeGeometry deja el recorrido longitudinal en uv.x: 0 en el origen
    // del arco, 1 en el destino. Es el parámetro que mueve el pulso.
    vT = uv.x;
    vArcId = aArcId;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normalize(position));
    vViewDir = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

export const pulseFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uReveal;
  uniform vec3  uCold;
  uniform vec3  uWarm;

  varying float vT;
  varying float vArcId;
  varying vec3  vNormalW;
  varying vec3  vViewDir;

  float hash11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }

  void main() {
    float seed  = hash11(vArcId);
    float speed = 0.16 + seed * 0.12;
    float phase = seed * 7.0;

    // Ciclo por arco: el pulso viaja, luego el arco descansa.
    float cycle = fract(uTime * speed + phase);
    float alive = smoothstep(0.0, 0.08, cycle) * (1.0 - smoothstep(0.62, 0.78, cycle));
    float front = cycle / 0.70;

    // Cabeza brillante + estela corta detrás.
    // Cabeza corta y estela corta. Con la cabeza larga esto deja de ser un
    // pulso que viaja y se convierte en una raya encendida de punta a punta,
    // que es exactamente lo que parece un destello de lente mal puesto.
    float d = vT - front;
    float glow = exp(-pow(d * 30.0, 2.0));
    float trail = exp(-pow(max(d, 0.0) * 6.0, 2.0)) * 0.40;

    float facing = clamp(dot(normalize(vNormalW), normalize(vViewDir)), 0.0, 1.0);
    float depth = pow(smoothstep(-0.1, 0.5, facing), 1.5);

    // Los extremos se desvanecen: el arco no debe "empezar" con un corte.
    float ends = smoothstep(0.0, 0.10, vT) * (1.0 - smoothstep(0.90, 1.0, vT));

    float i = (glow + trail) * alive * depth * ends * smoothstep(0.55, 1.0, uReveal) * 1.25;
    vec3 col = mix(uWarm, uCold, sin(vT * 3.14159));

    gl_FragColor = vec4(col * i, i * 0.9);
    #include <colorspace_fragment>
  }
`

/* ---------------------------------------------------------------- partículas */

export const dustVertex = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;

  uniform float uTime;
  uniform float uReveal;
  uniform float uPixelRatio;

  varying float vSeed;
  varying float vFade;

  void main() {
    vec3 p = position;

    // Deriva lenta: la escena respira, no se agita.
    p.x += sin(uTime * 0.05 + aSeed * 6.2831) * 0.35;
    p.y += cos(uTime * 0.04 + aSeed * 4.1) * 0.30;
    p.z += sin(uTime * 0.03 + aSeed * 2.7) * 0.25;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = -mv.z;

    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (34.0 / max(dist, 0.001));

    vSeed = aSeed;
    // Las partículas muy cercanas se difuminan en vez de convertirse en
    // discos: es lo que produce la sensación de profundidad de campo.
    vFade = smoothstep(0.05, 0.6, uReveal)
          * smoothstep(46.0, 16.0, dist)
          * smoothstep(4.5, 9.0, dist);
  }
`

export const dustFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3  uCold;

  varying float vSeed;
  varying float vFade;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    float soft = smoothstep(0.5, 0.0, d);
    float twinkle = 0.5 + 0.5 * sin(uTime * 0.55 + vSeed * 12.0);

    float a = pow(soft, 2.6) * vFade * (0.35 + 0.65 * twinkle) * 1.6;
    gl_FragColor = vec4(uCold * (0.55 + 0.55 * twinkle), a);
    #include <colorspace_fragment>
  }
`
