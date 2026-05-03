import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useEscrow } from '@/hooks/useEscrow'
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  DollarSign,
  User,
  Calendar,
  Search,
  Filter,
  Loader2,
  Eye,
  Send
} from 'lucide-react'
import { Toaster } from 'sonner'

export const AdminEscrowManager: React.FC = () => {
  const { loadPendingEscrowReleases, releaseEscrow, rejectEscrowRelease, pendingReleases, loading } = useEscrow()
  const [selectedEscrow, setSelectedEscrow] = useState<any>(null)
  const [showReleaseModal, setShowReleaseModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadPendingEscrowReleases()
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('escrow_updates')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'escrow_holds', filter: 'status=eq.pending_release' },
        () => loadPendingEscrowReleases()
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  const handleRelease = async () => {
    if (!selectedEscrow) return
    
    const success = await releaseEscrow(selectedEscrow.escrow_id, adminNotes)
    if (success) {
      setShowReleaseModal(false)
      setAdminNotes('')
      setSelectedEscrow(null)
      loadPendingEscrowReleases()
    }
  }

  const handleReject = async () => {
    if (!selectedEscrow || !rejectionReason) {
      toast.error('Please provide a rejection reason')
      return
    }
    
    const success = await rejectEscrowRelease(selectedEscrow.escrow_id, rejectionReason)
    if (success) {
      setShowRejectModal(false)
      setRejectionReason('')
      setSelectedEscrow(null)
      loadPendingEscrowReleases()
    }
  }

  const filteredReleases = pendingReleases.filter(release => {
    if (filter === 'high_value' && release.amount < 100000) return false
    if (filter === 'low_value' && release.amount > 50000) return false
    if (searchTerm && !release.seller_name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const stats = {
    total: pendingReleases.length,
    totalAmount: pendingReleases.reduce((sum, r) => sum + r.amount, 0),
    totalSellerAmount: pendingReleases.reduce((sum, r) => sum + r.seller_amount, 0),
    avgDays: pendingReleases.reduce((sum, r) => sum + r.days_held, 0) / (pendingReleases.length || 1)
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary-500" />
          Escrow Management
        </h1>
        <p className="text-gray-600">Admin-only control for escrow fund releases</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Releases</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Escrow Amount</p>
              <p className="text-2xl font-bold">₦{stats.totalAmount.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">To Release to Sellers</p>
              <p className="text-2xl font-bold">₦{stats.totalSellerAmount.toLocaleString()}</p>
            </div>
            <Send className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Hold Time</p>
              <p className="text-2xl font-bold">{stats.avgDays.toFixed(1)} days</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by seller name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Amounts</option>
            <option value="high_value">High Value (>₦100k)</option>
            <option value="low_value">Low Value (<₦50k)</option>
          </select>
        </div>
      </div>

      {/* Pending Releases Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller Gets</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Held</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredReleases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No pending escrow releases
                  </td>
                </tr>
              ) : (
                filteredReleases.map((release) => (
                  <tr key={release.escrow_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{release.seller_name}</p>
                        <p className="text-xs text-gray-500">{release.seller_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold">₦{release.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-green-600">₦{release.seller_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-red-600">₦{release.platform_fee.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs capitalize">
                        {release.entity_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">{release.days_held} days</td>
                    <td className="px-6 py-4 text-sm">{new Date(release.release_requested_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedEscrow(release)
                            setShowReleaseModal(true)
                          }}
                          className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Release
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEscrow(release)
                            setShowRejectModal(true)
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            // View details modal
                          }}
                          className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Release Modal */}
      {showReleaseModal && selectedEscrow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Release Escrow Funds</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Seller</span>
                <span className="font-medium">{selectedEscrow.seller_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Total Amount</span>
                <span className="font-bold">₦{selectedEscrow.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Seller Receives</span>
                <span className="font-bold text-green-600">₦{selectedEscrow.seller_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Platform Fee (15%)</span>
                <span className="text-red-600">₦{selectedEscrow.platform_fee.toLocaleString()}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Admin Notes (Optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full border rounded-md p-3"
                placeholder="Add any notes about this release..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRelease}
                className="flex-1 bg-green-500 text-white py-2 rounded-md hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm Release
              </button>
              <button
                onClick={() => setShowReleaseModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedEscrow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4 text-red-600">Reject Release Request</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Rejection Reason *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full border rounded-md p-3"
                placeholder="Explain why this escrow release is being rejected..."
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={!rejectionReason}
                className="flex-1 bg-red-500 text-white py-2 rounded-md hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject Request
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
