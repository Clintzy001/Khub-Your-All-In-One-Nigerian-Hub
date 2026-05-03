import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { 
  Share2, 
  Copy, 
  Check, 
  Users, 
  DollarSign, 
  TrendingUp,
  Gift,
  Clock,
  ExternalLink
} from 'lucide-react'
import { Toaster } from 'sonner'

export const ReferralDashboard: React.FC = () => {
  const { user, profile } = useAuth()
  const [referrals, setReferrals] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    pendingRewards: 0,
    conversionRate: 0,
    clicks: 0
  })
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  const referralLink = `https://khub.com.ng/ref/${profile?.referral_code}`

  useEffect(() => {
    if (user) {
      loadReferralData()
      
      // Subscribe to real-time referral updates
      const subscription = supabase
        .channel('referral_updates')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'referrals', filter: `referrer_id=eq.${user.id}` },
          () => loadReferralData()
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user])

  const loadReferralData = async () => {
    // Get referrals
    const { data: referralsData } = await supabase
      .from('referrals')
      .select(`
        *,
        referred:profiles!referred_user_id (
          full_name,
          email,
          created_at
        )
      `)
      .eq('referrer_id', user!.id)
      .order('created_at', { ascending: false })

    // Get clicks
    const { data: clicksData } = await supabase
      .from('referral_clicks')
      .select('*')
      .eq('referral_code', profile?.referral_code)

    // Calculate stats
    const totalReferrals = referralsData?.length || 0
    const completedReferrals = referralsData?.filter(r => r.status === 'completed') || []
    const totalEarnings = completedReferrals.reduce((sum, r) => sum + (r.reward_amount || 0), 0)
    const pendingRewards = referralsData?.filter(r => r.status === 'pending').length || 0
    const conversionRate = clicksData?.length ? (totalReferrals / clicksData.length) * 100 : 0

    setReferrals(referralsData || [])
    setStats({
      totalReferrals,
      totalEarnings,
      pendingRewards,
      conversionRate,
      clicks: clicksData?.length || 0
    })
    setLoading(false)
  }

  const copyReferralLink = async () => {
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOnWhatsApp = () => {
    const text = `Join KHUB using my referral link and earn rewards! ${referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const shareOnTwitter = () => {
    const text = `Join KHUB using my referral link and earn rewards!`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`, '_blank')
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading referral data...</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Referral Program</h1>
        <p className="text-gray-600">Invite friends and earn rewards when they join KHUB</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex justify-between items-start mb-2">
            <Users className="w-6 h-6" />
            <span className="text-2xl font-bold">{stats.totalReferrals}</span>
          </div>
          <p className="text-purple-100">Total Referrals</p>
          <p className="text-sm text-purple-200">{stats.pendingRewards} pending</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex justify-between items-start mb-2">
            <DollarSign className="w-6 h-6" />
            <span className="text-2xl font-bold">₦{stats.totalEarnings.toLocaleString()}</span>
          </div>
          <p className="text-green-100">Total Earnings</p>
          <p className="text-sm text-green-200">Lifetime rewards</p>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex justify-between items-start mb-2">
            <TrendingUp className="w-6 h-6" />
            <span className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</span>
          </div>
          <p className="text-blue-100">Conversion Rate</p>
          <p className="text-sm text-blue-200">{stats.clicks} total clicks</p>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex justify-between items-start mb-2">
            <Gift className="w-6 h-6" />
            <span className="text-2xl font-bold">₦200</span>
          </div>
          <p className="text-orange-100">Per Referral</p>
          <p className="text-sm text-orange-200">+ subscription bonuses</p>
        </div>
      </div>

      {/* Referral Link Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Your Referral Link</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 bg-gray-50 rounded-lg p-3 font-mono text-sm break-all">
            {referralLink}
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyReferralLink}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={shareOnWhatsApp}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              WhatsApp
            </button>
            <button
              onClick={shareOnTwitter}
              className="px-4 py-2 bg-blue-400 text-white rounded-md hover:bg-blue-500 transition-colors"
            >
              Twitter
            </button>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Share2 className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className="font-semibold mb-2">1. Share Your Link</h3>
            <p className="text-sm text-gray-600">Share your unique referral link with friends</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className="font-semibold mb-2">2. Friend Joins</h3>
            <p className="text-sm text-gray-600">They sign up using your link</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className="font-semibold mb-2">3. Earn Rewards</h3>
            <p className="text-sm text-gray-600">Get ₦200 when they verify their account</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Bonus Rewards</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Friend subscribes to Verified plan</span>
              <span className="font-semibold text-green-600">+₦500</span>
            </div>
            <div className="flex justify-between">
              <span>Friend subscribes to Premium plan</span>
              <span className="font-semibold text-green-600">+₦1,000</span>
            </div>
            <div className="flex justify-between">
              <span>Transaction commission (2.5%)</span>
              <span className="font-semibold text-green-600">On all purchases</span>
            </div>
          </div>
        </div>
      </div>

      {/* Referral History */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Referral History</h2>
        </div>
        
        {referrals.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No referrals yet</p>
            <p className="text-sm">Share your link to start earning!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {referrals.map((referral) => (
              <div key={referral.id} className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    referral.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="font-medium">
                      {referral.referred?.full_name || 'New User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Joined {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {referral.status === 'completed' ? (
                    <>
                      <p className="font-semibold text-green-600">
                        +₦{referral.reward_amount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {referral.reward_type}
                      </p>
                    </>
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Pending</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
