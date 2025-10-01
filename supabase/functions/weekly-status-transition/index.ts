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

    console.log('Starting weekly status transition...')

    // Получаем текущий интервал недели
    const { data: weekInterval, error: intervalError } = await supabase
      .rpc('get_current_week_interval')

    if (intervalError) {
      console.error('Error getting week interval:', intervalError)
      throw intervalError
    }

    console.log('Current week interval:', weekInterval)

    const transitions = {
      thisWeekToPast: 0,
      nextWeekOnSiteToThisWeek: 0,
      nextWeekToNextWeekOnSite: 0,
      approvedToThisWeek: 0
    }

    // 1. Переводим "this week" → "past", сохраняя их week_interval
    const { data: thisWeekParticipants, error: thisWeekError } = await supabase
      .from('weekly_contest_participants')
      .select('id, week_interval, status_history')
      .eq('admin_status', 'this week')
      .eq('is_active', true)

    if (thisWeekError) {
      console.error('Error fetching this week participants:', thisWeekError)
      throw thisWeekError
    }

    for (const participant of thisWeekParticipants || []) {
      // Сохраняем интервал, который был записан когда карточка была "this week"
      const pastInterval = participant.week_interval

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
      statusHistory['past'] = {
        changed_at: new Date().toISOString(),
        changed_by: null,
        change_reason: 'Automatic weekly transition (weekly-status-transition function)',
        week_interval: pastInterval,
        timestamp: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('weekly_contest_participants')
        .update({
          admin_status: 'past',
          week_interval: pastInterval, // Keep the same interval
          status_history: statusHistory
        })
        .eq('id', participant.id)

      if (updateError) {
        console.error(`Error updating participant ${participant.id}:`, updateError)
      } else {
        transitions.thisWeekToPast++
        console.log(`Moved participant ${participant.id} from "this week" to "past" with interval ${pastInterval}`)
      }
    }

    // 2. Переводим "next week on site" → "this week" с новым интервалом текущей недели
    const { data: nextWeekOnSiteParticipants, error: nextWeekOnSiteError } = await supabase
      .from('weekly_contest_participants')
      .select('id, status_history')
      .eq('admin_status', 'next week on site')
      .eq('is_active', true)

    if (nextWeekOnSiteError) {
      console.error('Error fetching next week on site participants:', nextWeekOnSiteError)
      throw nextWeekOnSiteError
    }

    for (const participant of nextWeekOnSiteParticipants || []) {
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
      statusHistory['this week'] = {
        changed_at: new Date().toISOString(),
        changed_by: null,
        change_reason: 'Automatic weekly transition (weekly-status-transition function)',
        week_interval: weekInterval,
        timestamp: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('weekly_contest_participants')
        .update({
          admin_status: 'this week',
          week_interval: weekInterval, // New current week interval
          status_history: statusHistory
        })
        .eq('id', participant.id)

      if (updateError) {
        console.error(`Error updating participant ${participant.id}:`, updateError)
      } else {
        transitions.nextWeekOnSiteToThisWeek++
        console.log(`Moved participant ${participant.id} from "next week on site" to "this week" with interval ${weekInterval}`)
      }
    }

    // 3. Переводим "next week" → "next week on site" с новым интервалом
    const { data: nextWeekParticipants, error: nextWeekError } = await supabase
      .from('weekly_contest_participants')
      .select('id, status_history')
      .eq('admin_status', 'next week')
      .eq('is_active', true)

    if (nextWeekError) {
      console.error('Error fetching next week participants:', nextWeekError)
      throw nextWeekError
    }

    for (const participant of nextWeekParticipants || []) {
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
      statusHistory['next week on site'] = {
        changed_at: new Date().toISOString(),
        changed_by: null,
        change_reason: 'Automatic weekly transition (weekly-status-transition function)',
        week_interval: weekInterval,
        timestamp: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('weekly_contest_participants')
        .update({
          admin_status: 'next week on site',
          week_interval: weekInterval,
          status_history: statusHistory
        })
        .eq('id', participant.id)

      if (updateError) {
        console.error(`Error updating participant ${participant.id}:`, updateError)
      } else {
        transitions.nextWeekToNextWeekOnSite++
        console.log(`Moved participant ${participant.id} from "next week" to "next week on site" with interval ${weekInterval}`)
      }
    }

    // 4. Добавляем approved заявки как новых участников "this week"
    const { data: approvedApplications, error: approvedError } = await supabase
      .from('contest_applications')
      .select(`
        id,
        user_id,
        application_data,
        status
      `)
      .eq('status', 'approved')
      .eq('is_active', true)
      .is('deleted_at', null)

    if (approvedError) {
      console.error('Error fetching approved applications:', approvedError)
      throw approvedError
    }

    let approvedToThisWeek = 0

    for (const application of approvedApplications || []) {
      // Проверяем, не существует ли уже этот участник в weekly_contest_participants
      const { data: existingParticipant } = await supabase
        .from('weekly_contest_participants')
        .select('id')
        .eq('user_id', application.user_id)
        .eq('is_active', true)
        .single()

      if (!existingParticipant) {
        // Получаем текущий активный конкурс
        const { data: currentContest } = await supabase
          .from('weekly_contests')
          .select('id')
          .eq('status', 'active')
          .order('week_start_date', { ascending: false })
          .limit(1)
          .single()

        if (currentContest) {
          // Create initial status history
          const statusHistory = {
            'this week': {
              changed_at: new Date().toISOString(),
              changed_by: null,
              change_reason: 'Automatic weekly transition (weekly-status-transition function)',
              week_interval: weekInterval,
              timestamp: new Date().toISOString()
            }
          }

          const { error: insertError } = await supabase
            .from('weekly_contest_participants')
            .insert({
              contest_id: currentContest.id,
              user_id: application.user_id,
              application_data: application.application_data,
              admin_status: 'this week',
              week_interval: weekInterval,
              status_history: statusHistory,
              is_active: true
            })

          if (insertError) {
            console.error(`Error inserting approved application ${application.id}:`, insertError)
          } else {
            approvedToThisWeek++
            console.log(`Added approved application ${application.id} as "this week" participant with interval ${weekInterval}`)
          }
        }
      }
    }

    transitions.approvedToThisWeek = approvedToThisWeek

    const summary = {
      success: true,
      weekInterval,
      transitions,
      message: `Weekly transition completed for week ${weekInterval}`,
      totalTransitions: transitions.thisWeekToPast + transitions.nextWeekOnSiteToThisWeek + transitions.nextWeekToNextWeekOnSite + transitions.approvedToThisWeek
    }

    console.log('Weekly transition summary:', summary)

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