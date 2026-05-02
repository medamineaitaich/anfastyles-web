import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';

const PRODUCT_NAME = 'Compost Graphic Tee';
const PRODUCT_URL = '[PRODUCT_URL]';
const CHECKOUT_URL = '[CHECKOUT_URL]';

const PRODUCT_IMAGES = [
  { src: '[PRODUCT_IMAGE_1]', alt: 'Compost Graphic Tee — hero mockup (no face)' },
  { src: '[PRODUCT_IMAGE_2]', alt: 'Compost Graphic Tee — alternate mockup (no face)' },
  { src: '[PRODUCT_IMAGE_3]', alt: 'Compost Graphic Tee — close-up of graphic print' },
  { src: '[PRODUCT_IMAGE_4]', alt: 'Compost Graphic Tee — flat lay or folded shot' },
  { src: '[PRODUCT_IMAGE_5]', alt: 'Compost Graphic Tee — back/side composition (no face)' },
];

const earthy = {
  cream: '#f6f1e7',
  offWhite: '#fbfaf7',
  clay: '#b5654a',
  olive: '#2f5f3a',
  sage: '#86a58d',
  bark: '#5a463a',
  charcoal: '#0f172a',
};

const cn = (...values) => values.filter(Boolean).join(' ');

const ArrowRight = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path
      fill="currentColor"
      d="M13.5 5.5a1 1 0 0 1 1.4 0l6.6 6.6a1 1 0 0 1 0 1.4l-6.6 6.6a1 1 0 1 1-1.4-1.4l4.9-4.9H3a1 1 0 1 1 0-2h15.4l-4.9-4.9a1 1 0 0 1 0-1.4Z"
    />
  </svg>
);

const Check = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path
      fill="currentColor"
      d="M9.2 16.2 4.9 12a1 1 0 1 1 1.4-1.4l3 3 8.4-8.4a1 1 0 0 1 1.4 1.4l-9.8 9.6a1 1 0 0 1-1.1 0Z"
    />
  </svg>
);

const Leaf = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path
      fill="currentColor"
      d="M20.7 3.4c-7.8 0-13.6 3.9-16 10.8-1.2 3.5.8 6.4 4.2 6.4 6.9 0 12.1-6.8 11.8-17.2Zm-5 6.5a1 1 0 0 1 0 1.4l-4.2 4.2a1 1 0 1 1-1.4-1.4l4.2-4.2a1 1 0 0 1 1.4 0Z"
    />
  </svg>
);

const Badge = ({ children }) => (
  <span
    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide"
    style={{ borderColor: 'rgba(15, 23, 42, 0.14)', backgroundColor: 'rgba(251, 250, 247, 0.9)' }}
  >
    <span className="inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: earthy.olive }} />
    {children}
  </span>
);

const PrimaryCta = ({ href, children, className }) => (
  <a
    href={href}
    className={cn(
      'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 active:scale-[0.99] sm:w-auto',
      className,
    )}
  >
    {children}
    <ArrowRight className="h-5 w-5" />
  </a>
);

const SecondaryCta = ({ href, children, className }) => (
  <a
    href={href}
    className={cn(
      'inline-flex w-full items-center justify-center rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-muted sm:w-auto',
      className,
    )}
  >
    {children}
  </a>
);

const Section = ({ id, eyebrow, title, subtitle, children, className }) => (
  <section id={id} className={cn('py-14 sm:py-16', className)}>
    <div className="container-custom">
      {(eyebrow || title || subtitle) && (
        <header className="mx-auto max-w-3xl text-center">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="mt-3 text-3xl font-bold text-balance md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {subtitle}
            </p>
          )}
        </header>
      )}
      {children}
    </div>
  </section>
);

const FeatureCard = ({ icon, title, description }) => (
  <div className="rounded-2xl border border-border bg-background/90 p-5 shadow-sm backdrop-blur">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex flex-col gap-1 border-b border-border/70 py-4 sm:flex-row sm:items-baseline sm:justify-between">
    <p className="text-sm font-semibold text-foreground">{label}</p>
    <p className="text-sm leading-relaxed text-muted-foreground sm:max-w-[34rem] sm:text-right">{value}</p>
  </div>
);

