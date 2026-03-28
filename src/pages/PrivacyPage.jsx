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
            <p className="mb-2 text-muted-foreground">Last Updated: March 28, 2026</p>
            <p className="mb-6 text-muted-foreground">English Version</p>

            <p className="mb-8 leading-relaxed text-muted-foreground">
              This Privacy Policy describes how anfastyles.shop, operated by MEDAIT LLC, collects, uses, and discloses
              your personal information when you visit, use our services, or make a purchase from our website.
            </p>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">1. Information We Collect</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We may collect the following categories of personal information:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  Personal information you provide directly, such as your name, billing address, shipping address,
                  email address, and phone number
                </li>
                <li>Order information, including payment confirmation and purchase details</li>
                <li>
                  Usage data collected automatically, such as IP address, browser type, device information, pages
                  visited, and interactions with our website
                </li>
                <li>
                  Information received from third parties, including Shopify, payment processors, and service providers
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">2. How We Use Your Information</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We may use your information to:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Process and fulfill your orders</li>
                <li>Provide customer support</li>
                <li>Communicate with you about your order</li>
                <li>Prevent fraud and improve website security</li>
                <li>Send marketing communications by email or SMS, where permitted</li>
                <li>Improve our website, products, and services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">3. Cookies and Tracking Technologies</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We use cookies, pixels, and similar technologies to improve user experience, analyze traffic, remember
                preferences, and support advertising and marketing efforts.
              </p>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                By using our website, you consent to our use of cookies as described in this policy. You can manage or
                disable cookies through your browser settings. Please note that disabling cookies may affect the
                functionality of the site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">4. Sharing of Personal Information</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We may share your information with:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>
                  Service providers such as Shopify, payment processors, production partners, and shipping carriers
                </li>
                <li>
                  Marketing and advertising partners
                </li>
                <li>
                  Legal or regulatory authorities when required to comply with law or protect our rights
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">5. Sale or Sharing of Data</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We do not sell your personal information to third parties. However, we may share limited data with
                service providers and advertising partners for operational and marketing purposes, as permitted by
                applicable law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">6. Data Retention</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in
                this policy, including fulfilling orders, resolving disputes, maintaining business records, and
                complying with legal obligations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">7. SMS Marketing</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                By providing your phone number, you agree to receive text messages from us, including marketing
                messages and cart reminders where applicable. Consent is not a condition of purchase. You may opt out
                at any time by replying &quot;STOP&quot; to any message.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">8. Your Privacy Rights</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Depending on your location, you may have the right to:
              </p>
              <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>Access the personal information we hold about you</li>
                <li>Request correction or deletion of your personal information</li>
                <li>Opt out of certain data uses, including targeted advertising where applicable</li>
              </ul>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                If you are located in the European Economic Area, United Kingdom, or another region with privacy
                protections, you may also have the right to lodge a complaint with your local data protection
                authority.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">9. Contact Information</h2>
              <p className="mb-2 leading-relaxed text-muted-foreground">
                If you have any questions about this Privacy Policy or would like to exercise your privacy rights,
                please contact us at:
              </p>
              <p className="mb-2 leading-relaxed text-muted-foreground">
                Email: <span className="font-medium text-foreground">contact@anfastyles.shop</span>
              </p>
              <p className="leading-relaxed text-muted-foreground">
                Address:
                <br />
                <span className="font-medium text-foreground">1209 Mountain Road Place Northeast STE R</span>
                <br />
                <span className="font-medium text-foreground">Albuquerque, NM 87110</span>
                <br />
                <span className="font-medium text-foreground">United States</span>
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

