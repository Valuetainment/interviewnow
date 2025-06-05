import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const akoolClientId = Deno.env.get('AKOOL_CLIENT_ID')
    const akoolClientSecret = Deno.env.get('AKOOL_CLIENT_SECRET') || Deno.env.get('AKOOL_API_KEY')
    
    console.log('[Test] Environment check:', {
      hasClientId: !!akoolClientId,
      hasClientSecret: !!akoolClientSecret,
      clientIdLength: akoolClientId?.length,
      clientSecretLength: akoolClientSecret?.length,
      clientIdPrefix: akoolClientId?.substring(0, 10) + '...',
      clientSecretPrefix: akoolClientSecret?.substring(0, 10) + '...'
    })

    // Test getting token
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
    console.log('[Test] Token response:', {
      status: tokenResponse.status,
      code: tokenData.code,
      hasToken: !!tokenData.token,
      message: tokenData.message || tokenData.msg
    })

    // If token successful, try to get avatar list
    if (tokenData.code === 1000 && tokenData.token) {
      const avatarListResponse = await fetch('https://openapi.akool.com/api/open/v4/liveAvatar/avatar/list?page=1&size=10', {
        headers: {
          'Authorization': `Bearer ${tokenData.token}`
        }
      })
      
      const avatarList = await avatarListResponse.json()
      console.log('[Test] Avatar list response:', {
        status: avatarListResponse.status,
        code: avatarList.code,
        count: avatarList.data?.count,
        availableCount: avatarList.data?.result?.filter((a: any) => a.available).length
      })
      
      return new Response(JSON.stringify({
        tokenSuccess: tokenData.code === 1000,
        avatarListSuccess: avatarList.code === 1000,
        availableAvatars: avatarList.data?.result?.filter((a: any) => a.available).map((a: any) => a.avatar_id) || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      tokenSuccess: false,
      error: tokenData.message || tokenData.msg || 'Failed to get token'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[Test] Error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 