interface JoystickState {
  up: boolean; down: boolean; left: boolean; right: boolean
}

interface Props {
  onChange: (state: JoystickState) => void
}

const BTN = 'select-none touch-none flex items-center justify-center rounded-full text-2xl active:scale-90 transition-transform'
const BASE = { width: 56, height: 56, border: '3px solid rgba(74,63,53,0.4)', background: 'rgba(255,255,255,0.7)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }

export default function VirtualJoystick({ onChange }: Props) {
  const state = { up: false, down: false, left: false, right: false }

  function press(dir: keyof JoystickState) {
    state[dir] = true
    onChange({ ...state })
  }
  function release(dir: keyof JoystickState) {
    state[dir] = false
    onChange({ ...state })
  }

  function btn(dir: keyof JoystickState, emoji: string) {
    return (
      <button
        className={BTN}
        style={BASE}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); press(dir) }}
        onPointerUp={() => release(dir)}
        onPointerLeave={() => release(dir)}
        aria-label={dir}
      >
        {emoji}
      </button>
    )
  }

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: '56px 56px 56px', gridTemplateRows: '56px 56px 56px' }}>
      <div />{btn('up', '⬆️')}<div />
      {btn('left', '⬅️')}<div style={{ ...BASE, borderRadius: '50%', opacity: 0.3 }} />{btn('right', '➡️')}
      <div />{btn('down', '⬇️')}<div />
    </div>
  )
}
