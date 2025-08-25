import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageCircle, Share2, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn, getCountryDisplayName } from "@/lib/utils";
import { PhotoModal } from "@/components/photo-modal";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCardData } from "@/hooks/useCardData";
import { useParticipantData } from "@/hooks/useParticipantData";
import LoginModalContent from "@/components/login-modal-content";
import { ContestParticipationModal } from "@/components/contest-participation-modal";

// Import contest images for mock display
import contestant1Face from "@/assets/contestant-1-face.jpg";
import contestant1Full from "@/assets/contestant-1-full.jpg";
import contestant2Face from "@/assets/contestant-2-face.jpg";
import contestant2Full from "@/assets/contestant-2-full.jpg";
import contestant3Face from "@/assets/contestant-3-face.jpg";
import contestant3Full from "@/assets/contestant-3-full.jpg";

interface LikedItemProps {
  likeId: string;
  contentType: 'post' | 'photo' | 'contest' | 'next_week_candidate';
  contentId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorProfileId?: string;
  time: string;
  content?: string;
  imageSrc?: string;
  likes?: number;
  comments?: number;
  onUnlike?: (likeId: string) => void;
  viewMode?: 'compact' | 'full';
  candidateData?: any;
  participantType?: 'candidate' | 'finalist' | 'winner';
  showStatusBadge?: boolean;
  isOwner?: boolean;
  onEditPhotos?: () => void;
  onPhotoUpdate?: (type: 'photo_1' | 'photo_2', url: string) => void;
}

// Participant interface exactly like in Admin
interface ParticipantData {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  photo1_url: string;
  photo2_url: string;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("");
  return initials || "U";
};

const getParticipantBadge = (type?: 'candidate' | 'finalist' | 'winner', isFullView = false) => {
  if (!type) return null;
  
  const badgeStyles = {
    candidate: "bg-yellow-100 text-yellow-700",
    finalist: "bg-orange-100 text-orange-700", 
    winner: "bg-blue-100 text-blue-700"
  };
  
  const labels = {
    candidate: "Candidate",
    finalist: "Finalist",
    winner: "🏆 Winner + 5000 PHP"
  };

  const dates = {
    candidate: "1 Sep",
    finalist: "9 Sep",
    winner: "16 Sep"
  };
  
  const positionClasses = isFullView 
    ? "absolute bottom-0 left-0 right-0 z-20" 
    : "absolute bottom-0 left-0 w-[193px] sm:w-[225px] md:w-[257px] z-20";
  
  return (
    <div className={`${positionClasses} px-2 py-1 text-xs font-semibold ${badgeStyles[type]} flex justify-between items-center`}>
      <span>{labels[type]}</span>
      <span>{dates[type]}</span>
    </div>
  );
};

