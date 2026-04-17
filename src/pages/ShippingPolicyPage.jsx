import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const ShippingPolicyPage = () => {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>Shipping Policy - AnfaStyles</title>
        <meta name="description" content="AnfaStyles shipping policy, processing times, delivery estimates, and tracking" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-20">
        <div className="container-custom max-w-4xl">
          <h1
            className="mb-8 text-4xl font-bold text-balance md:text-5xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Shipping Policy
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="mb-2 text-muted-foreground">anfastyles (MEDAIT LLC)</p>
            <p className="mb-6 text-muted-foreground">Last Updated: March 28, 2026</p>

            <p className="mb-8 leading-relaxed text-muted-foreground">
              At anfastyles, all products are made-to-order and fulfilled through our trusted production partners,
              including Printify and Printful. Because of this, shipping times include both production and delivery
              phases.
            </p>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">1. Order Processing Time</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                All orders are custom-made after purchase.
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Processing time: 2 to 5 business days</li>
              </ul>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                This includes printing, production, quality checks, and packaging. During holidays, peak seasons, or
                periods of high order volume, processing times may be longer.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">2. Shipping Time</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                After production is completed, orders are shipped to the delivery address provided at checkout.
              </p>
              <p className="mb-2 leading-relaxed text-muted-foreground">Estimated delivery times:</p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>United States: 3 to 7 business days</li>
              </ul>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                These timeframes are estimates only and may vary depending on destination, carrier performance, and seasonal demand.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">3. Shipping Costs</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Shipping costs are calculated at checkout based on your location and the shipping method selected.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">4. Order Tracking</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Once your order has shipped, you will receive a tracking number by email. Please allow 24 to 72 hours
                for tracking information to update.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">5. Delays</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We are not responsible for delays caused by shipping carriers, weather conditions,
                incorrect or incomplete shipping information provided by the customer, or other circumstances beyond
                our control.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">6. Lost or Stolen Packages</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                If your package is marked as delivered but you have not received it, please contact the shipping
                carrier first.
              </p>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                If you still need assistance, contact us at: <span className="font-medium text-foreground">contact@anfastyles.shop</span>
              </p>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We will do our best to assist you, but we are not responsible for packages lost or stolen after they
                are marked as delivered by the carrier.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">7. Incorrect Shipping Address</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Customers are responsible for providing a complete and accurate shipping address at checkout. If an
                incorrect address is provided and the order has already entered processing or shipping, we cannot
                guarantee that changes can be made.
              </p>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                If a package is returned to us due to an incorrect or undeliverable address, additional shipping fees
                may apply to resend the package.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">8. Customs, Duties, and Taxes</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We currently ship within the United States only. Customs fees and import duties do not apply for US orders.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">9. Contact</h2>
              <p className="leading-relaxed text-muted-foreground">
                For any shipping-related questions, contact us at:{' '}
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

export default ShippingPolicyPage;
