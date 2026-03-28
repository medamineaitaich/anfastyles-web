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
            <p className="mb-2 text-muted-foreground">anfastyles.shop (MEDAIT LLC)</p>
            <p className="mb-6 text-muted-foreground">English Version</p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Overview</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                This website is operated by anfastyles. Throughout the site, the terms &quot;we&quot;, &quot;us&quot;
                and &quot;our&quot; refer to anfastyles. We offer this website, including all information, tools, and
                services available from this site to you, the user, conditioned upon your acceptance of all terms,
                conditions, policies, and notices stated here.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Section 1 - Online Store Terms</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                By agreeing to these Terms of Service, you represent that you are at least the age of majority in
                your state or province of residence. You may not use our products for any illegal or unauthorized
                purpose nor may you, in the use of the Service, violate any laws in your jurisdiction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Section 2 - General Conditions</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We reserve the right to refuse service to anyone for any reason at any time. You understand that your
                content (not including credit card information), may be transferred unencrypted. Credit card
                information is always encrypted during transfer over networks.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Section 3 - Accuracy, Completeness and Timeliness of Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We are not responsible if information made available on this site is not accurate, complete or
                current. The material on this site is provided for general information only. Any reliance on the
                material on this site is at your own risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Section 4 - Modifications to the Service and Prices</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Prices for our products are subject to change without notice. We reserve the right at any time to
                modify or discontinue the Service (or any part or content thereof) without notice at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Section 5 - Products or Services</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Certain products or services may be available exclusively online through the website. We have made
                every effort to display as accurately as possible the colors and images of our products. We cannot
                guarantee that your computer monitor's display of any color will be accurate.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Section 6 - Accuracy of Billing and Account Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or
                cancel quantities purchased per person, per household or per order. You agree to provide current,
                complete and accurate purchase and account information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Section 7 - Third-Party Links</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Certain content, products, and services available via our Service may include materials from
                third-parties. Third-party links on this site may direct you to third-party websites that are not
                affiliated with us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Section 8 - Prohibited Uses</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                In addition to other prohibitions, you are prohibited from using the site or its content: (a) for any
                unlawful purpose; (b) to solicit others to perform or participate in any unlawful acts; (c) to
                infringe upon or violate our intellectual property rights or the intellectual property rights of
                others.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Section 9 - Disclaimer of Warranties; Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We do not guarantee that your use of our service will be uninterrupted, timely, secure or error-free.
                In no case shall anfastyles, our directors, officers, employees, or affiliates be liable for any
                injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages
                of any kind.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Section 10 - Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                These Terms of Service and any separate agreements whereby we provide you Services shall be governed
                by and construed in accordance with the laws of 1209 Mountain Road Place Northeast STE R, Albuquerque,
                NM 87110, United States.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Section 11 - Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                Questions about the Terms of Service should be sent to us at{' '}
                <span className="font-medium text-foreground">contact@anfastyles.shop</span> |{' '}
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

