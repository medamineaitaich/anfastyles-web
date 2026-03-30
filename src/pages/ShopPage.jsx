import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
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
import ProductRatingStars from '@/components/ProductRatingStars.jsx';

const DEFAULT_CATEGORY = 'all';
const DEFAULT_SORT = 'popularity';
const DEFAULT_PAGE = 1;
const VALID_CATEGORIES = new Set(['all', 'apparel', 'accessories', 'home']);
const VALID_SORTS = new Set(['popularity', 'newest', 'price_asc', 'price_desc']);

const normalizeCategory = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return VALID_CATEGORIES.has(normalized) ? normalized : DEFAULT_CATEGORY;
};

const normalizeSort = (value) => {
  const normalized = String(value || '').trim();
  return VALID_SORTS.has(normalized) ? normalized : DEFAULT_SORT;
};

const normalizePage = (value) => {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PAGE;
};

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(() => normalizeCategory(searchParams.get('category')));
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [sort, setSort] = useState(() => normalizeSort(searchParams.get('sort')));
  const [page, setPage] = useState(() => normalizePage(searchParams.get('page')));
  const [totalPages, setTotalPages] = useState(1);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const searchTerm = searchParams.get('search')?.trim() || '';
  const hasActiveFilters = category !== DEFAULT_CATEGORY || sort !== DEFAULT_SORT;

  useEffect(() => {
    fetchProducts();
  }, [category, sort, page, searchTerm]);

  useEffect(() => {
    const nextCategory = normalizeCategory(searchParams.get('category'));
    const nextSort = normalizeSort(searchParams.get('sort'));
    const nextPage = normalizePage(searchParams.get('page'));

    setCategory((current) => current === nextCategory ? current : nextCategory);
    setSort((current) => current === nextSort ? current : nextSort);
    setPage((current) => current === nextPage ? current : nextPage);
  }, [searchParams]);

  const updateQueryParams = (updates) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      const shouldDelete = value == null
        || value === ''
        || (key === 'category' && value === DEFAULT_CATEGORY)
        || (key === 'sort' && value === DEFAULT_SORT)
        || (key === 'page' && Number(value) === DEFAULT_PAGE);

      if (shouldDelete) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });

    setSearchParams(nextParams);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        perPage: '12',
        sort
      });

      if (category !== DEFAULT_CATEGORY) {
        params.append('category', category);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await apiServerClient.fetch(`/products?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      const nextProducts = data.products || [];
      setProducts(nextProducts);

      const apiTotalPages = Number(data.totalPages);
      if (apiTotalPages && apiTotalPages > 0) {
        setTotalPages(apiTotalPages);
      } else {
        const total = Number(data.total) || nextProducts.length || 0;
        setTotalPages(Math.max(1, Math.ceil(total / 12)));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (page !== DEFAULT_PAGE) {
      setPage(DEFAULT_PAGE);
    }

    updateQueryParams({
      category,
      sort,
      page: DEFAULT_PAGE,
    });
  };

  const handleCategoryChange = (nextCategory) => {
    setCategory(nextCategory);
    setPage(DEFAULT_PAGE);
    updateQueryParams({
      category: nextCategory,
      page: DEFAULT_PAGE,
    });
  };

  const handleSortChange = (nextSort) => {
    setSort(nextSort);
    setPage(DEFAULT_PAGE);
    updateQueryParams({
      sort: nextSort,
      page: DEFAULT_PAGE,
    });
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    updateQueryParams({ page: nextPage });
  };

  const clearFilters = () => {
    setCategory(DEFAULT_CATEGORY);
    setPriceRange([0, 200]);
    setSort(DEFAULT_SORT);
    setPage(DEFAULT_PAGE);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('category');
    nextParams.delete('sort');
    nextParams.delete('page');

    if (!hasActiveFilters && searchTerm) {
      nextParams.delete('search');
    }

    setSearchParams(nextParams);
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-semibold mb-3 block">Category</label>
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_CATEGORY}>All products</SelectItem>
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
        <Select value={sort} onValueChange={handleSortChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DEFAULT_SORT}>Popularity</SelectItem>
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
            <p className="text-muted-foreground">
              {searchTerm
                ? `Showing results for "${searchTerm}"`
                : 'Discover sustainable pieces for conscious living'}
            </p>
          </div>

          <div className="flex gap-8">
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold mb-4">Filters</h2>
                <FilterPanel />
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {loading ? 'Loading...' : `${products.length} product${products.length === 1 ? '' : 's'}`}
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
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:gap-3 lg:grid-cols-4">
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
                  <p className="text-sm text-muted-foreground mb-6">
                    {searchTerm && hasActiveFilters
                      ? `No results matched "${searchTerm}" with the current filters.`
                      : searchTerm
                      ? `No results matched "${searchTerm}". Try another search or adjust your filters.`
                      : 'Try adjusting your filters'}
                  </p>
                  <Button onClick={clearFilters}>
                    {!hasActiveFilters && searchTerm ? 'Clear search' : 'Clear filters'}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:gap-3 lg:grid-cols-4">
                    {products.map((product) => (
                      <Link key={product.id} to={`/product/${product.id}`} className="card-product block">
                        <div className="aspect-square bg-muted overflow-hidden">
                          <img
                            src={product.image || 'https://images.unsplash.com/photo-1618815909724-861120595390'}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                        <div className="p-3 lg:p-4">
                          <h3 className="font-semibold mb-1 truncate">{product.name}</h3>
                          <ProductRatingStars className="mb-2" showLabel />
                          <p className="font-semibold text-lg font-variant-tabular">${parseFloat(product.price).toFixed(2)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-12">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(Math.max(DEFAULT_PAGE, page - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-2">
                        {[...Array(totalPages)].map((_, i) => (
                          <Button
                            key={i}
                            variant={page === i + 1 ? 'default' : 'outline'}
                            onClick={() => handlePageChange(i + 1)}
                            size="sm"
                          >
                            {i + 1}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
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