const LikedItem = ({
  likeId,
  contentType,
  authorName,
  authorAvatarUrl,
  authorProfileId,
  time,
  content,
  imageSrc,
  likes = 0,
  comments = 0,
  onUnlike,
  viewMode = 'full',
  candidateData,
  participantType,
  showStatusBadge = true,
  isOwner = false,
  onEditPhotos,
  onPhotoUpdate
}: LikedItemProps) => {
  const [isUnliking, setIsUnliking] = useState(false);
  const [isLiked, setIsLiked] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentParticipantType, setCurrentParticipantType] = useState<'candidate' | 'finalist' | 'winner' | null>(participantType || null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Photo editing states exactly like in Admin
  const [editingParticipant, setEditingParticipant] = useState<ParticipantData | null>(null);
  const [participantPhoto1File, setParticipantPhoto1File] = useState<File | null>(null);
  const [participantPhoto2File, setParticipantPhoto2File] = useState<File | null>(null);
  const [uploadingParticipantPhotos, setUploadingParticipantPhotos] = useState(false);
  
  // Use unified card data hook
  const { data: cardData, loading: cardDataLoading } = useCardData(authorName, user?.id);
  
  // Get real participant data from database
  const { getParticipantByName } = useParticipantData();
  const realParticipantData = getParticipantByName(authorName);
  
  // Don't render until card data is loaded
  const isDataLoading = cardDataLoading;

  // Get current user
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      setCurrentUserId(session?.user?.id || null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setCurrentUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Participant photo editing functions exactly like in Admin
  const startEditingParticipant = () => {
    if (!authorProfileId) return;
    
    const participant: ParticipantData = {
      id: authorProfileId,
      user_id: authorProfileId,
      first_name: candidateData?.name?.split(' ')[0] || authorName.split(' ')[0],
      last_name: candidateData?.name?.split(' ').slice(1).join(' ') || authorName.split(' ').slice(1).join(' '),
      photo1_url: candidateData?.faceImage || imageSrc || '',
      photo2_url: candidateData?.fullBodyImage || imageSrc || ''
    };
    
    setEditingParticipant(participant);
    setParticipantPhoto1File(null);
    setParticipantPhoto2File(null);
  };

  const cancelParticipantEdit = () => {
    setEditingParticipant(null);
    setParticipantPhoto1File(null);
    setParticipantPhoto2File(null);
  };

  const handleParticipantPhoto1Upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setParticipantPhoto1File(file);
    }
  };

  const handleParticipantPhoto2Upload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setParticipantPhoto2File(file);
    }
  };

  // Save participant photos exactly like in Admin
  const saveParticipantPhotos = async () => {
    if (!editingParticipant) return;

    setUploadingParticipantPhotos(true);

    try {
      const updates: any = {};

      // Upload photo1 if provided - ТОЧНО КАК В АДМИНКЕ
      if (participantPhoto1File) {
        const fileExt = participantPhoto1File.name.split('.').pop();
        const fileName = `photo_1.${fileExt}`;
        const filePath = `${editingParticipant.user_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('contest-photos')
          .upload(filePath, participantPhoto1File, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('contest-photos')
          .getPublicUrl(filePath);
        
        const timestampedUrl = `${publicUrl}?t=${Date.now()}`;
        updates.photo_1_url = timestampedUrl;
      }

      // Upload photo2 if provided - ТОЧНО КАК В АДМИНКЕ  
      if (participantPhoto2File) {
        const fileExt = participantPhoto2File.name.split('.').pop();
        const fileName = `photo_2.${fileExt}`;
        const filePath = `${editingParticipant.user_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('contest-photos')
          .upload(filePath, participantPhoto2File, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('contest-photos')
          .getPublicUrl(filePath);
        
        const timestampedUrl = `${publicUrl}?t=${Date.now()}`;
        updates.photo_2_url = timestampedUrl;
      }

      // Update profile if there are changes - ТОЧНО КАК В АДМИНКЕ
      if (Object.keys(updates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', editingParticipant.user_id);

        if (profileError) throw profileError;

        toast({
          title: "Success",
          description: "Photos updated successfully",
        });

        // Notify parent component about photo updates
        if (updates.photo_1_url) {
          onPhotoUpdate?.('photo_1', updates.photo_1_url);
        }
        if (updates.photo_2_url) {
          onPhotoUpdate?.('photo_2', updates.photo_2_url);
        }
      }

      cancelParticipantEdit();
    } catch (error: any) {
      console.error('Error updating participant photos:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update photos",
        variant: "destructive",
      });
    } finally {
      setUploadingParticipantPhotos(false);
    }
  };

  // Fetch current participant type from database
  useEffect(() => {
    if (authorProfileId && contentType === 'next_week_candidate') {
      const fetchParticipantType = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('participant_type')
            .eq('id', authorProfileId)
            .single();
          
          if (!error && data?.participant_type) {
            setCurrentParticipantType(data.participant_type as 'candidate' | 'finalist' | 'winner');
          }
        } catch (error) {
          console.error('Error fetching participant type:', error);
        }
      };
      
      fetchParticipantType();
    }
  }, [authorProfileId, contentType]);

  const handleUnlike = async () => {
    setIsUnliking(true);
    try {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("id", likeId);
      
      if (error) throw error;
      
      setIsLiked(false);
      onUnlike?.(likeId);
      toast({ description: "Лайк убран" });
    } catch (error) {
      toast({ description: "Не удалось убрать лайк" });
    } finally {
      setIsUnliking(false);
    }
  };

  const openModal = (photoIndex: number) => {
    setModalStartIndex(photoIndex);
    setIsModalOpen(true);
  };

  const handleComment = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    openModal(0);
  };

  // Use real participant data from database if available, otherwise fallback
  const candidateAge = realParticipantData?.age || candidateData?.age || 25;
  const candidateWeight = realParticipantData?.weight_kg || candidateData?.weight || 52;
  const candidateHeight = realParticipantData?.height_cm || candidateData?.height || 168;
  const candidateCountry = realParticipantData?.country || candidateData?.country || "Philippines";
  const candidateCity = realParticipantData?.city || candidateData?.city || "Unknown";
  const candidateState = realParticipantData?.state || candidateData?.state || "";
  const candidateFaceImage = realParticipantData?.photo_1_url || candidateData?.faceImage || imageSrc;
  const candidateFullImage = realParticipantData?.photo_2_url || candidateData?.fullBodyImage || imageSrc;
  const candidateAdditionalPhotos = candidateData?.additionalPhotos || [];
  
  // Fallback mock images if no real data available
  const images = [contestant1Face, contestant2Face, contestant3Face];
  const fullImages = [contestant1Full, contestant2Full, contestant3Full];
  const randomIndex = Math.floor(Math.random() * images.length);
  
  // Use real candidate photos if available, otherwise use mock images
  const displayFaceImage = candidateFaceImage || images[randomIndex];
  const displayFullImage = candidateFullImage || fullImages[randomIndex];
  const allPhotos = [displayFaceImage, displayFullImage, ...candidateAdditionalPhotos].filter(Boolean);
  
  // Show loading skeleton while data is loading
  if (isDataLoading) {
    return (
      <Card className="bg-card border-contest-border relative overflow-hidden animate-pulse">
        {viewMode === 'compact' ? (
          <div className="flex h-32 sm:h-36 md:h-40">
            <div className="flex-shrink-0 flex h-full relative gap-px">
              <div className="bg-muted w-24 sm:w-28 md:w-32 h-full" />
              <div className="bg-muted w-24 sm:w-28 md:w-32 h-full" />
            </div>
            <div className="flex-1 p-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
              <div className="flex gap-4 justify-end">
                <div className="h-6 bg-muted rounded w-12" />
                <div className="h-6 bg-muted rounded w-12" />
                <div className="h-6 bg-muted rounded w-8" />
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="h-[72px] border-b border-contest-border p-4">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/4 mt-2" />
            </div>
            <div className="grid grid-cols-2 gap-px">
              <div className="bg-muted aspect-[4/5]" />
              <div className="bg-muted aspect-[4/5]" />
            </div>
            <div className="border-t border-contest-border px-4 py-2 flex justify-evenly gap-4">
              <div className="h-6 bg-muted rounded w-12" />
              <div className="h-6 bg-muted rounded w-12" />
              <div className="h-6 bg-muted rounded w-8" />
            </div>
          </div>
        )}
      </Card>
    );
  }
  
  // Compact view
  if (viewMode === 'compact') {
    return (
      <>
        <Card className="bg-card border-contest-border relative overflow-hidden flex h-32 sm:h-36 md:h-40">
          {/* Edit button for owner - show for contest participation */}
          {isOwner && (contentType === 'contest' || contentType === 'next_week_candidate') && (
            <Button
              onClick={() => {
                console.log('Edit button clicked! Trying to find and click Join button...');
                // Find and click the Join & Win button
                const joinButton = document.querySelector('button:has-text("🏆 Join & Win 5,000 PHP")') || 
                                 document.querySelector('button[class*="gradient"]:has-text("Join")') ||
                                 document.querySelector('button:contains("Join & Win")');
                
                if (joinButton) {
                  console.log('Found join button, clicking it...');
                  (joinButton as HTMLButtonElement).click();
                } else {
                  console.log('Join button not found, trying different approach...');
                  // Dispatch a custom event that the Profile page can listen to
                  window.dispatchEvent(new CustomEvent('openEditModal', { 
                    detail: { 
                      userData: realParticipantData || candidateData 
                    } 
                  }));
                }
              }}
              size="sm"
              className="absolute top-2 right-2 z-30 w-8 h-8 p-0"
            >
              <Edit className="w-3 h-3" />
            </Button>
          )}
          
          {/* Participant Type Badge */}
          {showStatusBadge && getParticipantBadge(currentParticipantType)}
          {/* Main two photos */}
          <div className="flex-shrink-0 flex h-full relative gap-px">
            <div className="relative">
              <img 
                src={displayFaceImage}
                alt={`${authorName} face`}
                className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openModal(0)}
              />
            </div>
            <div className="relative">
              <img 
                src={displayFullImage}
                alt={`${authorName} full body`}
                className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openModal(1)}
              />
            </div>
          </div>
          
          {/* Content area */}
          <div className="flex-1 p-1.5 sm:p-2 md:p-3 flex flex-col relative">
            <div className="absolute inset-0 bg-white rounded-r flex flex-col justify-between p-2 sm:p-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1 mr-2">
                  <h3 className="font-semibold text-contest-text text-base sm:text-lg truncate">
                    {authorProfileId ? (
                      <Link to={`/u/${authorProfileId}`} className="hover:text-primary underline-offset-2 hover:underline">
                        {authorName}
                      </Link>
                    ) : (
                      authorName
                    )}, {candidateAge}
                  </h3>
                   <div className="text-xs sm:text-sm text-muted-foreground font-normal">{candidateWeight} kg · {candidateHeight} cm</div>
                   <div className="text-sm sm:text-base text-contest-blue truncate">
                     {getCountryDisplayName(candidateCountry)}{candidateCity !== "Unknown" && candidateCity !== candidateCountry ? ` · ${candidateCity}` : ''}
                   </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm text-contest-blue hover:text-contest-blue/80 transition-colors"
                  aria-label="Unlike"
                  onClick={handleUnlike}
                  disabled={isUnliking}
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-primary" strokeWidth={1} />
                   <span className="hidden xl:inline">Unlike</span>
                   <span>{cardData.likes}</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={handleComment}
                  aria-label="Comments"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-primary" strokeWidth={1} />
                  <span className="hidden xl:inline">Comment</span>
                   <span>{cardData.comments}</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={async () => {
                    try {
                      if ((navigator as any).share) {
                        await (navigator as any).share({ title: authorName, url: window.location.href });
                      } else if (navigator.clipboard) {
                        await navigator.clipboard.writeText(window.location.href);
                        toast({ title: "Link copied" });
                      }
                    } catch {}
                  }}
                  aria-label="Share"
                >
                  <Share2 className="w-3.5 h-3.5" strokeWidth={1} />
                  <span className="hidden xl:inline">Share</span>
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Photo editing dialog exactly like in Admin */}
        <Dialog open={!!editingParticipant} onOpenChange={(open) => !open && cancelParticipantEdit()}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Edit Photos for {editingParticipant?.first_name} {editingParticipant?.last_name}
              </DialogTitle>
            </DialogHeader>
            
            {editingParticipant && (
              <div className="space-y-6">
                {/* Current Photos */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Current Portrait Photo</Label>
                    {editingParticipant.photo1_url && (
                      <img 
                        src={editingParticipant.photo1_url} 
                        alt="Current portrait" 
                        className="w-full h-48 object-cover rounded border mt-2"
                      />
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Current Full Length Photo</Label>
                    {editingParticipant.photo2_url && (
                      <img 
                        src={editingParticipant.photo2_url} 
                        alt="Current full length" 
                        className="w-full h-48 object-cover rounded border mt-2"
                      />
                    )}
                  </div>
                </div>
                
                {/* New Photo Uploads */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Replace Portrait Photo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleParticipantPhoto1Upload}
                      className="mt-2"
                    />
                    {participantPhoto1File && (
                      <p className="text-sm text-green-600 mt-1">
                        New portrait selected: {participantPhoto1File.name}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Replace Full Length Photo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleParticipantPhoto2Upload}
                      className="mt-2"
                    />
                    {participantPhoto2File && (
                      <p className="text-sm text-green-600 mt-1">
                        New full length selected: {participantPhoto2File.name}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={cancelParticipantEdit} disabled={uploadingParticipantPhotos}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={saveParticipantPhotos} 
                    className="bg-blue-600 hover:bg-blue-700" 
                    disabled={uploadingParticipantPhotos || (!participantPhoto1File && !participantPhoto2File)}
                  >
                    {uploadingParticipantPhotos ? "Uploading..." : "Save Photos"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <PhotoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          photos={allPhotos}
          currentIndex={modalStartIndex}
          contestantName={authorName}
          age={candidateAge}
          weight={candidateWeight}
          height={candidateHeight}
          country={candidateCountry}
          city={candidateCity}
        />

        {/* Login Modal */}
        <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
          <DialogContent className="sm:max-w-lg">
            <LoginModalContent onClose={() => setShowLoginModal(false)} />
          </DialogContent>
        </Dialog>
      </>
    );
  }
  
  // Full view
  return (
    <>
      <Card className="bg-card border-contest-border relative overflow-hidden">
          {/* Edit button for owner - show for contest participation */}
          {isOwner && (contentType === 'contest' || contentType === 'next_week_candidate') && (
            <Button
              onClick={() => {
                console.log('Edit button clicked! Trying to find and click Join button...');
                // Find and click the Join & Win button
                const joinButton = document.querySelector('button:has-text("🏆 Join & Win 5,000 PHP")') || 
                                 document.querySelector('button[class*="gradient"]:has-text("Join")') ||
                                 document.querySelector('button:contains("Join & Win")');
                
                if (joinButton) {
                  console.log('Found join button, clicking it...');
                  (joinButton as HTMLButtonElement).click();
                } else {
                  console.log('Join button not found, trying different approach...');
                  // Dispatch a custom event that the Profile page can listen to
                  window.dispatchEvent(new CustomEvent('openEditModal', { 
                    detail: { 
                      userData: realParticipantData || candidateData 
                    } 
                  }));
                }
              }}
              size="sm"
              className="absolute top-2 right-2 z-30 w-8 h-8 p-0"
            >
              <Edit className="w-3 h-3" />
            </Button>
          )}
        
        {/* Name in top left */}
        <div className="absolute top-2 left-4 z-20">
          <h3 className="text-xl font-semibold text-contest-text">
            {authorProfileId ? (
              <Link to={`/u/${authorProfileId}`} className="hover:text-primary underline-offset-2 hover:underline">
                {authorName}
              </Link>
            ) : (
              authorName
            )}, {candidateAge} <span className="text-sm text-muted-foreground font-normal">({candidateWeight} kg · {candidateHeight} cm)</span>
          </h3>
          <div className="text-contest-blue text-sm">{getCountryDisplayName(candidateCountry)}{candidateCity !== "Unknown" && candidateCity !== candidateCountry ? ` · ${candidateCity}` : ''}</div>
        </div>
        
        {/* Header */}
        <div className="relative p-4 border-b border-contest-border h-[72px]">
          <div className="h-full"></div>
        </div>
        
        {/* Photos section */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-px">
            {/* Participant Type Badge */}
            {showStatusBadge && getParticipantBadge(currentParticipantType, true)}
            <div className="relative">
              <img 
                src={displayFaceImage} 
                alt={`${authorName} face`}
                className="w-full aspect-[4/5] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openModal(0)}
              />
            </div>
            <div className="relative">
              <img 
                src={displayFullImage} 
                alt={`${authorName} full body`}
                className="w-full aspect-[4/5] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openModal(1)}
              />
            </div>
          </div>
        </div>
        
        {/* Footer with actions */}
        <div className="border-t border-contest-border px-4 py-2 flex items-center justify-evenly gap-4">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-contest-blue hover:text-contest-blue/80 transition-colors"
            aria-label="Unlike"
            onClick={handleUnlike}
            disabled={isUnliking}
          >
            <ThumbsUp className="w-4 h-4 text-blue-500 fill-blue-500" strokeWidth={1} />
             <span className="hidden sm:inline text-blue-500">Unlike</span>
             <span className="text-blue-500">{cardData.likes}</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleComment}
            aria-label="Comments"
          >
            <MessageCircle className="w-4 h-4 text-primary" strokeWidth={1} />
            <span className="hidden sm:inline">Comment</span>
            <span>{cardData.comments}</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={async () => {
              try {
                if ((navigator as any).share) {
                  await (navigator as any).share({ title: authorName, url: window.location.href });
                } else if (navigator.clipboard) {
                  await navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Link copied" });
                }
              } catch {}
            }}
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" strokeWidth={1} />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </Card>

      {/* Photo editing dialog exactly like in Admin */}
      <Dialog open={!!editingParticipant} onOpenChange={(open) => !open && cancelParticipantEdit()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Edit Photos for {editingParticipant?.first_name} {editingParticipant?.last_name}
            </DialogTitle>
          </DialogHeader>
          
          {editingParticipant && (
            <div className="space-y-6">
              {/* Current Photos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Current Portrait Photo</Label>
                  {editingParticipant.photo1_url && (
                    <img 
                      src={editingParticipant.photo1_url} 
                      alt="Current portrait" 
                      className="w-full h-48 object-cover rounded border mt-2"
                    />
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Full Length Photo</Label>
                  {editingParticipant.photo2_url && (
                    <img 
                      src={editingParticipant.photo2_url} 
                      alt="Current full length" 
                      className="w-full h-48 object-cover rounded border mt-2"
                    />
                  )}
                </div>
              </div>
              
              {/* New Photo Uploads */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Replace Portrait Photo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleParticipantPhoto1Upload}
                    className="mt-2"
                  />
                  {participantPhoto1File && (
                    <p className="text-sm text-green-600 mt-1">
                      New portrait selected: {participantPhoto1File.name}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Replace Full Length Photo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleParticipantPhoto2Upload}
                    className="mt-2"
                  />
                  {participantPhoto2File && (
                    <p className="text-sm text-green-600 mt-1">
                      New full length selected: {participantPhoto2File.name}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={cancelParticipantEdit} disabled={uploadingParticipantPhotos}>
                  Cancel
                </Button>
                <Button 
                  onClick={saveParticipantPhotos} 
                  className="bg-blue-600 hover:bg-blue-700" 
                  disabled={uploadingParticipantPhotos || (!participantPhoto1File && !participantPhoto2File)}
                >
                  {uploadingParticipantPhotos ? "Uploading..." : "Save Photos"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PhotoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        photos={allPhotos}
        currentIndex={modalStartIndex}
        contestantName={authorName}
        age={candidateAge}
        weight={candidateWeight}
        height={candidateHeight}
        country={candidateCountry}
        city={candidateCity}
      />

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-lg">
          <LoginModalContent onClose={() => setShowLoginModal(false)} />
        </DialogContent>
      </Dialog>

    </>
  );
};

export default LikedItem;