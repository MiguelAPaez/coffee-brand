import { Link, useParams } from 'wouter'
import { PageHero } from '@/components/PageHero'
import { Reveal } from '@/components/Reveal'
import { SiteLayout } from '@/components/SiteLayout'
import { Stagger } from '@/components/Stagger'
import { getArticle, type Article as ArticleData } from '@/content/journal'
import { usePageMeta } from '@/hooks/usePageMeta'
import { formatDate } from '@/lib/format'
import { NotFound } from '@/pages/NotFound'

function ArticleView({ article }: { article: ArticleData }) {
  usePageMeta(article.title)
  return (
    <SiteLayout>
      <PageHero
        eyebrow={`${formatDate(article.date)} · ${article.readMins} min read`}
        title={article.title}
        lede={article.excerpt}
      />
      <div className="bg-scene px-6 py-24 text-cream sm:px-8 md:px-12 lg:py-32">
        <Reveal className="mx-auto max-w-6xl">
          <div className="max-w-[65ch]">
            {article.body.map((p, i) => (
              <Stagger key={p} index={i} as="p" className="mb-6 text-base leading-relaxed text-cream/80">
                {p}
              </Stagger>
            ))}
          </div>
          <Link
            href="/journal"
            className="mt-12 inline-block text-xs uppercase tracking-[0.3em] underline underline-offset-8"
          >
            Back to Journal
          </Link>
        </Reveal>
      </div>
    </SiteLayout>
  )
}

export function Article() {
  const { slug } = useParams<{ slug: string }>()
  const article = getArticle(slug)
  return article ? <ArticleView article={article} /> : <NotFound />
}
