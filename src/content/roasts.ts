// Must not import from '@/config': config derives SPECS/FLAVORS from here.
export type Size = '250g' | '1kg'
export type Grind = 'Whole bean' | 'Filter' | 'Espresso'
export type Roast = {
  slug: string
  name: string
  region: string
  level: 'Light' | 'Medium' | 'Dark'
  summary: string
  body: string[]
  specs: readonly { label: string; value: string }[]
  flavors: readonly { name: string; note: string }[]
  price: Record<Size, number> // cents
}

export const SIZES: readonly Size[] = ['250g', '1kg']
export const GRINDS: readonly Grind[] = ['Whole bean', 'Filter', 'Espresso']

export const ROASTS: readonly Roast[] = [
  {
    slug: 'la-cumbre',
    name: 'La Cumbre',
    region: 'Quindío, Colombia',
    level: 'Medium',
    summary: 'Our flagship: slow-grown Caturra with a round, panela sweetness and a clean finish.',
    body: [
      'La Cumbre comes from the highest terraces we work with, where cool nights keep the cherry on the branch a little longer. The fruit is picked by hand, ripe and dark, and washed to keep the cup clear.',
      'Roasted to the middle, it stays sweet without losing its brightness. Pour it slowly and let it cool a minute.',
    ],
    specs: [
      { label: 'Altitude', value: '1,600 m' },
      { label: 'Variety', value: 'Caturra' },
      { label: 'Process', value: 'Washed' },
    ],
    flavors: [
      { name: 'Panela', note: 'Deep, round sweetness' },
      { name: 'Red berries', note: 'Bright, juicy acidity' },
      { name: 'Cacao nib', note: 'A long, dry finish' },
    ],
    price: { '250g': 1800, '1kg': 6200 },
  },
  {
    slug: 'niebla',
    name: 'Niebla',
    region: 'Quindío, Colombia',
    level: 'Light',
    summary: 'A light, honey-processed Castillo from the cloud line, soft and floral.',
    body: [
      'Niebla grows where the morning mist sits on the slopes until nearly noon. The cherries dry slowly with some of their fruit left on, which gives the cup its gentle sweetness.',
      'We roast it light and quiet. It is at its best as a filter coffee, a little cooler than you would expect.',
    ],
    specs: [
      { label: 'Altitude', value: '1,850 m' },
      { label: 'Variety', value: 'Castillo' },
      { label: 'Process', value: 'Honey' },
    ],
    flavors: [
      { name: 'Orange blossom', note: 'Soft and floral' },
      { name: 'Honey', note: 'Light, lingering sweetness' },
      { name: 'Stone fruit', note: 'Ripe and gently tart' },
    ],
    price: { '250g': 2000, '1kg': 6800 },
  },
  {
    slug: 'raiz',
    name: 'Raíz',
    region: 'Quindío, Colombia',
    level: 'Dark',
    summary: 'A deep, low-acid Castillo roasted for milk, and for the early hours.',
    body: [
      'Raíz is grown lower on the mountain, at the edge of the old shade trees. The beans are dense and steady, and they take a longer roast without turning bitter.',
      'Expect cocoa and toasted sugar rather than smoke. It holds its shape in milk and under pressure.',
    ],
    specs: [
      { label: 'Altitude', value: '1,450 m' },
      { label: 'Variety', value: 'Castillo' },
      { label: 'Process', value: 'Washed' },
    ],
    flavors: [
      { name: 'Dark chocolate', note: 'Bittersweet and smooth' },
      { name: 'Toasted almond', note: 'Warm, dry sweetness' },
      { name: 'Brown sugar', note: 'A soft, round finish' },
    ],
    price: { '250g': 1900, '1kg': 6400 },
  },
  {
    slug: 'mirador',
    name: 'Mirador',
    region: 'Quindío, Colombia',
    level: 'Light',
    summary: 'A small lot of Pink Bourbon and Gesha, naturally processed and bright to the last sip.',
    body: [
      'Mirador is picked from a single ridge with a long view of the valley. The cherries are dried whole, turned by hand, and cupped before anything else leaves the farm.',
      'It is the most delicate coffee we sell, and the rarest. Brew it gently and give it your attention.',
    ],
    specs: [
      { label: 'Altitude', value: '1,900 m' },
      { label: 'Variety', value: 'Pink Bourbon, Gesha' },
      { label: 'Process', value: 'Natural' },
    ],
    flavors: [
      { name: 'Jasmine', note: 'Perfumed and airy' },
      { name: 'Peach', note: 'Juicy, sweet acidity' },
      { name: 'Bergamot', note: 'A clean, tea-like finish' },
    ],
    price: { '250g': 2400, '1kg': 8200 },
  },
]

export function getRoast(slug: string): Roast | undefined {
  return ROASTS.find((r) => r.slug === slug)
}
