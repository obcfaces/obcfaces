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

  const VoterCard = ({ voter }: { voter: Voter }) => (
    <Card key={voter.user_id} className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex">
          {/* Photos section */}
          <div className="flex gap-px w-[20ch] flex-shrink-0">
            {voter.photo_1_url && (
              <div className="w-1/2">
                <img 
                  src={voter.photo_1_url} 
                  alt="Portrait" 
                  className="w-full h-[120px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openPhotoModal([voter.photo_1_url, voter.photo_2_url].filter(Boolean), 0, voter.display_name || `${voter.first_name} ${voter.last_name}`)}
                />
              </div>
            )}
            {voter.photo_2_url && (
              <div className="w-1/2 relative">
                <img 
                  src={voter.photo_2_url} 
                  alt="Full length" 
                  className="w-full h-[120px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openPhotoModal([voter.photo_1_url, voter.photo_2_url].filter(Boolean), 1, voter.display_name || `${voter.first_name} ${voter.last_name}`)}
                />
                <div className="absolute top-2 right-2">
                  <Avatar className="h-6 w-6 flex-shrink-0 border-2 border-white shadow-sm">
                    <AvatarImage src={voter.avatar_url || voter.photo_1_url || ''} />
                    <AvatarFallback className="text-xs">
                      {voter.first_name?.charAt(0) || voter.display_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
            )}
          </div>
          
          {/* Content section */}
          <div className="flex-1 p-3 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-sm truncate">
                {voter.display_name || `${voter.first_name} ${voter.last_name}` || 'Unnamed User'}
              </h3>
              <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                <div className="flex items-center gap-2">
                  <span>{voter.age || 'Unknown'} лет</span>
                  <span>•</span>
                  <span>{voter.city || 'Unknown'}, {voter.country || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={voter.vote_type === 'like' ? 'default' : 'destructive'} className="text-xs">
                    {voter.vote_type === 'like' ? '👍 Like' : '👎 Dislike'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(voter.created_at).toLocaleDateString()}
                  </span>
                </div>
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
                    {likeVoters.map(voter => (
                      <VoterCard key={voter.user_id} voter={voter} />
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
                    {dislikeVoters.map(voter => (
                      <VoterCard key={voter.user_id} voter={voter} />
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