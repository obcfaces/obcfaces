import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star } from "lucide-react";

interface VoterData {
  user_id: string;
  rating: number;
  created_at: string;
  profile?: {
    display_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    country?: string;
    city?: string;
    age?: number;
    gender?: string;
    bio?: string;
    is_contest_participant?: boolean;
  };
}

interface VotersModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participantName: string;
}

export const VotersModal = ({ isOpen, onClose, participantId, participantName }: VotersModalProps) => {
  const [voters, setVoters] = useState<VoterData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && participantId) {
      fetchVoters();
    }
  }, [isOpen, participantId]);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      // Get ratings for this participant
      const { data: ratings, error: ratingsError } = await supabase
        .from('contestant_ratings')
        .select('user_id, rating, created_at')
        .or(`participant_id.eq.${participantId},contestant_user_id.eq.${participantId}`)
        .order('created_at', { ascending: false });

      if (ratingsError) {
        console.error('Error fetching ratings:', ratingsError);
        return;
      }

      if (!ratings || ratings.length === 0) {
        setVoters([]);
        return;
      }

      // Get user profiles for all voters
      const userIds = ratings.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, last_name, avatar_url, country, city, age, gender, bio, is_contest_participant')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Combine ratings with profiles
      const votersWithProfiles = ratings.map(rating => ({
        ...rating,
        profile: profiles?.find(p => p.id === rating.user_id)
      }));

      setVoters(votersWithProfiles);
    } catch (error) {
      console.error('Error in fetchVoters:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (voter: VoterData) => {
    if (voter.profile?.display_name) return voter.profile.display_name;
    if (voter.profile?.first_name || voter.profile?.last_name) {
      return `${voter.profile.first_name || ''} ${voter.profile.last_name || ''}`.trim();
    }
    return 'Anonymous User';
  };

  const getLocationString = (voter: VoterData) => {
    const parts = [];
    if (voter.profile?.city) parts.push(voter.profile.city);
    if (voter.profile?.country) parts.push(voter.profile.country);
    return parts.join(', ') || 'Location not specified';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return 'bg-green-500';
    if (rating >= 7) return 'bg-yellow-500';
    if (rating >= 5) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Voters for {participantName} ({voters.length} total)
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading voters...</div>
            </div>
          ) : voters.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No votes yet for this participant</div>
            </div>
          ) : (
            <div className="grid gap-4">
              {voters.map((voter, index) => (
                <Card key={`${voter.user_id}-${index}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <Avatar className="h-16 w-16 flex-shrink-0">
                        <AvatarImage src={voter.profile?.avatar_url || ''} />
                        <AvatarFallback className="text-lg">
                          {getDisplayName(voter).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg leading-tight">
                              {getDisplayName(voter)}
                            </h3>
                            
                            {/* Basic Info */}
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              {voter.profile?.age && (
                                <>
                                  <span>{voter.profile.age} years old</span>
                                  <span>•</span>
                                </>
                              )}
                              {voter.profile?.gender && (
                                <>
                                  <span>{voter.profile.gender}</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>{getLocationString(voter)}</span>
                            </div>
                            
                            {/* Bio */}
                            {voter.profile?.bio && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {voter.profile.bio}
                              </p>
                            )}
                            
                            {/* Vote Date */}
                            <p className="text-xs text-muted-foreground mt-2">
                              Voted on {new Date(voter.created_at).toLocaleString()}
                            </p>
                          </div>
                          
                          {/* Rating and Badges */}
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <Badge 
                                className={`${getRatingColor(voter.rating)} text-white px-3 py-1 text-sm font-semibold`}
                              >
                                {voter.rating}/10
                              </Badge>
                            </div>
                            
                            {voter.profile?.is_contest_participant && (
                              <Badge variant="secondary" className="text-xs">
                                Contestant
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};