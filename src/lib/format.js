export function formatPrice(price) {
  return Number(price) === 0 ? 'FREE' : `$${Number(price).toFixed(2)}`
}

export function formatDate(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  const monthName = new Date(year, month - 1, day).toLocaleString('en', { month: 'short' })
  return `${monthName} ${day}, ${year}`
}
