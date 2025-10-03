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
      preNextWeekToNextWeek: 0,
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

    // 3. Переводим "pre next week" → "next week" с новым интервалом
    const { data: preNextWeekParticipants, error: preNextWeekError } = await supabase
      .from('weekly_contest_participants')
      .select('id, status_history')
      .eq('admin_status', 'pre next week')
      .eq('is_active', true)

    if (preNextWeekError) {
      console.error('Error fetching pre next week participants:', preNextWeekError)
      throw preNextWeekError
    }

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
        change_reason: 'Automatic weekly transition (weekly-status-transition function)',
        week_interval: weekInterval,
        timestamp: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('weekly_contest_participants')
        .update({
          admin_status: 'next week',
          week_interval: weekInterval,
          status_history: statusHistory
        })
        .eq('id', participant.id)

      if (updateError) {
        console.error(`Error updating participant ${participant.id}:`, updateError)
      } else {
        transitions.preNextWeekToNextWeek++
        console.log(`Moved participant ${participant.id} from "pre next week" to "next week" with interval ${weekInterval}`)
      }
    }

    // 4. Переводим approved участников в статус "this week"
    // После миграции все участники уже в weekly_contest_participants
    const { data: approvedApplications, error: approvedError } = await supabase
      .from('weekly_contest_participants')
      .select(`
        id,
        user_id,
        application_data,
        admin_status,
        status
      `)
      .eq('status', 'approved')
      .eq('admin_status', 'approved')
      .eq('is_active', true)
      .is('deleted_at', null)

    if (approvedError) {
      console.error('Error fetching approved applications:', approvedError)
      throw approvedError
    }

    let approvedToThisWeek = 0

    for (const participant of approvedApplications || []) {
      // Получаем текущий активный конкурс
      const { data: currentContest } = await supabase
        .from('weekly_contests')
        .select('id')
        .eq('status', 'active')
        .order('week_start_date', { ascending: false })
        .limit(1)
        .single()

      if (currentContest) {
        // Update existing participant to "this week" status
        const statusHistory = participant.status_history || {}
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
            contest_id: currentContest.id,
            admin_status: 'this week',
            week_interval: weekInterval,
            status_history: statusHistory
          })
          .eq('id', participant.id)

        if (updateError) {
          console.error(`Error updating approved participant ${participant.id}:`, updateError)
        } else {
          approvedToThisWeek++
          console.log(`Moved approved participant ${participant.id} to "this week" with interval ${weekInterval}`)
        }
      }
    }

    transitions.approvedToThisWeek = approvedToThisWeek

    const summary = {
      success: true,
      weekInterval,
      transitions,
      message: `Weekly transition completed for week ${weekInterval}`,
      totalTransitions: transitions.thisWeekToPast + transitions.nextWeekOnSiteToThisWeek + transitions.preNextWeekToNextWeek + transitions.approvedToThisWeek
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