/** Sanitiza telefone BR e monta URL do WhatsApp. */
export function sanitizarTelefoneBr(telefone?: string | null): string | null {
  if (!telefone) return null
  let digitos = telefone.replace(/\D+/g, '')
  if (!digitos) return null
  if (digitos.startsWith('0')) {
    digitos = digitos.replace(/^0+/, '')
  }
  if (!digitos.startsWith('55')) {
    digitos = `55${digitos}`
  }
  if (digitos.length < 12) return null
  return digitos
}

export function urlWhatsApp(telefone?: string | null, mensagem?: string): string | null {
  const digitos = sanitizarTelefoneBr(telefone)
  if (!digitos) return null
  const base = `https://wa.me/${digitos}`
  if (!mensagem) return base
  return `${base}?text=${encodeURIComponent(mensagem)}`
}

export function abrirWhatsApp(telefone?: string | null, mensagem?: string) {
  const url = urlWhatsApp(telefone, mensagem)
  if (!url) return false
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}
