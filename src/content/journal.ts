export type Article = {
  slug: string
  title: string
  date: string // ISO
  readMins: number
  excerpt: string
  body: string[]
}

// Newest first.
export const ARTICLES: readonly Article[] = [
  {
    slug: 'the-harvest-begins',
    title: 'The harvest begins',
    date: '2026-10-12',
    readMins: 4,
    excerpt: 'The first red cherries of the season come down from the high rows, and the whole farm changes pace.',
    body: [
      'Every October the mountain wakes up differently. The cherries on the upper rows turn from green to a deep, glossy red, and the pickers start before the mist has lifted.',
      'We pick by hand, and we pick again. A tree is never stripped in one pass. Pickers return every ten days or so, taking only what is ripe, so each lot is sweeter and more even than a single sweep could ever give.',
      'By noon the baskets are weighed and the cherries are sorted in cold water. The ones that float go to the side. The ones that sink go to the mill, and from there to the drying beds.',
      'It is long, careful work, and it is the reason a cup from La Cumbre tastes the way it does.',
    ],
  },
  {
    slug: 'why-we-wash-our-coffee',
    title: 'Why we wash our coffee',
    date: '2026-09-14',
    readMins: 5,
    excerpt:
      'Washed process is slower and quieter than the alternatives. It is also how we keep the mountain in the cup.',
    body: [
      'After picking, the fruit has to come off the seed. There are several ways to do it, and each one leaves its own fingerprint on the coffee.',
      'We wash. The cherries are pulped, then rest in clean spring water while the sugars on the seed ferment away. Nothing sweet is left behind to cloud the flavor.',
      'What remains is clarity: bright acidity, clean fruit, a finish that stays a while. You taste the altitude and the variety, not the process.',
      'It uses more water and more patience than other methods, so we recycle every drop through settling ponds before it returns to the stream.',
    ],
  },
  {
    slug: 'brewing-at-home',
    title: 'Brewing at home, without the fuss',
    date: '2026-08-20',
    readMins: 6,
    excerpt: 'A scale, fresh water and a little patience. That is nearly everything you need for a good cup.',
    body: [
      'You do not need special gear. A scale, a kettle and a simple dripper will take you further than an expensive machine used carelessly.',
      'Start with fifteen grams of coffee to every 250 grams of water. Grind just before brewing, medium and a little coarser than table salt.',
      'Pour a small amount of water first and let the grounds bloom for thirty seconds. Then pour in slow circles until you reach your weight. The whole brew should finish in about three minutes.',
      'If it tastes sharp, grind finer. If it tastes bitter, grind coarser. Change one thing at a time and trust your tongue.',
    ],
  },
  {
    slug: 'the-people-of-la-cumbre',
    title: 'The people of La Cumbre',
    date: '2026-07-03',
    readMins: 5,
    excerpt: 'Behind every bag is a handful of families who have worked this ridge for generations.',
    body: [
      'Coffee is a crop of patience, and the families of La Cumbre have plenty of it. Some have tended the same rows since before the road was paved.',
      'They know which slope warms first, which corner holds the mist, and which trees need a little extra care. None of this is written down. It is handed from parent to child, row by row.',
      'We pay above the local market, and we share the results of every cupping with the people who grew the lots. When a coffee scores well, they are the first to hear.',
      'When you open a bag of ALTURA, you are tasting their year.',
    ],
  },
]

export function getArticle(slug: string | undefined): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug)
}
