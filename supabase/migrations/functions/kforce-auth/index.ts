import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'

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

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    // Staff login
    if (path === 'login' && req.method === 'POST') {
      const { email, password } = await req.json()
      
      const { data: staff, error } = await supabaseClient
        .from('staff_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (error || !staff) {
        throw new Error('Invalid credentials')
      }

      const validPassword = await bcrypt.compare(password, staff.password_hash)
      if (!validPassword) {
        throw new Error('Invalid credentials')
      }

      // Generate session token
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 8) // 8 hour session

      await supabaseClient
        .from('staff_sessions')
        .insert({
          staff_id: staff.id,
          token,
          ip_address: req.headers.get('cf-connecting-ip') || 'unknown',
          user_agent: req.headers.get('user-agent'),
          expires_at: expiresAt.toISOString()
        })

      // Update last login
      await supabaseClient
        .from('staff_users')
        .update({
          last_login_at: new Date().toISOString(),
          last_login_ip: req.headers.get('cf-connecting-ip') || 'unknown'
        })
        .eq('id', staff.id)

      // Log audit
      await supabaseClient
        .from('audit_logs')
        .insert({
          staff_id: staff.id,
          staff_email: staff.email,
          action: 'LOGIN',
          ip_address: req.headers.get('cf-connecting-ip') || 'unknown',
          user_agent: req.headers.get('user-agent')
        })

      return new Response(
        JSON.stringify({
          success: true,
          token,
          staff: {
            id: staff.id,
            email: staff.email,
            full_name: staff.full_name,
            role: staff.role
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify staff token
    if (path === 'verify' && req.method === 'GET') {
      const token = req.headers.get('x-staff-token')
      
      if (!token) {
        throw new Error('No token provided')
      }

      const { data: session, error } = await supabaseClient
        .from('staff_sessions')
        .select('*, staff:staff_users(*)')
        .eq('token', token)
        .single()

      if (error || !session || new Date(session.expires_at) < new Date()) {
        throw new Error('Invalid or expired token')
      }

      return new Response(
        JSON.stringify({
          success: true,
          staff: session.staff
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Staff logout
    if (path === 'logout' && req.method === 'POST') {
      const token = req.headers.get('x-staff-token')
      
      await supabaseClient
        .from('staff_sessions')
        .delete()
        .eq('token', token)

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Route not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
    )
  }
})
