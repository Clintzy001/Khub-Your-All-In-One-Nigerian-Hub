import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CartItem, ShippingAddress, PromoCode } from '@/types'
import { 
  CreditCard, 
  Truck, 
  MapPin, 
  Check, 
  ChevronRight,
  Wallet,
  Building2,
  Home,
  Plus,
  Edit,
  Trash2,
  Ticket,
  Loader2
} from 'lucide-react'
import { generateReceiptPDF } from '@/utils/receiptGenerator'
import { Toaster } from 'sonner'

type CheckoutStep = 'address' | 'shipping' | 'payment' | 'review'

export const Checkout: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cart, setCart] = useState<any>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address')
  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [selectedAddress, setSelectedAddress] = useState<ShippingAddress | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [newAddress, setNewAddress] = useState<Partial<ShippingAddress>>({})
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null)
  const [discount, setDiscount] = useState(0)
  const [shippingCost, setShippingCost] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card' | 'bank'>('card')
  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)

  useEffect(() => {
    if (user) {
      loadCart()
      loadAddresses()
    }
  }, [user])

  const loadCart = async () => {
    // Get active cart
    const { data: cartData } = await supabase
      .from('carts')
      .select(`
        *,
        items:cart_items(
          *,
          product:products(*)
        )
      `)
      .eq('user_id', user!.id)
      .eq('status', 'active')
      .single()

    if (cartData) {
      setCart(cartData)
      setCartItems(cartData.items)
    } else {
      navigate('/cart')
    }
  }

  const loadAddresses = async () => {
    const { data } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('user_id', user!.id)
      .order('is_default', { ascending: false })

    setAddresses(data || [])
    const defaultAddr = data?.find(a => a.is_default)
    if (defaultAddr) setSelectedAddress(defaultAddr)
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + shippingCost - discount
  }

  const applyPromoCode = async () => {
    if (!promoCode) return

    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', promoCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !data) {
      toast.error('Invalid promo code')
      return
    }

    const subtotal = calculateSubtotal()
    if (data.minimum_order && subtotal < data.minimum_order) {
      toast.error(`Minimum order of ₦${data.minimum_order.toLocaleString()} required`)
      return
    }

    let discountAmount = 0
    if (data.discount_type === 'percentage') {
      discountAmount = (subtotal * data.discount_value) / 100
      if (data.maximum_discount && discountAmount > data.maximum_discount) {
        discountAmount = data.maximum_discount
      }
    } else {
      discountAmount = data.discount_value
    }

    setDiscount(discountAmount)
    setAppliedPromo(data)
    toast.success(`Promo code applied! You saved ₦${discountAmount.toLocaleString()}`)
  }

  const createOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a shipping address')
      return
    }

    setLoading(true)

    const orderNumber = `KHUB-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user!.id,
        seller_id: cartItems[0]?.product.seller_id,
        order_number: orderNumber,
        total_amount: calculateTotal(),
        status: 'pending',
        payment_status: 'pending',
        shipping_address: selectedAddress,
        created_at: new Date()
      })
      .select()
      .single()

    if (orderError) {
      toast.error('Failed to create order')
      setLoading(false)
      return
    }

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      toast.error('Failed to create order items')
      setLoading(false)
      return
    }

    // Apply promo code if used
    if (appliedPromo) {
      await supabase
        .from('applied_promos')
        .insert({
          order_id: order.id,
          promo_code_id: appliedPromo.id,
          discount_amount: discount
        })
    }

    // Process payment based on method
    if (paymentMethod === 'wallet') {
      await processWalletPayment(order.id)
    } else {
      await processCardPayment(order.id)
    }

    // Clear cart
    await supabase
      .from('carts')
      .update({ status: 'completed' })
      .eq('id', cart.id)

    setOrderPlaced(true)
    setLoading(false)

    // Generate receipt
    await generateReceiptPDF(order.id, orderNumber, cartItems, calculateTotal(), discount)

    toast.success('Order placed successfully!')
    setTimeout(() => navigate(`/order/${order.id}`), 2000)
  }

  const processWalletPayment = async (orderId: string) => {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user!.id)
      .single()

    if (wallet.balance < calculateTotal()) {
      toast.error('Insufficient wallet balance')
      throw new Error('Insufficient balance')
    }

    await supabase
      .from('wallets')
      .update({ balance: wallet.balance - calculateTotal() })
      .eq('user_id', user!.id)

    await supabase
      .from('orders')
      .update({ 
        payment_status: 'paid',
        status: 'processing'
      })
      .eq('id', orderId)
  }

  const processCardPayment = async (orderId: string) => {
    // Initialize Paystack payment
    const response = await fetch('/api/payments/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: calculateTotal(),
        email: user?.email,
        order_id: orderId
      })
    })

    const data = await response.json()
    if (data.authorization_url) {
      window.location.href = data.authorization_url
    }
  }

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
        <p className="text-gray-600 mb-6">Thank you for your purchase. You will receive a confirmation email shortly.</p>
        <button
          onClick={() => navigate('/orders')}
          className="bg-primary-500 text-white px-6 py-2 rounded-md hover:bg-primary-600"
        >
          View My Orders
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Checkout Steps */}
          <div className="flex mb-8 border-b">
            {(['address', 'shipping', 'payment', 'review'] as CheckoutStep[]).map((step, index) => (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className={`flex-1 pb-4 text-center border-b-2 transition-colors ${
                  currentStep === step
                    ? 'border-primary-500 text-primary-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-sm font-medium capitalize">{step}</span>
              </button>
            ))}
          </div>

          {/* Address Step */}
          {currentStep === 'address' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Shipping Address</h3>
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="text-primary-500 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add New Address
                </button>
              </div>

              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedAddress?.id === address.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedAddress(address)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {selectedAddress?.id === address.id && (
                            <Check className="w-5 h-5 text-primary-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{address.full_name}</p>
                          <p className="text-sm text-gray-600">{address.phone}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {address.address_line1}<br />
                            {address.address_line2 && <>{address.address_line2}<br /></>}
                            {address.city}, {address.state}<br />
                            {address.country}
                          </p>
                          {address.is_default && (
                            <span className="inline-block bg-gray-100 text-xs px-2 py-1 rounded mt-2">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 rounded text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {addresses.length === 0 && (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">No saved addresses</p>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="mt-2 text-primary-500"
                  >
                    Add your first address
                  </button>
                </div>
              )}

              {selectedAddress && (
                <button
                  onClick={() => setCurrentStep('shipping')}
                  className="mt-6 w-full bg-primary-500 text-white py-3 rounded-md hover:bg-primary-600 flex items-center justify-center gap-2"
                >
                  Continue to Shipping
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Shipping Step */}
          {currentStep === 'shipping' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Shipping Method</h3>
              <div className="space-y-3">
                {[
                  { name: 'Standard Delivery', days: '3-5 business days', price: 1500 },
                  { name: 'Express Delivery', days: '1-2 business days', price: 3500 },
                  { name: 'Same Day Delivery', days: 'Within 24 hours', price: 5000 }
                ].map((method) => (
                  <label
                    key={method.name}
                    className={`border rounded-lg p-4 flex justify-between items-center cursor-pointer ${
                      shippingCost === method.price ? 'border-primary-500 bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingCost === method.price}
                        onChange={() => setShippingCost(method.price)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold">{method.name}</p>
                        <p className="text-sm text-gray-600">{method.days}</p>
                      </div>
                    </div>
                    <p className="font-semibold">₦{method.price.toLocaleString()}</p>
                  </label>
                ))}
              </div>

              <button
                onClick={() => setCurrentStep('payment')}
                className="mt-6 w-full bg-primary-500 text-white py-3 rounded-md hover:bg-primary-600"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Payment Step */}
          {currentStep === 'payment' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
              <div className="space-y-3">
                <label className={`border rounded-lg p-4 flex items-center gap-3 cursor-pointer ${
                  paymentMethod === 'wallet' ? 'border-primary-500 bg-primary-50' : ''
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="wallet"
                    checked={paymentMethod === 'wallet'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                  />
                  <Wallet className="w-5 h-5" />
                  <div>
                    <p className="font-semibold">KHUB Wallet</p>
                    <p className="text-sm text-gray-600">Pay using your wallet balance</p>
                  </div>
                </label>

                <label className={`border rounded-lg p-4 flex items-center gap-3 cursor-pointer ${
                  paymentMethod === 'card' ? 'border-primary-500 bg-primary-50' : ''
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                  />
                  <CreditCard className="w-5 h-5" />
                  <div>
                    <p className="font-semibold">Credit/Debit Card</p>
                    <p className="text-sm text-gray-600">Pay with card (Paystack)</p>
                  </div>
                </label>
              </div>

              <button
                onClick={() => setCurrentStep('review')}
                className="mt-6 w-full bg-primary-500 text-white py-3 rounded-md hover:bg-primary-600"
              >
                Review Order
              </button>
            </div>
          )}

          {/* Review Step */}
          {currentStep === 'review' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Review Your Order</h3>
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b pb-4">
                    <img
                      src={item.product.images?.[0] || '/placeholder.jpg'}
                      alt={item.product.title}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{item.product.title}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-primary-500 font-semibold">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="flex justify-between py-2">
                    <span>Subtotal</span>
                    <span>₦{calculateSubtotal().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Shipping</span>
                    <span>₦{shippingCost.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between py-2 text-green-600">
                      <span>Discount</span>
                      <span>-₦{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-lg font-bold border-t mt-2 pt-2">
                    <span>Total</span>
                    <span>₦{calculateTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={createOrder}
                disabled={loading}
                className="mt-6 w-full bg-green-500 text-white py-3 rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
            <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Items ({cartItems.length})</span>
                <span>₦{calculateSubtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>₦{shippingCost.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₦{discount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="border-t pt-3 mb-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₦{calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            {/* Promo Code */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Promo code"
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <button
                  onClick={applyPromoCode}
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Secure Checkout Notice */}
            <div className="text-center text-sm text-gray-500">
              <p className="flex items-center justify-center gap-1">
                <Check className="w-4 h-4 text-green-500" />
                Secure checkout
              </p>
              <p className="mt-1">Your payment is encrypted and secure</p>
            </div>
          </div>
        </div>
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <AddressFormModal
          onClose={() => setShowAddressForm(false)}
          onSave={(address) => {
            setAddresses([...addresses, address])
            setShowAddressForm(false)
          }}
        />
      )}
    </div>
  )
}
