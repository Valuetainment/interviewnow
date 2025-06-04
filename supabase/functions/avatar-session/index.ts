import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const AVATAR_API_VERSION = 'v1.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Validate request method and content type
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ 
        error: 'Method not allowed',
        version: AVATAR_API_VERSION
      }), { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Parse request body
    const { sessionId, avatarId = 'dvp_Tristan_cloth2_1080P' } = await req.json()
    
    if (!sessionId) {
      return new Response(JSON.stringify({ 
        error: 'sessionId is required',
        version: AVATAR_API_VERSION
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 4. Verify session exists and get tenant info
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select(`
        id,
        tenant_id,
        companies!inner(tenant_id)
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return new Response(JSON.stringify({ 
        error: 'Session not found or access denied',
        version: AVATAR_API_VERSION
      }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 5. Check tenant avatar limits
    await checkTenantAvatarLimit(session.tenant_id, supabase)

    // 6. Create Akool session
    const akoolSession = await createAkoolSession(avatarId)
    
    // 7. Poll for session ready state
    const credentials = await pollForReady(akoolSession.data._id)
    
    // 8. Update interview_sessions with avatar info
    await supabase
      .from('interview_sessions')
      .update({
        avatar_enabled: true,
        avatar_session_id: akoolSession.data._id,
        avatar_provider: 'akool'
      })
      .eq('id', sessionId)

    // 9. Return credentials with version info
    return new Response(JSON.stringify({ 
      credentials,
      version: AVATAR_API_VERSION,
      timestamp: new Date().toISOString(),
      sessionId: akoolSession.data._id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[Avatar Session] Error:', error)
    
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      version: AVATAR_API_VERSION,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

/**
 * Check tenant avatar usage limits
 */
async function checkTenantAvatarLimit(tenantId: string, supabase: any) {
  const { data: prefs } = await supabase
    .from('tenant_preferences')
    .select('avatar_monthly_limit, avatar_usage_count')
    .eq('tenant_id', tenantId)
    .single()
  
  // If no preferences set, allow usage (default limits apply)
  if (!prefs) {
    console.log(`[Avatar Session] No preferences found for tenant ${tenantId}, allowing usage`)
    return true
  }
  
  // Check if usage limit exceeded
  if (prefs.avatar_usage_count >= prefs.avatar_monthly_limit) {
    throw new Error(`Monthly avatar limit of ${prefs.avatar_monthly_limit} reached`)
  }
  
  // Increment usage count
  const { error: updateError } = await supabase
    .from('tenant_preferences')
    .update({ 
      avatar_usage_count: prefs.avatar_usage_count + 1,
      updated_at: new Date().toISOString()
    })
    .eq('tenant_id', tenantId)
    
  if (updateError) {
    console.error('[Avatar Session] Failed to update usage count:', updateError)
    // Don't fail the request for this, just log
  }
  
  return true
}

/**
 * Create Akool avatar session
 */
async function createAkoolSession(avatarId: string) {
  const akoolApiKey = Deno.env.get('AKOOL_API_KEY')
  
  if (!akoolApiKey) {
    throw new Error('AKOOL_API_KEY not configured')
  }

  const response = await fetch('https://openapi.akool.com/api/open/v4/liveAvatar/session/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${akoolApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      avatar_id: avatarId,
      duration: 600 // 10 minutes max session
    })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Akool API error (${response.status}): ${errorText}`)
  }
  
  const data = await response.json()
  
  if (!data.success || !data.data) {
    throw new Error(`Akool session creation failed: ${data.message || 'Unknown error'}`)
  }
  
  return data
}

/**
 * Poll Akool session until ready (stream_status = 2)
 */
async function pollForReady(sessionId: string, maxAttempts = 30) {
  const akoolApiKey = Deno.env.get('AKOOL_API_KEY')!
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`https://openapi.akool.com/api/open/v4/liveAvatar/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${akoolApiKey}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Poll request failed: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(`Poll failed: ${data.message}`)
      }
      
      // Check if session is ready (stream_status = 2)
      if (data.data.stream_status === 2) {
        return {
          agora_app_id: data.data.agora_app_id,
          agora_channel: data.data.agora_channel,
          agora_token: data.data.agora_token,
          agora_uid: data.data.agora_uid
        }
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error(`[Avatar Session] Poll attempt ${attempt} failed:`, error)
      
      // If this was the last attempt, rethrow
      if (attempt === maxAttempts) {
        throw error
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  throw new Error(`Avatar session timeout after ${maxAttempts} attempts`)
} 