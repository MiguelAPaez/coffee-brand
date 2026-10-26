export type Errors<T> = Partial<Record<keyof T, string>>
export type ContactValues = { name: string; email: string; message: string }

export type ShippingValues = {
  name: string
  email: string
  address: string
  city: string
  postcode: string
  country: string
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

export function validateContact(v: ContactValues): Errors<ContactValues> {
  const errors: Errors<ContactValues> = {}
  if (!v.name.trim()) errors.name = 'Please tell us your name.'
  if (!isEmail(v.email.trim())) errors.email = 'Enter a valid email address.'
  if (v.message.trim().length < 10) errors.message = 'Write a message of at least 10 characters.'
  return errors
}

export function validateShipping(v: ShippingValues): Errors<ShippingValues> {
  const errors: Errors<ShippingValues> = {}
  if (!v.name.trim()) errors.name = 'Please tell us your name.'
  if (!isEmail(v.email.trim())) errors.email = 'Enter a valid email address.'
  if (!v.address.trim()) errors.address = 'Enter your street address.'
  if (!v.city.trim()) errors.city = 'Enter your city.'
  if (!v.postcode.trim()) errors.postcode = 'Enter your postal code.'
  if (!v.country) errors.country = 'Choose your country.'
  return errors
}
