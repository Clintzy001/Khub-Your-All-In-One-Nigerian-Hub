import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Star, Filter, ChevronDown, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const products = [
  { id: "1", name: "iPhone 15 Pro Max 256GB", price: 950000, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop", seller: "TechHub NG", verified: true, category: "Phones", rating: 4.8 },
  { id: "2", name: "Samsung Galaxy S24 Ultra", price: 850000, image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop", seller: "Mobile World", verified: true, category: "Phones", rating: 4.7 },
  { id: "3", name: "Nike Air Max 90", price: 45000, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", seller: "Sneaker City", verified: true, category: "Fashion", rating: 4.5 },
  { id: "4", name: "MacBook Pro M3 14-inch", price: 1450000, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop", seller: "Apple Store NG", verified: true, category: "Computing", rating: 4.9 },
  { id: "5", name: "Sony WH-1000XM5 Headphones", price: 185000, image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop", seller: "Audio Hub", verified: false, category: "Electronics", rating: 4.6 },
  { id: "6", name: "Ankara Fabric (6 yards)", price: 8500, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop", seller: "Mama Textile", verified: true, category: "Fashion", rating: 4.3 },
  { id: "7", name: "Standing Desk Adjustable", price: 125000, image: "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=400&h=400&fit=crop", seller: "Office Pro", verified: true, category: "Home & Office", rating: 4.4 },
  { id: "8", name: "Organic Honey (1L)", price: 5500, image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop", seller: "Nature's Best", verified: false, category: "Groceries", rating: 4.2 },
];

const categories = ["All", "Phones", "Fashion", "Computing", "Electronics", "Home & Office", "Groceries"];

const ShopPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { addToCart } = useCart();
  const { t } = useLanguage();

  const filtered = selectedCategory === "All" ? products : products.filter((p) => p.category === selectedCategory);

  const handleAddToCart = (product: typeof products[0]) => {
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image, seller: product.seller });
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("shop")}</h1>
        <span className="text-sm text-muted-foreground">{filtered.length} products</span>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "gradient-purple text-primary-foreground"
                : "border border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group border border-border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all"
          >
            <Link to={`/shop/${product.id}`} className="block">
              <div className="aspect-square overflow-hidden bg-muted">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              </div>
            </Link>
            <div className="p-3">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-muted-foreground">{product.seller}</span>
                {product.verified && <BadgeCheck className="w-3 h-3 text-primary" />}
              </div>
              <Link to={`/shop/${product.id}`}>
                <h3 className="text-sm font-medium text-foreground line-clamp-2 hover:text-primary transition-colors">{product.name}</h3>
              </Link>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 fill-warning text-warning" />
                <span className="text-xs text-muted-foreground">{product.rating}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-base font-bold text-foreground">₦{product.price.toLocaleString()}</p>
                <Button size="sm" className="gradient-purple text-primary-foreground h-8 text-xs" onClick={() => handleAddToCart(product)}>
                  <ShoppingCart className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ShopPage;
