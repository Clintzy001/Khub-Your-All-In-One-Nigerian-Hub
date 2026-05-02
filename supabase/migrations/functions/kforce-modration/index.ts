import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )

    // Verify staff token
    const staffToken = req.headers.get('x-staff-token')
    const { data: session, error: sessionError } = await supabaseClient
      .from('staff_sessions')
      .select('*, staff:staff_users(*)')
      .eq('token', staffToken)
      .single()

    if (sessionError || !session || new Date(session.expires_at) < new Date()) {
      throw new Error('Unauthorized')
    }

    const staff = session.staff
    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    // Approve KYC
    if (action === 'approve-kyc' && req.method === 'POST') {
      if (!['super_admin', 'admin', 'finance'].includes(staff.role)) {
        throw new Error('Insufficient permissions')
      }

      const { submission_id, user_id, notes } = await req.json()

      // Update KYC status
      await supabaseClient
        .from('kyc_submissions')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          admin_notes: notes
        })
        .eq('id', submission_id)

      // Update user verification status
      await supabaseClient
        .from('profiles')
        .update({ verification_status: 'verified' })
        .eq('id', user_id)

      // Log audit
      await supabaseClient
        .from('audit_logs')
        .insert({
          staff_id: staff.id,
          staff_email: staff.email,
          action: 'APPROVE_KYC',
          entity_type: 'kyc_submissions',
          entity_id: submission_id,
          metadata: { user_id, notes }
        })

      // Send notification to user
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: user_id,
          type: 'kyc_approved',
          title: 'KYC Approved!',
          content: 'Your KYC verification has been approved. You can now withdraw funds.'
        })

      return new Response(
        JSON.stringify({ success: true, message: 'KYC approved successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Moderate listing
    if (action === 'moderate-listing' && req.method === 'POST') {
      if (!['super_admin', 'admin', 'moderator'].includes(staff.role)) {
        throw new Error('Insufficient permissions')
      }

      const { entity_type, entity_id, action: moderation_action, notes } = await req.json()
      const table_map: Record<string, string> = {
        'product': 'products',
        'service': 'services',
        'job': 'jobs',
        'rental': 'rentals'
      }

      const table = table_map[entity_type]
      if (!table) throw new Error('Invalid entity type')

      let update_data: any = {}
      if (moderation_action === 'approve') {
        update_data = { is_active: true, moderated_at: new Date().toISOString() }
      } else if (moderation_action === 'reject' || moderation_action === 'block') {
        update_data = { is_active: false, status: 'rejected', moderated_at: new Date().toISOString() }
      }

      await supabaseClient
        .from(table)
        .update(update_data)
        .eq('id', entity_id)

      // Update moderation queue
      await supabaseClient
        .from('moderation_queue')
        .update({
          status: moderation_action === 'approve' ? 'approved' : 'rejected',
          reviewed_by: staff.id,
          reviewed_at: new Date().toISOString(),
          moderation_notes: notes
        })
        .eq('entity_id', entity_id)
        .eq('entity_type', entity_type)

      // Log audit
      await supabaseClient
        .from('audit_logs')
        .insert({
          staff_id: staff.id,
          staff_email: staff.email,
          action: `${moderation_action.toUpperCase()}_LISTING`,
          entity_type: entity_type,
          entity_id: entity_id,
          metadata: { notes }
        })

      return new Response(
        JSON.stringify({ success: true, message: `Listing ${moderation_action}ed successfully` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Approve withdrawal
    if (action === 'approve-withdrawal' && req.method === 'POST') {
      if (!['super_admin', 'admin', 'finance'].includes(staff.role)) {
        throw new Error('Insufficient permissions')
      }

      const { approval_id, action: withdrawal_action, notes } = await req.json()

      const { data: approval } = await supabaseClient
        .from('withdrawal_approvals')
        .select('*, transaction:transactions(*)')
        .eq('id', approval_id)
        .single()

      if (!approval) throw new Error('Withdrawal request not found')

      if (withdrawal_action === 'approve') {
        // Update transaction status
        await supabaseClient
          .from('transactions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', approval.transaction_id)

        // Update wallet balance (already deducted when request was made)
        await supabaseClient
          .from('withdrawal_approvals')
          .update({
            status: 'approved',
            reviewed_by: staff.id,
            reviewed_at: new Date().toISOString(),
            notes
          })
          .eq('id', approval_id)

        // Initiate actual payout via Paystack
        const paystackResponse = await fetch('https://api.paystack.co/transfer', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('PAYSTACK_SECRET_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'balance',
            amount: approval.amount * 100,
            recipient: approval.bank_details.recipient_code,
            reason: `Withdrawal - ${approval.transaction_id}`
          })
        })

      } else {
        // Reject withdrawal - refund user
        await supabaseClient
          .from('transactions')
          .update({ status: 'reversed' })
          .eq('id', approval.transaction_id)

        await supabaseClient
          .from('wallets')
          .update({ balance: supabaseClient.rpc('increment', { row_id: approval.user_id, amount: approval.amount }) })
          .eq('user_id', approval.user_id)

        await supabaseClient
          .from('withdrawal_approvals')
          .update({
            status: 'rejected',
            reviewed_by: staff.id,
            reviewed_at: new Date().toISOString(),
            notes
          })
          .eq('id', approval_id)
      }

      // Log audit
      await supabaseClient
        .from('audit_logs')
        .insert({
          staff_id: staff.id,
          staff_email: staff.email,
          action: `${withdrawal_action.toUpperCase()}_WITHDRAWAL`,
          entity_type: 'withdrawal_approvals',
          entity_id: approval_id,
          metadata: { notes }
        })

      return new Response(
        JSON.stringify({ success: true, message: `Withdrawal ${withdrawal_action}d successfully` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ban user
    if (action === 'ban-user' && req.method === 'POST') {
      if (!['super_admin', 'admin'].includes(staff.role)) {
        throw new Error('Insufficient permissions')
      }

      const { user_id, reason, duration_days } = await req.json()

      const ban_expiry = duration_days ? new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000) : null

      await supabaseClient
        .from('profiles')
        .update({
          is_banned: true,
          ban_reason: reason,
          ban_expires_at: ban_expiry,
          is_active: false
        })
        .eq('id', user_id)

      // Log audit
      await supabaseClient
        .from('audit_logs')
        .insert({
          staff_id: staff.id,
          staff_email: staff.email,
          action: 'BAN_USER',
          entity_type: 'profiles',
          entity_id: user_id,
          metadata: { reason, duration_days }
        })

      return new Response(
        JSON.stringify({ success: true, message: 'User banned successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Action not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
