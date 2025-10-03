import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { ip } = await req.json()
    
    if (!ip || ip === 'null') {
      return new Response(
        JSON.stringify({ error: 'Invalid IP address' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Use ip-api.com for geolocation
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch country data')
    }

    const data = await response.json()
    
    return new Response(
      JSON.stringify({ country: data.country || null }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
