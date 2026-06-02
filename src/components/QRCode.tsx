/** QR generado via API pública (sin librería). */
interface Props { url: string; size?: number }

export default function QRCode({ url, size = 160 }: Props) {
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=fdf3e3&color=4a3f35`
  return (
    <img src={src} alt={`QR para ${url}`} width={size} height={size}
      className="crayon" style={{ background: 'var(--papel)' }} />
  )
}
