import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";

const CartPage = () => {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const { t } = useLanguage();

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-foreground">Your cart is empty</h1>
        <p className="text-muted-foreground mt-1">Start shopping to add items</p>
        <Link to="/shop"><Button className="mt-4 gradient-purple text-primary-foreground">Browse Shop</Button></Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">{t("cart")} ({items.length})</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 border border-border rounded-xl bg-card">
              <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground text-sm truncate">{item.name}</h3>
                <p className="text-xs text-muted-foreground">{item.seller}</p>
                <p className="font-bold text-foreground mt-1">₦{item.price.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent"><Plus className="w-3 h-3" /></button>
                  <button onClick={() => removeFromCart(item.id)} className="ml-auto text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 border border-border rounded-xl bg-card h-fit sticky top-20">
          <h2 className="font-semibold text-foreground mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">₦{total.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="text-foreground">Calculated at checkout</span></div>
            <div className="border-t border-border pt-2 flex justify-between font-semibold text-base"><span className="text-foreground">Total</span><span className="text-foreground">₦{total.toLocaleString()}</span></div>
          </div>
          <Link to="/checkout">
            <Button className="w-full mt-4 gradient-purple text-primary-foreground" size="lg">
              {t("checkout")} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <p className="text-xs text-center text-muted-foreground mt-3">Secure payment via Escrow</p>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
