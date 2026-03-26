import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const NotFoundPage = () => {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  return (
    <>
      <Helmet>
        <title>Page not found - AnfaStyles</title>
        <meta name="description" content="The page you are looking for does not exist" />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-20">
        <div className="container-custom max-w-2xl text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Page not found</h2>
            <p className="text-lg text-muted-foreground">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>

          <Link to="/">
            <Button size="lg">
              <Home className="w-5 h-5 mr-2" />
              Back to home
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default NotFoundPage;
