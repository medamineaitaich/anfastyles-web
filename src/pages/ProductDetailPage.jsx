import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { Star, Minus, Plus, ShoppingCart, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import apiServerClient from '@/lib/apiServerClient';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import CartDrawer from '@/components/CartDrawer.jsx';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchRelatedProducts();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await apiServerClient.fetch(`/products/${id}`);
      if (!response.ok) throw new Error('Product not found');

      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    try {
      const response = await apiServerClient.fetch('/products/featured');
      if (!response.ok) return;

      const data = await response.json();
      setRelatedProducts(data.slice(0, 4));
    } catch (error) {
      console.error('Error fetching related products:', error);
    }
  };

  const addToCart = () => {
    if (!product) return;

    const cart = JSON.parse(localStorage.getItem('anfaCart') || '{"items":[],"subtotal":0,"itemCount":0}');

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === product.id && item.size === selectedSize && item.color === selectedColor
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image: product.images?.[0] || product.image,
        quantity,
        size: selectedSize,
        color: selectedColor
      });
    }

    cart.subtotal = cart.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    localStorage.setItem('anfaCart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Added to cart');
    setCartDrawerOpen(true);
  };

  if (loading) {
    return (
      <>
        <Header onCartClick={() => setCartDrawerOpen(true)} />
        <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
        <main className="py-12">
          <div className="container-custom">
            <div className="grid gap-12 md:grid-cols-2">
              <div className="space-y-4">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
                </div>
              </div>
              <div className="space-y-6">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header onCartClick={() => setCartDrawerOpen(true)} />
        <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
        <main className="py-20">
          <div className="container-custom text-center">
            <h1 className="mb-4 text-2xl font-bold">Product not found</h1>
            <Link to="/shop">
              <Button>Continue shopping</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const images = product.images || [product.image];
  const averageRating = product.rating || 4.5;

  return (
    <>
      <Helmet>
        <title>{`${product.name} - AnfaStyles`}</title>
        <meta
          name="description"
          content={product.description?.substring(0, 160) || `Shop ${product.name} at AnfaStyles`}
        />
      </Helmet>

      <Header onCartClick={() => setCartDrawerOpen(true)} />
      <CartDrawer open={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <main className="py-12">
        <div className="container-custom">
          <Link
            to="/shop"
            className="mb-8 inline-flex items-center text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to shop
          </Link>

          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <div className="mb-4 aspect-square overflow-hidden rounded-xl bg-muted">
                <img
                  src={images[selectedImage] || 'https://images.unsplash.com/photo-1618815909724-861120595390'}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                        selectedImage === index ? 'border-primary' : 'border-transparent hover:border-border'
                      }`}
                    >
                      <img src={img} alt={`${product.name} view ${index + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h1
                className="mb-3 text-3xl font-bold text-balance md:text-4xl"
                style={{ letterSpacing: '-0.02em' }}
              >
                {product.name}
              </h1>

              <div className="mb-4 flex items-center gap-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(averageRating) ? 'fill-primary text-primary' : 'text-muted'}`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {averageRating.toFixed(1)} ({product.reviews?.length || 0} reviews)
                </span>
              </div>

              <p className="mb-6 text-3xl font-bold font-variant-tabular">${parseFloat(product.price).toFixed(2)}</p>

              <p className="mb-6 max-w-prose leading-relaxed text-muted-foreground">
                {product.description || 'Sustainably crafted with eco-friendly materials. Made-to-order to reduce waste and support conscious creation.'}
              </p>

              <Separator className="my-6" />

              <div className="mb-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Size</label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xs">XS</SelectItem>
                      <SelectItem value="s">S</SelectItem>
                      <SelectItem value="m">M</SelectItem>
                      <SelectItem value="l">L</SelectItem>
                      <SelectItem value="xl">XL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Color</label>
                  <Select value={selectedColor} onValueChange={setSelectedColor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="black">Black</SelectItem>
                      <SelectItem value="white">White</SelectItem>
                      <SelectItem value="green">Forest green</SelectItem>
                      <SelectItem value="brown">Earth brown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Quantity</label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={addToCart} size="lg" className="w-full">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to cart
              </Button>

              <div className="mt-6 rounded-lg bg-muted p-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Free shipping on orders over $75</li>
                  <li>• Made-to-order, ships in 3-7 business days</li>
                  <li>• 30-day satisfaction guarantee</li>
                  <li>• Sustainable materials, eco-friendly production</li>
                </ul>
              </div>
            </div>
          </div>

          {product.reviews && product.reviews.length > 0 && (
            <section className="mt-20">
              <h2 className="mb-6 text-2xl font-bold">Customer reviews</h2>
              <div className="space-y-6">
                {product.reviews.map((review, index) => (
                  <div key={index} className="rounded-lg border border-border p-6">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted'}`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold">{review.reviewer}</span>
                      <span className="text-sm text-muted-foreground">{review.date}</span>
                    </div>
                    <p className="leading-relaxed text-muted-foreground">{review.review}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {relatedProducts.length > 0 && (
            <section className="mt-20">
              <h2 className="mb-6 text-2xl font-bold">You might also like</h2>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {relatedProducts.map((relatedProduct) => (
                  <Link key={relatedProduct.id} to={`/product/${relatedProduct.id}`} className="card-product block">
                    <div className="aspect-square overflow-hidden bg-muted">
                      <img
                        src={relatedProduct.image || 'https://images.unsplash.com/photo-1618815909724-861120595390'}
                        alt={relatedProduct.name}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="mb-1 truncate text-sm font-semibold">{relatedProduct.name}</h3>
                      <p className="font-semibold font-variant-tabular">${parseFloat(relatedProduct.price).toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
};

export default ProductDetailPage;
