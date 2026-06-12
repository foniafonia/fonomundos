interface Props {
  children?: string
  detail?: string
}

export default function CommunityBadge({
  children = 'Ya cambiado por la comunidad',
  detail = '12/06/2026',
}: Props) {
  return (
    <div
      className="community-badge mano inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-black"
      role="note"
      aria-label={`${children}. ${detail}`}
    >
      <span className="community-badge__spark" aria-hidden="true">✨</span>
      <span className="community-badge__copy">
        <span>{children}</span>
        <small>{detail}</small>
      </span>
    </div>
  )
}
