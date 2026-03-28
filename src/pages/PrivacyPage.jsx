import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const PrivacyPage = () => {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>Privacy Policy - AnfaStyles</title>
        <meta name="description" content="AnfaStyles privacy policy and data protection" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-20">
        <div className="container-custom max-w-4xl">
          <h1
            className="mb-8 text-4xl font-bold text-balance md:text-5xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            Privacy Policy
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="mb-2 text-muted-foreground">anfastyles.shop (MEDAIT LLC)</p>
            <p className="mb-6 text-muted-foreground">English Version</p>
            <p className="mb-6 text-muted-foreground">Last Updated: March 13, 2026</p>

            <p className="mb-8 leading-relaxed text-muted-foreground">
              This Privacy Policy describes how anfastyles.shop (the &quot;Site&quot;, &quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;) collects, uses, and discloses your personal
              information when you visit, use our services, or make a purchase from the Site.
            </p>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">1. Information We Collect</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We collect personal information from various sources to provide our services:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">Information provided directly by you:</span>{' '}
                  including contact details (name, address, phone number, email), order information (billing and
                  shipping address, payment confirmation), and account information.
                </li>
                <li>
                  <span className="font-medium text-foreground">Information collected automatically:</span>{' '}
                  when you visit our Site, we automatically collect &quot;Usage Data&quot; through cookies, pixels,
                  and similar technologies. This includes device information, browser type, IP address, and how you
                  interact with our Site.
                </li>
                <li>
                  <span className="font-medium text-foreground">Information from third parties:</span> we may receive
                  information from service providers and our payment processors.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">2. How We Use Your Information</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We use your information for the following purposes:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">Providing products and services:</span> to process
                  payments, fulfill orders, and manage your account.
                </li>
                <li>
                  <span className="font-medium text-foreground">Marketing and advertising:</span> to send promotional
                  communications (email and SMS) and show targeted ads.
                </li>
                <li>
                  <span className="font-medium text-foreground">Security and fraud prevention:</span> to detect and
                  investigate fraudulent or illegal activity.
                </li>
                <li>
                  <span className="font-medium text-foreground">Customer support:</span> to respond to your inquiries
                  and improve our services.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">3. Cookies and Tracking Technologies</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We use cookies to power and improve our Site, remember your preferences, and run analytics. You can
                manage cookie preferences through your browser settings, though blocking cookies may affect your
                experience on the Site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">4. Disclosure of Personal Information</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We may share your personal information with:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  <span className="font-medium text-foreground">Service providers:</span> such as shipping carriers and
                  payment processors.
                </li>
                <li>
                  <span className="font-medium text-foreground">Marketing partners:</span> to provide you with tailored
                  advertisements.
                </li>
                <li>
                  <span className="font-medium text-foreground">Legal compliance:</span> to comply with applicable laws,
                  respond to subpoenas, or protect our rights.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">5. SMS Marketing</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                By providing your phone number, you agree to receive text messages (including cart reminders).
                Consent is not a condition of purchase. You can opt-out by replying &quot;STOP&quot; to any message.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">6. Your Rights (CCPA/GDPR)</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Depending on your location, you may have the right to:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Access the personal information we hold about you.</li>
                <li>Request the deletion or correction of your information.</li>
                <li>
                  Opt-out of the &quot;sale&quot; or &quot;sharing&quot; of your personal information for targeted
                  advertising.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">7. Contact Us</h2>
              <p className="mb-2 leading-relaxed text-muted-foreground">
                For any questions regarding this policy or to exercise your rights, please contact us at:
              </p>
              <p className="mb-2 leading-relaxed text-muted-foreground">
                Email: <span className="font-medium text-foreground">contact@anfastyles.shop</span>
              </p>
              <p className="leading-relaxed text-muted-foreground">
                Address: <span className="font-medium text-foreground">1209 Mountain Road Place Northeast STE R, Albuquerque, NM 87110, US.</span>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default PrivacyPage;

