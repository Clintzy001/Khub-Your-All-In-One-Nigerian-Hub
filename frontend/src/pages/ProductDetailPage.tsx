import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, Star, BadgeCheck, Shield, Share2, Heart, Truck, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Demo products (same as ShopPage for now)
const allProducts = [
  { id: "1", name: "iPhone 15 Pro Max 256GB", price: 950000, images: ["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=600&fit=crop"], seller: "TechHub NG", sellerId: "seller1", verified: true, category: "Phones", rating: 4.8, reviews: 234, sales: 1200, desc: "Latest iPhone 15 Pro Max with A17 Pro chip, 48MP camera system, titanium design. 256GB storage. Genuine product with 1 year warranty.", warranty: "1 Year", returnPolicy: "7 Days Return" },
  { id: "2", name: "Samsung Galaxy S24 Ultra", price: 850000, images: ["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&h=600&fit=crop"], seller: "Mobile World", sellerId: "seller2", verified: true, category: "Phones", rating: 4.7, reviews: 189, sales: 890, desc: "Samsung Galaxy S24 Ultra with S Pen, 200MP camera, Snapdragon 8 Gen 3. Premium build quality.", warranty: "1 Year", returnPolicy: "7 Days Return" },
  { id: "3", name: "Nike Air Max 90", price: 45000, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop"], seller: "Sneaker City", sellerId: "seller3", verified: true, category: "Fashion", rating: 4.5, reviews: 78, sales: 456, desc: "Classic Nike Air Max 90 sneakers. Authentic product. Available in multiple sizes.", warranty: "6 Months", returnPolicy: "14 Days Return" },
  { id: "4", name: "MacBook Pro M3 14-inch", price: 1450000, images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop"], seller: "Apple Store NG", sellerId: "seller4", verified: true, category: "Computing", rating: 4.9, reviews: 312, sales: 2100, desc: "MacBook Pro with M3 chip, 14-inch Liquid Retina XDR display. 18-hour battery life. Perfect for professionals.", warranty: "1 Year Apple Care", returnPolicy: "14 Days Return" },
  { id: "5", name: "Sony WH-1000XM5 Headphones", price: 185000, images: ["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&h=600&fit=crop"], seller: "Audio Hub", sellerId: "seller5", verified: false, category: "Electronics", rating: 4.6, reviews: 156, sales: 670, desc: "Industry-leading noise cancellation headphones. 30-hour battery life. Premium sound quality.", warranty: "1 Year", returnPolicy: "7 Days Return" },
  { id: "6", name: "Ankara Fabric (6 yards)", price: 8500, images: ["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=600&fit=crop"], seller: "Mama Textile", sellerId: "seller6", verified: true, category: "Fashion", rating: 4.3, reviews: 45, sales: 230, desc: "Premium quality Ankara fabric, 6 yards. Beautiful patterns for any occasion.", warranty: "No Warranty", returnPolicy: "3 Days Return" },
  { id: "7", name: "Standing Desk Adjustable", price: 125000, images: ["https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=600&h=600&fit=crop"], seller: "Office Pro", sellerId: "seller7", verified: true, category: "Home & Office", rating: 4.4, reviews: 67, sales: 340, desc: "Electric height-adjustable standing desk. Ergonomic design for comfortable work.", warranty: "2 Years", returnPolicy: "7 Days Return" },
  { id: "8", name: "Organic Honey (1L)", price: 5500, images: ["https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&h=600&fit=crop"], seller: "Nature's Best", sellerId: "seller8", verified: false, category: "Groceries", rating: 4.2, reviews: 34, sales: 120, desc: "100% pure organic honey from Nigerian farms. No additives, no preservatives.", warranty: "Best Before Date", returnPolicy: "No Return" },
];

const ProductDetailPage = () => {
  const { productId } = useParams();
  const { addToCart } = useCart();
  const [wishlisted, setWishlisted] = useState(false);

  const product = allProducts.find(p => p.id === productId);

  if (!product) return (
    <div className="container py-20 text-center">
      <h2 className="text-xl font-semibold text-foreground">Product not found</h2>
      <Link to="/shop" className="text-primary mt-4 inline-block">← Back to Shop</Link>
    </div>
  );

  const handleAddToCart = () => {
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.images[0], seller: product.seller });
    toast.success(`${product.name} added to cart!`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Product link copied!");
  };

  return (
    <div className="container py-6 max-w-4xl">
      <Link to="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Shop
      </Link>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Image */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        </motion.div>

        {/* Details */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to={`/profile/${product.sellerId}`} className="text-sm text-primary hover:underline">{product.seller}</Link>
              {product.verified && <BadgeCheck className="w-4 h-4 text-primary" />}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-warning text-warning" />
                <span className="text-sm font-medium text-foreground">{product.rating}</span>
                <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
              </div>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{product.sales.toLocaleString()} sold</span>
            </div>
          </div>

          <p className="text-3xl font-bold text-foreground">₦{product.price.toLocaleString()}</p>

          <p className="text-sm text-muted-foreground leading-relaxed">{product.desc}</p>

          {/* Trust indicators */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-primary" />
              <span>Escrow Protected — Pay safely</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="w-4 h-4 text-primary" />
              <span>Delivery available nationwide</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-xs px-2 py-0.5 rounded bg-accent text-accent-foreground">🛡 {product.warranty}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-accent text-accent-foreground">↩ {product.returnPolicy}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleAddToCart} className="flex-1 gradient-purple text-primary-foreground" size="lg">
              <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
            </Button>
            <Button size="lg" variant="outline" onClick={() => { setWishlisted(!wishlisted); toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist"); }} className={`border-border ${wishlisted ? "text-destructive" : "text-foreground"}`}>
              <Heart className={`w-4 h-4 ${wishlisted ? "fill-destructive" : ""}`} />
            </Button>
            <Button size="lg" variant="outline" onClick={handleShare} className="border-border text-foreground">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Reviews section placeholder */}
      <div className="mt-10 p-6 border border-border rounded-xl bg-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">Customer Reviews</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-foreground">{product.rating}</p>
            <div className="flex gap-0.5 mt-1">{[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.round(product.rating) ? "fill-warning text-warning" : "text-muted"}`} />)}</div>
            <p className="text-xs text-muted-foreground mt-1">{product.reviews} reviews</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Reviews will appear here once customers provide feedback.</p>
      </div>
    </div>
  );
};

export default ProductDetailPage;
