import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Star, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { toast } from 'sonner';
import apiServerClient from '@/lib/apiServerClient';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [sort, setSort] = useState('popularity');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [category, sort, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: '12',
        sort
      });

      if (category !== 'all') {
        params.append('category', category);
      }

      const response = await apiServerClient.fetch(`/products?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      setProducts(data.products || []);
      setTotalPages(Math.ceil((data.total || 12) / 12));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    setPage(1);
    fetchProducts();
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-semibold mb-3 block">Category</label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All products</SelectItem>
            <SelectItem value="apparel">Apparel</SelectItem>
            <SelectItem value="accessories">Accessories</SelectItem>
            <SelectItem value="home">Home goods</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-semibold mb-3 block">
          Price range: ${priceRange[0]} - ${priceRange[1]}
        </label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={200}
          step={10}
          className="mb-2"
        />
      </div>

      <div>
        <label className="text-sm font-semibold mb-3 block">Sort by</label>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">Popularity</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low to high</SelectItem>
            <SelectItem value="price_desc">Price: High to low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={applyFilters} className="w-full">
        Apply filters
      </Button>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Shop - AnfaStyles</title>
        <meta
          name="description"
          content="Browse our collection of eco-friendly apparel and accessories. Sustainable fashion made with conscious creation."
        />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-12">
        <div className="container-custom">
          <div className="mb-8">
            <h1
              className="text-4xl md:text-5xl font-bold mb-3 text-balance"
              style={{ letterSpacing: '-0.02em' }}
            >
              Shop collection
            </h1>
            <p className="text-muted-foreground">Discover sustainable pieces for conscious living</p>
          </div>

          <div className="flex gap-8">
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold mb-4">Filters</h2>
                <FilterPanel />
              </div>
            </aside>

            <div className="flex-1">
              <div className="flex justify-between items-center mb-6">
                <p className="text-sm text-muted-foreground">
                  {loading ? 'Loading...' : `${products.length} products`}
                </p>

                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterPanel />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="w-full aspect-square rounded-xl" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <SlidersHorizontal className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No products found</h3>
                  <p className="text-sm text-muted-foreground mb-6">Try adjusting your filters</p>
                  <Button onClick={() => { setCategory('all'); setPriceRange([0, 200]); }}>
                    Clear filters
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <Link key={product.id} to={`/product/${product.id}`} className="card-product block">
                        <div className="aspect-square bg-muted overflow-hidden">
                          <img
                            src={product.image || 'https://images.unsplash.com/photo-1618815909724-861120595390'}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold mb-1 truncate">{product.name}</h3>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < Math.floor(product.rating || 4.5) ? 'fill-primary text-primary' : 'text-muted'}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">({product.reviewCount || 0})</span>
                          </div>
                          <p className="font-semibold text-lg font-variant-tabular">${parseFloat(product.price).toFixed(2)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-12">
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-2">
                        {[...Array(totalPages)].map((_, i) => (
                          <Button
                            key={i}
                            variant={page === i + 1 ? 'default' : 'outline'}
                            onClick={() => setPage(i + 1)}
                            size="sm"
                          >
                            {i + 1}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ShopPage;
