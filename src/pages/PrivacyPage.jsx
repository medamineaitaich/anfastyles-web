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
            <p className="mb-6 text-muted-foreground">Last updated: March 26, 2026</p>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">Information We Collect</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We collect information you provide directly to us, including name, email address,
                shipping address, payment information, and order history when you create an account
                or make a purchase.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">How We Use Your Information</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We use the information we collect to process orders, communicate with you, improve
                our services, and send marketing communications (with your consent).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">Information Sharing</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We do not sell or rent your personal information to third parties. We may share
                information with service providers who assist in operating our website and
                fulfilling orders.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">Data Security</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                We implement appropriate security measures to protect your personal information.
                However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">Your Rights</h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                You have the right to access, correct, or delete your personal information. You may
                also opt out of marketing communications at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-4 text-2xl font-bold">Contact Us</h2>
              <p className="leading-relaxed text-muted-foreground">
                If you have questions about this Privacy Policy, please contact us at
                contact@medaitllc.com
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

