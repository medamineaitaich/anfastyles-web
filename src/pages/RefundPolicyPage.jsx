import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const RefundPolicyPage = () => {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>Refund Policy - AnfaStyles</title>
        <meta name="description" content="AnfaStyles refund and return policy" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-20">
        <div className="container-custom max-w-4xl">
          <h1
            className="mb-8 text-4xl font-bold text-balance md:text-5xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Refund Policy
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="mb-6 text-muted-foreground">Last updated: March 26, 2026</p>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">30-Day Satisfaction Guarantee</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We offer a 30-day satisfaction guarantee on all products. If you are not completely
                satisfied with your purchase, you may return it for a full refund or exchange.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">Return Conditions</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                To be eligible for a return, items must be unworn, unwashed, and in their original
                condition with all tags attached. Custom or personalized items cannot be returned
                unless defective.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">How to Initiate a Return</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Contact our customer service team at contact@medaitllc.com with your order number
                and reason for return. We will provide you with a return shipping label and
                instructions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">Refund Processing</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Once we receive your return, we will inspect the item and process your refund
                within 5-7 business days. Refunds will be issued to the original payment method.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">Exchanges</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                If you would like to exchange an item for a different size or color, please contact
                us. We will ship the replacement item once we receive your return.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">Damaged or Defective Items</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                If you receive a damaged or defective item, please contact us immediately with
                photos. We will send a replacement at no additional cost or issue a full refund.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">Questions</h2>
              <p className="leading-relaxed text-muted-foreground">
                For questions about returns or refunds, please contact us at contact@medaitllc.com
                or call +1 202-773-7432
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default RefundPolicyPage;

