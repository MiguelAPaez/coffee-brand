import { Link } from 'wouter'
import { PageHero } from '@/components/PageHero'
import { SiteLayout } from '@/components/SiteLayout'
import { usePageMeta } from '@/hooks/usePageMeta'

export function NotFound() {
  usePageMeta('Not found')

  return (
    <SiteLayout>
      <PageHero
        eyebrow="404"
        title="This trail ends here"
        lede="The page you followed does not exist, or the path has moved on."
      />
      <div className="px-6 py-16 sm:px-8 md:px-12">
        <Link href="/" className="text-sm uppercase tracking-[0.3em] underline underline-offset-8">
          Back to the descent
        </Link>
      </div>
    </SiteLayout>
  )
}
