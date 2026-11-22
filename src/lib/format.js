export function formatPrice(price) {
  return Number(price) === 0 ? 'FREE' : `$${Number(price).toFixed(2)}`
}

export function formatDate(value) {
  if (!value) return '—'
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return value || '—'
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}
