import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting weekly status transition...')

    // 1. Move "this week" participants to "past week 1"
    const { data: thisWeekParticipants, error: fetchError } = await supabaseClient
      .from('weekly_contest_participants')
      .select('*')
      .eq('admin_status', 'this week')

    if (fetchError) {
      console.error('Error fetching this week participants:', fetchError)
      throw fetchError
    }

    console.log(`Found ${thisWeekParticipants?.length || 0} participants in "this week"`)

    // 2. Shift all past week statuses down (past week 2 → past week 3, past week 1 → past week 2)
    const statusTransitions = [
      { from: 'past week 2', to: 'past week 3' },
      { from: 'past week 1', to: 'past week 2' },
    ]

    for (const transition of statusTransitions) {
      const { error: transitionError } = await supabaseClient
        .from('weekly_contest_participants')
        .update({ admin_status: transition.to })
        .eq('admin_status', transition.from)

      if (transitionError) {
        console.error(`Error transitioning ${transition.from} to ${transition.to}:`, transitionError)
        throw transitionError
      }

      console.log(`Moved participants from "${transition.from}" to "${transition.to}"`)
    }

    // 3. Move "this week" to "past week 1"
    if (thisWeekParticipants && thisWeekParticipants.length > 0) {
      const { error: moveThisWeekError } = await supabaseClient
        .from('weekly_contest_participants')
        .update({ admin_status: 'past week 1' })
        .eq('admin_status', 'this week')

      if (moveThisWeekError) {
        console.error('Error moving this week to past week 1:', moveThisWeekError)
        throw moveThisWeekError
      }

      console.log(`Moved ${thisWeekParticipants.length} participants from "this week" to "past week 1"`)
    }

    // 4. Move "next week on site" to "this week" (only these cards transition)
    const { data: nextWeekOnSiteParticipants, error: fetchNextOnSiteError } = await supabaseClient
      .from('weekly_contest_participants')
      .select('*')
      .eq('admin_status', 'next week on site')

    if (fetchNextOnSiteError) {
      console.error('Error fetching next week on site participants:', fetchNextOnSiteError)
      throw fetchNextOnSiteError
    }

    console.log(`Found ${nextWeekOnSiteParticipants?.length || 0} participants in "next week on site"`)

    if (nextWeekOnSiteParticipants && nextWeekOnSiteParticipants.length > 0) {
      const { error: moveNextWeekOnSiteError } = await supabaseClient
        .from('weekly_contest_participants')
        .update({ admin_status: 'this week' })
        .eq('admin_status', 'next week on site')

      if (moveNextWeekOnSiteError) {
        console.error('Error moving next week on site to this week:', moveNextWeekOnSiteError)
        throw moveNextWeekOnSiteError
      }

      console.log(`Moved ${nextWeekOnSiteParticipants.length} participants from "next week on site" to "this week"`)
    }

    // Note: "next week" status participants remain unchanged but get updated date intervals

    // 5. Update contest applications statuses accordingly
    const { error: updateApplicationsError } = await supabaseClient
      .from('contest_applications')
      .update({ status: 'next week' })
      .eq('status', 'next week')

    if (updateApplicationsError) {
      console.error('Error updating applications:', updateApplicationsError)
      // Don't throw here as this is not critical
    }

    console.log('Weekly status transition completed successfully!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Weekly status transition completed',
        transitions: {
          thisWeekToPastWeek1: thisWeekParticipants?.length || 0,
          nextWeekOnSiteToThisWeek: nextWeekOnSiteParticipants?.length || 0
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in weekly status transition:', error)
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