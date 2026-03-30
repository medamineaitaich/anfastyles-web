import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Leaf, Award, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import apiServerClient from '@/lib/apiServerClient';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';
import ProductRatingStars from '@/components/ProductRatingStars.jsx';

const HomePage = () => {
  const [homeProducts, setHomeProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const formatPrice = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
  };

  const getImageUrl = (value) => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') return value.src || value.url || null;
    return null;
  };

  useEffect(() => {
    fetchHomeProducts();
  }, []);

  const getPrimaryCategoryKey = (product) => {
    const categories = product?.categories;
    if (!Array.isArray(categories) || categories.length === 0) return null;

    const first = categories[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') return first.id ?? first.slug ?? first.name ?? null;
    return null;
  };

  const pickMixedProducts = (products, count) => {
    const input = Array.isArray(products) ? products : [];
    const desiredCount = Math.max(0, Number(count) || 0);
    if (desiredCount === 0) return [];

    const buckets = new Map();
    const categoryOrder = [];

    for (const product of input) {
      if (!product || product.id == null) continue;

      const key = getPrimaryCategoryKey(product) ?? '__uncategorized__';
      if (!buckets.has(key)) {
        buckets.set(key, []);
        categoryOrder.push(key);
      }
      buckets.get(key).push(product);
    }

    const selected = [];
    const selectedIds = new Set();

    while (selected.length < desiredCount) {
      let addedInRound = false;

      for (const key of categoryOrder) {
        if (selected.length >= desiredCount) break;

        const bucket = buckets.get(key);
        if (!bucket || bucket.length === 0) continue;

        const candidate = bucket.shift();
        if (!candidate || candidate.id == null || selectedIds.has(candidate.id)) continue;

        selected.push(candidate);
        selectedIds.add(candidate.id);
        addedInRound = true;
      }

      if (!addedInRound) break;
    }

    if (selected.length < desiredCount) {
      for (const product of input) {
        if (selected.length >= desiredCount) break;
        if (!product || product.id == null || selectedIds.has(product.id)) continue;
        selected.push(product);
        selectedIds.add(product.id);
      }
    }

    return selected.slice(0, desiredCount);
  };

  const fetchHomeProducts = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        perPage: '48',
        sort: 'newest',
      });

      const response = await apiServerClient.fetch(`/products?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      const products = Array.isArray(data) ? data : (data?.products || []);
      setHomeProducts(pickMixedProducts(products, 12));
    } catch (error) {
      console.error('Error fetching home products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    toast.success('Welcome to the Soil Community');
    setEmail('');
  };

  const features = [
    { icon: Truck, title: 'Free shipping', description: 'On orders over $75' },
    { icon: Leaf, title: 'Eco-friendly', description: 'Sustainable materials' },
    { icon: Award, title: 'Premium quality', description: 'Handpicked designs' },
    { icon: Users, title: 'Community driven', description: 'Support local artists' }
  ];

  const faqs = [
    {
      question: 'What makes AnfaStyles eco-conscious?',
      answer: 'We use sustainable materials, eco-friendly printing processes, and partner with manufacturers who share our commitment to reducing environmental impact. Every product is made-to-order to minimize waste.'
    },
    {
      question: 'How does print-on-demand work?',
      answer: 'When you place an order, we create your item specifically for you. This eliminates excess inventory and waste. Your product is printed, packaged, and shipped directly to you within 3-7 business days.'
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a 30-day satisfaction guarantee. If you are not completely satisfied with your purchase, contact us for a full refund or exchange. Custom items must be unworn and in original condition.'
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Yes, we ship worldwide. Shipping costs and delivery times vary by location. Free shipping applies to US orders over $75 only.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>AnfaStyles - Conscious creation for sustainable living</title>
        <meta name="description" content="Discover eco-friendly apparel and accessories made with sustainable materials. Join the Soil Community and support conscious creation." />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main>
        <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1698181090645-020da72cbeca"
              alt="Sustainable fashion background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
          </div>

          <div className="container-custom relative z-10 text-white py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-balance" style={{ letterSpacing: '-0.02em' }}>
                Wear your values, support the soil
              </h1>
              <p className="text-lg md:text-xl leading-relaxed mb-8 text-white/90 max-w-prose">
                Every piece tells a story of conscious creation. Sustainable materials, ethical production, and designs that matter.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/shop">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Shop collection
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                    Our story
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-12 bg-muted">
          <div className="container-custom">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container-custom">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-3xl md:text-4xl font-bold mb-2 text-balance">Fresh drops</h2>
                <p className="text-muted-foreground">Latest additions to our conscious collection</p>
              </div>
              <Link to="/shop" className="shrink-0">
                <Button variant="outline">
                  View all
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="w-full aspect-square rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {homeProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link to={`/product/${product.id}`} className="card-product block h-full">
                      <div className="aspect-square bg-muted overflow-hidden">
                          <img
                            src={getImageUrl(product.image) || 'https://images.unsplash.com/photo-1618815909724-861120595390'}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-1 truncate">{product.name}</h3>
                        <ProductRatingStars className="mb-2" showLabel />
                        <p className="font-semibold text-lg font-variant-tabular">${formatPrice(product.price)}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="py-20 bg-muted">
          <div className="container-custom">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Conscious creation, zero waste</h2>
                <p className="text-muted-foreground leading-relaxed mb-6 max-w-prose">
                  Our print-on-demand model means every item is made specifically for you. No excess inventory, no waste. Just quality products created with intention and care for our planet.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Leaf className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm">Sustainable materials sourced from ethical suppliers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Leaf className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm">Made-to-order production eliminates overstock waste</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Leaf className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm">Carbon-neutral shipping on all orders</span>
                  </li>
                </ul>
                <Link to="/about">
                  <Button variant="outline">
                    Learn more about our process
                  </Button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative"
              >
                <img
                  src="https://images.unsplash.com/photo-1618815909724-861120595390"
                  alt="Sustainable production process"
                  className="rounded-2xl shadow-lg w-full"
                />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container-custom max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-balance">Common questions</h2>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container-custom text-center max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Join the Soil Community</h2>
            <p className="text-primary-foreground/90 mb-8 leading-relaxed">
              Get early access to new drops, exclusive discounts, and sustainability tips delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white text-foreground flex-1"
              />
              <Button type="submit" variant="secondary">
                Subscribe
              </Button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default HomePage;