const FaqItem = ({ question, answer }) => (
  <details className="group rounded-2xl border border-border bg-background/90 px-5 py-4 shadow-sm backdrop-blur">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
      <span>{question}</span>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground transition-transform duration-200 group-open:rotate-45">
        +
      </span>
    </summary>
    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{answer}</p>
  </details>
);

const Gallery = ({ images }) => (
  <div className="mt-10 grid gap-3 md:mt-12 md:grid-cols-12 md:gap-4">
    <div className="md:col-span-7">
      <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-muted shadow-sm sm:aspect-[16/17] md:aspect-[4/5]">
        <img
          src={images[0]?.src}
          alt={images[0]?.alt}
          className="h-full w-full object-cover"
          loading="eager"
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Hero image suggestion: torso-only mockup or flat lay. No visible face.
      </p>
    </div>
    <div className="grid gap-3 md:col-span-5 md:gap-4">
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {images.slice(1, 3).map((image) => (
          <div key={image.alt} className="aspect-square overflow-hidden rounded-2xl bg-muted shadow-sm">
            <img src={image.src} alt={image.alt} className="h-full w-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {images.slice(3, 5).map((image) => (
          <div key={image.alt} className="aspect-square overflow-hidden rounded-2xl bg-muted shadow-sm">
            <img src={image.src} alt={image.alt} className="h-full w-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Include a close-up of the print and a folded/flat lay shot for premium feel.
      </p>
    </div>
  </div>
);

export default function CompostGraphicTeeLanding() {
  const [stickyVisible, setStickyVisible] = useState(true);

  const heroImage = PRODUCT_IMAGES[0];

  const benefits = useMemo(() => ([
    {
      title: 'Soft, lightweight comfort',
      description: 'Printed on Gildan Softstyle 64000 with a lightweight 4.5 oz/yd² (153 g/m²) feel for everyday wear.',
      icon: <Leaf className="h-5 w-5" />,
    },
    {
      title: 'Easy classic fit',
      description: 'Classic fit with a crew neckline—simple, clean, and easy to style with denim, work pants, or garden clogs.',
      icon: <Check className="h-5 w-5" />,
    },
    {
      title: 'A quiet badge of compost pride',
      description: 'A conversation-starting graphic for people who know scraps aren’t trash—they’re future soil.',
      icon: <Leaf className="h-5 w-5" />,
    },
    {
      title: 'Comfort details you notice',
      description: 'Tear-away label, ribbed knit collar, shoulder tape, and no side seams for a smoother feel.',
      icon: <Check className="h-5 w-5" />,
    },
    {
      title: 'Giftable and genuinely thoughtful',
      description: 'For the compost person in your life—the one who lights up talking scraps, soil, and growing things.',
      icon: <Leaf className="h-5 w-5" />,
    },
  ]), []);

  const faqs = useMemo(() => ([
    {
      question: 'What material is the shirt made from?',
      answer: 'Solid colors are 100% ring-spun cotton. Heather colors are blended fabrics.',
    },
    {
      question: 'Is it unisex?',
      answer: 'It’s a classic fit with a crew neckline—easy to wear with a relaxed, everyday feel.',
    },
    {
      question: 'Is it lightweight or heavy?',
      answer: 'Lightweight: 4.5 oz/yd² (153 g/m²).',
    },
    {
      question: 'What makes this tee comfortable?',
      answer: 'Tear-away label, ribbed knit collar to help retain shape, shoulder tape for stability, and no side seams for a smoother fit.',
    },
    {
      question: 'How do I care for it?',
      answer: 'Machine wash cold, tumble dry low, low heat iron if needed. Do not bleach. Do not dry clean.',
    },
    {
      question: 'Is this a good gift for gardeners or compost lovers?',
      answer: 'Yes—especially for anyone who gets weirdly excited about food scraps, soil life, and growing things.',
    },
  ]), []);

  const onStickyClose = () => setStickyVisible(false);

  return (
    <>
      <Helmet>
        <title>{`${PRODUCT_NAME} — Food Scraps Are Future Soil`}</title>
        <meta
          name="description"
          content="Food scraps are future soil. A premium, soft, lightweight graphic tee for gardeners, compost lovers, and soil-minded folks."
        />
      </Helmet>

      <div
        className="min-h-screen bg-background text-foreground"
        style={{
          backgroundImage: `radial-gradient(1200px 600px at 20% 5%, rgba(134, 165, 141, 0.25), transparent 60%),
            radial-gradient(1000px 500px at 85% 10%, rgba(181, 101, 74, 0.18), transparent 60%),
            linear-gradient(180deg, ${earthy.offWhite} 0%, ${earthy.cream} 55%, rgba(246, 241, 231, 0.15) 100%)`,
        }}
      >
        <header className="border-b border-border/60 bg-background/70 backdrop-blur">
          <div className="container-custom flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-primary">
                <Leaf className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-bold">AnfaStyles</p>
                <p className="text-xs text-muted-foreground">Earthy essentials</p>
              </div>
            </div>
            <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex">
              <a className="transition-colors hover:text-foreground" href="#why">Why it hits</a>
              <a className="transition-colors hover:text-foreground" href="#details">Details</a>
              <a className="transition-colors hover:text-foreground" href="#gallery">Gallery</a>
              <a className="transition-colors hover:text-foreground" href="#faq">FAQ</a>
            </nav>
            <div className="hidden items-center gap-3 md:flex">
              <SecondaryCta href={PRODUCT_URL}>View product</SecondaryCta>
              <PrimaryCta href={CHECKOUT_URL}>Shop the Compost Tee</PrimaryCta>
            </div>
          </div>
        </header>

        <main className="pb-24">
          <section className="py-12 sm:py-16">
            <div className="container-custom">
              <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
                <div className="lg:col-span-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge>For gardeners, soil lovers, and compost believers</Badge>
                    <Badge>Wear your compost pride</Badge>
                  </div>

                  <h1
                    className="mt-6 text-4xl font-bold text-balance sm:text-5xl"
                    style={{ letterSpacing: '-0.03em', color: earthy.charcoal }}
                  >
                    Food scraps are future soil.
                  </h1>

                  <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                    A soft, lightweight graphic tee for gardeners, compost lovers, and soil-minded folks who like wearing
                    their values in a simple, playful way.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <PrimaryCta href={CHECKOUT_URL}>Shop the Compost Tee</PrimaryCta>
                    <SecondaryCta href={PRODUCT_URL}>See full product page</SecondaryCta>
                  </div>

                  <div className="mt-6 grid gap-3 rounded-2xl border border-border/70 bg-background/75 p-5 text-sm text-muted-foreground shadow-sm backdrop-blur sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-primary">
                        <Check className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">Gildan Softstyle 64000</p>
                        <p className="text-xs leading-relaxed">Soft, lightweight unisex tee base.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-primary">
                        <Leaf className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">For compost people</p>
                        <p className="text-xs leading-relaxed">For the person who gets excited about food scraps.</p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-muted-foreground">
                    Material note: solid colors are 100% ring-spun cotton; heather colors are blended fabrics.
                  </p>
                </div>

                <div className="lg:col-span-6">
                  <div className="relative overflow-hidden rounded-3xl border border-border bg-muted shadow-sm">
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(600px 240px at 10% 10%, rgba(47, 95, 58, 0.24), transparent 60%), radial-gradient(520px 220px at 95% 20%, rgba(181, 101, 74, 0.20), transparent 65%)',
                      }}
                    />
                    <div className="relative aspect-[4/5] w-full sm:aspect-[16/17] lg:aspect-[4/5]">
                      <img src={heroImage.src} alt={heroImage.alt} className="h-full w-full object-cover" />
                    </div>
                    <div className="relative border-t border-border/70 bg-background/85 p-4 backdrop-blur">
                      <p className="text-sm font-semibold">Compost Graphic Tee</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Lifestyle image guidance: cropped from neck down or flat lay only—no visible face.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Core message: <span className="font-semibold text-foreground">“Food scraps are future soil.”</span>
                    </p>
                    <a
                      href="#gallery"
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      View gallery
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Section
            id="why"
            eyebrow="Why people love it"
            title="Quiet, premium, and very you."
            subtitle="Designed to feel like a small everyday essential—soft on the body, strong on the message."
          >
            <div className="mt-10 grid gap-4 md:mt-12 md:grid-cols-2 lg:grid-cols-3">
              {benefits.map((benefit) => (
                <FeatureCard
                  key={benefit.title}
                  icon={benefit.icon}
                  title={benefit.title}
                  description={benefit.description}
                />
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryCta href={CHECKOUT_URL}>Shop the Compost Tee</PrimaryCta>
              <SecondaryCta href={PRODUCT_URL}>See full details</SecondaryCta>
            </div>
          </Section>

          <section className="py-14 sm:py-16">
            <div className="container-custom">
              <div className="grid gap-10 rounded-3xl border border-border bg-background/70 p-7 shadow-sm backdrop-blur md:grid-cols-12 md:items-center md:gap-12 md:p-10">
                <div className="md:col-span-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                    Lifestyle & identity
                  </p>
                  <h2 className="mt-3 text-3xl font-bold text-balance md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
                    For people who know scraps aren’t trash.
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    You’re the one who looks at the kitchen bin and sees tomorrow’s soil. The one who loves raised beds,
                    farmer’s markets, compost piles, and the quiet magic of a garden coming back to life.
                  </p>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    This tee is a conversation starter—low-key, warm, and proud. A small badge that says you’re paying
                    attention to what grows.
                  </p>

                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <PrimaryCta href={CHECKOUT_URL}>Shop the Compost Tee</PrimaryCta>
                    <a
                      href="#details"
                      className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      See the fabric & fit
                    </a>
                  </div>

                  <p className="mt-4 text-xs text-muted-foreground">
                    Friendly reminder: no loud slogans—just a clean statement for compost believers.
                  </p>
                </div>

                <div className="md:col-span-5">
                  <div className="relative overflow-hidden rounded-3xl bg-muted shadow-sm">
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, rgba(47,95,58,0.22), rgba(181,101,74,0.18))` }} />
                    <div className="relative aspect-[4/5]">
                      <img src={PRODUCT_IMAGES[1].src} alt={PRODUCT_IMAGES[1].alt} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Image suggestion: workwear + garden tools + torso-only tee shot for a premium, authentic vibe.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Section
            id="details"
            eyebrow="Product details"
            title="Built for comfort. Made to wear often."
            subtitle="A clean, premium spec list—no fluff, no exaggerated claims."
          >
            <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur sm:p-8">
              <DetailRow label="Blank" value="Printed on Gildan Softstyle 64000." />
              <DetailRow label="Fabric weight" value="Lightweight 4.5 oz/yd² (153 g/m²)." />
              <DetailRow label="Material notes" value="Solid colors: 100% ring-spun cotton. Heather colors: blended fabrics." />
              <DetailRow label="Fit" value="Classic fit with crew neckline." />
              <DetailRow label="Comfort" value="Tear-away label. No side seams for a smoother fit." />
              <DetailRow label="Structure" value="Ribbed knit collar helps retain shape. Shoulder tape helps stabilize the garment." />
              <DetailRow label="Cotton sourcing" value="Ethically grown and harvested US cotton. Gildan is a member of the US Cotton Trust Protocol." />
              <DetailRow label="Safety & quality" value="Blank tee is certified by Oeko-Tex for safety and quality assurance." />
              <div className="pt-6">
                <p className="text-sm font-semibold">Care instructions</p>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />Machine wash cold</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />Tumble dry low</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />Low heat iron if needed</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />Do not bleach</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />Do not dry clean</li>
                </ul>
              </div>
            </div>
          </Section>

          <section className="py-14 sm:py-16">
            <div className="container-custom">
              <div className="grid gap-10 rounded-3xl border border-border bg-background/75 p-7 shadow-sm backdrop-blur md:grid-cols-12 md:items-center md:p-10">
                <div className="md:col-span-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">Gift angle</p>
                  <h2 className="mt-3 text-3xl font-bold text-balance md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
                    A thoughtful gift for the compost person in your life.
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    For gardeners, plant lovers, and anyone who lights up when talking about scraps, soil, and growing things.
                  </p>
                  <div className="mt-6 rounded-2xl bg-muted p-5">
                    <p className="text-sm font-semibold text-foreground">Gift note ideas (simple + not cheesy)</p>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" />“Because you make magic out of scraps.”</li>
                      <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" />“For your garden era (forever).”</li>
                      <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" />“Food scraps are future soil.”</li>
                    </ul>
                  </div>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <PrimaryCta href={CHECKOUT_URL}>Shop the Compost Tee</PrimaryCta>
                    <SecondaryCta href={PRODUCT_URL}>View product</SecondaryCta>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    No invented shipping promises here—use your real product page/checkout for final purchase details.
                  </p>
                </div>

                <div className="md:col-span-6">
                  <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
                    {PRODUCT_IMAGES.slice(2, 4).map((image) => (
                      <div key={image.alt} className="aspect-square overflow-hidden rounded-3xl bg-muted shadow-sm">
                        <img src={image.src} alt={image.alt} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Image suggestion: close-up print + folded tee shot. Keep the design as the hero.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Section
            id="gallery"
            eyebrow="Gallery"
            title="See it from every angle."
            subtitle="Use torso-only lifestyle shots, flat lays, and close-ups—no faces, just the tee."
          >
            <Gallery images={PRODUCT_IMAGES} />
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryCta href={CHECKOUT_URL}>Shop the Compost Tee</PrimaryCta>
              <SecondaryCta href={PRODUCT_URL}>View product page</SecondaryCta>
            </div>
          </Section>

          <Section
            id="faq"
            eyebrow="FAQ"
            title="Quick answers."
            subtitle="Everything we can answer from confirmed product facts."
          >
            <div className="mx-auto mt-10 grid max-w-4xl gap-3 md:mt-12">
              {faqs.map((faq) => (
                <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </Section>

          <section className="pb-16 pt-4 sm:pb-20">
            <div className="container-custom">
              <div className="relative overflow-hidden rounded-3xl border border-border bg-background/75 p-8 shadow-sm backdrop-blur sm:p-12">
                <div
                  className="absolute inset-0 opacity-70"
                  style={{
                    backgroundImage:
                      'radial-gradient(600px 260px at 20% 20%, rgba(47, 95, 58, 0.22), transparent 60%), radial-gradient(520px 240px at 80% 30%, rgba(181, 101, 74, 0.18), transparent 60%)',
                  }}
                />
                <div className="relative mx-auto max-w-3xl text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">Final CTA</p>
                  <h2 className="mt-3 text-3xl font-bold text-balance md:text-4xl" style={{ letterSpacing: '-0.02em' }}>
                    Compost people get it.
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                    If composting makes you weirdly happy, this tee gets it. Wear your compost pride—quietly, confidently, every day.
                  </p>
                  <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <PrimaryCta href={CHECKOUT_URL} className="px-7 py-3.5 text-base">
                      Get Yours Now
                    </PrimaryCta>
                    <SecondaryCta href={PRODUCT_URL} className="px-7 py-3.5 text-base">
                      View product details
                    </SecondaryCta>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Message: “Food scraps are future soil.” Secondary: “Wear your compost pride.”
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {stickyVisible && (
          <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
            <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{PRODUCT_NAME}</p>
                <p className="truncate text-xs text-muted-foreground">Food scraps are future soil.</p>
              </div>
              <a
                href={CHECKOUT_URL}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Shop now
              </a>
              <button
                type="button"
                aria-label="Hide sticky call to action"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={onStickyClose}
              >
                ×
              </button>
            </div>
          </div>
        )}

        <footer className="border-t border-border/60 bg-background/70 py-10 backdrop-blur">
          <div className="container-custom">
            <div className="grid gap-6 md:grid-cols-12 md:items-start">
              <div className="md:col-span-5">
                <p className="text-sm font-bold">AnfaStyles</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Premium essentials for people who feel at home in the garden, the kitchen, and the soil.
                </p>
              </div>
              <div className="md:col-span-7 md:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">Ready to shop?</p>
                <div className="mt-4 flex flex-col gap-3 md:flex-row md:justify-end">
                  <SecondaryCta href={PRODUCT_URL}>Product page</SecondaryCta>
                  <PrimaryCta href={CHECKOUT_URL}>Shop the Compost Tee</PrimaryCta>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Replace placeholder URLs and images with your real product assets before publishing.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

