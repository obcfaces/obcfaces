import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Star, ChevronDown, ChevronUp, Heart } from "lucide-react";

interface VoterData {
  user_id: string;
  rating: number;
  created_at: string;
  email?: string;
  registration_date?: string;
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
    created_at?: string;
  };
}

interface UserActivity {
  target_name: string;
  target_user_id: string;
  rating?: number;
  like_count: number;
  last_activity: string;
  target_avatar?: string;
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
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (isOpen && participantId) {
      fetchVoters();
    }
  }, [isOpen, participantId]);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      console.log('Fetching voters for participant ID:', participantId);
      
      // First get the participant's user_id from weekly_contest_participants
      const { data: participantData, error: participantError } = await supabase
        .from('weekly_contest_participants')
        .select('user_id')
        .eq('id', participantId)
        .single();

      console.log('Participant data:', { participantData, participantError });

      if (participantError) {
        console.error('Error fetching participant:', participantError);
        return;
      }

      if (!participantData) {
        console.log('No participant found for ID:', participantId);
        setVoters([]);
        return;
      }

      // Get ratings for this participant using both participant_id and user_id
      // Only get the latest rating from each user to avoid duplicates
      const { data: ratings, error: ratingsError } = await supabase
        .from('contestant_ratings')
        .select('user_id, rating, created_at')
        .or(`participant_id.eq.${participantId},contestant_user_id.eq.${participantData.user_id}`)
        .order('user_id', { ascending: true })
        .order('created_at', { ascending: false });

      console.log('Ratings query result:', { ratings, ratingsError });

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
        .select('id, display_name, first_name, last_name, avatar_url, country, city, age, gender, bio, is_contest_participant, created_at')
        .in('id', userIds);

      // Get auth data for emails
      const { data: authData, error: authError } = await supabase
        .rpc('get_user_auth_data_admin');

      if (authError) {
        console.error('Error fetching auth data:', authError);
      }

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Combine ratings with profiles and auth data
      // Filter to get only the latest rating from each user
      const uniqueRatings = ratings?.reduce((acc: any[], rating: any) => {
        const existingIndex = acc.findIndex(r => r.user_id === rating.user_id);
        if (existingIndex === -1) {
          acc.push(rating);
        } else if (new Date(rating.created_at) > new Date(acc[existingIndex].created_at)) {
          acc[existingIndex] = rating;
        }
        return acc;
      }, []) || [];

      const votersWithProfiles = uniqueRatings.map(rating => {
        const profile = profiles?.find(p => p.id === rating.user_id);
        const auth = authData?.find(a => a.user_id === rating.user_id);
        return {
          ...rating,
          profile,
          email: auth?.email,
          registration_date: auth?.created_at || profile?.created_at
        };
      });

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

  const fetchUserActivity = async (userId: string) => {
    setActivityLoading(true);
    try {
      // Get user's ratings for other participants
      const { data: ratings, error: ratingsError } = await supabase
        .from('contestant_ratings')
        .select(`
          rating,
          created_at,
          contestant_user_id,
          contestant_name
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Get user's likes for other participants
      const { data: likes, error: likesError } = await supabase
        .from('likes')
        .select('content_id, created_at')
        .eq('user_id', userId)
        .eq('content_type', 'contest')
        .ilike('content_id', 'contestant-%')
        .order('created_at', { ascending: false });

      if (ratingsError) {
        console.error('Error fetching user ratings:', ratingsError);
        return;
      }

      if (likesError) {
        console.error('Error fetching user likes:', likesError);
        return;
      }

      // Get profiles for rated users
      const ratedUserIds = ratings?.map(r => r.contestant_user_id).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, last_name, avatar_url')
        .in('id', ratedUserIds);

      // Combine data
      const activityMap = new Map<string, UserActivity>();

      // Process ratings
      ratings?.forEach(rating => {
        if (rating.contestant_user_id) {
          const profile = profiles?.find(p => p.id === rating.contestant_user_id);
          const key = rating.contestant_user_id;
          const name = profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || rating.contestant_name;
          
          activityMap.set(key, {
            target_name: name,
            target_user_id: rating.contestant_user_id,
            rating: rating.rating,
            like_count: 0,
            last_activity: rating.created_at,
            target_avatar: profile?.avatar_url
          });
        }
      });

      // Process likes
      likes?.forEach(like => {
        // Extract user name from content_id (contestant-card-{name} or contestant-photo-{name}-{number})
        const match = like.content_id.match(/contestant-(?:card|photo)-(.+?)(?:-\d+)?$/);
        if (match) {
          const targetName = match[1];
          // Find matching activity by name
          for (const [key, activity] of activityMap.entries()) {
            if (activity.target_name.toLowerCase() === targetName.toLowerCase()) {
              activity.like_count++;
              if (like.created_at > activity.last_activity) {
                activity.last_activity = like.created_at;
              }
              break;
            }
          }
        }
      });

      const activities = Array.from(activityMap.values())
        .sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime());

      setUserActivity(activities);
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleUserClick = (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      setUserActivity([]);
    } else {
      setExpandedUser(userId);
      fetchUserActivity(userId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle className="text-xl">
            Voters for {participantName} ({voters.length} total)
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-auto px-6 pb-6" style={{ maxHeight: 'calc(90vh - 100px)', minHeight: '400px' }}>
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
                <Collapsible key={`${voter.user_id}-${index}`} open={expandedUser === voter.user_id}>
                  <Card className="hover:shadow-md transition-shadow">
                     <CollapsibleTrigger 
                       className="w-full text-left"
                       onClick={() => handleUserClick(voter.user_id)}
                     >
                       <CardContent className="p-4 hover:bg-muted/50 transition-colors relative">
                         {/* Contestant badge in top-left corner */}
                         {voter.profile?.is_contest_participant && (
                           <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
                             Contestant
                           </Badge>
                         )}
                         <div className="flex items-start gap-4 mt-4">
                           {/* Avatar with rating below */}
                           <div className="flex flex-col items-center gap-2 flex-shrink-0">
                             <Avatar className="h-16 w-16">
                               <AvatarImage src={voter.profile?.avatar_url || ''} />
                               <AvatarFallback className="text-lg">
                                 {getDisplayName(voter).charAt(0)}
                               </AvatarFallback>
                             </Avatar>
                             <Badge 
                               className={`${getRatingColor(voter.rating)} text-white px-2 py-1 text-sm font-semibold`}
                             >
                               {voter.rating}/10
                             </Badge>
                           </div>
                          
                           {/* User Info */}
                           <div className="flex-1 min-w-0">
                             <div className="flex items-start justify-between gap-2">
                               <div className="flex-1">
                                 <h3 className="font-semibold text-lg leading-tight">
                                   {getDisplayName(voter)}
                                 </h3>
                                 
                                 {/* City and Country */}
                                 <div className="text-sm text-muted-foreground mt-1">
                                   <span>{getLocationString(voter)}</span>
                                 </div>
                                 
                                 {/* Basic Info with Age first */}
                                 <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                   {voter.profile?.age && (
                                     <>
                                       <span>{voter.profile.age} years old</span>
                                       {voter.profile?.gender && <span>•</span>}
                                     </>
                                   )}
                                   {voter.profile?.gender && (
                                     <span>{voter.profile.gender}</span>
                                   )}
                                 </div>
                                
                                {/* Bio */}
                                {voter.profile?.bio && (
                                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                    {voter.profile.bio}
                                  </p>
                                )}
                                
                                {/* Email */}
                                {voter.email && (
                                  <p className="text-sm text-muted-foreground mt-2 break-all">
                                    📧 {voter.email}
                                  </p>
                                )}
                                
                                {/* Registration Date */}
                                {voter.registration_date && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Registered: {new Date(voter.registration_date).toLocaleDateString()}
                                  </p>
                                )}
                                
                                {/* Vote Date */}
                                <p className="text-xs text-muted-foreground mt-1">
                                  Voted on {new Date(voter.created_at).toLocaleString()}
                                </p>
                              </div>
                              
                               {/* Badges and expand indicator */}
                               <div className="flex flex-col items-end gap-2">
                                 <div className="flex items-center gap-2">
                                   {expandedUser === voter.user_id ? (
                                     <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                   ) : (
                                     <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                   )}
                                 </div>
                               </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    
                    {/* User Activity History */}
                    <CollapsibleContent>
                      <CardContent className="px-4 pb-4 pt-0 border-t">
                        <h4 className="font-medium text-sm mb-3 text-muted-foreground">
                          Rating & Like History
                        </h4>
                        
                        {activityLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="text-sm text-muted-foreground">Loading activity...</div>
                          </div>
                        ) : userActivity.length === 0 ? (
                          <div className="text-sm text-muted-foreground py-2">
                            No activity found for other participants
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {userActivity.map((activity, actIndex) => (
                              <div key={`${activity.target_user_id}-${actIndex}`} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={activity.target_avatar || ''} />
                                  <AvatarFallback className="text-xs">
                                    {activity.target_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {activity.target_name}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {activity.rating && (
                                      <span className="flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-current text-yellow-500" />
                                        {activity.rating}/10
                                      </span>
                                    )}
                                    {activity.like_count > 0 && (
                                      <span className="flex items-center gap-1">
                                        <Heart className="w-3 h-3 fill-current text-red-500" />
                                        {activity.like_count}
                                      </span>
                                    )}
                                    <span>•</span>
                                    <span>{new Date(activity.last_activity).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};