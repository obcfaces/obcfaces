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

    // Check for dry-run mode
    const url = new URL(req.url)
    const dryRun = url.searchParams.get('dry_run') === 'true'

    console.log('🚀 Starting UTC-based weekly contest transition...')
    console.log('⏰ All times calculated in UTC')
    console.log('🔄 Using atomic SQL function for data integrity')
    if (dryRun) {
      console.log('🧪 DRY RUN MODE - No changes will be committed')
    }

    // ========================================
    // CALCULATE WEEK START DATE (Monday in UTC)
    // ========================================
    const now = new Date()
    
    // Get current Monday in UTC
    const currentMonday = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ))
    
    const currentDay = currentMonday.getUTCDay()
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay
    currentMonday.setUTCDate(currentMonday.getUTCDate() + daysToMonday)

    // Format as YYYY-MM-DD for database
    const targetWeekStart = currentMonday.toISOString().split('T')[0]

    console.log(`📅 Target week start (Monday UTC): ${targetWeekStart}`)
    console.log(`📅 Current UTC time: ${now.toISOString()}`)

    // ========================================
    // CALL ATOMIC SQL FUNCTION
    // All transitions happen in one database transaction
    // Idempotent: safe to run multiple times
    // ========================================
    console.log('\n🔄 Calling atomic transition function...')

    const { data, error } = await supabase.rpc('transition_weekly_contest', {
      target_week_start: targetWeekStart,
      dry_run: dryRun
    })

    if (error) {
      console.error('❌ Transition function error:', error)
      throw error
    }

    console.log('\n✅ Transition function completed!')

    // ========================================
    // PARSE AND RETURN RESULTS
    // ========================================
    const result = {
      success: true,
      timestamp: now.toISOString(),
      utc_based: true,
      ...data
    }

    // Log summary
    if (data.status === 'already_completed') {
      console.log('\nℹ️  IDEMPOTENCY CHECK: Transition already completed for this week')
      console.log(`   Week: ${data.week_start_date} to ${data.week_end_date}`)
      console.log(`   Original run: ${data.run_id}`)
    } else if (data.status === 'dry_run') {
      console.log('\n🧪 DRY RUN RESULTS (NO CHANGES MADE):')
      console.log(`   Week: ${data.week_start_date} to ${data.week_end_date} (${data.week_interval})`)
      console.log(`   • Would move "this week" → "past": ${data.transitions?.thisWeekToPast || 0}`)
      console.log(`   • Would move "next week on site" → "this week": ${data.transitions?.nextWeekOnSiteToThisWeek || 0}`)
      console.log(`   • Would move "pre next week" → "next week": ${data.transitions?.preNextWeekToNextWeek || 0}`)
      
      if (data.winner) {
        console.log(`\n🏆 WOULD BE WINNER:`)
        console.log(`   User ID: ${data.winner.user_id}`)
        console.log(`   Rating: ${data.winner.average_rating || 'N/A'}`)
        console.log(`   Votes: ${data.winner.total_votes || 'N/A'}`)
      } else {
        console.log('\n🏆 No winner (no participants in "this week")')
      }
      
      console.log(`\n📸 Snapshot captured: ${data.snapshot ? 'yes' : 'no'}`)
      console.log(`📝 Dry run ID: ${data.run_id}`)
      console.log('\n⚠️  TO EXECUTE FOR REAL: Remove ?dry_run=true parameter')
    } else {
      console.log('\n📈 TRANSITION SUMMARY:')
      console.log(`   Week: ${data.week_start_date} to ${data.week_end_date} (${data.week_interval})`)
      console.log(`   • "this week" → "past": ${data.transitions?.thisWeekToPast || 0}`)
      console.log(`   • "next week on site" → "this week": ${data.transitions?.nextWeekOnSiteToThisWeek || 0}`)
      console.log(`   • "pre next week" → "next week": ${data.transitions?.preNextWeekToNextWeek || 0}`)
      
      if (data.winner) {
        console.log(`\n🏆 WINNER:`)
        console.log(`   User ID: ${data.winner.user_id}`)
        console.log(`   Rating: ${data.winner.average_rating || 'N/A'}`)
        console.log(`   Votes: ${data.winner.total_votes || 'N/A'}`)
      } else {
        console.log('\n🏆 No winner (no participants in "this week")')
      }
      
      console.log(`\n📝 Run ID: ${data.run_id}`)
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('❌ ERROR in weekly transition:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return new Response(
      JSON.stringify({ 
        success: false,
        utc_based: true,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
