import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Leaf, Users, Heart, Recycle } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const AboutPage = () => {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const values = [
    {
      icon: Leaf,
      title: 'Sustainable materials',
      description: 'We source eco-friendly fabrics and materials that minimize environmental impact while maintaining premium quality.'
    },
    {
      icon: Users,
      title: 'Community focused',
      description: 'Supporting local artists and creators who share our vision for conscious, meaningful design.'
    },
    {
      icon: Heart,
      title: 'Ethical production',
      description: 'Fair wages, safe working conditions, and transparent supply chains are non-negotiable for us.'
    },
    {
      icon: Recycle,
      title: 'Zero waste approach',
      description: 'Print-on-demand production means we only create what you order, eliminating excess inventory and waste.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>About us - AnfaStyles</title>
        <meta name="description" content="Learn about AnfaStyles mission to create sustainable, eco-conscious apparel and accessories" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main>
        <section className="py-20 bg-muted">
          <div className="container-custom max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance" style={{ letterSpacing: '-0.02em' }}>
              Conscious creation for a sustainable future
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-prose mx-auto">
              AnfaStyles was born from a simple belief: fashion should not cost the earth. We create apparel and accessories that honor both style and sustainability.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Our story</h2>
                <p className="text-muted-foreground leading-relaxed mb-4 max-w-prose">
                  Founded in 2024, AnfaStyles emerged from a desire to challenge the fast fashion industry. We saw an opportunity to create beautiful, meaningful products without the environmental toll.
                </p>
                <p className="text-muted-foreground leading-relaxed max-w-prose">
                  Every piece we offer is made-to-order, using sustainable materials and ethical production practices. We partner with artists who share our values, creating designs that tell stories and spark conversations.
                </p>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1618815909724-861120595390"
                  alt="Sustainable fashion production"
                  className="rounded-2xl shadow-lg w-full"
                />
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-balance">Our values</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div key={index} className="bg-card border border-border rounded-xl p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container-custom text-center max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">Join the movement</h2>
            <p className="text-lg text-primary-foreground/90 leading-relaxed">
              Every purchase supports sustainable practices, ethical production, and artists who create with intention. Together, we are building a future where fashion and environmental responsibility go hand in hand.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default AboutPage;
