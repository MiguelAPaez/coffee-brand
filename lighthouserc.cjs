// LHCI_MODE=ci (set in .github/workflows/ci.yml) downgrades the performance-sensitive assertions to warnings:
// shared runners are too noisy to gate on. Accessibility stays blocking everywhere.
const perfLevel = process.env.LHCI_MODE === 'ci' ? 'warn' : 'error'

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview -- --port 4173 --strictPort',
      startServerReadyPattern: 'Local',
      // /cart rather than /checkout: an unseeded /checkout redirects to /cart, so it would measure /cart anyway.
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/roasts',
        'http://localhost:4173/roasts/la-cumbre',
        'http://localhost:4173/cart',
      ],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:performance': [perfLevel, { minScore: 0.95 }],
        'categories:best-practices': [perfLevel, { minScore: 0.95 }],
        'cumulative-layout-shift': [perfLevel, { maxNumericValue: 0.05 }],
      },
    },
    // Keep reports local; the default public storage would upload them.
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
}
