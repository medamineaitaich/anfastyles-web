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
            <p className="text-muted-foreground mb-6">Last updated: March 26, 2026</p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                By accessing and using AnfaStyles, you agree to be bound by these Terms of Service
                and all applicable laws and regulations. If you do not agree with any of these
                terms, you are prohibited from using this site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Use License</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Permission is granted to temporarily download one copy of the materials on
                AnfaStyles for personal, non-commercial transitory viewing only. This is the grant
                of a license, not a transfer of title.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Product Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We strive to provide accurate product descriptions and images. However, we do not
                warrant that product descriptions, colors, or other content are accurate, complete,
                reliable, current, or error-free.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Pricing and Payment</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                All prices are in USD and subject to change without notice. We reserve the right to
                refuse or cancel any order for any reason, including pricing errors.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In no event shall AnfaStyles or its suppliers be liable for any damages arising out
                of the use or inability to use the materials on our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms of Service, please contact us at
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

export default TermsPage;

