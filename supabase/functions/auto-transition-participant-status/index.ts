import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = 'https://mlbzdxsumfudrtuuybqn.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseServiceKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current date and check if it's Monday
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    console.log(`Current day of week: ${dayOfWeek}`)
    
    // Only run on Mondays (1) or if manually triggered
    const isManual = req.url.includes('manual=true')
    
    if (dayOfWeek !== 1 && !isManual) {
      return new Response(
        JSON.stringify({ 
          message: 'Not Monday - no status transitions needed',
          currentDay: dayOfWeek 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    console.log('Starting participant status transitions...')

    // Step 1: Transition "this week" participants to "past week"
    const { data: thisWeekParticipants, error: thisWeekError } = await supabase
      .from('weekly_contest_participants')
      .update({ participant_status: 'past week' })
      .eq('participant_status', 'this week')
      .select('id, user_id')

    if (thisWeekError) {
      console.error('Error transitioning this week participants:', thisWeekError)
      throw thisWeekError
    }

    console.log(`Transitioned ${thisWeekParticipants?.length || 0} participants from "this week" to "past week"`)

    // Step 2: Transition "next week on site" participants to "this week"
    const { data: nextWeekOnSiteParticipants, error: nextWeekOnSiteError } = await supabase
      .from('weekly_contest_participants')
      .update({ participant_status: 'this week' })
      .eq('participant_status', 'next week on site')
      .select('id, user_id')

    if (nextWeekOnSiteError) {
      console.error('Error transitioning next week on site participants:', nextWeekOnSiteError)
      throw nextWeekOnSiteError
    }

    console.log(`Transitioned ${nextWeekOnSiteParticipants?.length || 0} participants from "next week on site" to "this week"`)

    // Create summary report
    const transitionReport = {
      timestamp: now.toISOString(),
      transitionsPerformed: {
        thisWeekToPast: thisWeekParticipants?.length || 0,
        nextWeekOnSiteToThisWeek: nextWeekOnSiteParticipants?.length || 0
      },
      totalTransitions: (thisWeekParticipants?.length || 0) + (nextWeekOnSiteParticipants?.length || 0),
      isManualTrigger: isManual
    }

    console.log('Transition report:', transitionReport)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Participant status transitions completed successfully',
        report: transitionReport
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in auto-transition-participant-status:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})