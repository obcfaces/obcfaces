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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting pre next week → next week transition...')

    // Calculate current week Monday using get_week_monday
    const today = new Date()
    const { data: currentMonday, error: mondayError } = await supabase
      .rpc('get_week_monday', { input_date: today.toISOString().split('T')[0] })

    if (mondayError) {
      console.error('Error getting week Monday:', mondayError)
      throw mondayError
    }

    console.log('Current Monday:', currentMonday)

    // Parse the Monday date
    const mondayDate = new Date(currentMonday as string)
    
    // Current week ends on Sunday (6 days after Monday)
    const currentSunday = new Date(mondayDate)
    currentSunday.setDate(currentSunday.getDate() + 6)
    
    // Next week starts the day after current Sunday
    const nextWeekMonday = new Date(currentSunday)
    nextWeekMonday.setDate(nextWeekMonday.getDate() + 1)
    
    // Next week ends 6 days after next Monday
    const nextWeekSunday = new Date(nextWeekMonday)
    nextWeekSunday.setDate(nextWeekSunday.getDate() + 6)
    
    // Format as DD/MM-DD/MM/YY
    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      return `${day}/${month}`
    }
    
    const formatYear = (date: Date) => {
      return String(date.getFullYear()).slice(-2)
    }
    
    const nextWeekInterval = `${formatDate(nextWeekMonday)}-${formatDate(nextWeekSunday)}/${formatYear(nextWeekSunday)}`
    console.log('Next week interval calculated:', nextWeekInterval)

    // Get all "pre next week" participants
    const { data: preNextWeekParticipants, error: fetchError } = await supabase
      .from('weekly_contest_participants')
      .select('id, application_data, status_history')
      .eq('admin_status', 'pre next week')
      .eq('is_active', true)

    if (fetchError) {
      console.error('Error fetching pre next week participants:', fetchError)
      throw fetchError
    }

    console.log(`Found ${preNextWeekParticipants?.length || 0} participants with "pre next week" status`)

    let transitionCount = 0

    // Transition each participant
    for (const participant of preNextWeekParticipants || []) {
      // Parse existing status_history
      let statusHistory: any = {}
      try {
        statusHistory = typeof participant.status_history === 'string' 
          ? JSON.parse(participant.status_history) 
          : (participant.status_history || {})
      } catch (e) {
        console.error('Error parsing status_history:', e)
        statusHistory = {}
      }

      // Add automatic transition to history
      statusHistory['next week'] = {
        changed_at: new Date().toISOString(),
        changed_by: null,
        change_reason: 'Manual transition via admin panel (transition-pre-next-week function)',
        week_interval: nextWeekInterval,
        timestamp: new Date().toISOString()
      }

      const participantName = `${participant.application_data?.first_name || ''} ${participant.application_data?.last_name || ''}`.trim()

      const { error: updateError } = await supabase
        .from('weekly_contest_participants')
        .update({
          admin_status: 'next week',
          week_interval: nextWeekInterval,
          status_history: statusHistory
        })
        .eq('id', participant.id)

      if (updateError) {
        console.error(`Error updating participant ${participant.id} (${participantName}):`, updateError)
      } else {
        transitionCount++
        console.log(`✅ Moved ${participantName} from "pre next week" to "next week" with interval ${nextWeekInterval}`)
      }
    }

    const summary = {
      success: true,
      currentMonday: currentMonday,
      nextWeekInterval: nextWeekInterval,
      transitionCount,
      message: `Transitioned ${transitionCount} participants from "pre next week" to "next week" (${nextWeekInterval})`
    }

    console.log('Transition summary:', summary)

    return new Response(
      JSON.stringify(summary),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in pre next week transition:', error)
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