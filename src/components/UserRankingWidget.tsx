import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/hooks/useI18n';
import { Trophy, TrendingUp, Medal } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useToast } from '@/hooks/use-toast';

type RankData = {
  participant_user_id: string;
  display_name_generated: string;
  total_votes: number;
  rank_position: number;
};

export default function UserRankingWidget({ userId }: { userId: string }) {
  const [rank, setRank] = useState<number | null>(null);
  const [votes, setVotes] = useState<number>(0);
  const [previousRank, setPreviousRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();
  const { toast } = useToast();

  const fetchRankData = async () => {
    const { data, error } = await supabase
      .from('v_user_weekly_rank')
      .select('*')
      .eq('participant_user_id', userId)
      .single();
    
    if (!error && data) {
      const newRank = data.rank_position;
      const newVotes = data.total_votes;
      
      // Check for rank improvement
      if (previousRank && newRank < previousRank) {
        const improvement = previousRank - newRank;
        toast({
          title: t('rank_improved', { count: improvement }),
          variant: 'default',
        });
      }
      
      // Check for top 3 achievement
      if (newRank <= 3 && (!previousRank || previousRank > 3)) {
        toast({
          title: t('top3_achievement'),
          variant: 'default',
        });
        triggerConfetti();
      }
      
      setPreviousRank(rank);
      setRank(newRank);
      setVotes(newVotes);
    }
    setLoading(false);
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  useEffect(() => {
    fetchRankData();

    // Setup realtime subscription
    const channel = supabase
      .channel('next_week_votes_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'next_week_votes' },
        () => {
          fetchRankData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="rounded-2xl p-4 bg-gradient-to-br from-primary/5 to-background shadow-md animate-pulse">
        <p className="text-muted-foreground text-sm">{t('loading_ranking')}</p>
      </div>
    );
  }

  const getRankColor = (rank: number | null) => {
    if (!rank) return 'text-muted-foreground';
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-primary';
  };

  const getRankIcon = (rank: number | null) => {
    if (!rank) return <Trophy className="w-6 h-6" />;
    if (rank === 1) return <span className="text-3xl">🥇</span>;
    if (rank === 2) return <span className="text-3xl">🥈</span>;
    if (rank === 3) return <span className="text-3xl">🥉</span>;
    return <Medal className="w-6 h-6" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5 shadow-lg border border-border/50 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-muted-foreground text-sm mb-1">{t('your_rank')}</p>
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={rank}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {getRankIcon(rank)}
              </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.p
                key={rank}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`text-4xl font-bold ${getRankColor(rank)}`}
              >
                #{rank ?? '-'}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 text-right">
          <p className="text-muted-foreground text-sm mb-1">{t('total_votes')}</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={votes}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ 
                scale: [0.9, 1.1, 1],
                opacity: 1 
              }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-2"
            >
              {votes}
              {previousRank && rank && rank < previousRank && (
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              )}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
