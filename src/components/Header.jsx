import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, Leaf } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Header = ({ onCartClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get('search') || '');
  }, [location.search]);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('anfaCart') || '{"items":[],"itemCount":0}');
    setCartCount(cart.itemCount || 0);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const nextSearch = searchTerm.trim();
    const params = new URLSearchParams();

    if (nextSearch) {
      params.set('search', nextSearch);
    }

    navigate({
      pathname: '/shop',
      search: params.toString() ? `?${params.toString()}` : '',
    });

    setMobileMenuOpen(false);
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/shop', label: 'Shop' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="bg-primary text-primary-foreground py-2 text-center text-sm font-medium">
        Free shipping over $75
      </div>
      
      <div className="container-custom py-4">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">ANFASTYLES</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-primary bg-accent'
                    : 'text-foreground hover:text-primary hover:bg-muted'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-2 flex-1 max-w-sm">
            <Input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
            />
            <Button type="submit" variant="ghost" size="icon" aria-label="Search">
              <Search className="w-5 h-5" />
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={onCartClick}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>

            {authenticated ? (
              <Link to="/account">
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="default" size="sm" className="hidden sm:flex">
                  Login
                </Button>
              </Link>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <nav className="flex flex-col gap-4 mt-8">
                  <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                    <Input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search products"
                      aria-label="Search products"
                    />
                    <Button type="submit" variant="ghost" size="icon" aria-label="Search">
                      <Search className="w-5 h-5" />
                    </Button>
                  </form>
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        isActive(link.path)
                          ? 'text-primary bg-accent'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {!authenticated && (
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="default" className="w-full">
                        Login
                      </Button>
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
