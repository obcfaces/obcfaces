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
      pastWeeksShifted: 0,
      thisWeekToPast: 0,
      nextWeekOnSiteToThisWeek: 0,
      nextWeekToNextWeekOnSite: 0,
      approvedToThisWeek: 0
    }

    // 1. Сначала сдвигаем все существующие "past" статусы на одну неделю назад
    const { data: existingPastParticipants, error: pastError } = await supabase
      .from('weekly_contest_participants')
      .select('id, status_week_history')
      .eq('admin_status', 'past')
      .eq('is_active', true)

    if (pastError) {
      console.error('Error fetching existing past participants:', pastError)
      throw pastError
    }

    for (const participant of existingPastParticipants || []) {
      // Сдвигаем интервал недели на одну неделю назад (вычитаем 7 дней)
      const currentPastInterval = participant.status_week_history?.past
      if (currentPastInterval) {
        // Парсим текущий интервал и вычитаем 7 дней
        const [startDate] = currentPastInterval.split(' - ')
        const currentStart = new Date(startDate.split('/').reverse().join('-'))
        const newStart = new Date(currentStart)
        newStart.setDate(newStart.getDate() - 7)
        
        const newEnd = new Date(newStart)
        newEnd.setDate(newEnd.getDate() + 6)
        
        const newInterval = `${newStart.getDate().toString().padStart(2, '0')}/${(newStart.getMonth() + 1).toString().padStart(2, '0')}/${newStart.getFullYear().toString().slice(-2)} - ${newEnd.getDate().toString().padStart(2, '0')}/${(newEnd.getMonth() + 1).toString().padStart(2, '0')}/${newEnd.getFullYear().toString().slice(-2)}`
        
        const updatedHistory = {
          ...participant.status_week_history,
          'past': newInterval
        }

        const { error: updateError } = await supabase
          .from('weekly_contest_participants')
          .update({
            status_week_history: updatedHistory
          })
          .eq('id', participant.id)

        if (updateError) {
          console.error(`Error shifting past week for participant ${participant.id}:`, updateError)
        } else {
          transitions.pastWeeksShifted++
          console.log(`Shifted participant ${participant.id} past week interval from ${currentPastInterval} to ${newInterval}`)
        }
      }
    }

    // 2. Переводим "this week" → "past" с текущим интервалом
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

    // 3. Переводим "pre next week" → "next week"
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

    // 4. Переводим "next week on site" → "this week"
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

    // 5. Добавляем approved заявки как новых участников "this week"
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
          const { error: insertError } = await supabase
            .from('weekly_contest_participants')
            .insert({
              contest_id: currentContest.id,
              user_id: application.user_id,
              application_data: application.application_data,
              admin_status: 'this week',
              status_week_history: {
                'this week': weekInterval
              },
              is_active: true
            })

          if (insertError) {
            console.error(`Error inserting approved application ${application.id}:`, insertError)
          } else {
            approvedToThisWeek++
            console.log(`Added approved application ${application.id} as "this week" participant`)
          }
        }
      }
    }

    // 6. Статус "next week" остается без изменений для фильтрации в админке по неделям
    console.log('Skipping "next week" participants - they remain unchanged for admin filtering')

    transitions.approvedToThisWeek = approvedToThisWeek

    const summary = {
      success: true,
      weekInterval,
      transitions,
      message: `Weekly transition completed for week ${weekInterval}`,
      totalTransitions: transitions.pastWeeksShifted + transitions.thisWeekToPast + transitions.nextWeekOnSiteToThisWeek + transitions.nextWeekToNextWeekOnSite + transitions.approvedToThisWeek
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