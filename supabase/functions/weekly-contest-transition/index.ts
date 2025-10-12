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

    console.log('🔄 Starting weekly contest transition...')

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
    
    // Current week: Monday to Sunday
    const currentSunday = new Date(mondayDate)
    currentSunday.setDate(currentSunday.getDate() + 6)
    
    // Next week: starts day after current Sunday
    const nextWeekMonday = new Date(currentSunday)
    nextWeekMonday.setDate(nextWeekMonday.getDate() + 1)
    
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
    
    const currentWeekInterval = `${formatDate(mondayDate)}-${formatDate(currentSunday)}/${formatYear(currentSunday)}`
    const nextWeekInterval = `${formatDate(nextWeekMonday)}-${formatDate(nextWeekSunday)}/${formatYear(nextWeekSunday)}`
    
    console.log('Current week interval:', currentWeekInterval)
    console.log('Next week interval:', nextWeekInterval)

    const transitions = {
      thisToPast: 0,
      nextOnSiteToThis: 0,
      preNextToNext: 0
    }

    // ========================================
    // TRANSITION 1: "this week" → "past"
    // ALL get current week interval (week of transition)
    // Previous interval doesn't matter
    // ========================================
    console.log('\n📊 TRANSITION 1: "this week" → "past"')
    
    const { data: thisWeekParticipants, error: fetchThisWeekError } = await supabase
      .from('weekly_contest_participants')
      .select('id, user_id, application_data, status_history, week_interval, average_rating, total_votes')
      .eq('admin_status', 'this week')
      .eq('is_active', true)

    if (fetchThisWeekError) {
      console.error('Error fetching this week participants:', fetchThisWeekError)
      throw fetchThisWeekError
    }

    console.log(`Found ${thisWeekParticipants?.length || 0} participants in "this week"`)

    // Determine winner from "this week" participants
    let winnerId: string | null = null
    let winnerName = ''
    
    if (thisWeekParticipants && thisWeekParticipants.length > 0) {
      // Sort by average_rating DESC, then total_votes DESC
      const sorted = [...thisWeekParticipants].sort((a, b) => {
        if (b.average_rating !== a.average_rating) {
          return (b.average_rating || 0) - (a.average_rating || 0)
        }
        return (b.total_votes || 0) - (a.total_votes || 0)
      })
      
      const winner = sorted[0]
      winnerId = winner.id
      winnerName = `${winner.application_data?.first_name || ''} ${winner.application_data?.last_name || ''}`.trim()
      console.log(`🏆 Winner determined: ${winnerName} (ID: ${winnerId})`)
    }

    // Move "this week" to "past" with current week interval
    for (const participant of thisWeekParticipants || []) {
      let statusHistory: any = {}
      try {
        statusHistory = typeof participant.status_history === 'string' 
          ? JSON.parse(participant.status_history) 
          : (participant.status_history || {})
      } catch (e) {
        console.error('Error parsing status_history:', e)
        statusHistory = {}
      }

      statusHistory['past'] = {
        changed_at: new Date().toISOString(),
        changed_by: null,
        change_reason: 'Automatic weekly transition',
        old_status: 'this week',
        new_status: 'past',
        old_week_interval: participant.week_interval,
        week_interval: currentWeekInterval, // Current week when transition happens
        timestamp: new Date().toISOString()
      }

      const participantName = `${participant.application_data?.first_name || ''} ${participant.application_data?.last_name || ''}`.trim()
      const isWinner = participant.id === winnerId
      const finalRank = isWinner ? 1 : null

      const { error: updateError } = await supabase
        .from('weekly_contest_participants')
        .update({
          admin_status: 'past',
          status_history: statusHistory,
          final_rank: finalRank,
          week_interval: currentWeekInterval // Assign current week
        })
        .eq('id', participant.id)

      if (updateError) {
        console.error(`Error updating participant ${participant.id}:`, updateError)
      } else {
        transitions.thisToPast++
        const rankInfo = isWinner ? ' 🏆 (WINNER, rank=1)' : ''
        console.log(`✅ ${participantName}: "this week" → "past"${rankInfo}, week: ${currentWeekInterval}`)
      }
    }

    // ========================================
    // TRANSITION 2: "next week on site" → "this week"
    // ALL get current week interval (week of transition)
    // Previous interval doesn't matter
    // ========================================
    console.log('\n📊 TRANSITION 2: "next week on site" → "this week"')
    
    const { data: nextOnSiteParticipants, error: fetchNextOnSiteError } = await supabase
      .from('weekly_contest_participants')
      .select('id, application_data, status_history')
      .eq('admin_status', 'next week on site')
      .eq('is_active', true)

    if (fetchNextOnSiteError) {
      console.error('Error fetching next week on site participants:', fetchNextOnSiteError)
      throw fetchNextOnSiteError
    }

    console.log(`Found ${nextOnSiteParticipants?.length || 0} participants in "next week on site"`)

    for (const participant of nextOnSiteParticipants || []) {
      let statusHistory: any = {}
      try {
        statusHistory = typeof participant.status_history === 'string' 
          ? JSON.parse(participant.status_history) 
          : (participant.status_history || {})
      } catch (e) {
        console.error('Error parsing status_history:', e)
        statusHistory = {}
      }

      statusHistory['this week'] = {
        changed_at: new Date().toISOString(),
        changed_by: null,
        change_reason: 'Automatic weekly transition',
        old_status: 'next week on site',
        new_status: 'this week',
        old_week_interval: participant.status_history?.['next week on site']?.week_interval,
        week_interval: currentWeekInterval, // Current week when transition happens
        timestamp: new Date().toISOString()
      }

      const participantName = `${participant.application_data?.first_name || ''} ${participant.application_data?.last_name || ''}`.trim()

      const { error: updateError } = await supabase
        .from('weekly_contest_participants')
        .update({
          admin_status: 'this week',
          week_interval: currentWeekInterval, // Assign current week
          status_history: statusHistory
        })
        .eq('id', participant.id)

      if (updateError) {
        console.error(`Error updating participant ${participant.id}:`, updateError)
      } else {
        transitions.nextOnSiteToThis++
        console.log(`✅ ${participantName}: "next week on site" → "this week", week: ${currentWeekInterval}`)
      }
    }

    // ========================================
    // TRANSITION 3: "pre next week" → "next week"
    // ALL get current week interval (week of transition)
    // Previous interval doesn't matter
    // ========================================
    console.log('\n📊 TRANSITION 3: "pre next week" → "next week"')
    
    const { data: preNextParticipants, error: fetchPreNextError } = await supabase
      .from('weekly_contest_participants')
      .select('id, application_data, status_history')
      .eq('admin_status', 'pre next week')
      .eq('is_active', true)

    if (fetchPreNextError) {
      console.error('Error fetching pre next week participants:', fetchPreNextError)
      throw fetchPreNextError
    }

    console.log(`Found ${preNextParticipants?.length || 0} participants in "pre next week"`)

    for (const participant of preNextParticipants || []) {
      let statusHistory: any = {}
      try {
        statusHistory = typeof participant.status_history === 'string' 
          ? JSON.parse(participant.status_history) 
          : (participant.status_history || {})
      } catch (e) {
        console.error('Error parsing status_history:', e)
        statusHistory = {}
      }

      statusHistory['next week'] = {
        changed_at: new Date().toISOString(),
        changed_by: null,
        change_reason: 'Automatic weekly transition',
        old_status: 'pre next week',
        new_status: 'next week',
        old_week_interval: participant.status_history?.['pre next week']?.week_interval,
        week_interval: currentWeekInterval, // Current week of transition
        timestamp: new Date().toISOString()
      }

      const participantName = `${participant.application_data?.first_name || ''} ${participant.application_data?.last_name || ''}`.trim()

      const { error: updateError } = await supabase
        .from('weekly_contest_participants')
        .update({
          admin_status: 'next week',
          week_interval: currentWeekInterval, // Assign current week interval
          status_history: statusHistory
        })
        .eq('id', participant.id)

      if (updateError) {
        console.error(`Error updating participant ${participant.id}:`, updateError)
      } else {
        transitions.preNextToNext++
        console.log(`✅ ${participantName}: "pre next week" → "next week", week: ${currentWeekInterval}`)
      }
    }

    // ========================================
    // Create/update weekly contest records
    // ========================================
    console.log('\n📅 Managing contest records...')
    
    // Close previous week's contest (if exists)
    const prevMonday = new Date(mondayDate)
    prevMonday.setDate(prevMonday.getDate() - 7)
    const prevSunday = new Date(prevMonday)
    prevSunday.setDate(prevSunday.getDate() + 6)
    
    const { error: closeError } = await supabase
      .from('weekly_contests')
      .update({ 
        status: 'closed',
        winner_id: winnerId 
      })
      .eq('week_start_date', prevMonday.toISOString().split('T')[0])
      .eq('status', 'active')

    if (closeError) {
      console.error('Error closing previous contest:', closeError)
    } else {
      console.log('✅ Closed previous week contest')
    }

    // Create current week contest if not exists
    const { data: existingContest } = await supabase
      .from('weekly_contests')
      .select('id')
      .eq('week_start_date', mondayDate.toISOString().split('T')[0])
      .maybeSingle()

    if (!existingContest) {
      const { error: createError } = await supabase
        .from('weekly_contests')
        .insert({
          week_start_date: mondayDate.toISOString().split('T')[0],
          week_end_date: currentSunday.toISOString().split('T')[0],
          title: `Contest ${currentWeekInterval}`,
          status: 'active'
        })

      if (createError) {
        console.error('Error creating current week contest:', createError)
      } else {
        console.log('✅ Created current week contest')
      }
    }

    const summary = {
      success: true,
      currentWeekInterval,
      nextWeekInterval,
      transitions,
      winner: winnerId ? { id: winnerId, name: winnerName } : null,
      message: `Transition complete: ${transitions.thisToPast} to past, ${transitions.nextOnSiteToThis} to this week, ${transitions.preNextToNext} to next week`
    }

    console.log('\n✅ Transition summary:', summary)

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
    console.error('❌ Error in weekly contest transition:', error)
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
