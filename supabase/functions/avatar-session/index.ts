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
    const { sessionId, avatarId = 'dvp_josh_1080P' } = await req.json()
    
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
async function checkTenantAvatarLimit(tenantId: string, supabase: ReturnType<typeof createClient>) {
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
async function createAkoolSession(avatarId?: string) {
  const akoolClientId = Deno.env.get('AKOOL_CLIENT_ID') || 'A7mt90cBGUmh2tOO+eruMg=='
  const akoolClientSecret = Deno.env.get('AKOOL_CLIENT_SECRET') || Deno.env.get('AKOOL_API_KEY')
  
  if (!akoolClientSecret) {
    throw new Error('AKOOL_CLIENT_SECRET or AKOOL_API_KEY not configured')
  }

  console.log('[Avatar Session] Creating Akool session with:', {
    requestedAvatarId: avatarId,
    hasClientId: !!akoolClientId,
    hasClientSecret: !!akoolClientSecret,
    clientIdLength: akoolClientId.length,
    clientSecretLength: akoolClientSecret.length
  })

  // Step 1: Get authentication token using clientId and clientSecret
  console.log('[Avatar Session] Step 1: Getting authentication token from Akool')
  
  const tokenResponse = await fetch('https://openapi.akool.com/api/open/v3/getToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientId: akoolClientId,
      clientSecret: akoolClientSecret
    })
  })
  
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    console.error('[Avatar Session] Token request failed:', {
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      body: errorText
    })
    throw new Error(`Failed to get Akool token (${tokenResponse.status}): ${errorText}`)
  }
  
  const tokenData = await tokenResponse.json()
  console.log('[Avatar Session] Token response:', {
    code: tokenData.code,
    hasToken: !!tokenData.token,
    tokenLength: tokenData.token?.length
  })
  
  if (tokenData.code !== 1000 || !tokenData.token) {
    console.error('[Avatar Session] Invalid token response:', tokenData)
    
    // Handle specific error codes from Akool documentation
    if (tokenData.code === 1101) {
      throw new Error('Invalid authorization or token expired. Check clientId and clientSecret.')
    } else if (tokenData.code === 1102) {
      throw new Error('Authorization cannot be empty. Check AKOOL_CLIENT_ID and AKOOL_CLIENT_SECRET.')
    } else if (tokenData.code === 1200) {
      throw new Error('The Akool account has been banned.')
    }
    
    throw new Error(`Failed to get Akool token: ${tokenData.message || 'Unknown error'}`)
  }
  
  const authToken = tokenData.token
  
  // Step 2: Get list of available avatars if no specific avatar requested
  let finalAvatarId = avatarId
  
  if (!finalAvatarId) {
    console.log('[Avatar Session] Step 2a: Getting list of available avatars')
    
    const avatarListResponse = await fetch('https://openapi.akool.com/api/open/v4/liveAvatar/avatar/list?page=1&size=100', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    if (!avatarListResponse.ok) {
      const errorText = await avatarListResponse.text()
      console.error('[Avatar Session] Failed to get avatar list:', {
        status: avatarListResponse.status,
        body: errorText
      })
      // Fallback to a default avatar ID if list fails
      finalAvatarId = 'dvp_josh_1080P'
      console.log('[Avatar Session] Using fallback avatar ID:', finalAvatarId)
    } else {
      const avatarListData = await avatarListResponse.json()
      console.log('[Avatar Session] Avatar list response:', {
        code: avatarListData.code,
        count: avatarListData.data?.count,
        resultCount: avatarListData.data?.result?.length
      })
      
      if (avatarListData.code === 1000 && avatarListData.data?.result?.length > 0) {
        // Find first available avatar
        const availableAvatar = avatarListData.data.result.find((avatar: any) => avatar.available === true)
        
        if (availableAvatar) {
          finalAvatarId = availableAvatar.avatar_id
          console.log('[Avatar Session] Found available avatar:', {
            avatarId: finalAvatarId,
            name: availableAvatar.name,
            gender: availableAvatar.gender
          })
        } else {
          // If no available avatars, use the first one anyway
          finalAvatarId = avatarListData.data.result[0].avatar_id
          console.log('[Avatar Session] No available avatars, using first one:', {
            avatarId: finalAvatarId,
            name: avatarListData.data.result[0].name,
            available: avatarListData.data.result[0].available
          })
        }
      } else {
        // Fallback if API response is invalid
        finalAvatarId = 'dvp_josh_1080P'
        console.log('[Avatar Session] Invalid avatar list response, using fallback:', finalAvatarId)
      }
    }
  }
  
  // Step 3: Create avatar session using the selected avatar
  console.log('[Avatar Session] Step 3: Creating avatar session with avatar:', finalAvatarId)
  
  const requestBody = {
    avatar_id: finalAvatarId,
    duration: 600 // 10 minutes max session
  }

  const sessionResponse = await fetch('https://openapi.akool.com/api/open/v4/liveAvatar/session/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(requestBody)
  })
  
  if (!sessionResponse.ok) {
    const errorText = await sessionResponse.text()
    console.error('[Avatar Session] Akool session creation failed:', {
      status: sessionResponse.status,
      statusText: sessionResponse.statusText,
      body: errorText,
      headers: Object.fromEntries(sessionResponse.headers.entries()),
      usedAvatarId: finalAvatarId
    })
    
    throw new Error(`Akool session creation failed (${sessionResponse.status}): ${errorText}`)
  }
  
  const sessionData = await sessionResponse.json()
  console.log('[Avatar Session] Session creation response:', {
    success: sessionData.success,
    hasData: !!sessionData.data,
    sessionId: sessionData.data?._id,
    usedAvatarId: finalAvatarId
  })
  
  if (!sessionData.success || !sessionData.data) {
    console.error('[Avatar Session] Invalid session response:', sessionData)
    
    // Check if it's a busy avatar error
    if (sessionData.code === 1215 || sessionData.msg?.includes('busy')) {
      // Try to get list of available avatars to suggest alternatives
      try {
        const avatarListResponse = await fetch('https://openapi.akool.com/api/open/v4/liveAvatar/avatar/list?page=1&size=100', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
        
        if (avatarListResponse.ok) {
          const avatarListData = await avatarListResponse.json()
          if (avatarListData.code === 1000 && avatarListData.data?.result?.length > 0) {
            const availableAvatars = avatarListData.data.result
              .filter((avatar: any) => avatar.available === true)
              .map((avatar: any) => avatar.avatar_id)
              .slice(0, 5) // Limit to 5 suggestions
            
            throw new Error(`Avatar ${finalAvatarId} is busy. Available avatars: ${availableAvatars.join(', ')}`)
          }
        }
      } catch (listError) {
        console.error('[Avatar Session] Failed to get alternative avatars:', listError)
      }
      
      throw new Error(`Avatar ${finalAvatarId} is busy. Please try again with a different avatar.`)
    }
    
    throw new Error(`Akool session creation failed: ${sessionData.message || sessionData.error || 'Unknown error - check logs'}`)
  }
  
  console.log('[Avatar Session] Akool session created successfully:', sessionData.data._id)
  return sessionData
}

/**
 * Poll Akool session until ready (stream_status = 2)
 */
async function pollForReady(sessionId: string, maxAttempts = 30) {
  // We need to get a fresh token for polling as well
  const akoolClientId = Deno.env.get('AKOOL_CLIENT_ID') || 'A7mt90cBGUmh2tOO+eruMg=='
  const akoolClientSecret = Deno.env.get('AKOOL_CLIENT_SECRET') || Deno.env.get('AKOOL_API_KEY')
  
  // Get auth token for polling
  const tokenResponse = await fetch('https://openapi.akool.com/api/open/v3/getToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientId: akoolClientId,
      clientSecret: akoolClientSecret
    })
  })
  
  const tokenData = await tokenResponse.json()
  if (tokenData.code !== 1000 || !tokenData.token) {
    throw new Error('Failed to get auth token for polling')
  }
  
  const authToken = tokenData.token
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`https://openapi.akool.com/api/open/v4/liveAvatar/session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
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