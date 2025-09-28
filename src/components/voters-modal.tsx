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
  ratings: Array<{
    rating: number;
    created_at: string;
    action_type?: string;
    old_rating?: number;
  }>;
  rating_history?: Array<{
    old_rating?: number;
    new_rating: number;
    action_type: string;
    changed_at: string;
  }>;
  latest_rating: {
    rating: number;
    created_at: string;
  };
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

      // Get rating history for this participant
      const { data: ratingHistory, error: historyError } = await supabase
        .from('contestant_rating_history')
        .select('user_id, old_rating, new_rating, action_type, changed_at')
        .or(`participant_id.eq.${participantId},contestant_user_id.eq.${participantData.user_id}`)
        .order('user_id', { ascending: true })
        .order('changed_at', { ascending: false });

      console.log('Rating history query result:', { ratingHistory, historyError });

      if (historyError) {
        console.error('Error fetching rating history:', historyError);
        // Fallback to current ratings if history fails
        const { data: currentRatings, error: currentRatingsError } = await supabase
          .from('contestant_ratings')
          .select('user_id, rating, created_at')
          .or(`participant_id.eq.${participantId},contestant_user_id.eq.${participantData.user_id}`)
          .order('user_id', { ascending: true })
          .order('created_at', { ascending: false });
        
        if (currentRatingsError) {
          console.error('Error fetching current ratings:', currentRatingsError);
          setVoters([]);
          return;
        }
        
        if (!currentRatings || currentRatings.length === 0) {
          setVoters([]);
          return;
        }

        // Get unique user IDs for profile fetching
        const userIds = [...new Set(currentRatings.map(r => r.user_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, display_name, first_name, last_name, avatar_url, country, city, age, gender, bio, is_contest_participant, created_at')
          .in('id', userIds);

        // Get auth data for emails
        const { data: authData, error: authError } = await supabase
          .rpc('get_user_auth_data_admin');

        if (profilesError || authError) {
          console.error('Error fetching profiles or auth data:', { profilesError, authError });
          setVoters([]);
          return;
        }

        // Use current ratings as fallback
        const ratingsByUser = currentRatings?.reduce((acc: { [key: string]: any }, rating: any) => {
          if (!acc[rating.user_id] || new Date(rating.created_at) > new Date(acc[rating.user_id].created_at)) {
            acc[rating.user_id] = rating;
          }
          return acc;
        }, {}) || {};

        const votersWithProfiles = Object.keys(ratingsByUser).map(userId => {
          const latestRating = ratingsByUser[userId];
          const profile = profiles?.find(p => p.id === userId);
          const auth = authData?.find(a => a.user_id === userId);
          
          return {
            user_id: userId,
            ratings: [{
              rating: latestRating.rating,
              created_at: latestRating.created_at,
              action_type: 'current'
            }],
            latest_rating: latestRating,
            profile,
            email: auth?.email,
            registration_date: auth?.created_at || profile?.created_at
          };
        });

        setVoters(votersWithProfiles);
        return;
      }

      if (!ratingHistory || ratingHistory.length === 0) {
        setVoters([]);
        return;
      }

      // Get unique user IDs for profile fetching
      const userIds = [...new Set(ratingHistory.map(r => r.user_id))];
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

      // Group rating history by user
      const historyByUser = ratingHistory?.reduce((acc: { [key: string]: any[] }, historyItem: any) => {
        if (!acc[historyItem.user_id]) {
          acc[historyItem.user_id] = [];
        }
        acc[historyItem.user_id].push(historyItem);
        return acc;
      }, {}) || {};

      console.log('Rating history grouped by user:', historyByUser);

      // Create voter entries with full rating history per user
      const votersWithProfiles = Object.keys(historyByUser).map(userId => {
        const userHistory = historyByUser[userId].sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
        const profile = profiles?.find(p => p.id === userId);
        const auth = authData?.find(a => a.user_id === userId);
        
        // Get the latest rating (most recent new_rating or current value)
        const latestHistoryItem = userHistory[0];
        const latestRating = latestHistoryItem.new_rating || latestHistoryItem.old_rating;
        
        console.log(`User ${userId} rating history:`, userHistory);
        
        return {
          user_id: userId,
          ratings: userHistory.map(h => ({
            rating: h.new_rating || h.old_rating,
            created_at: h.changed_at,
            action_type: h.action_type,
            old_rating: h.old_rating
          })), // Store full history
          rating_history: userHistory, // Add explicit rating_history property
          latest_rating: {
            rating: latestRating,
            created_at: latestHistoryItem.changed_at
          },
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

  const formatRatingTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                                className={`${getRatingColor(voter.latest_rating.rating)} text-white px-2 py-1 text-sm font-semibold`}
                              >
                                {voter.latest_rating.rating}/10
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
                                
                                 {/* Latest Vote Date */}
                                 <p className="text-xs text-muted-foreground mt-1">
                                   Latest vote: {formatRatingTime(voter.latest_rating.created_at)}
                                 </p>
                                 
                                 {/* Complete rating history for this user */}
                                 {voter.rating_history && voter.rating_history.length > 0 && (
                                   <div className="mt-2 space-y-1">
                                     <p className="text-xs font-medium text-muted-foreground">
                                       Complete rating history ({voter.rating_history.length} changes):
                                     </p>
                                     <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                                       {voter.rating_history.map((historyItem, idx) => (
                                         <div key={idx} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                                           <div className="flex items-center gap-2">
                                             {historyItem.action_type === 'insert' ? (
                                               <Badge variant="outline" className="bg-green-500 text-white border-none text-xs px-1.5 py-0.5">
                                                 New: {historyItem.new_rating}
                                               </Badge>
                                             ) : historyItem.action_type === 'update' ? (
                                               <div className="flex items-center gap-1">
                                                 <Badge variant="outline" className="bg-orange-500 text-white border-none text-xs px-1.5 py-0.5">
                                                   {historyItem.old_rating}
                                                 </Badge>
                                                 <span>→</span>
                                                 <Badge variant="outline" className="bg-blue-500 text-white border-none text-xs px-1.5 py-0.5">
                                                   {historyItem.new_rating}
                                                 </Badge>
                                               </div>
                                             ) : (
                                               <Badge variant="outline" className="bg-red-500 text-white border-none text-xs px-1.5 py-0.5">
                                                 Deleted: {historyItem.old_rating}
                                               </Badge>
                                             )}
                                           </div>
                                           <span className="text-[10px] text-muted-foreground">
                                             {formatRatingTime(historyItem.changed_at)}
                                           </span>
                                         </div>
                                       ))}
                                     </div>
                                   </div>
                                 )}
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