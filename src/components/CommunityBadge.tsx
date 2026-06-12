interface Props {
  children?: string
  detail?: string
}

export default function CommunityBadge({
  children = 'Modificado por la comunidad',
  detail = '12/06/2026',
}: Props) {
  return (
    <div
      className="community-badge crayon mano inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-black"
      style={{ background: 'linear-gradient(135deg, var(--cera-verde), var(--cera-azul))', color: '#fff' }}
    >
      <span aria-hidden="true">✨</span>
      <span>{children}</span>
      <span className="opacity-80">· {detail}</span>
    </div>
  )
}
