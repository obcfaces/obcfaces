import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ContestParticipationModal } from "@/components/contest-participation-modal";
import { supabase } from "@/integrations/supabase/client";
import { format, addYears } from "date-fns";

interface ContestParticipationWrapperProps {
  children?: React.ReactNode;
}

export const ContestParticipationWrapper = ({ children }: ContestParticipationWrapperProps) => {
  const [canParticipate, setCanParticipate] = useState(true);
  const [nextEligibleDate, setNextEligibleDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        await checkParticipationEligibility(session.user.id);
      } else {
        setIsLoading(false);
      }
    };

    checkUserStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      
      if (session?.user) {
        await checkParticipationEligibility(session.user.id);
      } else {
        setCanParticipate(true);
        setNextEligibleDate(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkParticipationEligibility = async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Check if user has participated in the contest before
      const { data: lastParticipation, error } = await supabase
        .from('contest_applications')
        .select('last_participation_date, submitted_at')
        .eq('user_id', userId)
        .order('last_participation_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.warn('Error checking participation eligibility:', error);
        setCanParticipate(true);
        return;
      }

      if (lastParticipation) {
        const lastDate = new Date(lastParticipation.last_participation_date || lastParticipation.submitted_at);
        const oneYearLater = addYears(lastDate, 1);
        const now = new Date();

        if (now < oneYearLater) {
          setCanParticipate(false);
          setNextEligibleDate(oneYearLater);
        } else {
          setCanParticipate(true);
          setNextEligibleDate(null);
        }
      } else {
        setCanParticipate(true);
        setNextEligibleDate(null);
      }
    } catch (error) {
      console.warn('Error checking participation eligibility:', error);
      setCanParticipate(true);
    } finally {
      setIsLoading(false);
    }
  };

  const formatEligibleDate = (date: Date) => {
    return format(date, 'MMMM d, yyyy');
  };

  // If not authenticated, show normal button
  if (!user) {
    return children || (
      <ContestParticipationModal>
        <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
          🏆 Join & Win 5,000 PHP
        </Button>
      </ContestParticipationModal>
    );
  }

  // If can participate, show normal button
  if (canParticipate && !isLoading) {
    return children || (
      <ContestParticipationModal>
        <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
          🏆 Join & Win 5,000 PHP
        </Button>
      </ContestParticipationModal>
    );
  }

  // If cannot participate, show disabled button with tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-not-allowed">
            <Button 
              disabled
              className="bg-gradient-to-r from-gray-400 to-gray-500 text-white font-semibold shadow-lg cursor-not-allowed opacity-60"
            >
              🏆 Join & Win 5,000 PHP
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-center">
          <p>
            You can participate in the contest again one year after your last participation.
            {nextEligibleDate && (
              <>
                <br />
                Next eligible date: {formatEligibleDate(nextEligibleDate)}
              </>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};