import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      toast.success('Welcome to the Soil Community');
      setEmail('');
      setLoading(false);
    }, 1000);
  };

  return (
    <footer className="bg-muted text-muted-foreground border-t border-border mt-20">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Leaf className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">ANFASTYLES</span>
            </div>
            <p className="text-sm leading-relaxed">
              Conscious creation for a sustainable future. Every purchase supports eco-friendly practices.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/shop" className="hover:text-primary transition-colors duration-200">All products</Link></li>
              <li><Link to="/shop?category=apparel" className="hover:text-primary transition-colors duration-200">Apparel</Link></li>
              <li><Link to="/shop?category=accessories" className="hover:text-primary transition-colors duration-200">Accessories</Link></li>
              <li><Link to="/shop?sort=newest" className="hover:text-primary transition-colors duration-200">New arrivals</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" className="hover:text-primary transition-colors duration-200">Contact us</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors duration-200">FAQ</Link></li>
              <li><Link to="/refund-policy" className="hover:text-primary transition-colors duration-200">Refund policy</Link></li>
              <li><Link to="/orders" className="hover:text-primary transition-colors duration-200">Track order</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Join the Soil Community</h3>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background text-foreground"
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="text-sm space-y-1">
              <p className="font-medium text-foreground">Medait LLC</p>
              <p>1209 Mountain Road Place Northeast STE R</p>
              <p>Albuquerque, NM 87110</p>
              <p>contact@medaitllc.com</p>
              <p>+1 202-773-7432</p>
            </div>

            <div className="flex items-center gap-4 md:justify-end">
              <span className="text-sm">We accept:</span>
              <div className="flex gap-2">
                <div className="w-12 h-8 bg-background rounded border border-border flex items-center justify-center text-xs font-semibold">
                  VISA
                </div>
                <div className="w-12 h-8 bg-background rounded border border-border flex items-center justify-center text-xs font-semibold">
                  MC
                </div>
                <div className="w-12 h-8 bg-background rounded border border-border flex items-center justify-center text-xs font-semibold">
                  AMEX
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; 2026 AnfaStyles. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/privacy" className="hover:text-primary transition-colors duration-200">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors duration-200">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
