import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { Toaster } from 'sonner'

interface EscrowReleaseRequest {
  id: string
  escrow_hold_id: string
  seller_id: string
  request_reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export const useEscrow = () => {
  const [loading, setLoading] = useState(false)
  const [pendingReleases, setPendingReleases] = useState<any[]>([])

  const createEscrowTransaction = async (
    amount: number,
    entityType: 'ride' | 'delivery' | 'order' | 'rental',
    entityId: string,
    sellerId: string
  ) => {
    setLoading(true)
    
    const platformFee = amount * 0.15 // 15% platform fee
    const sellerAmount = amount - platformFee

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        amount,
        type: 'escrow_hold',
        status: 'pending',
        reference: `ESCROW_${entityType.toUpperCase()}_${entityId}_${Date.now()}`,
        metadata: {
          entity_type: entityType,
          entity_id: entityId,
          seller_id: sellerId,
          platform_fee: platformFee,
          seller_amount: sellerAmount
        }
      })
      .select()
      .single()

    if (txError) {
      toast.error('Failed to create escrow transaction')
      setLoading(false)
      return null
    }

    // Create escrow hold with proper mapping
    const escrowData: any = {
      transaction_id: transaction.id,
      amount,
      platform_fee: platformFee,
      seller_amount: sellerAmount,
      status: 'held'
    }

    // Add entity-specific ID
    if (entityType === 'order') escrowData.order_id = entityId
    else if (entityType === 'ride') escrowData.ride_id = entityId
    else if (entityType === 'delivery') escrowData.delivery_id = entityId
    else if (entityType === 'rental') escrowData.rental_booking_id = entityId

    const { error: escrowError } = await supabase
      .from('escrow_holds')
      .insert(escrowData)

    if (escrowError) {
      toast.error('Failed to create escrow hold')
      setLoading(false)
      return null
    }

    setLoading(false)
    toast.success('Payment secured in escrow! Funds will be released after admin approval.')
    return transaction
  }

  // Seller requests escrow release (NEW)
  const requestEscrowRelease = async (
    escrowHoldId: string,
    sellerId: string,
    reason: string = 'Service completed successfully'
  ) => {
    setLoading(true)

    const { data, error } = await supabase.rpc('request_escrow_release', {
      p_escrow_hold_id: escrowHoldId,
      p_seller_id: sellerId,
      p_reason: reason
    })

    if (error) {
      toast.error('Failed to request escrow release')
      setLoading(false)
      return false
    }

    if (data?.success) {
      toast.success('Release request submitted! Admin will review your request.')
    } else {
      toast.error(data?.message || 'Failed to request release')
    }
    
    setLoading(false)
    return data?.success || false
  }

  // Admin releases escrow (UPDATED - Admin only)
  const releaseEscrow = async (escrowHoldId: string, adminNotes?: string) => {
    setLoading(true)

    // Get current admin user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Verify user is admin by checking staff_users table
    const { data: staff } = await supabase
      .from('staff_users')
      .select('id, role')
      .eq('id', user?.id)
      .single()

    if (!staff || !['super_admin', 'admin', 'finance'].includes(staff.role)) {
      toast.error('Unauthorized: Only admin users can release escrow funds')
      setLoading(false)
      return false
    }

    // Call admin_release_escrow RPC function
    const { data, error } = await supabase.rpc('admin_release_escrow', {
      p_escrow_hold_id: escrowHoldId,
      p_admin_id: staff.id,
      p_admin_notes: adminNotes || null
    })

    if (error) {
      toast.error('Failed to release escrow: ' + error.message)
      setLoading(false)
      return false
    }

    if (data?.success) {
      toast.success(data.message || 'Escrow funds released to seller!')
    } else {
      toast.error(data?.message || 'Failed to release escrow')
    }
    
    setLoading(false)
    return data?.success || false
  }

  // Admin rejects escrow release request
  const rejectEscrowRelease = async (escrowHoldId: string, rejectionReason: string) => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    const { data: staff } = await supabase
      .from('staff_users')
      .select('id, role')
      .eq('id', user?.id)
      .single()

    if (!staff || !['super_admin', 'admin', 'finance'].includes(staff.role)) {
      toast.error('Unauthorized: Only admin users can reject escrow release')
      setLoading(false)
      return false
    }

    const { data, error } = await supabase.rpc('admin_reject_escrow_release', {
      p_escrow_hold_id: escrowHoldId,
      p_admin_id: staff.id,
      p_rejection_reason: rejectionReason
    })

    if (error) {
      toast.error('Failed to reject release request')
      setLoading(false)
      return false
    }

    toast.success('Release request rejected')
    setLoading(false)
    return data?.success || false
  }

  // Get pending escrow releases (for admin dashboard)
  const loadPendingEscrowReleases = async () => {
    setLoading(true)

    const { data, error } = await supabase.rpc('get_pending_escrow_releases')

    if (error) {
      console.error('Failed to load pending releases:', error)
      setLoading(false)
      return []
    }

    setPendingReleases(data || [])
    setLoading(false)
    return data || []
  }

  const disputeEscrow = async (transactionId: string, reason: string, evidence?: string[]) => {
    setLoading(true)

    const { error } = await supabase
      .from('escrow_holds')
      .update({
        status: 'disputed',
        dispute_reason: reason,
        dispute_evidence: evidence || [],
        dispute_resolution: 'pending'
      })
      .eq('transaction_id', transactionId)

    if (error) {
      toast.error('Failed to dispute transaction')
      setLoading(false)
      return false
    }

    // Notify admins about dispute
    const { data: admins } = await supabase
      .from('staff_users')
      .select('id')
      .in('role', ['super_admin', 'admin', 'finance'])

    if (admins) {
      for (const admin of admins) {
        await supabase.from('notifications').insert({
          user_id: admin.id,
          type: 'escrow_dispute',
          title: 'Escrow Dispute Filed',
          content: `A user has filed a dispute for transaction ${transactionId}. Reason: ${reason}`,
          metadata: { transaction_id: transactionId, dispute_reason: reason }
        })
      }
    }

    toast.success('Dispute filed. Admin will review your case within 24-48 hours.')
    setLoading(false)
    return true
  }

  // Check escrow status
  const getEscrowStatus = async (transactionId: string) => {
    const { data, error } = await supabase
      .from('escrow_holds')
      .select('*')
      .eq('transaction_id', transactionId)
      .single()

    if (error) return null
    return data
  }

  return {
    createEscrowTransaction,
    requestEscrowRelease, // NEW - sellers call this
    releaseEscrow, // UPDATED - only admins can call this
    rejectEscrowRelease, // NEW - admins reject requests
    disputeEscrow,
    loadPendingEscrowReleases, // NEW - for admin dashboard
    getEscrowStatus,
    pendingReleases,
    loading
  }
}
