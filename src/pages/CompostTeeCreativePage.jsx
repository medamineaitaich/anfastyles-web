import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CREATIVE_IMAGE_SRC = '/offer/compost-tee-creative.png';

export default function CompostTeeCreativePage() {
  return (
    <>
      <Helmet>
        <title>Compost Tee Offer Creative</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <main className="min-h-screen bg-background py-10 overflow-x-hidden">
        <div className="container-custom">
          <div className="mx-auto max-w-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-lg font-semibold">Compost Tee Offer Creative</h1>
              <div className="flex items-center gap-2">
                <Link to="/offer/compost-tee">
                  <Button variant="outline" size="sm">Open landing</Button>
                </Link>
                <Link to="/shop">
                  <Button variant="outline" size="sm">Shop</Button>
                </Link>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
              <img
                src={CREATIVE_IMAGE_SRC}
                alt="Compost Tee offer creative"
                className="h-auto w-full max-w-full"
                loading="eager"
              />
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Image is served from <span className="font-mono">{CREATIVE_IMAGE_SRC}</span>.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

