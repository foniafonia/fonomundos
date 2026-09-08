import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Atmósfera de fondo.
 *
 * Un plano a pantalla completa detrás de todo. No es decoración: sin él la
 * esfera flota sobre negro plano y parece un render recortado. Con él hay
 * un espacio donde estar. La nebulosa se mueve lentísimo para que el fondo
 * nunca esté del todo quieto.
 */
export function Backdrop({ reveal }: { reveal: React.RefObject<number> }) {
  const mat = useRef<THREE.ShaderMaterial>(null!)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        depthTest: false,
        depthWrite: false,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position.xy * 2.0, 0.999, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          uniform float uTime;
          uniform float uReveal;
          uniform vec2  uRes;
          varying vec2 vUv;

          float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

          void main() {
            vec2 uv = vUv - 0.5;
            uv.x *= uRes.x / max(uRes.y, 1.0);
            float r = length(uv);

            // Base: azul de noche, no negro puro. El negro puro mata el bloom.
            vec3 col = vec3(0.0035, 0.0065, 0.0125);

            // Halo trasero: la esfera necesita un fondo del que despegarse,
            // pero muy poco. En cuanto se pasa, esto deja de ser espacio
            // profundo y se convierte en un fondo de estudio.
            float halo = exp(-pow(r * 3.1, 2.0));
            col += vec3(0.016, 0.040, 0.062) * halo * (0.3 + 0.7 * uReveal);

            // Dos manchas frías casi imperceptibles, a distinta velocidad.
            float a = exp(-pow(length(uv - vec2(-0.62 + sin(uTime * 0.021) * 0.06, 0.34)) * 1.4, 2.0));
            float b = exp(-pow(length(uv - vec2(0.70, -0.40 + cos(uTime * 0.017) * 0.05)) * 1.6, 2.0));
            col += vec3(0.008, 0.019, 0.032) * a;
            col += vec3(0.012, 0.011, 0.026) * b;

            // Caída hacia las esquinas: encuadra sin necesidad de viñeta dura.
            col *= 1.0 - smoothstep(0.18, 0.92, r) * 0.92;

            // Dither: sin esto los degradados oscuros se ven a bandas.
            col += (hash(gl_FragCoord.xy) - 0.5) * 0.0035;

            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }
        `,
        uniforms: {
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uRes: { value: new THREE.Vector2(1, 1) },
        },
      }),
    []
  )

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uReveal.value = reveal.current
    material.uniforms.uRes.value.set(state.size.width, state.size.height)
  })

  return (
    <mesh ref={mat as never} frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
