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

    // 3. Transition participant statuses
    const transitions = []

    // Move 'past week 2' to 'past week 3' (but we use 'past' for simplicity)
    const { data: pastWeek2, error: error1 } = await supabase
      .from('weekly_contest_participants')
      .update({ admin_status: 'past' })
      .eq('admin_status', 'past week 2')
      .select('id')

    if (error1) console.error('Error updating past week 2:', error1)
    else transitions.push(`Moved ${pastWeek2?.length || 0} participants from 'past week 2' to 'past'`)

    // Move 'past week 1' to 'past week 2'
    const { data: pastWeek1, error: error2 } = await supabase
      .from('weekly_contest_participants')
      .update({ admin_status: 'past week 2' })
      .eq('admin_status', 'past week 1')
      .select('id')

    if (error2) console.error('Error updating past week 1:', error2)
    else transitions.push(`Moved ${pastWeek1?.length || 0} participants from 'past week 1' to 'past week 2'`)

    // Move 'this week' to 'past week 1'
    const { data: thisWeek, error: error3 } = await supabase
      .from('weekly_contest_participants')
      .update({ admin_status: 'past week 1' })
      .eq('admin_status', 'this week')
      .select('id')

    if (error3) console.error('Error updating this week:', error3)
    else transitions.push(`Moved ${thisWeek?.length || 0} participants from 'this week' to 'past week 1'`)

    // Move 'next week on site' to 'this week'
    const { data: nextWeekOnSite, error: error4 } = await supabase
      .from('weekly_contest_participants')
      .update({ admin_status: 'this week' })
      .eq('admin_status', 'next week on site')
      .select('id')

    if (error4) console.error('Error updating next week on site:', error4)
    else transitions.push(`Moved ${nextWeekOnSite?.length || 0} participants from 'next week on site' to 'this week'`)

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