import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const TermsPage = () => {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>Terms of Service - AnfaStyles</title>
        <meta name="description" content="AnfaStyles terms of service and conditions" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-20">
        <div className="container-custom max-w-4xl">
          <h1
            className="text-4xl md:text-5xl font-bold mb-8 text-balance"
            style={{ letterSpacing: '-0.02em' }}
          >
            Terms of Service
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="mb-2 text-muted-foreground">anfastyles (MEDAIT LLC)</p>
            <p className="mb-2 text-muted-foreground">Last Updated: March 28, 2026</p>
            <p className="mb-6 text-muted-foreground">English Version</p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Overview</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                This website is operated by anfastyles. Throughout the site, the terms &quot;we&quot;, &quot;us&quot;,
                and &quot;our&quot; refer to anfastyles. By accessing or using our website, you agree to be bound by
                these Terms of Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">1. Online Store Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                By using this site, you confirm that you are at least the age of majority in your jurisdiction. You
                agree not to use our products for any illegal or unauthorized purpose.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. General Conditions</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We reserve the right to refuse service to anyone at any time. Your content, excluding payment
                information, may be transferred unencrypted. Payment data is always encrypted during transfer over
                networks.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Accuracy of Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We are not responsible if information on this site is not accurate, complete, or current. Any reliance
                on the material on this site is at your own risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Modifications to Service and Prices</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Prices and services may change without notice. We reserve the right to modify or discontinue any part
                of the service at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Products or Services</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Some products may be available exclusively online. We strive to display product colors and images as
                accurately as possible, but we cannot guarantee exact display across all devices and screens.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Billing and Account Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We reserve the right to refuse or cancel any order. You agree to provide accurate, current, and
                complete purchase and account information for all orders placed on our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">7. Account Responsibility</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You are responsible for maintaining the confidentiality of your account information and for all
                activities conducted under your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">8. Refund Policy</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Please review our Refund and Return Policy for detailed information about refunds, replacements,
                returns, and cancellations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">9. Third-Party Links</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We are not responsible for third-party websites or services linked on our site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">10. Prohibited Uses</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You may not use our website or its content for any unlawful purpose, to violate any laws, or to
                infringe upon our intellectual property rights or the rights of others.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">11. Chargebacks</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Customers are encouraged to contact us before initiating a chargeback. Unauthorized, fraudulent, or
                abusive chargebacks may result in order restrictions, account restrictions, and further review.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">12. Disclaimer of Warranties and Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We do not guarantee that your use of our service will be uninterrupted, timely, secure, or error-free.
                To the fullest extent permitted by law, we are not liable for any direct, indirect, incidental,
                punitive, special, or consequential damages arising from your use of our services or products.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">13. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of New Mexico,
                United States.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">14. Billing Descriptor</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Charges will appear as &quot;ANFASTYLES&quot; on your bank or card statement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">15. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                For any questions regarding these Terms of Service, contact us at:
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">contact@anfastyles.shop</span>
                <br />
                <span className="font-medium text-foreground">contact@MEDAITLLC.COM</span>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default TermsPage;

