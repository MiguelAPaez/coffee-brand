const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatPrice(cents: number): string {
  return usd.format(cents / 100)
}

// UTC so a date-only ISO string never slips a day in negative-offset timezones.
const longDate = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export function formatDate(iso: string): string {
  return longDate.format(new Date(iso))
}
