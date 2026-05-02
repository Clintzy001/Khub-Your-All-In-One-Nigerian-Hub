import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import toast from 'react-hot-toast'

export const useEscrow = () => {
  const [loading, setLoading] = useState(false)

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

    // Create escrow hold
    const { error: escrowError } = await supabase
      .from('escrow_holds')
      .insert({
        transaction_id: transaction.id,
        amount,
        platform_fee: platformFee,
        seller_amount: sellerAmount,
        status: 'held'
      })

    if (escrowError) {
      toast.error('Failed to create escrow hold')
      setLoading(false)
      return null
    }

    setLoading(false)
    return transaction
  }

  const releaseEscrow = async (transactionId: string) => {
    setLoading(true)

    // Call the release_escrow function
    const { error } = await supabase.rpc('release_escrow', {
      p_transaction_id: transactionId
    })

    if (error) {
      toast.error('Failed to release escrow')
      setLoading(false)
      return false
    }

    toast.success('Payment released to seller!')
    setLoading(false)
    return true
  }

  const disputeEscrow = async (transactionId: string, reason: string) => {
    setLoading(true)

    const { error } = await supabase
      .from('escrow_holds')
      .update({
        status: 'disputed',
        dispute_reason: reason,
        dispute_resolution: 'pending'
      })
      .eq('transaction_id', transactionId)

    if (error) {
      toast.error('Failed to dispute transaction')
      setLoading(false)
      return false
    }

    toast.success('Dispute filed. Support will review your case.')
    setLoading(false)
    return true
  }

  return {
    createEscrowTransaction,
    releaseEscrow,
    disputeEscrow,
    loading
  }
}
