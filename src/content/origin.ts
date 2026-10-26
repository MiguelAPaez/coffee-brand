export const ORIGIN: {
  sections: readonly { heading: string; body: string[] }[]
  facts: readonly { label: string; value: string }[]
} = {
  facts: [
    { label: 'Altitude', value: '1,600 m' },
    { label: 'Region', value: 'Salento, Quindío' },
    { label: 'Varieties', value: 'Caturra, Castillo' },
    { label: 'Harvest', value: 'October–December' },
    { label: 'Picking', value: 'By hand' },
  ],
  sections: [
    {
      heading: 'A farm above the cloud line',
      body: [
        'Finca La Cumbre climbs a steep ridge in the Quindío highlands. Mornings begin in cloud, and the coffee grows slowly in cool air, which is where its sweetness comes from.',
        'The same families have tended these slopes for generations. They know which rows ripen first and which corner of the farm holds the morning mist longest.',
      ],
    },
    {
      heading: 'Soil, shade and patience',
      body: [
        'Volcanic soil feeds the trees, and tall shade trees soften the sun. Nothing here is hurried, and the harvest arrives when the fruit is ready, not before.',
      ],
    },
    {
      heading: 'From one hillside to one cup',
      body: [
        'We buy directly from the farm and keep each lot separate, so the coffee in your cup can be traced back to a single hillside.',
      ],
    },
  ],
}
