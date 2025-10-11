import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CacheRefreshRequest {
  type?: 'voting' | 'engagement' | 'all';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type = 'all' }: CacheRefreshRequest = await req.json().catch(() => ({ type: 'all' }));

    console.log(`🔄 Refreshing cache: ${type}`);
    const startTime = Date.now();

    // Refresh materialized views for caching
    if (type === 'voting' || type === 'all') {
      console.log('Refreshing voting stats cache...');
      const { error: votingError } = await supabaseClient.rpc('refresh_voting_stats_cache');
      
      if (votingError) {
        console.error('Error refreshing voting stats:', votingError);
        throw votingError;
      }
      console.log('✅ Voting stats cache refreshed');
    }

    // Update participant stats
    if (type === 'engagement' || type === 'all') {
      console.log('Updating participant engagement stats...');
      
      // Get all active participants
      const { data: participants, error: participantsError } = await supabaseClient
        .from('weekly_contest_participants')
        .select('id, user_id')
        .eq('is_active', true)
        .is('deleted_at', null);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        throw participantsError;
      }

      if (participants) {
        console.log(`Updating stats for ${participants.length} participants...`);
        
        // Update in batches for better performance
        const batchSize = 50;
        for (let i = 0; i < participants.length; i += batchSize) {
          const batch = participants.slice(i, i + batchSize);
          
          await Promise.all(batch.map(async (participant) => {
            // Get aggregated stats
            const [likesResult, commentsResult, ratingsResult] = await Promise.all([
              supabaseClient
                .from('likes')
                .select('user_id', { count: 'exact', head: true })
                .eq('participant_id', participant.id),
              
              supabaseClient
                .from('photo_comments')
                .select('user_id', { count: 'exact', head: true })
                .eq('participant_id', participant.id),
              
              supabaseClient
                .from('contestant_ratings')
                .select('rating')
                .eq('participant_id', participant.id)
            ]);

            const totalLikes = likesResult.count || 0;
            const totalComments = commentsResult.count || 0;
            const ratings = ratingsResult.data || [];
            
            const averageRating = ratings.length > 0
              ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
              : 0;

            // Update participant stats
            await supabaseClient
              .from('weekly_contest_participants')
              .update({
                total_votes: ratings.length,
                average_rating: averageRating
              })
              .eq('id', participant.id);
          }));
          
          console.log(`✅ Updated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(participants.length / batchSize)}`);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Cache refresh completed in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        type,
        duration_ms: duration,
        message: 'Cache refreshed successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in cache-refresh function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});