import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Starting weekly transition process...')

    // Get current time in Philippine timezone
    const philippineTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"})
    const currentDate = new Date(philippineTime)
    console.log(`Philippine time: ${philippineTime}`)

    // Get current week Monday (Philippines time)
    const currentDayOfWeek = currentDate.getDay()
    const daysToSubtract = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1 // Monday = 0 days to subtract
    const currentMonday = new Date(currentDate)
    currentMonday.setDate(currentDate.getDate() - daysToSubtract)
    const currentMondayStr = currentMonday.toISOString().split('T')[0]

    console.log(`Current week Monday: ${currentMondayStr}`)

    // 1. Get current week participants to determine winner
    const { data: currentParticipants, error: currentError } = await supabase
      .from('weekly_contest_participants')
      .select('*')
      .eq('admin_status', 'this week')
      .eq('is_active', true)

    if (currentError) {
      console.error('Error fetching current participants:', currentError)
      throw currentError
    }

    console.log(`Found ${currentParticipants?.length || 0} current week participants`)

    let winnerDetermined = false
    let winnerInfo = null

    // 2. Determine winner (highest average rating, then highest votes)
    if (currentParticipants && currentParticipants.length > 0) {
      const sortedParticipants = currentParticipants
        .filter(p => p.total_votes && p.total_votes > 0) // Only participants with votes
        .sort((a, b) => {
          // First sort by average rating (highest first)
          if (b.average_rating !== a.average_rating) {
            return (b.average_rating || 0) - (a.average_rating || 0)
          }
          // Then by total votes (highest first)
          return (b.total_votes || 0) - (a.total_votes || 0)
        })

      if (sortedParticipants.length > 0) {
        const winner = sortedParticipants[0]
        
        // Set final ranks for all participants
        for (let i = 0; i < sortedParticipants.length; i++) {
          const participant = sortedParticipants[i]
          const { error: rankError } = await supabase
            .from('weekly_contest_participants')
            .update({ final_rank: i + 1 })
            .eq('id', participant.id)

          if (rankError) {
            console.error(`Error setting rank for participant ${participant.id}:`, rankError)
          }
        }

        winnerDetermined = true
        winnerInfo = {
          participant_id: winner.id,
          user_id: winner.user_id,
          name: `${winner.application_data?.first_name || ''} ${winner.application_data?.last_name || ''}`.trim(),
          average_rating: winner.average_rating,
          total_votes: winner.total_votes
        }

        console.log(`Winner determined: ${winnerInfo.name} (Rating: ${winnerInfo.average_rating}, Votes: ${winnerInfo.total_votes})`)
      }
    }

    // 3. Transition participant statuses with audit logging
    const transitions = []
    const currentTime = new Date().toISOString()

    // Move 'this week' to 'past' (simplified - only one past status)
    const { data: thisWeekToUpdate, error: fetchThisWeekError } = await supabase
      .from('weekly_contest_participants')
      .select('id, status_history')
      .eq('admin_status', 'this week')

    if (!fetchThisWeekError && thisWeekToUpdate) {
      for (const participant of thisWeekToUpdate) {
        const currentHistory = (participant.status_history as Record<string, any>) || {}
        const updatedHistory = {
          ...currentHistory,
          past: {
            changed_at: currentTime,
            changed_by: 'SYSTEM',
            changed_via: 'EDGE_FUNCTION_weekly-transition',
            previous_status: 'this week'
          }
        }

        await supabase
          .from('weekly_contest_participants')
          .update({ 
            admin_status: 'past',
            status_history: updatedHistory
          })
          .eq('id', participant.id)
      }
      transitions.push(`Moved ${thisWeekToUpdate.length} participants from 'this week' to 'past'`)
    }

    // Move 'next week on site' to 'this week'
    const { data: nextWeekToUpdate, error: fetchNextWeekError } = await supabase
      .from('weekly_contest_participants')
      .select('id, status_history')
      .eq('admin_status', 'next week on site')

    if (!fetchNextWeekError && nextWeekToUpdate) {
      for (const participant of nextWeekToUpdate) {
        const currentHistory = (participant.status_history as Record<string, any>) || {}
        const updatedHistory = {
          ...currentHistory,
          'this week': {
            changed_at: currentTime,
            changed_by: 'SYSTEM',
            changed_via: 'EDGE_FUNCTION_weekly-transition',
            previous_status: 'next week on site'
          }
        }

        await supabase
          .from('weekly_contest_participants')
          .update({ 
            admin_status: 'this week',
            status_history: updatedHistory
          })
          .eq('id', participant.id)
      }
      transitions.push(`Moved ${nextWeekToUpdate.length} participants from 'next week on site' to 'this week'`)
    }

    // 4. Create new contest for current week if it doesn't exist
    const { data: existingContest } = await supabase
      .from('weekly_contests')
      .select('id')
      .eq('week_start_date', currentMondayStr)
      .single()

    if (!existingContest) {
      const weekEnd = new Date(currentMonday)
      weekEnd.setDate(currentMonday.getDate() + 6)
      const weekEndStr = weekEnd.toISOString().split('T')[0]
      
      const contestTitle = `Contest ${currentMonday.getDate().toString().padStart(2, '0')}.${(currentMonday.getMonth() + 1).toString().padStart(2, '0')}-${weekEnd.getDate().toString().padStart(2, '0')}.${(weekEnd.getMonth() + 1).toString().padStart(2, '0')}.${weekEnd.getFullYear()}`

      const { error: contestError } = await supabase
        .from('weekly_contests')
        .insert({
          week_start_date: currentMondayStr,
          week_end_date: weekEndStr,
          title: contestTitle,
          status: 'active'
        })

      if (contestError) {
        console.error('Error creating new contest:', contestError)
      } else {
        console.log(`Created new contest: ${contestTitle}`)
      }
    }

    // 5. Close previous week's contest
    const prevMonday = new Date(currentMonday)
    prevMonday.setDate(currentMonday.getDate() - 7)
    const prevMondayStr = prevMonday.toISOString().split('T')[0]

    const { error: closeError } = await supabase
      .from('weekly_contests')
      .update({ status: 'closed' })
      .eq('week_start_date', prevMondayStr)
      .eq('status', 'active')

    if (closeError) {
      console.error('Error closing previous contest:', closeError)
    } else {
      console.log(`Closed contest for week starting ${prevMondayStr}`)
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      philippine_time: philippineTime,
      current_week_monday: currentMondayStr,
      winner_determined: winnerDetermined,
      winner_info: winnerInfo,
      transitions: transitions
    }

    console.log('Weekly transition completed successfully:', result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in weekly transition:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})