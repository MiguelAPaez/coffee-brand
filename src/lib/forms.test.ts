import { describe, expect, it } from 'vitest'
import { isEmail, validateContact, validateShipping } from '@/lib/forms'

const valid = { name: 'Ana', email: 'ana@example.com', message: 'Hello, we would like a tour.' }

describe('validateContact', () => {
  it('reports all three errors for empty values', () => {
    expect(validateContact({ name: '', email: '', message: '' })).toEqual({
      name: 'Please tell us your name.',
      email: 'Enter a valid email address.',
      message: 'Write a message of at least 10 characters.',
    })
  })
  it('rejects whitespace-only name and short trimmed message', () => {
    const e = validateContact({ ...valid, name: '   ', message: '  short   ' })
    expect(e.name).toBe('Please tell us your name.')
    expect(e.message).toBe('Write a message of at least 10 characters.')
  })
  it('rejects an email without a dot domain', () => {
    expect(validateContact({ ...valid, email: 'a@b' }).email).toBe('Enter a valid email address.')
  })
  it('returns no errors for valid values', () => {
    expect(validateContact(valid)).toEqual({})
  })
})

describe('isEmail', () => {
  it('accepts and rejects pragmatically', () => {
    expect(isEmail('a@b.co')).toBe(true)
    expect(isEmail('a@b')).toBe(false)
    expect(isEmail('a b@c.de')).toBe(false)
  })
})

describe('validateShipping', () => {
  const ship = {
    name: 'Ana',
    email: 'ana@example.com',
    address: '1 Calle Real',
    city: 'Salento',
    postcode: '630001',
    country: 'Colombia',
  }
  it('reports all six errors for empty values', () => {
    expect(validateShipping({ name: '', email: '', address: '', city: '', postcode: '', country: '' })).toEqual({
      name: 'Please tell us your name.',
      email: 'Enter a valid email address.',
      address: 'Enter your street address.',
      city: 'Enter your city.',
      postcode: 'Enter your postal code.',
      country: 'Choose your country.',
    })
  })
  it('rejects a whitespace-only postcode', () => {
    expect(validateShipping({ ...ship, postcode: '   ' }).postcode).toBe('Enter your postal code.')
  })
  it('returns no errors for valid values', () => {
    expect(validateShipping(ship)).toEqual({})
  })
})
