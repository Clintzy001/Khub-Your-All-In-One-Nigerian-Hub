import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { SubscriptionPlan, UserSubscription } from '@/types'
import { Check, Crown, Star, Zap, Award, CreditCard, TrendingUp, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

interface SubscriptionManagerProps {
  type: 'vendor' | 'service_provider' | 'job_lister' | 'rental_agent' | 'driver'
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ type }) => {
  const { user } = useAuth()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  useEffect(() => {
    loadPlans()
    loadCurrentSubscription()
  }, [type])

  const loadPlans = async () => {
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_type', type)
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

  const subscribeToPlan = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setShowPaymentModal(true)
  }

  const processPayment = async () => {
    const response = await fetch('/api/payments/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: selectedPlan!.price_naira,
        email: user?.email,
        metadata: {
          type: 'subscription',
          plan_id: selectedPlan!.id,
          subscription_type: type
        }
      })
    })

    const data = await response.json()
    if (data.authorization_url) {
      window.location.href = data.authorization_url
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
    return <div className="flex justify-center p-8">Loading plans...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select the perfect plan for your {type.replace('_', ' ')} business. Upgrade anytime to unlock more features.
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Current Plan: {currentSubscription.plan?.plan_name}</p>
                <p className="text-sm text-green-700">
                  Expires on {new Date(currentSubscription.end_date!).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button className="text-green-700 text-sm underline">Manage Subscription</button>
          </div>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-105 ${
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
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                    <span className={value ? 'text-gray-700' : 'text-gray-400'}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </li>
                ))}
                
                {/* Plan-specific limits */}
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

      {/* Features Comparison Table */}
      <div className="mt-12 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Compare All Features</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Feature</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="px-6 py-3 text-center">{plan.plan_name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 font-medium">Price</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.price_naira === 0 ? 'Free' : `₦${plan.price_naira.toLocaleString()}`}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Max Listings</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.max_listings === 0 ? 'Unlimited' : plan.max_listings}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Featured Listings</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.max_featured_listings || 0}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Commission Rate</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.commission_rate}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Analytics Dashboard</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.features?.analytics ? '✓' : '✗'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Priority Support</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.priority_support ? '✓' : '✗'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Dedicated Account Manager</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="px-6 py-4 text-center">
                    {plan.dedicated_account_manager ? '✓' : '✗'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Subscribe to {selectedPlan.plan_name}</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span>Plan</span>
                <span className="font-semibold">{selectedPlan.plan_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Billing Cycle</span>
                <span className="capitalize">{selectedPlan.billing_cycle}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Amount</span>
                <span className="font-bold text-primary-500">₦{selectedPlan.price_naira.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={processPayment}
              className="w-full bg-primary-500 text-white py-3 rounded-md hover:bg-primary-600 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Proceed to Payment
            </button>
            
            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full mt-3 text-gray-500 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
