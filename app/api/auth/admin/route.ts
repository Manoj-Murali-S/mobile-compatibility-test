import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return NextResponse.json({ ok: false, error: 'Supabase server configuration is missing' }, { status: 500 })
    }

    // 1. Verify the requester using the normal Anon client
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized: Invalid token' }, { status: 401 })
    }

    const requesterRole = user.user_metadata?.role || 'viewer'
    if (requesterRole !== 'superadmin' && requesterRole !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    // 2. Initialize the Admin client using the Service Role Key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const body = await req.json()
    const { action } = body

    if (action === 'getUsers') {
      const { data, error } = await adminClient.auth.admin.listUsers()
      if (error) throw error

      // Map Supabase users to our internal User format
      const mappedUsers = data.users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name || u.user_metadata?.full_name || '',
        role: u.user_metadata?.role || 'viewer',
        status: 'approved', // all supabase users are considered approved
        created_on: u.created_at,
        modified_on: u.updated_at
      }))

      return NextResponse.json({ ok: true, data: mappedUsers })
    }

    if (action === 'createUser') {
      const { email, passwordAttempt, role } = body
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password: passwordAttempt,
        email_confirm: true, // auto-confirm for admin-created users
        user_metadata: { role: role || 'viewer' }
      })
      if (error) throw error
      return NextResponse.json({ ok: true, user: data.user })
    }

    if (action === 'updateUser') {
      const { id, updates } = body
      // If updates contain role, it goes in user_metadata
      const { role, status, ...rest } = updates
      
      const updatePayload: any = { ...rest }
      if (role) {
        updatePayload.user_metadata = { role }
      }

      const { data, error } = await adminClient.auth.admin.updateUserById(id, updatePayload)
      if (error) throw error
      return NextResponse.json({ ok: true, user: data.user })
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    console.error('API /auth/admin error:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
