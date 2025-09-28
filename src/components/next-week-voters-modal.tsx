import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminPhotoModal } from '@/components/admin-photo-modal';

interface NextWeekVotersModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantName: string;
}

interface Voter {
  user_id: string;
  vote_type: string;
  vote_count: number;
  created_at: string;
  display_name: string;
  avatar_url: string;
  first_name: string;
  last_name: string;
  age: number;
  city: string;
  country: string;
  photo_1_url: string;
  photo_2_url: string;
}

export function NextWeekVotersModal({ isOpen, onClose, participantName }: NextWeekVotersModalProps) {
  const [allVoters, setAllVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(false);
  const [photoModalData, setPhotoModalData] = useState<{ 
    isOpen: boolean; 
    photos: string[]; 
    currentIndex: number; 
    title: string; 
  }>({ isOpen: false, photos: [], currentIndex: 0, title: '' });

  const likeVoters = allVoters.filter(voter => voter.vote_type === 'like');
  const dislikeVoters = allVoters.filter(voter => voter.vote_type === 'dislike');

  useEffect(() => {
    if (isOpen && participantName) {
      fetchVoters();
    }
  }, [isOpen, participantName]);

  const fetchVoters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_next_week_voters', {
        participant_name_param: participantName
      });

      if (error) {
        console.error('Error fetching voters:', error);
        return;
      }

      setAllVoters(data || []);
    } catch (error) {
      console.error('Error fetching voters:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPhotoModal = (photos: string[], currentIndex: number, title: string) => {
    setPhotoModalData({
      isOpen: true,
      photos: photos.filter(Boolean),
      currentIndex,
      title
    });
  };

  const VoterCard = ({ voter, index }: { voter: Voter; index: number }) => (
    <Card className="overflow-hidden relative w-full">
      {/* Order number in top-left corner */}
      <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-br-md z-10">
        #{index + 1}
      </div>
      
      <CardContent className="p-0">
        <div className="flex w-full">
          {/* Avatar section */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-16 w-16 m-3">
              <AvatarImage src={voter.avatar_url || voter.photo_1_url || ''} />
              <AvatarFallback className="text-base">
                {voter.first_name?.charAt(0) || voter.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {/* Registration date badge at bottom of avatar */}
            <Badge 
              variant="outline" 
              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-xs px-1 py-0 bg-background"
            >
              {new Date(voter.created_at).toLocaleDateString('ru-RU', { 
                day: '2-digit', 
                month: '2-digit', 
                year: '2-digit' 
              })}
            </Badge>
          </div>
          
          {/* Content section */}
          <div className="flex-1 p-3 pt-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-base leading-tight">
                {voter.age && `${voter.age}, `}{voter.display_name || `${voter.first_name} ${voter.last_name}` || 'Unnamed User'}
              </h3>
              
              {/* City and Country */}
              <div className="text-sm text-muted-foreground">
                <span>{voter.city || 'Unknown'}, {voter.country || 'Unknown'}</span>
              </div>
              
              {/* Vote type badge */}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={voter.vote_type === 'like' ? 'default' : 'destructive'} className="text-xs">
                  {voter.vote_type === 'like' ? '👍 Like' : '👎 Dislike'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Voters for {participantName}</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Loading voters...</div>
            </div>
          ) : (
            <Tabs defaultValue="likes" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="likes" className="flex items-center gap-2">
                  👍 Likes ({likeVoters.length})
                </TabsTrigger>
                <TabsTrigger value="dislikes" className="flex items-center gap-2">
                  👎 Dislikes ({dislikeVoters.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="likes" className="space-y-4 mt-4">
                {likeVoters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No likes yet
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {likeVoters.map((voter, index) => (
                      <VoterCard key={voter.user_id} voter={voter} index={index} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="dislikes" className="space-y-4 mt-4">
                {dislikeVoters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No dislikes yet
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {dislikeVoters.map((voter, index) => (
                      <VoterCard key={voter.user_id} voter={voter} index={index} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <AdminPhotoModal
        isOpen={photoModalData.isOpen}
        onClose={() => setPhotoModalData(prev => ({ ...prev, isOpen: false }))}
        photos={photoModalData.photos}
        currentIndex={photoModalData.currentIndex}
        contestantName={photoModalData.title}
      />
    </>
  );
}