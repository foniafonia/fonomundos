// Personajes de refuerzo positivo de la guía: Pato amarillo y Rana Gustavo.
export function Refuerzo({ visible, mensaje, personaje = 'pato' }: { visible: boolean; mensaje: string; personaje?: 'pato' | 'rana' }) {
  if (!visible) return null
  return (
    <div className="fixed inset-x-0 bottom-6 flex justify-center pointer-events-none z-50">
      <div className="animate-pop flex items-center gap-3 bg-white rounded-full shadow-xl border-2 border-teal-300 px-5 py-3">
        <span className="text-4xl">{personaje === 'pato' ? '🦆' : '🐸'}</span>
        <span className="font-bold text-teal-700">{mensaje}</span>
      </div>
    </div>
  )
}
