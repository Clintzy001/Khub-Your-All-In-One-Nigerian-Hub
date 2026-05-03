import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { SubscriptionPlan, UserSubscription } from '@/types'
import { Check, Crown, Star, Zap, Award, CreditCard, TrendingUp, Shield, AlertCircle, Loader2 } from 'lucide-react'
import { PaystackButton } from 'react-paystack'
import { Toaster } from 'sonner'

interface SubscriptionManagerProps {
  type: 'vendor' | 'service_provider' | 'job_lister' | 'rental_agent' | 'driver'
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ type }) => {
  const { user, profile } = useAuth()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')

  useEffect(() => {
    loadPlans()
    loadCurrentSubscription()
  }, [type, billingCycle])

  const loadPlans = async () => {
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_type', type)
      .eq('billing_cycle', billingCycle)
      .eq('is_active', true)
      .order('price_naira', { ascending: true })

    setPlans(data || [])
    setLoading(false)
  }

  const loadCurrentSubscription = async () => {
    const { data } = await supabase
      .from('user_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('user_id', user!.id)
      .eq('subscription_type', type)
      .eq('status', 'active')
      .single()

    setCurrentSubscription(data)
  }

  const handlePaystackSuccess = async (reference: any) => {
    setProcessingPayment(true)
    
    // Verify payment
    const response = await fetch('/api/payments/paystack/verify-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference: reference.reference,
        plan_id: selectedPlan!.id,
        subscription_type: type,
        billing_cycle: billingCycle
      })
    })

    const result = await response.json()
    
    if (result.success) {
      toast.success('Subscription activated successfully!')
      loadCurrentSubscription()
      setSelectedPlan(null)
    } else {
      toast.error('Payment verification failed')
    }
    
    setProcessingPayment(false)
  }

  const handlePaystackClose = () => {
    toast.error('Payment cancelled')
    setSelectedPlan(null)
  }

  const getPaystackConfig = () => {
    const amount = selectedPlan?.price_naira || 0
    return {
      reference: `SUB_${type}_${user?.id}_${Date.now()}`,
      email: user?.email || '',
      amount: amount * 100, // Paystack uses kobo
      publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      currency: 'NGN',
      metadata: {
        custom_fields: [
          {
            display_name: "Plan Type",
            variable_name: "plan_type",
            value: type
          },
          {
            display_name: "Plan Name",
            variable_name: "plan_name",
            value: selectedPlan?.plan_name
          },
          {
            display_name: "Billing Cycle",
            variable_name: "billing_cycle", 
            value: billingCycle
          }
        ]
      }
    }
  }

  const subscribeToPlan = (plan: SubscriptionPlan) => {
    if (!user) {
      toast.error('Please login to subscribe')
      return
    }
    setSelectedPlan(plan)
  }

  const cancelSubscription = async () => {
    if (!currentSubscription) return
    
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: 'cancelled',
        auto_renew: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSubscription.id)
    
    if (error) {
      toast.error('Failed to cancel subscription')
    } else {
      toast.success('Subscription cancelled')
      loadCurrentSubscription()
    }
  }

  const getPlanIcon = (level: string) => {
    switch (level) {
      case 'basic':
        return <Star className="w-8 h-8" />
      case 'pro':
        return <Zap className="w-8 h-8" />
      case 'premium':
        return <Crown className="w-8 h-8" />
      case 'enterprise':
        return <Award className="w-8 h-8" />
      default:
        return <Star className="w-8 h-8" />
    }
  }

  const getPlanColor = (level: string) => {
    switch (level) {
      case 'basic':
        return 'from-blue-500 to-blue-600'
      case 'pro':
        return 'from-purple-500 to-purple-600'
      case 'premium':
        return 'from-yellow-500 to-yellow-600'
      case 'enterprise':
        return 'from-red-500 to-red-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Choose Your {type.replace('_', ' ').toUpperCase()} Plan</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select the perfect plan for your business. Upgrade anytime to unlock more features.
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1 inline-flex">
          {(['monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingCycle === cycle
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
              {cycle === 'yearly' && (
                <span className="ml-1 text-xs bg-green-500 text-white px-1 rounded">Save 20%</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">
                  Current Plan: {currentSubscription.plan?.plan_name}
                </p>
                <p className="text-sm text-green-700">
                  {currentSubscription.status === 'active' 
                    ? `Valid until ${new Date(currentSubscription.end_date!).toLocaleDateString()}`
                    : 'Subscription expired'}
                </p>
              </div>
            </div>
            <button
              onClick={cancelSubscription}
              className="text-red-600 text-sm underline hover:text-red-700"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${
              currentSubscription?.plan_id === plan.id ? 'ring-2 ring-primary-500' : ''
            }`}
          >
            <div className={`bg-gradient-to-r ${getPlanColor(plan.level)} p-6 text-white`}>
              <div className="flex justify-between items-start">
                {getPlanIcon(plan.level)}
                {plan.level === 'premium' && (
                  <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full">
                    Popular
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold mt-4">{plan.plan_name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">₦{plan.price_naira.toLocaleString()}</span>
                <span className="text-sm">/{plan.billing_cycle}</span>
              </div>
            </div>

            <div className="p-6">
              <ul className="space-y-3 mb-6">
                {plan.features && Object.entries(plan.features).map(([key, value]) => (
                  <li key={key} className="flex items-center gap-2 text-sm">
                    {value ? (
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                    <span className={value ? 'text-gray-700' : 'text-gray-400'}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </li>
                ))}
                
                {plan.max_listings && (
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{plan.max_listings} active listings</span>
                  </li>
                )}
                {plan.max_featured_listings && plan.max_featured_listings > 0 && (
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{plan.max_featured_listings} featured listings/month</span>
                  </li>
                )}
                {plan.commission_rate && (
                  <li className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span>{plan.commission_rate}% commission rate</span>
                  </li>
                )}
                {plan.priority_support && (
                  <li className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-green-500" />
                    <span>Priority support</span>
                  </li>
                )}
              </ul>

              <button
                onClick={() => subscribeToPlan(plan)}
                disabled={currentSubscription?.plan_id === plan.id}
                className={`w-full py-2 rounded-md transition-colors ${
                  currentSubscription?.plan_id === plan.id
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                {currentSubscription?.plan_id === plan.id ? 'Current Plan' : 'Subscribe Now'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Platform Fee Notice */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Platform Fee Notice:</strong> A 15% platform fee applies to all transactions made on KHUB. 
              This fee is automatically deducted and held in escrow until the transaction is completed successfully.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal with Paystack */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 bg-gradient-to-r ${getPlanColor(selectedPlan.level)} rounded-full flex items-center justify-center mx-auto mb-4`}>
                {getPlanIcon(selectedPlan.level)}
              </div>
              <h3 className="text-xl font-semibold">Subscribe to {selectedPlan.plan_name}</h3>
              <p className="text-gray-500 text-sm mt-1">{selectedPlan.plan_name} • {billingCycle} billing</p>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Plan</span>
                <span className="font-semibold">{selectedPlan.plan_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Billing Cycle</span>
                <span className="capitalize font-semibold">{billingCycle}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Subscription Fee</span>
                <span className="font-bold text-primary-500 text-lg">₦{selectedPlan.price_naira.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Platform Fee</span>
                <span className="text-gray-500">Included in price</span>
              </div>
            </div>

            <PaystackButton
              {...getPaystackConfig()}
              text={processingPayment ? "Processing..." : `Pay ₦${selectedPlan.price_naira.toLocaleString()} via Paystack`}
              onSuccess={handlePaystackSuccess}
              onClose={handlePaystackClose}
              className="w-full bg-primary-500 text-white py-3 rounded-md hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={processingPayment}
            />
            
            <button
              onClick={() => setSelectedPlan(null)}
              className="w-full mt-3 text-gray-500 text-sm hover:text-gray-700"
              disabled={processingPayment}
            >
              Cancel
            </button>

            <div className="mt-4 pt-3 border-t text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Secure payment powered by Paystack
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
