import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { avatarId = 'dvp_Tristan_cloth2_1080P' } = await req.json()
    
    // Get AKOOL credentials
    const akoolClientId = Deno.env.get('AKOOL_CLIENT_ID')
    const akoolClientSecret = Deno.env.get('AKOOL_CLIENT_SECRET') || Deno.env.get('AKOOL_API_KEY')
    
    if (!akoolClientSecret) {
      throw new Error('AKOOL credentials not configured')
    }

    // Get token
    const tokenResponse = await fetch('https://openapi.akool.com/api/open/v3/getToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: akoolClientId,
        clientSecret: akoolClientSecret
      })
    })
    
    const tokenData = await tokenResponse.json()
    if (tokenData.code !== 1000 || !tokenData.token) {
      throw new Error(`Failed to get token: ${tokenData.message || 'Unknown error'}`)
    }

    // Create session
    const sessionResponse = await fetch('https://openapi.akool.com/api/open/v4/liveAvatar/session/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.token}`
      },
      body: JSON.stringify({
        avatar_id: avatarId,
        duration: 600
      })
    })
    
    const sessionData = await sessionResponse.json()
    
    if (sessionData.code === 1215) {
      throw new Error(`Avatar ${avatarId} is busy. Please try again with a different avatar.`)
    }
    
    if (sessionData.code !== 1000 || !sessionData.data) {
      throw new Error(`Session creation failed: ${sessionData.message || sessionData.msg || 'Unknown error'}`)
    }

    // Poll for ready
    let attempts = 0
    let credentials = null
    
    while (attempts < 30 && !credentials) {
      const pollResponse = await fetch(`https://openapi.akool.com/api/open/v4/liveAvatar/session/detail?id=${sessionData.data._id}`, {
        headers: { 'Authorization': `Bearer ${tokenData.token}` }
      })
      
      const pollData = await pollResponse.json()
      
      if (pollData.code === 1000 && pollData.data?.status === 3) {
        credentials = pollData.data.credentials
        break
      }
      
      attempts++
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    if (!credentials) {
      throw new Error('Session timeout')
    }

    return new Response(JSON.stringify({ 
      credentials,
      sessionId: sessionData.data._id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[Avatar Simple] Error:', error)
    return new Response(JSON.stringify({ 
      error: error.message 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 