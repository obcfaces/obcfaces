import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageCircle, Share2, ThumbsDown, Pencil, X } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn, getCountryDisplayName } from "@/lib/utils";
import { PhotoModal } from "@/components/photo-modal";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCardData } from "@/hooks/useCardData";
import { useParticipantData } from "@/hooks/useParticipantData";
import LoginModalContent from "@/components/login-modal-content";

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
  onPhotoUpdate?: (type: 'photo_1' | 'photo_2', url: string) => void;
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
  onPhotoUpdate
}: LikedItemProps) => {
  const [isUnliking, setIsUnliking] = useState(false);
  const [isLiked, setIsLiked] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentParticipantType, setCurrentParticipantType] = useState<'candidate' | 'finalist' | 'winner' | null>(participantType || null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<'photo_1' | 'photo_2' | null>(null);
  const [photoFiles, setPhotoFiles] = useState<{[key: string]: File | null}>({});
  const [photoPreviews, setPhotoPreviews] = useState<{[key: string]: string | null}>({});

  // Use unified card data hook
  const { data: cardData, loading: cardDataLoading } = useCardData(authorName, user?.id);
  
  // Get real participant data from database
  const { getParticipantByName } = useParticipantData();
  const realParticipantData = getParticipantByName(authorName);
  
  // Don't render until card data is loaded (participant data loads separately)
  const isDataLoading = cardDataLoading;

  // Get current user
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const handlePhotoChange = (photoType: 'photo_1' | 'photo_2', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFiles(prev => ({ ...prev, [photoType]: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreviews(prev => ({ 
          ...prev, 
          [photoType]: e.target?.result as string 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoDelete = (photoType: 'photo_1' | 'photo_2') => {
    setPhotoFiles(prev => ({ ...prev, [photoType]: null }));
    setPhotoPreviews(prev => ({ ...prev, [photoType]: null }));
  };

  const uploadPhoto = async (file: File, photoType: 'photo_1' | 'photo_2'): Promise<string | null> => {
    if (!user?.id) return null;
    
    setUploadingPhoto(photoType);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${photoType}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('contest-photos')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('contest-photos')
        .getPublicUrl(fileName);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({ description: "Ошибка загрузки фото" });
      return null;
    } finally {
      setUploadingPhoto(null);
    }
  };

  const handleSavePhotos = async () => {
    console.log('💾 handleSavePhotos called', { 
      userId: user?.id, 
      authorProfileId, 
      photoFiles: Object.keys(photoFiles),
      hasPhoto1: !!photoFiles.photo_1,
      hasPhoto2: !!photoFiles.photo_2
    });
    
    if (!user?.id || !authorProfileId) {
      console.error('❌ Missing required data:', { userId: user?.id, authorProfileId });
      return;
    }

    try {
      const updates: { [key: string]: string } = {};

      // Upload photo_1 if changed
      if (photoFiles.photo_1) {
        const url = await uploadPhoto(photoFiles.photo_1, 'photo_1');
        if (url) {
          updates.photo_1_url = url;
          onPhotoUpdate?.('photo_1', url);
        }
      }

      // Upload photo_2 if changed  
      if (photoFiles.photo_2) {
        const url = await uploadPhoto(photoFiles.photo_2, 'photo_2');
        if (url) {
          updates.photo_2_url = url;
          onPhotoUpdate?.('photo_2', url);
        }
      }

      // Update profile if there are changes
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', authorProfileId);

        if (error) throw error;

        toast({ description: "Фото обновлены успешно" });
      }

      // Reset edit mode
      setIsEditMode(false);
      setPhotoFiles({});
      setPhotoPreviews({});
    } catch (error) {
      console.error('Error updating photos:', error);
      toast({ description: "Ошибка обновления фото" });
    }
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
  
  // Compact view (same as contest compact mode) 
  if (viewMode === 'compact') {
    return (
      <>
        <Card className="bg-card border-contest-border relative overflow-hidden flex h-32 sm:h-36 md:h-40">
          {/* Edit button for owner */}
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className="absolute top-2 right-2 z-30 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
            >
              {isEditMode ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
            </button>
          )}
          
          {/* Participant Type Badge */}
          {showStatusBadge && getParticipantBadge(currentParticipantType)}
          {/* Main two photos */}
          <div className="flex-shrink-0 flex h-full relative gap-px">
            <div className="relative">
              {/* Photo 1 */}
              <img 
                src={photoPreviews.photo_1 || displayFaceImage}
                alt={`${authorName} face`}
                className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => !isEditMode && openModal(0)}
              />
              {isEditMode && (
                <>
                  <input
                    type="file"
                    id="photo1-compact"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange('photo_1', e)}
                    className="hidden"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    {photoFiles.photo_1 ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handlePhotoDelete('photo_1')}
                          className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-sm transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <label htmlFor="photo1-compact" className="w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white text-sm cursor-pointer transition-colors">
                          <Pencil className="w-3 h-3" />
                        </label>
                      </div>
                    ) : (
                      <label htmlFor="photo1-compact" className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors">
                        <Pencil className="w-4 h-4" />
                      </label>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              {/* Photo 2 */}
              <img 
                src={photoPreviews.photo_2 || displayFullImage} 
                alt={`${authorName} full body`}
                className="w-24 sm:w-28 md:w-32 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => !isEditMode && openModal(1)}
              />
              {isEditMode && (
                <>
                  <input
                    type="file"
                    id="photo2-compact"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange('photo_2', e)}
                    className="hidden"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    {photoFiles.photo_2 ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handlePhotoDelete('photo_2')}
                          className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-sm transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <label htmlFor="photo2-compact" className="w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white text-sm cursor-pointer transition-colors">
                          <Pencil className="w-3 h-3" />
                        </label>
                      </div>
                    ) : (
                      <label htmlFor="photo2-compact" className="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors">
                        <Pencil className="w-4 h-4" />
                      </label>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Content area - показываем информацию как в проголосованных карточках конкурса */}
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
                
                <div className="text-right flex-shrink-0">
                  {/* Empty space like in contest cards */}
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-4">
                {isEditMode && (photoFiles.photo_1 || photoFiles.photo_2) ? (
                  <Button
                    onClick={handleSavePhotos}
                    disabled={uploadingPhoto !== null}
                    className="px-2 py-1 text-xs h-6"
                  >
                    {uploadingPhoto ? "Сохранение..." : "Сохранить"}
                  </Button>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

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
  
  // Full view (same as contest full mode)
  return (
    <>
      <Card className="bg-card border-contest-border relative overflow-hidden">
        {/* Edit button for owner */}
        {isOwner && (
          <button
            type="button"
            onClick={() => setIsEditMode(!isEditMode)}
            className="absolute top-2 right-4 z-30 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
          >
            {isEditMode ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </button>
        )}
        
        {/* Name in top left - показываем всегда как в проголосованных */}
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
        
        {/* Header - пустой как в проголосованных карточках конкурса */}
        <div className="relative p-4 border-b border-contest-border h-[72px]">
          <div className="h-full"></div>
        </div>
        
        {/* Photos section */}
        <div className="relative">
          <div className="grid grid-cols-2 gap-px">
            {/* Participant Type Badge - overlaid on photos */}
            {showStatusBadge && getParticipantBadge(currentParticipantType, true)}
            <div className="relative">
              {/* Photo 1 */}
              <img 
                src={photoPreviews.photo_1 || displayFaceImage} 
                alt={`${authorName} face`}
                className="w-full aspect-[4/5] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => !isEditMode && openModal(0)}
              />
              {isEditMode && (
                <>
                  <input
                    type="file"
                    id="photo1-full"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange('photo_1', e)}
                    className="hidden"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    {photoFiles.photo_1 ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handlePhotoDelete('photo_1')}
                          className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <label htmlFor="photo1-full" className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors">
                          <Pencil className="w-5 h-5" />
                        </label>
                      </div>
                    ) : (
                      <label htmlFor="photo1-full" className="w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors">
                        <Pencil className="w-6 h-6" />
                      </label>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="relative">
              {/* Photo 2 */}
              <img 
                src={photoPreviews.photo_2 || displayFullImage} 
                alt={`${authorName} full body`}
                className="w-full aspect-[4/5] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => !isEditMode && openModal(1)}
              />
              {isEditMode && (
                <>
                  <input
                    type="file"
                    id="photo2-full"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange('photo_2', e)}
                    className="hidden"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    {photoFiles.photo_2 ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handlePhotoDelete('photo_2')}
                          className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <label htmlFor="photo2-full" className="w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors">
                          <Pencil className="w-5 h-5" />
                        </label>
                      </div>
                    ) : (
                      <label htmlFor="photo2-full" className="w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors">
                        <Pencil className="w-6 h-6" />
                      </label>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer with actions - точно как в конкурсе */}
        <div className="border-t border-contest-border px-4 py-2 flex items-center justify-evenly gap-4">
          {isEditMode && (photoFiles.photo_1 || photoFiles.photo_2) ? (
            <Button
              onClick={handleSavePhotos}
              disabled={uploadingPhoto !== null}
              className="px-3 py-1 text-sm h-8"
            >
              {uploadingPhoto ? "Сохранение..." : "Сохранить"}
            </Button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </Card>

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