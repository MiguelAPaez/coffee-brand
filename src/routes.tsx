import { lazy, Suspense } from 'react'
import { Route, Router, Switch } from 'wouter'
import { Home } from '@/pages/Home'
import { NotFound } from '@/pages/NotFound'
import { useScrollRestoration } from '@/lib/scrollMemory'

// Every page except Home is split out of the entry chunk.
const Origin = lazy(() => import('@/pages/Origin').then((m) => ({ default: m.Origin })))
const Process = lazy(() => import('@/pages/Process').then((m) => ({ default: m.Process })))
const Roasts = lazy(() => import('@/pages/Roasts').then((m) => ({ default: m.Roasts })))
const RoastDetail = lazy(() => import('@/pages/RoastDetail').then((m) => ({ default: m.RoastDetail })))
const Visit = lazy(() => import('@/pages/Visit').then((m) => ({ default: m.Visit })))
const Journal = lazy(() => import('@/pages/Journal').then((m) => ({ default: m.Journal })))
const Article = lazy(() => import('@/pages/Article').then((m) => ({ default: m.Article })))
const Cart = lazy(() => import('@/pages/Cart').then((m) => ({ default: m.Cart })))
const Checkout = lazy(() => import('@/pages/Checkout').then((m) => ({ default: m.Checkout })))
const Confirmed = lazy(() => import('@/pages/Confirmed').then((m) => ({ default: m.Confirmed })))

const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '')

export function AppRoutes() {
  useScrollRestoration()
  return (
    <Router base={BASE_PATH}>
    <Suspense fallback={null}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/origin" component={Origin} />
          <Route path="/process" component={Process} />
          <Route path="/roasts" component={Roasts} />
          <Route path="/roasts/:slug" component={RoastDetail} />
          <Route path="/visit" component={Visit} />
          <Route path="/journal" component={Journal} />
          <Route path="/journal/:slug" component={Article} />
          <Route path="/cart" component={Cart} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/checkout/confirmed" component={Confirmed} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Router>
  )
}
