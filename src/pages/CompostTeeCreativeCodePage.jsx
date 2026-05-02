import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Leaf, Recycle, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PRODUCT_NAME = 'Compost Graphic Tee';

// Replace these with real URLs when ready.
const PRODUCT_URL = '[PRODUCT_URL]';
const CHECKOUT_URL = '[CHECKOUT_URL]';

// Optional: replace these with real images (torso-only / flat lay / no faces).
const IMAGES = {
  hero: '[PRODUCT_IMAGE_1]',
  alt1: '[PRODUCT_IMAGE_2]',
  alt2: '[PRODUCT_IMAGE_3]',
  alt3: '[PRODUCT_IMAGE_4]',
  alt4: '[PRODUCT_IMAGE_5]',
};

const cn = (...values) => values.filter(Boolean).join(' ');

const Pill = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur">
    {children}
  </span>
);

const Card = ({ className, children }) => (
  <div className={cn('rounded-2xl border border-border bg-background/80 p-5 shadow-sm backdrop-blur', className)}>
    {children}
  </div>
);

const CtaButton = ({ href, children, variant = 'default', className }) => {
  const isPlaceholder = String(href || '').includes('[');
  const Comp = isPlaceholder ? 'button' : 'a';
  const props = isPlaceholder ? { type: 'button' } : { href };

  return (
    <Button asChild={!isPlaceholder} variant={variant} size="lg" className={cn('h-12 w-full rounded-full', className)} disabled={isPlaceholder}>
      <Comp {...props}>
        <span className="inline-flex items-center justify-center gap-2">
          {children}
          <ArrowRight className="h-4 w-4" />
        </span>
      </Comp>
    </Button>
  );
};

const ImageBox = ({ src, alt, className }) => (
  <div className={cn('overflow-hidden rounded-2xl bg-muted shadow-sm ring-1 ring-border/60', className)}>
    <div className="aspect-[4/5] w-full">
      <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
    </div>
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 className="text-2xl font-bold text-balance md:text-3xl" style={{ letterSpacing: '-0.02em' }}>
    {children}
  </h2>
);

const IconFeature = ({ icon: Icon, title, description }) => (
  <Card className="p-4 sm:p-5">
    <div className="flex items-start gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  </Card>
);

const FAQItem = ({ q, a }) => (
  <details className="group rounded-2xl border border-border bg-background/80 px-5 py-4 shadow-sm backdrop-blur">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
      <span>{q}</span>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground transition-transform duration-200 group-open:rotate-45">
        +
      </span>
    </summary>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
  </details>
);

