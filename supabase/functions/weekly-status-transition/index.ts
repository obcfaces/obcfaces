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
      nextWeekToNextWeekOnSite: 0
    }

    // 1. Переводим "this week" → "past"
    const { data: thisWeekParticipants, error: thisWeekError } = await supabase
      .from('weekly_contest_participants')
      .select('id, status_week_history')
      .eq('admin_status', 'this week')
      .eq('is_active', true)

    if (thisWeekError) {
      console.error('Error fetching this week participants:', thisWeekError)
      throw thisWeekError
    }

    for (const participant of thisWeekParticipants || []) {
      const updatedHistory = {
        ...participant.status_week_history,
        'past': weekInterval
      }

      const { error: updateError } = await supabase
        .from('weekly_contest_participants')
        .update({
          admin_status: 'past',
          status_week_history: updatedHistory
        })
        .eq('id', participant.id)

      if (updateError) {
        console.error(`Error updating participant ${participant.id}:`, updateError)
      } else {
        transitions.thisWeekToPast++
        console.log(`Moved participant ${participant.id} from "this week" to "past"`)
      }
    }

    // 2. Переводим "pre next week" → "next week"
    const { data: preNextWeekParticipants, error: preNextWeekError } = await supabase
      .from('weekly_contest_participants')
      .select('id, status_week_history')
      .eq('admin_status', 'pre next week')
      .eq('is_active', true)

    if (preNextWeekError) {
      console.error('Error fetching pre next week participants:', preNextWeekError)
      throw preNextWeekError
    }

    for (const participant of preNextWeekParticipants || []) {
      const updatedHistory = {
        ...participant.status_week_history,
        'next week': weekInterval
      }

      const { error: updateError } = await supabase
        .from('weekly_contest_participants')
        .update({
          admin_status: 'next week',
          status_week_history: updatedHistory
        })
        .eq('id', participant.id)

      if (updateError) {
        console.error(`Error updating participant ${participant.id}:`, updateError)
      } else {
        transitions.nextWeekToNextWeekOnSite++
        console.log(`Moved participant ${participant.id} from "pre next week" to "next week"`)
      }
    }

    // 3. Переводим "next week on site" → "this week"
    const { data: nextWeekOnSiteParticipants, error: nextWeekOnSiteError } = await supabase
      .from('weekly_contest_participants')
      .select('id, status_week_history')
      .eq('admin_status', 'next week on site')
      .eq('is_active', true)

    if (nextWeekOnSiteError) {
      console.error('Error fetching next week on site participants:', nextWeekOnSiteError)
      throw nextWeekOnSiteError
    }

    for (const participant of nextWeekOnSiteParticipants || []) {
      const updatedHistory = {
        ...participant.status_week_history,
        'this week': weekInterval
      }

      const { error: updateError } = await supabase
        .from('weekly_contest_participants')
        .update({
          admin_status: 'this week',
          status_week_history: updatedHistory
        })
        .eq('id', participant.id)

      if (updateError) {
        console.error(`Error updating participant ${participant.id}:`, updateError)
      } else {
        transitions.nextWeekOnSiteToThisWeek++
        console.log(`Moved participant ${participant.id} from "next week on site" to "this week"`)
      }
    }

    // 4. Статус "next week" остается без изменений для фильтрации в админке по неделям
    console.log('Skipping "next week" participants - they remain unchanged for admin filtering')

    const summary = {
      success: true,
      weekInterval,
      transitions,
      message: `Weekly transition completed for week ${weekInterval}`,
      totalTransitions: transitions.thisWeekToPast + transitions.nextWeekOnSiteToThisWeek + transitions.nextWeekToNextWeekOnSite
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