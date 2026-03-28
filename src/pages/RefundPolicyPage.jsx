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
            <p className="mb-2 text-muted-foreground">anfastyles (MEDAIT LLC)</p>
            <p className="mb-6 text-muted-foreground">Last Updated: March 28, 2026</p>

            <p className="mb-8 leading-relaxed text-muted-foreground">
              At anfastyles, operated by MEDAIT LLC, we take pride in the quality of our products. Because all of our
              items are custom-made and printed on demand, our return policy differs from traditional retail stores.
            </p>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">1. No Returns for Change of Mind</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Since every product is made-to-order, we do not accept returns or issue refunds if you change your
                mind, ordered the wrong size, or are dissatisfied with the design. Please carefully review product
                descriptions and size charts before placing your order.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">2. Eligibility for Replacement or Refund</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We only offer replacements or refunds in the following cases:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Damaged or defective items (for example, torn, broken, or manufacturing defects)</li>
                <li>Incorrect items received (wrong size, color, or design)</li>
                <li>Poor print quality (blurry, peeling, or misaligned print)</li>
              </ul>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                If the issue is confirmed to be our fault, we will resolve it at no additional cost to you. We may
                offer a replacement or a full refund. In some cases, we may not require the item to be returned.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">3. Reporting Period and Requirements</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                To be eligible for a resolution, you must contact us within 30 days of receiving your order at:{' '}
                <span className="font-medium text-foreground">contact@anfastyles.shop</span>
              </p>
              <p className="mb-4 leading-relaxed text-muted-foreground">You must provide:</p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Clear photos of the defective or incorrect item</li>
                <li>A clear photo of the shipping label and packaging</li>
                <li>Your order number and the email address used for the purchase</li>
              </ul>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We reserve the right to deny claims that do not meet these requirements or lack sufficient evidence.
                Please do not discard the item or packaging until your claim has been reviewed.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">4. Order Cancellations</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Orders may be canceled within 24 hours of purchase. After this period, orders enter production and
                cannot be modified or canceled.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">5. Sale Items</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Items purchased during promotions, sales, or with discount codes are considered final sale and are not
                eligible for return, exchange, or refund unless they are defective or incorrect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">6. Returns and Shipping Costs</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                If the item is defective, damaged, or incorrect due to our error, we will resolve the issue at no
                additional cost to the customer.
              </p>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                If a return is required for inspection, we will provide instructions. In other approved cases, the
                customer may be responsible for return shipping costs.
              </p>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Original shipping fees, taxes, and handling charges are non-refundable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">7. Refund Processing</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Once your claim is approved, and the return is received if required, we will process your refund.
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Processing time: up to 10 business days</li>
                <li>Refund method: original payment method (PayPal, credit card, etc.)</li>
              </ul>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Please note that your bank or card provider may require additional time to post the refund.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">8. Non-Refundable Situations</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We do not guarantee refunds for issues caused by incorrect size selection, customer input errors, or
                misuse of the product.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">9. Contact</h2>
              <p className="leading-relaxed text-muted-foreground">
                For any questions regarding returns, refunds, or replacements, contact us at:{' '}
                <span className="font-medium text-foreground">contact@anfastyles.shop</span>
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