export default function CompostTeeCreativeCodePage() {
  const [hideSticky, setHideSticky] = useState(false);

  const benefits = useMemo(() => ([
    {
      icon: Leaf,
      title: 'Nature-inspired design',
      description: 'A clean compost-forward graphic that feels earthy, modern, and easy to wear.',
    },
    {
      icon: Sprout,
      title: 'For gardeners & soil lovers',
      description: 'For the person who gets excited about food scraps turning into future soil.',
    },
    {
      icon: Recycle,
      title: 'Conversation-starting style',
      description: 'A quiet badge of values—simple, confident, and not loud.',
    },
    {
      icon: CheckCircle2,
      title: 'Soft everyday comfort',
      description: 'Lightweight 4.5 oz/yd² feel with comfort-first details like a tear-away label.',
    },
  ]), []);

  const faqs = useMemo(() => ([
    {
      q: 'What is it printed on?',
      a: 'Gildan Softstyle 64000.',
    },
    {
      q: 'What material is the shirt made from?',
      a: 'Solid colors are 100% ring-spun cotton. Heather colors are blended fabrics.',
    },
    {
      q: 'Is it lightweight or heavy?',
      a: 'Lightweight: 4.5 oz/yd² (153 g/m²).',
    },
    {
      q: 'What makes this tee comfortable?',
      a: 'Tear-away label, ribbed knit collar to help retain shape, shoulder tape for stability, and no side seams for a smoother fit.',
    },
    {
      q: 'How do I care for it?',
      a: 'Machine wash cold, tumble dry low, low heat iron if needed. Do not bleach. Do not dry clean.',
    },
    {
      q: 'Is it a good gift?',
      a: 'Yes—especially for gardeners, compost lovers, and anyone who lights up talking scraps, soil, and growing things.',
    },
  ]), []);

  return (
    <>
      <Helmet>
        <title>{`${PRODUCT_NAME} — Offer`}</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <main className="min-h-screen overflow-x-hidden bg-background pb-24">
        <div className="border-b border-border/70 bg-background/80 backdrop-blur">
          <div className="container-custom flex items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-primary">
                <Leaf className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold">AnfaStyles</p>
                <p className="text-xs text-muted-foreground">Offer page (code version)</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/offer/compost-tee-creative">
                <Button variant="outline" size="sm">View image</Button>
              </Link>
              <Link to="/offer/compost-tee">
                <Button variant="outline" size="sm">View landing</Button>
              </Link>
            </div>
          </div>
        </div>

        <section className="py-10 sm:py-14">
          <div className="container-custom">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
              <div className="lg:col-span-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill>New arrival</Pill>
                  <Pill>For compost believers</Pill>
                </div>

                <h1 className="mt-5 text-4xl font-bold text-balance md:text-5xl" style={{ letterSpacing: '-0.03em' }}>
                  Wear your compost pride.
                </h1>

                <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                  Composting isn’t just a habit—it’s part of who you are. This soft graphic tee is for gardeners,
                  soil lovers, and zero-waste folks who believe food scraps are future soil.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <CtaButton href={CHECKOUT_URL}>Shop now</CtaButton>
                  <Button asChild variant="outline" size="lg" className="h-12 w-full rounded-full sm:w-auto">
                    <a href={PRODUCT_URL}>View product</a>
                  </Button>
                </div>

                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  <Card className="p-4">
                    <p className="text-sm font-semibold">Softstyle base</p>
                    <p className="mt-1 text-xs text-muted-foreground">Printed on Gildan Softstyle 64000.</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm font-semibold">Lightweight feel</p>
                    <p className="mt-1 text-xs text-muted-foreground">4.5 oz/yd² (153 g/m²).</p>
                  </Card>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  Note: This page intentionally avoids unverified claims (shipping times/return windows). Add those only if confirmed.
                </p>
              </div>

              <div className="lg:col-span-6">
                <ImageBox
                  src={IMAGES.hero}
                  alt="Compost Graphic Tee hero mockup (no face)"
                  className="rounded-3xl"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <p>Image guidance: torso-only / flat lay / no visible faces.</p>
                  <Link to="/offer/compost-tee">
                    <Button variant="outline" size="sm">Use premium landing</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container-custom">
            <div className="mx-auto max-w-4xl text-center">
              <SectionTitle>Why this tee stands out</SectionTitle>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Clean design, comfort-first details, and an identity that compost people recognize instantly.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((item) => (
                <IconFeature
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container-custom">
            <div className="rounded-3xl border border-border bg-muted/50 p-6 shadow-sm sm:p-8">
              <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-5">
                  <SectionTitle>Tired of tees that feel generic?</SectionTitle>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    This one has a message, personality, and that earthy “compost people get it” energy.
                  </p>
                </div>

                <div className="lg:col-span-7">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <p className="text-sm font-semibold text-muted-foreground">Generic tee</p>
                      <ul className="mt-3 space-y-2 text-sm">
                        <li className="flex items-center gap-2 text-muted-foreground"><span className="text-destructive">✕</span>No message</li>
                        <li className="flex items-center gap-2 text-muted-foreground"><span className="text-destructive">✕</span>No personality</li>
                        <li className="flex items-center gap-2 text-muted-foreground"><span className="text-destructive">✕</span>Forgettable</li>
                      </ul>
                    </Card>
                    <Card>
                      <p className="text-sm font-semibold text-foreground">{PRODUCT_NAME}</p>
                      <ul className="mt-3 space-y-2 text-sm">
                        <li className="flex items-center gap-2 text-muted-foreground"><span className="text-primary">✓</span>Meaningful design</li>
                        <li className="flex items-center gap-2 text-muted-foreground"><span className="text-primary">✓</span>Earthy style</li>
                        <li className="flex items-center gap-2 text-muted-foreground"><span className="text-primary">✓</span>Shows what you stand for</li>
                      </ul>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container-custom">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-6">
                <ImageBox src={IMAGES.alt2} alt="Close-up of Compost design" />
              </div>
              <div className="lg:col-span-6">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">More than a tee</p>
                <SectionTitle>It’s a statement.</SectionTitle>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  From food scraps to future soil—wear the cycle proudly. Stay grounded. Grow something. Waste less.
                  Wear your values.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Card className="p-4">
                    <p className="text-sm font-semibold">Ethically grown US cotton</p>
                    <p className="mt-1 text-xs text-muted-foreground">Blank tee uses ethically grown and harvested US cotton.</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm font-semibold">Oeko‑Tex certified blank</p>
                    <p className="mt-1 text-xs text-muted-foreground">Certified for safety and quality assurance.</p>
                  </Card>
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <CtaButton href={CHECKOUT_URL}>Shop now</CtaButton>
                  <Button asChild variant="outline" size="lg" className="h-12 w-full rounded-full sm:w-auto">
                    <a href={PRODUCT_URL}>See details</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container-custom">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">Gallery</p>
              <SectionTitle>Made for garden days, market runs, everyday wear</SectionTitle>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                Use torso-only lifestyle shots, flat lays, or folded presentations. Keep the design the hero.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ImageBox src={IMAGES.alt1} alt="Lifestyle mockup 1 (no face)" className="rounded-3xl" />
              <ImageBox src={IMAGES.alt3} alt="Lifestyle mockup 2 (no face)" className="rounded-3xl" />
              <ImageBox src={IMAGES.alt4} alt="Lifestyle mockup 3 (no face)" className="rounded-3xl" />
              <Card className="flex flex-col justify-between rounded-3xl p-6">
                <div>
                  <p className="text-sm font-semibold">Gift-ready energy</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    A thoughtful gift for the compost person in your life.
                  </p>
                </div>
                <div className="mt-5">
                  <CtaButton href={CHECKOUT_URL} className="h-11 text-sm">Shop now</CtaButton>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container-custom">
            <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur sm:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">FAQ</p>
                  <SectionTitle>Quick answers</SectionTitle>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    Only based on confirmed product facts.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
                  <CtaButton href={CHECKOUT_URL} className="px-6">Shop now</CtaButton>
                  <Button asChild variant="outline" size="lg" className="h-12 w-full rounded-full">
                    <a href={PRODUCT_URL}>View product</a>
                  </Button>
                </div>
              </div>

              <div className="mt-8 grid gap-3">
                {faqs.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {!hideSticky && (
          <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
            <div className="mx-auto flex w-full max-w-7xl items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{PRODUCT_NAME}</p>
                <p className="truncate text-xs text-muted-foreground">Food scraps are future soil.</p>
              </div>
              <CtaButton href={CHECKOUT_URL} className="h-11 w-auto px-5 text-sm">
                Shop
              </CtaButton>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full"
                onClick={() => setHideSticky(true)}
                aria-label="Hide sticky button"
              >
                ×
              </Button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

